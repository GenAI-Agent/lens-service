import { ServiceModulerConfig, ConversationState, Message } from './types';
import { OpenAIService } from './services/OpenAIService';
import { StorageService } from './services/StorageService';
import { IndexingService } from './services/IndexingService';
import { SupervisorAgent } from './agents/SupervisorAgent';
import { SidePanel } from './components/SidePanel';
import { CaptureService, PageContentService } from './services/CaptureService';
import { AdminPanel } from './admin/AdminPanel';
import { UserService } from './services/UserService';
import { ConversationService } from './services/ConversationService';
import { ManualIndexService } from './services/ManualIndexService';
import { createDefaultPluginManager, loadPluginConfigs, PluginManager } from './plugins';

/**
 * Lens Service - 可嵌入的 AI 客服 Widget
 *
 * 使用方式：
 *
 * <script src="lens-service.js"></script>
 * <script>
 *   LensService.init({
 *     azureOpenAI: {
 *       endpoint: 'https://your-resource.openai.azure.com/',
 *       apiKey: 'your-api-key',
 *       deployment: 'gpt-4.1'
 *     }
 *   });
 *
 *   // 綁定到按鈕
 *   document.getElementById('help-button').addEventListener('click', () => {
 *     LensService.open();
 *   });
 * </script>
 */
class LensServiceWidget {
  private config?: ServiceModulerConfig;
  private openAI?: OpenAIService;
  private indexing?: IndexingService;
  private agent?: SupervisorAgent;
  private panel?: SidePanel;
  private capture?: CaptureService;
  private conversationState?: ConversationState;
  private initialized: boolean = false;
  private captureMode: boolean = false;
  private adminPanel?: AdminPanel;
  private pluginManager?: PluginManager;
  
  /**
   * 初始化 Widget
   */
  init(config: ServiceModulerConfig): void {
    if (this.initialized) {
      console.warn('ServiceModuler already initialized');
      return;
    }
    
    this.config = config;

    // 初始化用戶服務
    UserService.getCurrentUser();
    console.log('User ID:', UserService.getUserId());

    // 初始化 Plugin Manager
    this.pluginManager = createDefaultPluginManager();
    loadPluginConfigs(this.pluginManager);

    // 初始化所有 Plugin
    this.pluginManager.initializeAll().then(() => {
      console.log('✅ All plugins initialized');
    }).catch(error => {
      console.error('❌ Plugin initialization error:', error);
    });

    // 初始化服務
    this.openAI = new OpenAIService(config.azureOpenAI || config.llmAPI);
    this.indexing = new IndexingService(this.openAI, config.siteConfig);

    // 設置OpenAI服務到ManualIndexService以支持embedding生成
    ManualIndexService.setOpenAIService(this.openAI);

    // 獲取 Telegram 配置
    const telegramConfig = config.telegram && config.telegram.botToken && config.telegram.chatId
      ? config.telegram
      : undefined;

    this.agent = new SupervisorAgent(
      this.openAI,
      this.pluginManager,
      config.rules || [],
      telegramConfig
    );
    this.capture = new CaptureService();

    // 初始化 UI
    this.panel = new SidePanel(
      config.ui?.width || '33.33%',
      config.ui?.position || 'right'
    );

    // 設置回調
    this.panel.setCallbacks({
      onSendMessage: (message, imageBase64) =>
        this.handleSendMessage(message, imageBase64),
      onSelectRule: (ruleId) => this.handleSelectRule(ruleId),
      onClose: () => this.handleClose(),
      onOpen: () => this.handleOpen()
    });

    // 載入對話狀態（舊版兼容）
    this.loadConversationState();
    
    // 設置規則列表
    if (this.agent) {
      this.panel.setRules(
        this.agent.getRules(),
        this.agent.getCurrentRule()?.id
      );
    }
    
    // 初始化管理後台
    this.adminPanel = new AdminPanel();

    this.initialized = true;

    if (config.debug) {
      console.log('ServiceModuler initialized', config);
    }
  }
  
  /**
   * 打開面板
   */
  open(): void {
    if (!this.initialized) {
      console.error('ServiceModuler not initialized. Call init() first.');
      return;
    }
    
    this.panel?.open();
  }
  
  /**
   * 關閉面板
   */
  close(): void {
    this.panel?.close();
  }
  
  /**
   * 發送訊息
   */
  async sendMessage(message: string, imageBase64?: string): Promise<void> {
    if (!this.initialized || !this.agent || !this.panel || !this.openAI) {
      console.error('ServiceModuler not initialized');
      return;
    }

    // 添加用戶訊息
    const userMessage: Message = {
      role: 'user',
      content: message || '請分析這張圖片',
      timestamp: Date.now()
    };

    this.conversationState?.messages.push(userMessage);
    this.panel.addMessage(userMessage);
    this.saveConversationState();

    try {
      let response: string;
      let sources: any[] | undefined;
      let needsHumanReply = false;

      // 獲取 session ID 和 user ID
      const sessionId = this.conversationState?.sessionId || this.generateSessionId();
      const userId = localStorage.getItem('lens_service_user_id') || 'default_user';

      if (imageBase64) {
        // 帶圖片的訊息 - 使用 vision 模型
        response = await this.openAI.chatCompletionWithImage(
          message || '請分析這張圖片並回答問題',
          imageBase64,
          this.conversationState?.messages.slice(0, -1) || []  // 不包含剛添加的用戶訊息
        );
      } else {
        // 純文字訊息 - 使用 agent 處理（新的兩階段流程）
        const result = await this.agent.processMessage(
          message,
          this.conversationState?.messages || [],
          sessionId,
          userId
        );
        response = result.response;
        sources = result.sources;
        needsHumanReply = result.needsHumanReply;
      }

      // 添加助手回應
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        sources
      };

      this.conversationState?.messages.push(assistantMessage);
      this.panel.addMessage(assistantMessage);
      this.saveConversationState();

      // 保存對話記錄到資料庫
      await this.saveConversationToDatabase(sessionId, userId);
    } catch (error) {
      console.error('Error processing message:', error);

      // 顯示錯誤訊息
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
        timestamp: Date.now()
      };

      this.panel.addMessage(errorMessage);
    }
  }

  /**
   * 保存對話記錄到資料庫
   */
  private async saveConversationToDatabase(sessionId: string, userId: string): Promise<void> {
    if (!this.conversationState) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          conversationId: sessionId,
          messages: this.conversationState.messages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      console.log('✅ Conversation saved to database');
    } catch (error) {
      console.error('Failed to save conversation to database:', error);
    }
  }
  
  /**
   * 設置規則
   */
  setRule(ruleId: string): void {
    if (!this.agent) return;
    
    this.agent.setRule(ruleId);
    
    if (this.panel) {
      this.panel.setRules(
        this.agent.getRules(),
        this.agent.getCurrentRule()?.id
      );
    }
  }
  
  /**
   * 開始索引網站
   * @param mode 'local' = 索引本地專案, 'domain' = 爬取域名（默認）
   */
  async indexSite(
    startUrl?: string,
    mode: 'local' | 'domain' = 'domain',
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    if (!this.indexing) {
      console.error('Indexing service not initialized');
      return;
    }

    const url = startUrl || window.location.origin;
    await this.indexing.indexSite(url, mode, onProgress);
  }

  /**
   * 啟用元素捕獲模式（Ctrl+Click）
   */
  enableCaptureMode(): void {
    if (!this.capture || !this.panel) {
      console.error('Capture service not initialized');
      return;
    }

    this.captureMode = true;

    this.capture.enable((imageBase64, text, element) => {
      console.log('Element captured:', { text, element });

      // 打開面板（如果未打開）
      this.open();

      // 將圖片設置到輸入框預覽
      this.panel!.setCapturedImage(imageBase64, text);
    });

    console.log('Capture mode enabled. Press Ctrl+Click to capture elements.');
  }

  /**
   * 禁用元素捕獲模式
   */
  disableCaptureMode(): void {
    if (this.capture) {
      this.capture.disable();
      this.captureMode = false;
    }
  }

  /**
   * 搜尋當前頁面內容
   */
  searchCurrentPage(query: string): Array<{
    text: string;
    context: string;
  }> {
    const results = PageContentService.searchInCurrentPage(query);
    return results.map(r => ({
      text: r.text,
      context: r.context
    }));
  }

  /**
   * 獲取當前頁面內容
   */
  getCurrentPageContent(): {
    title: string;
    url: string;
    content: string;
    headings: Array<{ level: number; text: string }>;
    links: Array<{ text: string; href: string }>;
  } {
    return PageContentService.extractCurrentPageContent();
  }
  
  /**
   * 清除對話
   */
  clearConversation(): void {
    if (this.conversationState) {
      this.conversationState.messages = [];
      this.saveConversationState();
    }

    this.panel?.clearMessages();
  }

  /**
   * 打開管理後台
   */
  openAdmin(): void {
    if (!this.initialized) {
      console.error('ServiceModuler not initialized. Call init() first.');
      return;
    }

    if (!this.adminPanel) {
      console.error('AdminPanel not initialized');
      return;
    }

    this.adminPanel.open();
  }

  /**
   * 銷毀 Widget
   */
  destroy(): void {
    this.panel?.destroy();
    this.adminPanel?.close();
    this.initialized = false;
  }
  
  /**
   * 處理發送訊息
   */
  private handleSendMessage(message: string, imageBase64?: string): void {
    this.sendMessage(message, imageBase64);
  }
  
  /**
   * 處理選擇規則
   */
  private handleSelectRule(ruleId: string): void {
    this.setRule(ruleId);
  }
  
  /**
   * 處理打開
   */
  private handleOpen(): void {
    // Ctrl+Click 捕獲模式已禁用
    console.log('✅ Panel opened');
  }

  /**
   * 處理關閉
   */
  private handleClose(): void {
    this.saveConversationState();
    console.log('❌ Panel closed');
  }
  
  /**
   * 載入對話狀態
   */
  private loadConversationState(): void {
    let state = StorageService.loadConversation();
    
    if (!state) {
      state = {
        sessionId: this.generateSessionId(),
        messages: []
      };
    }
    
    this.conversationState = state;
    
    // 恢復訊息到 UI
    if (this.panel && state.messages.length > 0) {
      state.messages.forEach(msg => {
        this.panel!.addMessage(msg);
      });
    }
  }
  
  /**
   * 保存對話狀態
   */
  private saveConversationState(): void {
    if (this.conversationState) {
      StorageService.saveConversation(this.conversationState);
    }
  }
  
  /**
   * 生成 Session ID
   */
  private generateSessionId(): string {
    return `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 創建全局實例
const LensService = new LensServiceWidget();

// 導出到全局
if (typeof window !== 'undefined') {
  (window as any).LensService = LensService;
}

export default LensService;


import { ServiceModulerConfig, ConversationState, Message, Rule } from './types';
import { SidePanel } from './components/SidePanel';
import { ResizablePanel } from './components/ResizablePanel';
import { AdminPanel } from './admin/AdminPanel';
import { ConversationService } from './services/ConversationService';
import { ManualIndexService } from './services/ManualIndexService';
import { DatabaseService } from './services/DatabaseService';
import { ConfigService } from './services/ConfigService';

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
  private panel?: ResizablePanel;
  private conversationState?: ConversationState;
  private initialized: boolean = false;
  private adminPanel?: AdminPanel;
  private floatingIcon?: HTMLElement;
  
  /**
   * Load rules from SQL database
   * Note: Rule loading is currently disabled. The system operates without predefined rules.
   * If you need to enable rules, start the db-server on port 3002 and uncomment the implementation.
   */
  private async loadRulesFromSQL(): Promise<Rule[]> {
    console.log('Rules loading disabled, using empty array');
    return [];
  }

  /**
   * 初始化 Widget
   */
  async init(config: ServiceModulerConfig): Promise<void> {
    if (this.initialized) {
      console.warn('ServiceModuler already initialized');
      return;
    }

    this.config = config;

    // 初始化服務
    console.log('✅ Widget initializing');

    // 獲取 Telegram 配置
    const telegramConfig = config.telegram && config.telegram.botToken && config.telegram.chatId
      ? config.telegram
      : undefined;

    // 將 Telegram 配置存儲到全局變量供 AdminPanel 使用
    (window as any).SM_TELEGRAM_CONFIG = telegramConfig;

    // Load rules from SQL (currently disabled)
    const rules = await this.loadRulesFromSQL();

    // 初始化 UI - 使用 ResizablePanel
    const initialWidth = config.ui?.width
      ? (typeof config.ui.width === 'string' && config.ui.width.includes('%'))
        ? (parseFloat(config.ui.width) / 100) * window.innerWidth
        : parseFloat(config.ui.width as string)
      : 500; // 預設 500px

    this.panel = new ResizablePanel(
      initialWidth,
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

    // Load conversation state (legacy compatibility)
    await this.loadConversationState();
    
    // 初始化管理後台（確保只創建一次）
    if (!this.adminPanel) {
      this.adminPanel = new AdminPanel();
    }

    // 檢查URL路徑，如果是 /lens-service 則打開管理後台
    if (window.location.pathname === '/lens-service') {
      this.openAdminPanel();
    }

    // 創建浮動圖標（如果配置了UI選項且不在管理後台頁面）
    if (config.ui?.iconPosition !== false && !this.isAdminPage()) {
      this.createFloatingIcon();
    }

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
    if (!this.initialized || !this.panel) {
      console.error('ServiceModuler not initialized');
      return;
    }

    // 移除歡迎畫面
    this.panel.removeWelcomeScreen();

    // 添加用戶訊息
    const userMessage: Message = {
      role: 'user',
      content: message || '請分析這張圖片',
      timestamp: Date.now()
    };

    this.conversationState?.messages.push(userMessage);
    this.panel.addMessage(userMessage);
    this.saveConversationState();

    // 顯示搜尋動畫
    this.panel.showSearchingAnimation();

    try {
      let response: string;
      let sources: any[] | undefined;
      let needsHumanReply = false;
      let pageId: string | undefined;

      // 獲取 session ID（user ID 由後端從 session 取得）
      const sessionId = this.conversationState?.sessionId || this.generateSessionId();

      if (imageBase64) {
        // 帶圖片的訊息 - 使用 vision 模型
        response = await this.processImageMessage(message, imageBase64);
      } else {
        // 純文字訊息 - 使用 agent 處理
        const result = await this.processTextMessage(message, sessionId);
        response = result.response;
        sources = result.sources;
        needsHumanReply = result.needsHumanReply;
        pageId = result.pageId;

        // 如果有 AI Page 產生，顯示按鈕讓用戶開啟
        if (result.aiPageHtml || pageId) {
          console.log('📄 AI Page generated, showing button');
          // 顯示 AI Page 按鈕
          if (this.panel) {
            this.panel.showAIPageButton();
          }
        }

        if (pageId) {
          // AI Page 已經生成，用戶可通過返回的 URL 直接訪問
          console.log('📄 AI Page ID received:', pageId);
          if (this.panel) {
            this.panel.showAIPageButton();
          }
        }

        // 如果需要人工回覆，發送 Telegram 通知
        if (needsHumanReply) {
          await this.sendTelegramNotification(message, sessionId);
        }
      }

      // 移除搜尋動畫
      this.panel.removeSearchingAnimation();

      // 開始流式回覆
      this.panel.startStreamingMessage();

      // 模擬流式輸出
      const words = response.split('');
      for (let i = 0; i < words.length; i++) {
        await this.panel.appendStreamingContent(words[i]);
        // 每個字符延遲 20ms
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // 完成流式回覆
      await this.panel.finishStreamingMessage(sources);

      // 添加助手回應到對話狀態
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        sources
      };

      this.conversationState?.messages.push(assistantMessage);
      this.saveConversationState();

      // 保存對話記錄到資料庫（userId 由後端處理）
      await this.saveConversationToDatabase(sessionId);
    } catch (error) {
      console.error('Error processing message:', error);

      // 移除搜尋動畫
      this.panel.removeSearchingAnimation();

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
   * 處理文字訊息（新架構：統一透過後端 API）
   */
  private async processTextMessage(message: string, sessionId: string): Promise<{
    response: string;
    sources: any[];
    needsHumanReply: boolean;
    pageId?: string;
    aiPageHtml?: string;
  }> {
    try {
      // 調用統一的後端 API
      const apiEndpoint = this.config?.apiEndpoint || '/api/widget/chat';

      console.log(`🤖 Calling backend API: ${apiEndpoint}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 包含 cookies (session)
        body: JSON.stringify({
          message,
          sessionId,
          // userId removed - will be extracted from session by backend
          conversationHistory: this.conversationState?.messages || [],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            response: '抱歉，您需要先登入才能使用此功能。',
            sources: [],
            needsHumanReply: false,
          };
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 標準化回應格式
      return {
        response: data.reply || data.message || '抱歉，我無法生成回應。',
        sources: data.sources || [],
        needsHumanReply: data.needsHumanReply || false,
        pageId: data.pageId, // AI Page ID
        aiPageHtml: data.aiPageHtml, // AI Page HTML 內容
      };
    } catch (error) {
      console.error('[LensService] API call failed:', error);

      // 降級處理：返回友善的錯誤訊息
      return {
        response: '抱歉，系統暫時無法回應。請稍後再試或聯繫客服。',
        sources: [],
        needsHumanReply: true,
      };
    }
  }

  /**
   * 處理圖片訊息
   */
  private async processImageMessage(message: string, imageBase64: string): Promise<string> {
    try {
      if (!this.config?.azureOpenAI?.endpoint || !this.config?.azureOpenAI?.apiKey) {
        return '圖片分析功能需要配置 Azure OpenAI 服務。';
      }

      // 調用 Azure OpenAI Vision API
      const response = await this.callAzureOpenAIVision(message, imageBase64);
      return response;
    } catch (error) {
      console.error('Error processing image message:', error);
      return '圖片分析失敗，請重試或聯繫客服。';
    }
  }

  /**
   * Call Azure OpenAI Vision API
   * Note: Vision API is currently not implemented. Future implementation should use backend API.
   */
  private async callAzureOpenAIVision(message: string, imageBase64: string): Promise<string> {
    return '抱歉，圖片分析功能暫時不可用。請聯繫客服獲得幫助。';
  }

  /**
   * 發送 Telegram 通知
   */
  private async sendTelegramNotification(message: string, sessionId: string): Promise<void> {
    try {
      const botToken = this.config?.telegram?.botToken;
      const chatId = this.config?.telegram?.chatId;

      if (!botToken || !chatId) {
        console.warn('Telegram not configured, skipping notification');
        return;
      }

      const text = `🔔 新的客服訊息需要人工回覆\n\n` +
                  `會話ID: ${sessionId}\n` +
                  `用戶訊息: ${message}\n` +
                  `時間: ${new Date().toLocaleString('zh-TW')}`;

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      console.log('✅ Telegram notification sent');
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  /**
   * 保存對話記錄到資料庫
   */
  private async saveConversationToDatabase(sessionId: string): Promise<void> {
    if (!this.conversationState) return;

    try {
      const { DatabaseService } = await import('./services/DatabaseService');
      // userId will be extracted from session by backend
      await DatabaseService.saveConversation(sessionId, 'anonymous', this.conversationState.messages);
      console.log('✅ Conversation saved to database');
    } catch (error) {
      console.error('Failed to save conversation to database:', error);
    }
  }
  
  /**
   * Set rule (currently disabled)
   * Note: Rule functionality is not implemented in this version
   */
  setRule(ruleId: string): void {
    console.log('Rule setting is disabled');
  }
  
  /**
   * 打開管理後台
   */
  private openAdminPanel(): void {
    if (this.adminPanel) {
      this.adminPanel.open().catch(console.error);
    }
  }

  /**
   * Index site (not implemented)
   * Note: Site indexing functionality has been removed. Use backend API for indexing.
   */
  async indexSite(
    startUrl?: string,
    mode: 'local' | 'domain' = 'domain',
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    console.warn('Site indexing is not implemented. Use backend API instead.');
  }

  /**
   * Search current page content (not implemented)
   * Note: This functionality has been removed.
   */
  searchCurrentPage(query: string): Array<{ text: string; context: string }> {
    return [];
  }

  /**
   * Get current page content (not implemented)
   * Note: This functionality has been removed.
   */
  getCurrentPageContent(): {
    title: string;
    url: string;
    content: string;
    headings: Array<{ level: number; text: string }>;
    links: Array<{ text: string; href: string }>;
  } {
    return { title: '', url: '', content: '', headings: [], links: [] };
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
  async openAdmin(): Promise<void> {
    if (!this.initialized) {
      console.error('ServiceModuler not initialized. Call init() first.');
      return;
    }

    if (!this.adminPanel) {
      console.error('AdminPanel not initialized');
      return;
    }

    await this.adminPanel.open();
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
    // 每次打開都創建新對話
    this.panel?.clearMessages();
    this.conversationState = {
      sessionId: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      messages: []
    };
    console.log('✅ Created new conversation session');
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
  private async loadConversationState(): Promise<void> {
    try {
      // 嘗試從 localStorage 獲取最新的對話
      const { DatabaseService } = await import('./services/DatabaseService');
      await DatabaseService.initializePool();

      const conversations = await DatabaseService.getConversations();
      let state: any = null;

      if (conversations.length > 0) {
        // 獲取最新的對話
        const latestConversation = conversations.sort((a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0];

        state = {
          sessionId: latestConversation.session_id,
          messages: latestConversation.messages || []
        };

        console.log(`✅ Loaded conversation with ${state.messages.length} messages`);
      } else {
        state = {
          sessionId: this.generateSessionId(),
          messages: []
        };
        console.log('✅ Created new conversation session');
      }

      this.conversationState = state;

      // 恢復訊息到 UI
      if (this.panel && state.messages.length > 0) {
        // 清除現有訊息
        this.panel.clearMessages();
        // 添加歷史訊息
        state.messages.forEach((msg: any) => {
          this.panel!.addMessage(msg);
        });
      }
    } catch (error) {
      console.error('Failed to load conversation state:', error);
      this.conversationState = {
        sessionId: this.generateSessionId(),
        messages: []
      };
    }
  }
  
  /**
   * 載入並顯示 AI Page
   */
  private async loadAndShowAIPage(pageId: string): Promise<void> {
    try {
      // 構建 AI Page URL
      const apiEndpoint = this.config?.apiEndpoint || '/api/widget';
      const baseUrl = apiEndpoint.replace('/chat', '');
      const pageUrl = `${baseUrl}/api/ai-page/${pageId}`;

      console.log('📄 Loading AI Page from:', pageUrl);

      // 獲取 AI Page 內容
      const response = await fetch(pageUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch AI Page:', response.statusText);
        return;
      }

      const htmlContent = await response.text();

      // AI Page overlay 已移除，改為直接在新視窗開啟
      window.open(pageUrl, '_blank');
    } catch (error) {
      console.error('Error loading AI Page:', error);
    }
  }

  /**
   * Save conversation state
   * Note: Local storage saving is disabled. Conversations are saved to database via saveConversationToDatabase()
   */
  private saveConversationState(): void {
    // Conversation state is saved to database instead of localStorage
  }

  /**
   * 檢查是否在管理後台頁面
   */
  private isAdminPage(): boolean {
    return window.location.pathname.includes('/lens-service');
  }

  /**
   * 創建浮動圖標
   */
  private createFloatingIcon(): void {
    if (this.floatingIcon) {
      this.floatingIcon.remove();
    }

    const iconConfig = this.config?.ui?.iconPosition;
    let position: any = { bottom: '20px', right: '20px' };

    // 處理不同的位置配置
    if (typeof iconConfig === 'string') {
      switch (iconConfig) {
        case 'bottom-left':
          position = { bottom: '20px', left: '20px' };
          break;
        case 'top-right':
          position = { top: '20px', right: '20px' };
          break;
        case 'top-left':
          position = { top: '20px', left: '20px' };
          break;
        default: // 'top-right'
          position = { top: '20px', right: '20px' };
      }
    } else if (iconConfig && typeof iconConfig === 'object') {
      position = iconConfig;
    }

    this.floatingIcon = document.createElement('button');
    this.floatingIcon.id = 'lens-service-floating-icon';
    this.floatingIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    // 設置樣式
    const styles = `
      position: fixed;
      z-index: 999999;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ${Object.entries(position).map(([key, value]) => `${key}: ${value}`).join('; ')};
    `;

    this.floatingIcon.style.cssText = styles;

    // 添加懸停效果
    this.floatingIcon.addEventListener('mouseenter', () => {
      this.floatingIcon!.style.transform = 'scale(1.1)';
      this.floatingIcon!.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.2)';
    });

    this.floatingIcon.addEventListener('mouseleave', () => {
      this.floatingIcon!.style.transform = 'scale(1)';
      this.floatingIcon!.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    });

    // 點擊事件
    this.floatingIcon.addEventListener('click', () => {
      this.open();
    });

    document.body.appendChild(this.floatingIcon);
  }

  /**
   * 移除浮動圖標
   */
  private removeFloatingIcon(): void {
    if (this.floatingIcon) {
      this.floatingIcon.remove();
      this.floatingIcon = undefined;
    }
  }



  /**
   * 生成 Session ID
   */
  private generateSessionId(): string {
    return `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 設置對話 ID（用於載入歷史對話）
   */
  setConversationId(conversationId: string): void {
    if (this.conversationState) {
      this.conversationState.sessionId = conversationId;
    }
  }
}

// 創建全局實例
const LensService = new LensServiceWidget();

// 導出到全局
if (typeof window !== 'undefined') {
  (window as any).LensService = LensService;
}

// 導出服務供外部使用
export { ContentExtractorService } from './services/ContentExtractorService';
export { DatabaseService } from './services/DatabaseService';
export { ManualIndexService } from './services/ManualIndexService';
export { ConversationService } from './services/ConversationService';
export { UserService } from './services/UserService';

export default LensService;


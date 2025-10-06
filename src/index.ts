import { ServiceModulerConfig, ConversationState, Message, Rule } from './types';
import { SidePanel } from './components/SidePanel';
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
  private panel?: SidePanel;
  private conversationState?: ConversationState;
  private initialized: boolean = false;
  private captureMode: boolean = false;
  private adminPanel?: AdminPanel;
  private floatingIcon?: HTMLElement;
  private screenshotMode: boolean = false;
  private hoverHandler: ((event: MouseEvent) => void) | null = null;
  private mouseLeaveHandler: ((event: MouseEvent) => void) | null = null;
  
  /**
   * 從SQL載入規則
   */
  private async loadRulesFromSQL(): Promise<Rule[]> {
    try {
      const response = await fetch('http://localhost:3002/rules');
      if (!response.ok) {
        console.log('No rules found in database, using empty array');
        return [];
      }
      const rules = await response.json();
      return Array.isArray(rules) ? rules : [];
    } catch (error) {
      console.error('Failed to load rules from SQL:', error);
      return [];
    }
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

    // 從SQL讀取規則
    const rules = await this.loadRulesFromSQL();

    // Agent initialization disabled
    // Capture service disabled

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
    await this.loadConversationState();
    
    // 設置規則列表
    // Agent disabled
    
    // 初始化管理後台（確保只創建一次）
    if (!this.adminPanel) {
      this.adminPanel = new AdminPanel();
    }

    // 檢查URL路徑，如果是 /lens-service 則打開管理後台
    if (window.location.pathname === '/lens-service') {
      this.openAdminPanel();
    }

    // 綁定快捷鍵
    this.bindGlobalKeyboardShortcuts();

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
   * 綁定全局快捷鍵
   */
  private bindGlobalKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Q 鍵按下時啟用截圖模式（僅當面板打開時）
      if (event.key && event.key.toLowerCase() === 'q' && this.panel?.isPanelOpen()) {
        console.log('🎯 Q key pressed, panel is open, enabling screenshot mode');
        this.enableScreenshotMode();
      } else if (event.key && event.key.toLowerCase() === 'q') {
        console.log('🎯 Q key pressed, but panel is not open:', this.panel?.isPanelOpen());
      }
    });

    document.addEventListener('keyup', (event) => {
      // Q 鍵釋放時禁用截圖模式
      if (event.key && event.key.toLowerCase() === 'q') {
        this.disableScreenshotMode();
      }
    });

    // 綁定點擊事件用於截圖
    document.addEventListener('click', (event) => {
      if (this.screenshotMode && this.panel?.isPanelOpen()) {
        console.log('📸 Screenshot click detected');
        event.preventDefault();
        event.stopPropagation();
        this.captureElementScreenshot(event.target as HTMLElement);
      }
    }, true);
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
        response = await this.processImageMessage(message, imageBase64);
      } else {
        // 純文字訊息 - 使用 agent 處理
        const result = await this.processTextMessage(message, sessionId, userId);
        response = result.response;
        sources = result.sources;
        needsHumanReply = result.needsHumanReply;

        // 如果需要人工回覆，發送 Telegram 通知
        if (needsHumanReply) {
          await this.sendTelegramNotification(message, sessionId);
        }
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
   * 處理文字訊息
   */
  private async processTextMessage(message: string, sessionId: string, userId: string): Promise<{
    response: string;
    sources: any[];
    needsHumanReply: boolean;
  }> {
    try {
      // 從資料庫獲取系統提示詞
      const { DatabaseService } = await import('./services/DatabaseService');
      await DatabaseService.initializePool();

      const systemPrompt = await DatabaseService.getSetting('system_prompt') ||
        '你是一個專業的客服助手，請用繁體中文回答問題。';

      // 檢查是否有 Azure OpenAI 配置
      if (!this.config?.azureOpenAI?.endpoint || !this.config?.azureOpenAI?.apiKey) {
        console.warn('Azure OpenAI not configured, using default reply');
        const defaultReply = await DatabaseService.getSetting('default_reply') ||
          '很抱歉，我無法回答這個問題。請聯繫人工客服獲得更多幫助。';
        return {
          response: defaultReply,
          sources: [],
          needsHumanReply: true
        };
      }

      // 調用 Azure OpenAI
      const response = await this.callAzureOpenAI(message, systemPrompt);

      return {
        response,
        sources: [],
        needsHumanReply: false
      };
    } catch (error) {
      console.error('Error processing text message:', error);

      // 獲取預設回覆
      try {
        const { DatabaseService } = await import('./services/DatabaseService');
        const defaultReply = await DatabaseService.getSetting('default_reply') ||
          '很抱歉，我無法回答這個問題。請聯繫人工客服獲得更多幫助。';
        return {
          response: defaultReply,
          sources: [],
          needsHumanReply: true
        };
      } catch {
        return {
          response: '系統暫時無法回應，請稍後再試。',
          sources: [],
          needsHumanReply: true
        };
      }
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
   * 調用 Azure OpenAI API
   */
  private async callAzureOpenAI(message: string, systemPrompt: string): Promise<string> {
    const endpoint = this.config?.azureOpenAI?.endpoint;
    const apiKey = this.config?.azureOpenAI?.apiKey;
    const deployment = this.config?.azureOpenAI?.deployment;
    const apiVersion = this.config?.azureOpenAI?.apiVersion;

    const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey!
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我無法生成回應。';
  }

  /**
   * 調用 Azure OpenAI Vision API
   */
  private async callAzureOpenAIVision(message: string, imageBase64: string): Promise<string> {
    const endpoint = this.config?.azureOpenAI?.endpoint;
    const apiKey = this.config?.azureOpenAI?.apiKey;
    const deployment = this.config?.azureOpenAI?.deployment;
    const apiVersion = this.config?.azureOpenAI?.apiVersion;

    const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey!
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: message || '請分析這張圖片' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我無法分析這張圖片。';
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
  private async saveConversationToDatabase(sessionId: string, userId: string): Promise<void> {
    if (!this.conversationState) return;

    try {
      const { DatabaseService } = await import('./services/DatabaseService');
      await DatabaseService.saveConversation(sessionId, userId, this.conversationState.messages);
      console.log('✅ Conversation saved to database');
    } catch (error) {
      console.error('Failed to save conversation to database:', error);
    }
  }
  
  /**
   * 設置規則
   */
  setRule(ruleId: string): void {
    // Rule setting disabled
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
   * 開始索引網站
   * @param mode 'local' = 索引本地專案, 'domain' = 爬取域名（默認）
   */
  async indexSite(
    startUrl?: string,
    mode: 'local' | 'domain' = 'domain',
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    console.log('Site indexing disabled');
  }

  /**
   * 啟用元素捕獲模式（Ctrl+Click）
   */
  enableCaptureMode(): void {
    console.log('Capture mode disabled');

    this.captureMode = true;

    // Capture mode disabled
    console.log('Capture mode would be enabled here');

    console.log('Capture mode enabled. Press Ctrl+Click to capture elements.');
  }

  /**
   * 禁用元素捕獲模式
   */
  disableCaptureMode(): void {
    this.captureMode = false;
  }

  /**
   * 搜尋當前頁面內容
   */
  searchCurrentPage(query: string): Array<{
    text: string;
    context: string;
  }> {
    return [];
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
   * 保存對話狀態
   */
  private saveConversationState(): void {
    if (this.conversationState) {
      // Save conversation disabled
    }
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
   * 啟用截圖模式
   */
  private enableScreenshotMode(): void {
    if (this.screenshotMode) return;

    this.screenshotMode = true;
    document.body.style.cursor = 'crosshair';

    // 添加視覺提示
    const overlay = document.createElement('div');
    overlay.id = 'lens-screenshot-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 123, 255, 0.1);
      z-index: 999998;
      pointer-events: none;
      border: 2px dashed #007bff;
    `;
    document.body.appendChild(overlay);

    // 添加hover效果來高亮選中的元素
    this.addHoverHighlight();

    console.log('📸 Screenshot mode enabled - Q+Click to capture elements');
  }

  /**
   * 禁用截圖模式
   */
  private disableScreenshotMode(): void {
    if (!this.screenshotMode) return;

    this.screenshotMode = false;
    document.body.style.cursor = '';

    // 移除視覺提示
    const overlay = document.getElementById('lens-screenshot-overlay');
    if (overlay) {
      overlay.remove();
    }

    // 移除hover高亮效果
    this.removeHoverHighlight();
  }

  /**
   * 添加hover高亮效果
   */
  private addHoverHighlight(): void {
    // 移除之前的事件監聽器（如果存在）
    this.removeHoverHighlight();

    this.hoverHandler = (event: MouseEvent) => {
      if (!this.screenshotMode) return;

      const target = event.target as HTMLElement;
      if (!target || target.closest('#lens-service-panel') || target.closest('#lens-service-admin')) {
        return;
      }

      // 移除之前的高亮
      const prevHighlight = document.querySelector('.lens-hover-highlight');
      if (prevHighlight) {
        prevHighlight.classList.remove('lens-hover-highlight');
      }

      // 添加高亮樣式
      target.classList.add('lens-hover-highlight');
    };

    this.mouseLeaveHandler = (event: MouseEvent) => {
      if (!this.screenshotMode) return;

      const target = event.target as HTMLElement;
      if (target) {
        target.classList.remove('lens-hover-highlight');
      }
    };

    // 添加CSS樣式
    if (!document.getElementById('lens-hover-styles')) {
      const style = document.createElement('style');
      style.id = 'lens-hover-styles';
      style.textContent = `
        .lens-hover-highlight {
          outline: 2px solid #007bff !important;
          outline-offset: 2px !important;
          background-color: rgba(0, 123, 255, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.addEventListener('mouseover', this.hoverHandler);
    document.addEventListener('mouseleave', this.mouseLeaveHandler);
  }

  /**
   * 移除hover高亮效果
   */
  private removeHoverHighlight(): void {
    if (this.hoverHandler) {
      document.removeEventListener('mouseover', this.hoverHandler);
      this.hoverHandler = null;
    }
    if (this.mouseLeaveHandler) {
      document.removeEventListener('mouseleave', this.mouseLeaveHandler);
      this.mouseLeaveHandler = null;
    }

    // 移除所有高亮
    const highlights = document.querySelectorAll('.lens-hover-highlight');
    highlights.forEach(el => el.classList.remove('lens-hover-highlight'));

    // 移除樣式
    const style = document.getElementById('lens-hover-styles');
    if (style) {
      style.remove();
    }
  }

  /**
   * 捕獲元素截圖
   */
  private async captureElementScreenshot(element: HTMLElement): Promise<void> {
    try {
      console.log('📸 Capturing screenshot of element:', element);

      // 動態載入 html2canvas
      if (!(window as any).html2canvas) {
        await this.loadHtml2Canvas();
      }

      const html2canvas = (window as any).html2canvas;

      // 高亮選中的元素
      const originalStyle = element.style.cssText;
      element.style.cssText += '; outline: 3px solid #007bff; outline-offset: 2px;';

      // 等待一小段時間讓高亮效果顯示
      await new Promise(resolve => setTimeout(resolve, 100));

      // 捕獲元素
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // 恢復原始樣式
      element.style.cssText = originalStyle;

      // 轉換為 base64
      const base64Image = canvas.toDataURL('image/png');

      // 將截圖放入輸入框
      if (this.panel) {
        this.panel.setScreenshotInInput(base64Image);
      }

      console.log('✅ Screenshot captured and added to input');

    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);

      // 顯示錯誤提示
      this.panel?.addMessage({
        id: Date.now().toString(),
        content: '截圖失敗，請重試。',
        role: 'assistant',
        timestamp: Date.now()
      });
    } finally {
      this.disableScreenshotMode();
    }
  }

  /**
   * 載入 html2canvas 庫
   */
  private async loadHtml2Canvas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
  }

  /**
   * 發送截圖到 AI 進行分析
   */
  private async sendScreenshotToAI(base64Image: string, element: HTMLElement): Promise<void> {
    try {
      console.log('Screenshot analysis disabled');

      // 獲取元素的上下文信息
      const elementInfo = {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        textContent: element.textContent?.substring(0, 200) || '',
        attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      };

      const contextPrompt = `
用戶截取了網頁上的一個元素，請分析這個截圖並提供相關說明。

元素信息：
- 標籤：${elementInfo.tagName}
- 類名：${elementInfo.className}
- ID：${elementInfo.id}
- 文本內容：${elementInfo.textContent}
- 屬性：${elementInfo.attributes}

請分析截圖內容並提供有用的信息或建議。
      `.trim();

      // 發送到 OpenAI Vision API
      const response = '截圖分析功能暫時停用';

      // 在面板中顯示結果
      this.panel?.addMessage({
        id: Date.now().toString(),
        content: `📸 **截圖分析結果：**\n\n${response}`,
        role: 'assistant',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Failed to send screenshot to AI:', error);

      this.panel?.addMessage({
        id: Date.now().toString(),
        content: '截圖分析失敗，請檢查 AI 服務配置。',
        role: 'assistant',
        timestamp: Date.now()
      });
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

export default LensService;


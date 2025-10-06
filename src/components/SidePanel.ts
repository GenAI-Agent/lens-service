import { Message, Rule } from '../types';
import { styles } from './styles';
// import { MarkdownRenderer } from '../utils/markdown';


/**
 * 側邊欄面板組件
 * 從右側滑入，將原頁面推到左邊 2/3
 */
export class SidePanel {
  private container: HTMLDivElement;
  private overlay: HTMLDivElement;
  private panel: HTMLDivElement;
  private isOpen: boolean = false;
  private width: string;
  private position: 'left' | 'right';
  private capturedImage: string | null = null;
  private capturedText: string | null = null;

  // 回調函數
  private onSendMessage?: (message: string, imageBase64?: string, imageContext?: string) => void;
  private onSelectRule?: (ruleId: string) => void;
  private onClose?: () => void;
  private onOpen?: () => void;
  
  constructor(
    width: string = '33.33%',
    position: 'left' | 'right' = 'right'
  ) {
    this.width = width;
    this.position = position;
    this.container = this.createContainer();
    this.overlay = this.createOverlay();
    this.panel = this.createPanel();
  }
  
  /**
   * 創建容器
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'sm-container';
    container.style.cssText = styles.container;
    return container;
  }
  
  /**
   * 創建遮罩層
   */
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = styles.overlay;
    overlay.style.display = 'none';
    overlay.addEventListener('click', () => this.close());
    return overlay;
  }
  
  /**
   * 創建面板
   */
  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = styles.panel;
    panel.style.width = this.width;

    // 設置初始位置（在螢幕外）
    if (this.position === 'right') {
      panel.style.right = `-${this.width}`;
      panel.style.left = 'auto';
    } else {
      panel.style.left = `-${this.width}`;
      panel.style.right = 'auto';
    }

    // 面板內容 - 移除 header，改善設計
    panel.innerHTML = `
      <div id="sm-view-container" style="${styles.viewContainer}">
        <!-- 右上角工具按鈕 -->
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; z-index: 10;">

          <button id="sm-history-btn" style="${styles.iconButton}" title="歷史記錄">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
          <button id="sm-refresh-btn" style="${styles.iconButton}" title="刷新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
            </svg>
          </button>
          <button id="sm-close-btn" style="${styles.iconButton}" title="關閉">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 對話視圖 -->
        <div id="sm-chat-view" style="${styles.chatView}">
          <div id="sm-messages" style="${styles.messagesContainer}"></div>
          <div style="${styles.inputContainer}">
            <!-- 圖片預覽（預設隱藏） -->
            <div id="sm-image-preview" style="display: none; margin-bottom: 12px; padding: 12px; background: #f3f4f6; border-radius: 8px; position: relative;">
              <img id="sm-preview-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db;" />
              <button id="sm-remove-image" style="position: absolute; top: 8px; right: 8px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">✕</button>
              <div id="sm-image-context" style="margin-left: 72px; font-size: 12px; color: #6b7280; line-height: 1.4;"></div>
            </div>

            <div style="position: relative; width: 100%;">
              <input
                type="text"
                id="sm-input"
                placeholder="輸入訊息..."
                style="${styles.input}"
              />
              <button id="sm-send-btn" style="${styles.sendIconButton}" title="發送">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>


      </div>
    `;

    // 綁定事件
    this.bindEvents(panel);

    return panel;
  }
  
  /**
   * 綁定事件
   */
  private bindEvents(panel: HTMLDivElement): void {
    // 關閉按鈕
    panel.querySelector('#sm-close-btn')?.addEventListener('click', () => {
      this.close();
    });
    
    // 發送按鈕 - 使用多種事件綁定方式確保可靠性
    const sendBtn = panel.querySelector('#sm-send-btn');
    if (sendBtn) {
      console.log('✅ Send button found, binding click event');

      // 方法1: 標準事件監聽器
      sendBtn.addEventListener('click', (e) => {
        console.log('🔥 Send button clicked via addEventListener!');
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      });

      // 方法2: 直接設置onclick屬性
      (sendBtn as HTMLElement).onclick = (e) => {
        console.log('🔥 Send button clicked via onclick!');
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      };

      // 方法3: 使用事件委託
      panel.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'sm-send-btn' ||
            (e.target as HTMLElement).closest('#sm-send-btn')) {
          console.log('🔥 Send button clicked via delegation!');
          e.preventDefault();
          e.stopPropagation();
          this.handleSend();
        }
      });
    } else {
      console.error('❌ Send button not found!');
    }
    
    // 輸入框事件
    const input = panel.querySelector('#sm-input') as HTMLInputElement;
    if (input) {
      console.log('✅ Input field found, binding events');

      // Enter 鍵發送
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('🔥 Enter key pressed in input');
          this.handleSend();
        }
      });

      // 輸入事件調試
      input.addEventListener('input', (e) => {
        console.log('🔥 Input event:', (e.target as HTMLInputElement).value);
      });

      // 聚焦事件調試
      input.addEventListener('focus', () => {
        console.log('🔥 Input focused');
      });

      input.addEventListener('blur', () => {
        console.log('🔥 Input blurred');
      });
    } else {
      console.error('❌ Input field not found!');
    }
    
    // 標籤切換
    panel.querySelector('#sm-chat-tab')?.addEventListener('click', () => {
      this.showView('chat');
    });
    

    
    // 刷新按鈕
    panel.querySelector('#sm-refresh-btn')?.addEventListener('click', () => {
      this.clearMessages();
    });

    // 歷史記錄按鈕
    panel.querySelector('#sm-history-btn')?.addEventListener('click', () => {
      this.showHistory();
    });

    // 移除圖片按鈕
    panel.querySelector('#sm-remove-image')?.addEventListener('click', () => {
      this.clearCapturedImage();
    });
  }
  
  /**
   * 處理發送訊息
   */
  private handleSend(): void {
    const input = this.panel.querySelector('#sm-input') as HTMLInputElement;
    const message = input.value.trim();

    if ((message || this.capturedImage) && this.onSendMessage) {
      this.onSendMessage(message, this.capturedImage || undefined, this.capturedText || undefined);
      input.value = '';
      this.clearCapturedImage();
    }
  }
  
  /**
   * 顯示視圖
   */
  private showView(view: 'chat'): void {
    const chatView = this.panel.querySelector('#sm-chat-view') as HTMLElement;
    const chatTab = this.panel.querySelector('#sm-chat-tab') as HTMLElement;

    if (view === 'chat') {
      chatView.style.display = 'flex';
      chatTab.style.cssText = styles.tabButton + '; ' + styles.tabButtonActive;
    }
  }
  
  /**
   * 添加訊息
   */
  addMessage(message: Message): void {
    const messagesContainer = this.panel.querySelector('#sm-messages');
    if (!messagesContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.style.cssText = message.role === 'user'
      ? styles.userMessage
      : styles.assistantMessage;

    // 對於助手消息使用 Markdown 渲染，用戶消息保持純文本
    if (message.role === 'assistant') {
      messageEl.innerHTML = message.content;
    } else {
      messageEl.textContent = message.content;
    }
    
    // 如果有來源，添加來源連結
    if (message.sources && message.sources.length > 0) {
      const sourcesEl = document.createElement('div');
      sourcesEl.style.cssText = styles.sources;
      sourcesEl.innerHTML = '<strong>參考來源：</strong><br>';
      
      message.sources.forEach((source, index) => {
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.textContent = `[${index + 1}] ${source.title}`;
        link.style.cssText = styles.sourceLink;
        sourcesEl.appendChild(link);
        sourcesEl.appendChild(document.createElement('br'));
      });
      
      messageEl.appendChild(sourcesEl);
    }
    
    messagesContainer.appendChild(messageEl);

    // 自動滾動到底部，使用 setTimeout 確保 DOM 更新完成
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
  }
  
  /**
   * 設置規則列表 (已移除規則功能)
   */
  setRules(rules: Rule[], currentRuleId?: string): void {
    // 規則功能已移除，此方法保留以維持兼容性
  }
  
  /**
   * 清除訊息
   */
  clearMessages(): void {
    const messagesContainer = this.panel.querySelector('#sm-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  /**
   * 顯示歷史記錄
   */
  async showHistory(): Promise<void> {
    try {
      // 從 DatabaseService 讀取對話記錄
      const { DatabaseService } = await import('../services/DatabaseService');
      const conversations = await DatabaseService.getConversations();

      // 切換到歷史記錄視圖
      this.showHistoryView(conversations);
    } catch (error) {
      console.error('Failed to load history:', error);
      alert('載入歷史記錄失敗');
    }
  }

  /**
   * 顯示歷史記錄視圖
   */
  private showHistoryView(conversations: any[]): void {
    const chatView = this.panel.querySelector('#sm-chat-view') as HTMLElement;
    const chatTab = this.panel.querySelector('#sm-chat-tab') as HTMLElement;

    console.log('📋 showHistoryView called with', conversations.length, 'conversations');
    console.log('📋 chatView:', chatView);
    console.log('📋 chatTab:', chatTab);

    if (!chatView || !chatTab) {
      console.error('❌ chatView or chatTab not found');
      return;
    }

    // 隱藏聊天視圖
    chatView.style.display = 'none';
    chatTab.style.cssText = styles.tabButton;

    // 創建或獲取歷史記錄視圖
    let historyView = this.panel.querySelector('#sm-history-view') as HTMLElement;
    if (!historyView) {
      historyView = document.createElement('div');
      historyView.id = 'sm-history-view';
      historyView.style.cssText = styles.chatView;
      const parent = chatView.parentElement;
      console.log('📋 parent element:', parent);
      if (parent) {
        parent.appendChild(historyView);
        console.log('✅ History view created and appended');
      } else {
        console.error('❌ Parent element not found');
        return;
      }
    }

    // 顯示歷史記錄視圖
    historyView.style.display = 'flex';
    historyView.style.flexDirection = 'column';
    console.log('✅ History view display set to flex');

    // 渲染歷史記錄列表
    if (!Array.isArray(conversations) || conversations.length === 0) {
      historyView.innerHTML = `
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #6b7280;">
          <p style="font-size: 14px;">目前沒有對話記錄</p>
        </div>
        <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
          <button id="sm-back-to-chat" style="
            width: 100%;
            padding: 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">返回對話</button>
        </div>
      `;
    } else {
      const historyItems = conversations.map((c: any) => {
        let messages = [];
        try {
          messages = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages;
        } catch (e) {
          messages = [];
        }

        const messageCount = Array.isArray(messages) ? messages.length : 0;
        const createdAt = new Date(c.created_at).toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        // 使用 conversation_id 欄位
        const conversationId = c.conversation_id || c.id || 'unknown';
        const displayId = conversationId.toString().slice(-8);

        return `
          <div class="history-item" data-conversation-id="${conversationId}" style="
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #1f2937; font-size: 14px;">對話 #${displayId}</div>
              <div style="font-size: 12px; color: #6b7280;">${createdAt}</div>
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              訊息數: ${messageCount} | 用戶: ${c.user_id || 'unknown'}
            </div>
          </div>
        `;
      }).join('');

      historyView.innerHTML = `
        <div style="flex: 1; overflow-y: auto;">
          <div style="padding: 16px; border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">對話歷史記錄</h3>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">點擊對話以查看詳情</p>
          </div>
          ${historyItems}
        </div>
        <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
          <button id="sm-back-to-chat" style="
            width: 100%;
            padding: 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">返回對話</button>
        </div>
      `;
    }

    // 綁定返回按鈕事件
    const backButton = historyView.querySelector('#sm-back-to-chat');
    backButton?.addEventListener('click', () => {
      this.showView('chat');
      historyView.style.display = 'none';
    });

    // 綁定歷史記錄項目點擊事件
    const historyItems = historyView.querySelectorAll('.history-item');
    historyItems.forEach(item => {
      item.addEventListener('click', async () => {
        const conversationId = item.getAttribute('data-conversation-id');
        if (conversationId) {
          await this.loadConversation(conversationId);
        }
      });
    });
  }

  /**
   * 載入指定對話
   */
  private async loadConversation(conversationId: string): Promise<void> {
    try {
      const { DatabaseService } = await import('../services/DatabaseService');
      const conversation = await DatabaseService.getConversation(conversationId);

      if (!conversation) {
        alert('無法載入對話');
        return;
      }

      // 清除當前訊息
      this.clearMessages();

      // 載入對話訊息
      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
      messages.forEach((msg: any) => {
        this.addMessage(msg);
      });

      // 切換回聊天視圖
      const historyView = this.panel.querySelector('#sm-history-view') as HTMLElement;
      if (historyView) {
        historyView.style.display = 'none';
      }
      this.showView('chat');

      // 通知主應用程式載入了新對話
      if ((window as any).LensService) {
        (window as any).LensService.setConversationId(conversationId);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('載入對話失敗');
    }
  }
  
  /**
   * 打開面板
   */
  open(): void {
    if (this.isOpen) return;

    // 添加到 DOM
    if (!this.container.parentElement) {
      document.body.appendChild(this.container);
      this.container.appendChild(this.overlay);
      this.container.appendChild(this.panel);
    }

    // 顯示遮罩
    this.overlay.style.display = 'block';

    // 滑入面板
    setTimeout(() => {
      if (this.position === 'right') {
        this.panel.style.right = '0';
      } else {
        this.panel.style.left = '0';
      }
    }, 10);

    this.isOpen = true;

    // 觸發 onOpen 回調（用於啟用 Ctrl+Click）
    if (this.onOpen) {
      this.onOpen();
    }
  }

  /**
   * 關閉面板
   */
  close(): void {
    if (!this.isOpen) return;

    // 滑出面板
    if (this.position === 'right') {
      this.panel.style.right = `-${this.width}`;
    } else {
      this.panel.style.left = `-${this.width}`;
    }

    // 隱藏遮罩
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 300);

    this.isOpen = false;

    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 檢查面板是否打開
   */
  isPanelOpen(): boolean {
    return this.isOpen;
  }
  
  /**
   * 推動頁面內容
   */
  private pushPageContent(): void {
    const body = document.body;
    const html = document.documentElement;

    // 計算面板寬度百分比
    const panelWidthPercent = parseFloat(this.width.replace('%', ''));
    // 原頁面應該變成 100% - 面板寬度
    const pageWidthPercent = 100 - panelWidthPercent;

    if (this.position === 'right') {
      // 右側面板：頁面向左推動，寬度縮小
      body.style.transform = `translateX(0)`;
      body.style.width = `${pageWidthPercent}%`;
      body.style.marginLeft = '0';
      body.style.marginRight = '0';
    } else {
      // 左側面板：頁面向右推動，寬度縮小
      body.style.transform = `translateX(${panelWidthPercent}%)`;
      body.style.width = `${pageWidthPercent}%`;
      body.style.marginLeft = '0';
      body.style.marginRight = '0';
    }

    body.style.transition = 'transform 0.3s ease, width 0.3s ease';
    body.style.boxSizing = 'border-box';
  }

  /**
   * 恢復頁面內容
   */
  private restorePageContent(): void {
    const body = document.body;

    body.style.transform = '';
    body.style.width = '';
    body.style.transition = '';
    body.style.boxSizing = '';
    body.style.marginLeft = '';
    body.style.marginRight = '';
  }

  /**
   * 設置捕獲的圖片
   */
  setCapturedImage(imageBase64: string, text: string): void {
    this.capturedImage = imageBase64;
    this.capturedText = text;

    const preview = this.panel.querySelector('#sm-image-preview') as HTMLElement;
    const img = this.panel.querySelector('#sm-preview-img') as HTMLImageElement;
    const context = this.panel.querySelector('#sm-image-context') as HTMLElement;

    if (preview && img && context) {
      preview.style.display = 'flex';
      img.src = imageBase64;
      context.textContent = text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    // 聚焦輸入框
    const input = this.panel.querySelector('#sm-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * 清除捕獲的圖片
   */
  clearCapturedImage(): void {
    this.capturedImage = null;
    this.capturedText = null;

    const preview = this.panel.querySelector('#sm-image-preview') as HTMLElement;
    if (preview) {
      preview.style.display = 'none';
    }
  }

  /**
   * 將截圖設置到輸入框
   */
  setScreenshotInInput(base64Image: string): void {
    this.capturedImage = base64Image;

    // 顯示圖片預覽
    const preview = this.panel.querySelector('#sm-image-preview') as HTMLElement;
    const img = this.panel.querySelector('#sm-preview-img') as HTMLImageElement;

    if (preview && img) {
      img.src = base64Image;
      preview.style.display = 'block';
    }

    // 自動打開面板如果還沒打開
    if (!this.isOpen) {
      this.open();
    }

    // 聚焦到輸入框
    const input = this.panel.querySelector('#sm-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * 設置回調函數
   */
  setCallbacks(callbacks: {
    onSendMessage?: (message: string, imageBase64?: string, imageContext?: string) => void;
    onSelectRule?: (ruleId: string) => void;
    onClose?: () => void;
    onOpen?: () => void;
  }): void {
    this.onSendMessage = callbacks.onSendMessage;
    this.onSelectRule = callbacks.onSelectRule;
    this.onClose = callbacks.onClose;
    this.onOpen = callbacks.onOpen;
  }
  
  /**
   * 銷毀
   */
  destroy(): void {
    this.close();
    if (this.container.parentElement) {
      document.body.removeChild(this.container);
    }
  }
}


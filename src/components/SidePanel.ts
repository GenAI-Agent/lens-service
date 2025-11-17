import { Message, Rule } from "../types";
import { styles } from "./styles";
import { marked } from "marked";

// 配置 marked
marked.setOptions({
  breaks: true, // 支援換行
  gfm: true, // 支援 GitHub Flavored Markdown
});

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
  private position: "left" | "right";

  // 回調函數
  private onSendMessage?: (message: string) => void;
  private onSelectRule?: (ruleId: string) => void;
  private onClose?: () => void;
  private onOpen?: () => void;

  constructor(width: string = "33.33%", position: "left" | "right" = "right") {
    this.width = width;
    this.position = position;
    this.container = this.createContainer();
    this.overlay = this.createOverlay();
    this.panel = this.createPanel();
    this.injectMarkdownStyles();
  }

  /**
   * 注入 Markdown 樣式
   */
  private injectMarkdownStyles(): void {
    // 檢查是否已經注入過
    if (document.getElementById("sm-markdown-styles")) return;

    const styleEl = document.createElement("div");
    styleEl.id = "sm-markdown-styles";
    styleEl.innerHTML = styles.markdownStyles;
    document.head.appendChild(styleEl);
  }

  /**
   * 創建容器
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "sm-container";
    container.style.cssText = styles.container;
    return container;
  }

  /**
   * 創建遮罩層
   */
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.style.cssText = styles.overlay;
    overlay.style.display = "none";
    overlay.addEventListener("click", () => this.close());
    return overlay;
  }

  /**
   * 創建面板
   */
  private createPanel(): HTMLDivElement {
    const panel = document.createElement("div");
    panel.style.cssText = styles.panel;
    panel.style.width = this.width;

    // 設置初始位置（在螢幕外）
    if (this.position === "right") {
      panel.style.right = `-${this.width}`;
      panel.style.left = "auto";
    } else {
      panel.style.left = `-${this.width}`;
      panel.style.right = "auto";
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
              <!-- Rule autocomplete dropdown -->
              <div id="sm-rule-dropdown" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); z-index: 1000;"></div>

              <textarea
                id="sm-input"
                placeholder="輸入訊息..."
                rows="1"
                style="${styles.input}; resize: none; overflow-y: hidden; min-height: 44px; max-height: 132px; padding-top: 12px; padding-bottom: 12px; line-height: 20px;"
              ></textarea>
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
    panel.querySelector("#sm-close-btn")?.addEventListener("click", () => {
      this.close();
    });

    // 發送按鈕 - 使用多種事件綁定方式確保可靠性
    const sendBtn = panel.querySelector("#sm-send-btn");
    if (sendBtn) {
      console.log("✅ Send button found, binding click event");

      // 方法1: 標準事件監聽器
      sendBtn.addEventListener("click", (e) => {
        console.log("🔥 Send button clicked via addEventListener!");
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      });

      // 方法2: 直接設置onclick屬性
      (sendBtn as HTMLElement).onclick = (e) => {
        console.log("🔥 Send button clicked via onclick!");
        e.preventDefault();
        e.stopPropagation();
        this.handleSend();
      };

      // 方法3: 使用事件委託
      panel.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).id === "sm-send-btn" ||
          (e.target as HTMLElement).closest("#sm-send-btn")
        ) {
          console.log("🔥 Send button clicked via delegation!");
          e.preventDefault();
          e.stopPropagation();
          this.handleSend();
        }
      });
    } else {
      console.error("❌ Send button not found!");
    }

    // Textarea 事件
    const textarea = panel.querySelector("#sm-input") as HTMLTextAreaElement;
    const dropdown = panel.querySelector("#sm-rule-dropdown") as HTMLElement;

    if (textarea && dropdown) {
      console.log("✅ Textarea field found, binding events");

      let selectedRuleIndex = -1;
      let availableRules: string[] = [];

      // 自動調整 textarea 高度
      const autoResize = () => {
        textarea.style.height = "auto";
        const newHeight = Math.min(textarea.scrollHeight, 132); // max 3 lines (44px * 3 = 132px)
        textarea.style.height = newHeight + "px";
        textarea.style.overflowY = newHeight >= 132 ? "auto" : "hidden";
      };

      // 顯示規則下拉選單
      const showRuleDropdown = async (query: string) => {
        try {
          // 從 API 動態獲取 rules
          const apiUrl = process.env.NEXT_PUBLIC_BASE_URL
            ? process.env.NEXT_PUBLIC_BASE_URL
            : typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:8080";

          const response = await fetch(`${apiUrl}/api/widget/rules`);

          if (!response.ok) {
            console.error("Failed to fetch rules from API");
            dropdown.style.display = "none";
            return;
          }

          const data = await response.json();
          const rules = data.rules || [];

          if (rules.length === 0) {
            dropdown.style.display = "none";
            return;
          }

          // 提取規則名稱
          availableRules = rules.map((r: any) => r.name);

          // 過濾符合的規則
          const filteredRules = query
            ? rules.filter(
                (r: any) =>
                  r.name.toLowerCase().includes(query.toLowerCase()) ||
                  r.displayName.includes(query)
              )
            : rules;

          if (filteredRules.length === 0) {
            dropdown.style.display = "none";
            return;
          }

          // 渲染下拉選單
          dropdown.innerHTML = filteredRules
            .map(
              (rule: any, index: number) => `
            <div class="rule-item" data-index="${index}" data-rule="${
                rule.name
              }" style="
              padding: 10px 16px;
              cursor: pointer;
              border-bottom: 1px solid #f3f4f6;
              transition: background-color 0.15s;
            " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
              <div style="font-weight: 500; font-size: 14px; color: #1f2937;">/${
                rule.name
              }</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${
                rule.displayName
              }${rule.description ? " - " + rule.description : ""}</div>
            </div>
          `
            )
            .join("");

          dropdown.style.display = "block";
          selectedRuleIndex = -1;

          // 綁定點擊事件
          dropdown.querySelectorAll(".rule-item").forEach((item) => {
            item.addEventListener("click", () => {
              const ruleName = item.getAttribute("data-rule");
              if (ruleName) {
                insertRule(ruleName);
              }
            });
          });
        } catch (error) {
          console.error("Failed to load rules:", error);
        }
      };

      // 插入規則到 textarea
      const insertRule = (ruleName: string) => {
        const currentValue = textarea.value;
        const cursorPos = textarea.selectionStart;

        // 找到最後一個 / 的位置
        const lastSlashIndex = currentValue.lastIndexOf("/", cursorPos);

        if (lastSlashIndex !== -1) {
          // 替換 / 後面的內容為選中的規則
          const before = currentValue.substring(0, lastSlashIndex);
          const after = currentValue.substring(cursorPos);
          textarea.value = before + "/" + ruleName + " " + after;

          // 將光標移到規則名稱之後
          const newCursorPos = lastSlashIndex + ruleName.length + 2;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }

        dropdown.style.display = "none";
        textarea.focus();
        autoResize();
      };

      // 隱藏下拉選單
      const hideDropdown = () => {
        dropdown.style.display = "none";
        selectedRuleIndex = -1;
      };

      // 追蹤 IME（輸入法）狀態
      let isComposing = false;

      textarea.addEventListener("compositionstart", () => {
        isComposing = true;
        console.log("🎌 IME composition started");
      });

      textarea.addEventListener("compositionend", () => {
        isComposing = false;
        console.log("🎌 IME composition ended");
      });

      // Enter 鍵發送，Shift+Enter 換行
      textarea.addEventListener("keydown", async (e) => {
        // 如果正在使用輸入法（中文、日文等），不處理 Enter 鍵
        if (isComposing) {
          console.log("🎌 Ignoring Enter key during IME composition");
          return;
        }

        // 如果下拉選單顯示中，處理方向鍵和 Enter
        if (dropdown.style.display === "block") {
          const ruleItems = dropdown.querySelectorAll(".rule-item");

          if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedRuleIndex = Math.min(
              selectedRuleIndex + 1,
              ruleItems.length - 1
            );
            updateDropdownSelection(ruleItems);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedRuleIndex = Math.max(selectedRuleIndex - 1, -1);
            updateDropdownSelection(ruleItems);
          } else if (e.key === "Enter" && selectedRuleIndex >= 0) {
            e.preventDefault();
            const selectedItem = ruleItems[selectedRuleIndex];
            const ruleName = selectedItem.getAttribute("data-rule");
            if (ruleName) {
              insertRule(ruleName);
            }
            return;
          } else if (e.key === "Escape") {
            e.preventDefault();
            hideDropdown();
            return;
          }
        }

        // 正常的 Enter 和 Shift+Enter 處理
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          console.log("🔥 Enter key pressed in textarea");
          this.handleSend();
        }
        // Shift+Enter 允許換行（瀏覽器預設行為）
      });

      // 更新下拉選單選中狀態
      const updateDropdownSelection = (items: NodeListOf<Element>) => {
        items.forEach((item, index) => {
          if (index === selectedRuleIndex) {
            (item as HTMLElement).style.backgroundColor = "#e0e7ff";
          } else {
            (item as HTMLElement).style.backgroundColor = "white";
          }
        });
      };

      // 輸入事件 - 檢測 / 並顯示規則下拉選單
      textarea.addEventListener("input", (e) => {
        const value = textarea.value;
        const cursorPos = textarea.selectionStart;

        // 自動調整高度
        autoResize();

        // 檢查是否在輸入 /
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

        if (lastSlashIndex !== -1) {
          const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1);

          // 如果 / 後面沒有空格，顯示下拉選單
          if (!textAfterSlash.includes(" ")) {
            showRuleDropdown(textAfterSlash);
          } else {
            hideDropdown();
          }
        } else {
          hideDropdown();
        }
      });

      // 點擊外部隱藏下拉選單
      document.addEventListener("click", (e) => {
        if (
          !textarea.contains(e.target as Node) &&
          !dropdown.contains(e.target as Node)
        ) {
          hideDropdown();
        }
      });

      // 聚焦事件
      textarea.addEventListener("focus", () => {
        console.log("🔥 Textarea focused");
      });

      textarea.addEventListener("blur", () => {
        console.log("🔥 Textarea blurred");
      });
    } else {
      console.error("❌ Textarea or dropdown not found!");
    }

    // 標籤切換
    panel.querySelector("#sm-chat-tab")?.addEventListener("click", () => {
      this.showView("chat");
    });

    // 刷新按鈕
    panel.querySelector("#sm-refresh-btn")?.addEventListener("click", () => {
      this.clearMessages();
    });

    // 歷史記錄按鈕
    panel.querySelector("#sm-history-btn")?.addEventListener("click", () => {
      this.showHistory();
    });
  }

  /**
   * 處理發送訊息
   */
  private handleSend(): void {
    const textarea = this.panel.querySelector(
      "#sm-input"
    ) as HTMLTextAreaElement;
    const message = textarea.value.trim();

    if (message && this.onSendMessage) {
      this.onSendMessage(message);
      textarea.value = "";
      // 重置高度
      textarea.style.height = "auto";
      textarea.style.overflowY = "hidden";
    }
  }

  /**
   * 顯示視圖
   */
  private showView(view: "chat"): void {
    const chatView = this.panel.querySelector("#sm-chat-view") as HTMLElement;
    const chatTab = this.panel.querySelector("#sm-chat-tab") as HTMLElement;

    if (view === "chat") {
      chatView.style.display = "flex";
      chatTab.style.cssText = styles.tabButton + "; " + styles.tabButtonActive;
    }
  }

  /**
   * 添加訊息
   */
  async addMessage(message: Message): Promise<void> {
    const messagesContainer = this.panel.querySelector("#sm-messages");
    if (!messagesContainer) return;

    const messageEl = document.createElement("div");
    messageEl.style.cssText =
      message.role === "user" ? styles.userMessage : styles.assistantMessage;

    // 對於助手消息使用 Markdown 渲染，用戶消息保持純文本
    if (message.role === "assistant") {
      // 渲染 Markdown
      try {
        const htmlContent = await marked.parse(message.content);
        messageEl.innerHTML = htmlContent;
      } catch (error) {
        console.error("Failed to render markdown:", error);
        messageEl.textContent = message.content;
      }
    } else {
      messageEl.textContent = message.content;
    }

    // 如果有來源，添加來源連結
    if (message.sources && message.sources.length > 0) {
      const sourcesEl = document.createElement("div");
      sourcesEl.style.cssText = styles.sources;
      sourcesEl.innerHTML = "<strong>參考來源：</strong><br>";

      message.sources.forEach((source, index) => {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.textContent = `[${index + 1}] ${source.title}`;
        link.style.cssText = styles.sourceLink;
        sourcesEl.appendChild(link);
        sourcesEl.appendChild(document.createElement("br"));
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
   * 顯示搜尋動畫
   */
  showSearchingAnimation(): HTMLDivElement {
    const messagesContainer = this.panel.querySelector("#sm-messages");
    if (!messagesContainer) return document.createElement("div");

    const searchingEl = document.createElement("div");
    searchingEl.id = "searching-animation";
    searchingEl.style.cssText = `
      align-self: stretch;
      padding: 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
    `;

    searchingEl.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <span>正在搜尋相關資訊...</span>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    messagesContainer.appendChild(searchingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return searchingEl;
  }

  /**
   * 移除搜尋動畫
   */
  removeSearchingAnimation(): void {
    const searchingEl = this.panel.querySelector("#searching-animation");
    if (searchingEl) {
      searchingEl.remove();
    }
  }

  /**
   * 開始流式回覆
   */
  startStreamingMessage(): HTMLDivElement {
    const messagesContainer = this.panel.querySelector("#sm-messages");
    if (!messagesContainer) return document.createElement("div");

    const messageEl = document.createElement("div");
    messageEl.id = "streaming-message";
    messageEl.style.cssText = styles.assistantMessage;

    const contentEl = document.createElement("div");
    contentEl.id = "streaming-content";
    messageEl.appendChild(contentEl);

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageEl;
  }

  /**
   * 追加流式內容
   */
  async appendStreamingContent(text: string): Promise<void> {
    const contentEl = this.panel.querySelector("#streaming-content");
    if (contentEl) {
      // 獲取當前的純文本內容
      const currentText = contentEl.getAttribute("data-raw-text") || "";
      const newText = currentText + text;

      // 保存原始文本到 data 屬性
      contentEl.setAttribute("data-raw-text", newText);

      // 即時渲染 Markdown
      try {
        const htmlContent = await marked.parse(newText);
        contentEl.innerHTML = htmlContent;
      } catch (error) {
        // 如果渲染失敗，顯示純文本
        contentEl.textContent = newText;
      }

      const messagesContainer = this.panel.querySelector("#sm-messages");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  /**
   * 完成流式回覆
   */
  async finishStreamingMessage(sources?: any[]): Promise<void> {
    const messageEl = this.panel.querySelector("#streaming-message");
    const contentEl = this.panel.querySelector("#streaming-content");
    if (!messageEl || !contentEl) return;

    // 內容已經在 appendStreamingContent 中即時渲染了，這裡只需要清理屬性
    contentEl.removeAttribute("data-raw-text");

    // 移除 ID 避免衝突
    messageEl.removeAttribute("id");
    contentEl.removeAttribute("id");

    // 如果有來源，添加來源連結
    if (sources && sources.length > 0) {
      const sourcesEl = document.createElement("div");
      sourcesEl.style.cssText = styles.sources;
      sourcesEl.innerHTML = "<strong>參考來源：</strong><br>";

      sources.forEach((source, index) => {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.textContent = `[${index + 1}] ${source.title}`;
        link.style.cssText = styles.sourceLink;
        sourcesEl.appendChild(link);
        sourcesEl.appendChild(document.createElement("br"));
      });

      messageEl.appendChild(sourcesEl);
    }
  }

  /**
   * 顯示歡迎畫面
   */
  showWelcomeScreen(): void {
    const messagesContainer = this.panel.querySelector("#sm-messages");
    if (!messagesContainer) return;

    const welcomeEl = document.createElement("div");
    welcomeEl.id = "welcome-screen";
    welcomeEl.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px;
    `;

    welcomeEl.innerHTML = `
      <div style="
        font-size: 48px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 24px;
        letter-spacing: 2px;
      ">ASK LENS</div>
      <div style="
        font-size: 18px;
        color: #4b5563;
        margin-bottom: 8px;
        font-weight: 500;
      ">有什麼可以幫助您的嗎？</div>
      <div style="
        font-size: 16px;
        color: #9ca3af;
        font-weight: 400;
      ">How can I help you today?</div>
    `;

    messagesContainer.appendChild(welcomeEl);
  }

  /**
   * 移除歡迎畫面
   */
  removeWelcomeScreen(): void {
    const welcomeEl = this.panel.querySelector("#welcome-screen");
    if (welcomeEl) {
      welcomeEl.remove();
    }
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
  clearMessages(showWelcome: boolean = true): void {
    const messagesContainer = this.panel.querySelector("#sm-messages");
    if (messagesContainer) {
      messagesContainer.innerHTML = "";
      // 只有在 showWelcome 為 true 時才顯示歡迎畫面
      if (showWelcome) {
        this.showWelcomeScreen();
      }
    }
  }

  /**
   * 顯示歷史記錄
   */
  async showHistory(): Promise<void> {
    try {
      // 從 DatabaseService 讀取對話記錄
      const { DatabaseService } = await import("../services/DatabaseService");
      const conversations = await DatabaseService.getConversations();

      // 切換到歷史記錄視圖
      this.showHistoryView(conversations);
    } catch (error) {
      console.error("Failed to load history:", error);
      alert("載入歷史記錄失敗");
    }
  }

  /**
   * 顯示歷史記錄視圖
   */
  private showHistoryView(conversations: any[]): void {
    const chatView = this.panel.querySelector("#sm-chat-view") as HTMLElement;

    console.log(
      "📋 showHistoryView called with",
      conversations.length,
      "conversations"
    );
    console.log("📋 chatView:", chatView);

    if (!chatView) {
      console.error("❌ chatView not found");
      return;
    }

    // 隱藏聊天視圖
    chatView.style.display = "none";

    // 創建或獲取歷史記錄視圖
    let historyView = this.panel.querySelector(
      "#sm-history-view"
    ) as HTMLElement;
    if (!historyView) {
      historyView = document.createElement("div");
      historyView.id = "sm-history-view";
      historyView.style.cssText = styles.chatView;
      const parent = chatView.parentElement;
      console.log("📋 parent element:", parent);
      if (parent) {
        parent.appendChild(historyView);
        console.log("✅ History view created and appended");
      } else {
        console.error("❌ Parent element not found");
        return;
      }
    }

    // 顯示歷史記錄視圖
    historyView.style.display = "flex";
    historyView.style.flexDirection = "column";
    console.log("✅ History view display set to flex");

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
      const historyItems = conversations
        .map((c: any) => {
          let messages = [];
          try {
            messages =
              typeof c.messages === "string"
                ? JSON.parse(c.messages)
                : c.messages;
          } catch (e) {
            messages = [];
          }

          const messageCount = Array.isArray(messages) ? messages.length : 0;
          const createdAt = new Date(c.created_at).toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

          // 使用 conversation_id 欄位
          const conversationId = c.conversation_id || c.id || "unknown";
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
              訊息數: ${messageCount} | 用戶: ${c.user_id || "unknown"}
            </div>
          </div>
        `;
        })
        .join("");

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
    const backButton = historyView.querySelector("#sm-back-to-chat");
    backButton?.addEventListener("click", () => {
      // 隱藏歷史記錄視圖
      historyView.style.display = "none";
      // 顯示聊天視圖
      chatView.style.display = "flex";
      console.log("✅ Returned to chat view");
    });

    // 綁定歷史記錄項目點擊事件
    const historyItems = historyView.querySelectorAll(".history-item");
    historyItems.forEach((item) => {
      item.addEventListener("click", async () => {
        const conversationId = item.getAttribute("data-conversation-id");
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
      console.log("🔄 Loading conversation:", conversationId);
      const { DatabaseService } = await import("../services/DatabaseService");
      const conversation = await DatabaseService.getConversation(
        conversationId
      );

      console.log("📦 Received conversation:", conversation);

      if (!conversation) {
        alert("無法載入對話");
        return;
      }

      // 清除當前訊息（不顯示歡迎畫面，因為我們要載入歷史訊息）
      this.clearMessages(false);

      // 載入對話訊息 - 處理可能是字串的情況
      let messages = [];
      if (typeof conversation.messages === "string") {
        try {
          messages = JSON.parse(conversation.messages);
          console.log("✅ Parsed messages from string:", messages);
        } catch (e) {
          console.error("❌ Failed to parse messages:", e);
          messages = [];
        }
      } else if (Array.isArray(conversation.messages)) {
        messages = conversation.messages;
        console.log("✅ Messages already array:", messages);
      } else {
        console.warn(
          "⚠️ Messages is neither string nor array:",
          typeof conversation.messages
        );
        messages = [];
      }

      console.log("📝 Loading", messages.length, "messages into chat view");
      messages.forEach((msg: any, index: number) => {
        console.log(
          `  Message ${index + 1}:`,
          msg.role,
          msg.content?.substring(0, 50)
        );
        this.addMessage(msg);
      });

      // 切換回聊天視圖
      const historyView = this.panel.querySelector(
        "#sm-history-view"
      ) as HTMLElement;
      const chatView = this.panel.querySelector("#sm-chat-view") as HTMLElement;
      if (historyView) {
        historyView.style.display = "none";
      }
      if (chatView) {
        chatView.style.display = "flex";
      }
      console.log("✅ Loaded conversation and returned to chat view");

      // 通知主應用程式載入了新對話
      if ((window as any).LensService) {
        (window as any).LensService.setConversationId(conversationId);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      alert("載入對話失敗");
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
    this.overlay.style.display = "block";

    // 滑入面板
    setTimeout(() => {
      if (this.position === "right") {
        this.panel.style.right = "0";
      } else {
        this.panel.style.left = "0";
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
    if (this.position === "right") {
      this.panel.style.right = `-${this.width}`;
    } else {
      this.panel.style.left = `-${this.width}`;
    }

    // 隱藏遮罩
    setTimeout(() => {
      this.overlay.style.display = "none";
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
    const panelWidthPercent = parseFloat(this.width.replace("%", ""));
    // 原頁面應該變成 100% - 面板寬度
    const pageWidthPercent = 100 - panelWidthPercent;

    if (this.position === "right") {
      // 右側面板：頁面向左推動，寬度縮小
      body.style.transform = `translateX(0)`;
      body.style.width = `${pageWidthPercent}%`;
      body.style.marginLeft = "0";
      body.style.marginRight = "0";
    } else {
      // 左側面板：頁面向右推動，寬度縮小
      body.style.transform = `translateX(${panelWidthPercent}%)`;
      body.style.width = `${pageWidthPercent}%`;
      body.style.marginLeft = "0";
      body.style.marginRight = "0";
    }

    body.style.transition = "transform 0.3s ease, width 0.3s ease";
    body.style.boxSizing = "border-box";
  }

  /**
   * 恢復頁面內容
   */
  private restorePageContent(): void {
    const body = document.body;

    body.style.transform = "";
    body.style.width = "";
    body.style.transition = "";
    body.style.boxSizing = "";
    body.style.marginLeft = "";
    body.style.marginRight = "";
  }

  /**
   * 設置回調函數
   */
  setCallbacks(callbacks: {
    onSendMessage?: (
      message: string,
      imageBase64?: string,
      imageContext?: string
    ) => void;
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

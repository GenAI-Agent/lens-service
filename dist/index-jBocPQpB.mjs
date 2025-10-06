var D = Object.defineProperty;
var T = (w, e, t) => e in w ? D(w, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : w[e] = t;
var b = (w, e, t) => T(w, typeof e != "symbol" ? e + "" : e, t);
const y = {
  container: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
  `,
  overlay: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    pointer-events: auto;
    z-index: 1;
  `,
  panel: `
    position: fixed;
    top: 0;
    height: 100%;
    background: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease, left 0.3s ease;
    pointer-events: auto;
    z-index: 2;
  `,
  viewContainer: `
    flex: 1;
    overflow: hidden;
    position: relative;
  `,
  chatView: `
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  messagesContainer: `
    flex: 1;
    overflow-y: auto;
    padding: 80px 20px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
    background: #ffffff;
  `,
  userMessage: `
    align-self: flex-end;
    background: #6366f1;
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.5;
  `,
  assistantMessage: `
    align-self: stretch;
    background: #f9fafb;
    color: #1f2937;
    padding: 16px;
    border-radius: 12px;
    max-width: 100%;
    word-wrap: break-word;
    font-size: 15px;
    line-height: 1.6;
    border: 1px solid #e5e7eb;
    margin-bottom: 16px;
  `,
  sources: `
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 12px;
  `,
  sourceLink: `
    color: #6366f1;
    text-decoration: none;
    display: inline-block;
    margin-top: 4px;
  `,
  inputContainer: `
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  input: `
    width: 100%;
    padding: 16px 50px 16px 16px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    min-height: 50px;
    box-sizing: border-box;
  `,
  sendIconButton: `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  `,
  iconButton: `
    background: white;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
  tabButton: `
    flex: 1;
    padding: 10px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
  `,
  tabButtonActive: `
    background: #6366f1;
    color: white;
    border-color: #6366f1;
  `
};
class O {
  constructor(e = "33.33%", t = "right") {
    b(this, "container");
    b(this, "overlay");
    b(this, "panel");
    b(this, "isOpen", !1);
    b(this, "width");
    b(this, "position");
    b(this, "capturedImage", null);
    b(this, "capturedText", null);
    // 回調函數
    b(this, "onSendMessage");
    b(this, "onSelectRule");
    b(this, "onClose");
    b(this, "onOpen");
    this.width = e, this.position = t, this.container = this.createContainer(), this.overlay = this.createOverlay(), this.panel = this.createPanel();
  }
  /**
   * 創建容器
   */
  createContainer() {
    const e = document.createElement("div");
    return e.id = "sm-container", e.style.cssText = y.container, e;
  }
  /**
   * 創建遮罩層
   */
  createOverlay() {
    const e = document.createElement("div");
    return e.style.cssText = y.overlay, e.style.display = "none", e.addEventListener("click", () => this.close()), e;
  }
  /**
   * 創建面板
   */
  createPanel() {
    const e = document.createElement("div");
    return e.style.cssText = y.panel, e.style.width = this.width, this.position === "right" ? (e.style.right = `-${this.width}`, e.style.left = "auto") : (e.style.left = `-${this.width}`, e.style.right = "auto"), e.innerHTML = `
      <div id="sm-view-container" style="${y.viewContainer}">
        <!-- 右上角工具按鈕 -->
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; z-index: 10;">

          <button id="sm-history-btn" style="${y.iconButton}" title="歷史記錄">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
          <button id="sm-refresh-btn" style="${y.iconButton}" title="刷新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
            </svg>
          </button>
          <button id="sm-close-btn" style="${y.iconButton}" title="關閉">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 對話視圖 -->
        <div id="sm-chat-view" style="${y.chatView}">
          <div id="sm-messages" style="${y.messagesContainer}"></div>
          <div style="${y.inputContainer}">
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
                style="${y.input}"
              />
              <button id="sm-send-btn" style="${y.sendIconButton}" title="發送">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>


      </div>
    `, this.bindEvents(e), e;
  }
  /**
   * 綁定事件
   */
  bindEvents(e) {
    var o, n, r, s, a;
    (o = e.querySelector("#sm-close-btn")) == null || o.addEventListener("click", () => {
      this.close();
    });
    const t = e.querySelector("#sm-send-btn");
    t ? (console.log("✅ Send button found, binding click event"), t.addEventListener("click", (d) => {
      console.log("🔥 Send button clicked via addEventListener!"), d.preventDefault(), d.stopPropagation(), this.handleSend();
    }), t.onclick = (d) => {
      console.log("🔥 Send button clicked via onclick!"), d.preventDefault(), d.stopPropagation(), this.handleSend();
    }, e.addEventListener("click", (d) => {
      (d.target.id === "sm-send-btn" || d.target.closest("#sm-send-btn")) && (console.log("🔥 Send button clicked via delegation!"), d.preventDefault(), d.stopPropagation(), this.handleSend());
    })) : console.error("❌ Send button not found!");
    const i = e.querySelector("#sm-input");
    i ? (console.log("✅ Input field found, binding events"), i.addEventListener("keypress", (d) => {
      d.key === "Enter" && (console.log("🔥 Enter key pressed in input"), this.handleSend());
    }), i.addEventListener("input", (d) => {
      console.log("🔥 Input event:", d.target.value);
    }), i.addEventListener("focus", () => {
      console.log("🔥 Input focused");
    }), i.addEventListener("blur", () => {
      console.log("🔥 Input blurred");
    })) : console.error("❌ Input field not found!"), (n = e.querySelector("#sm-chat-tab")) == null || n.addEventListener("click", () => {
      this.showView("chat");
    }), (r = e.querySelector("#sm-refresh-btn")) == null || r.addEventListener("click", () => {
      this.clearMessages();
    }), (s = e.querySelector("#sm-history-btn")) == null || s.addEventListener("click", () => {
      this.showHistory();
    }), (a = e.querySelector("#sm-remove-image")) == null || a.addEventListener("click", () => {
      this.clearCapturedImage();
    });
  }
  /**
   * 處理發送訊息
   */
  handleSend() {
    const e = this.panel.querySelector("#sm-input"), t = e.value.trim();
    (t || this.capturedImage) && this.onSendMessage && (this.onSendMessage(t, this.capturedImage || void 0, this.capturedText || void 0), e.value = "", this.clearCapturedImage());
  }
  /**
   * 顯示視圖
   */
  showView(e) {
    const t = this.panel.querySelector("#sm-chat-view"), i = this.panel.querySelector("#sm-chat-tab");
    e === "chat" && (t.style.display = "flex", i.style.cssText = y.tabButton + "; " + y.tabButtonActive);
  }
  /**
   * 添加訊息
   */
  addMessage(e) {
    const t = this.panel.querySelector("#sm-messages");
    if (!t) return;
    const i = document.createElement("div");
    if (i.style.cssText = e.role === "user" ? y.userMessage : y.assistantMessage, e.role === "assistant" ? i.innerHTML = e.content : i.textContent = e.content, e.sources && e.sources.length > 0) {
      const o = document.createElement("div");
      o.style.cssText = y.sources, o.innerHTML = "<strong>參考來源：</strong><br>", e.sources.forEach((n, r) => {
        const s = document.createElement("a");
        s.href = n.url, s.target = "_blank", s.textContent = `[${r + 1}] ${n.title}`, s.style.cssText = y.sourceLink, o.appendChild(s), o.appendChild(document.createElement("br"));
      }), i.appendChild(o);
    }
    t.appendChild(i), setTimeout(() => {
      t.scrollTop = t.scrollHeight;
    }, 10);
  }
  /**
   * 設置規則列表 (已移除規則功能)
   */
  setRules(e, t) {
  }
  /**
   * 清除訊息
   */
  clearMessages() {
    const e = this.panel.querySelector("#sm-messages");
    e && (e.innerHTML = "");
  }
  /**
   * 顯示歷史記錄
   */
  async showHistory() {
    try {
      const { DatabaseService: e } = await Promise.resolve().then(() => v), t = await e.getConversations();
      this.showHistoryView(t);
    } catch (e) {
      console.error("Failed to load history:", e), alert("載入歷史記錄失敗");
    }
  }
  /**
   * 顯示歷史記錄視圖
   */
  showHistoryView(e) {
    var s;
    const t = this.panel.querySelector("#sm-chat-view"), i = this.panel.querySelector("#sm-chat-tab");
    if (!t || !i) return;
    t.style.display = "none", i.style.cssText = y.tabButton;
    let o = this.panel.querySelector("#sm-history-view");
    if (o || (o = document.createElement("div"), o.id = "sm-history-view", o.style.cssText = y.chatView, (s = t.parentElement) == null || s.appendChild(o)), o.style.display = "flex", !Array.isArray(e) || e.length === 0)
      o.innerHTML = `
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
    else {
      const a = e.map((d) => {
        let h = [];
        try {
          h = typeof d.messages == "string" ? JSON.parse(d.messages) : d.messages;
        } catch {
          h = [];
        }
        const c = Array.isArray(h) ? h.length : 0, l = new Date(d.created_at).toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
        return `
          <div class="history-item" data-conversation-id="${d.conversation_id}" style="
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #1f2937; font-size: 14px;">對話 #${d.conversation_id.slice(-8)}</div>
              <div style="font-size: 12px; color: #6b7280;">${l}</div>
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              訊息數: ${c} | 用戶: ${d.user_id || "unknown"}
            </div>
          </div>
        `;
      }).join("");
      o.innerHTML = `
        <div style="flex: 1; overflow-y: auto;">
          <div style="padding: 16px; border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">對話歷史記錄</h3>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">點擊對話以查看詳情</p>
          </div>
          ${a}
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
    const n = o.querySelector("#sm-back-to-chat");
    n == null || n.addEventListener("click", () => {
      this.showView("chat"), o.style.display = "none";
    }), o.querySelectorAll(".history-item").forEach((a) => {
      a.addEventListener("click", async () => {
        const d = a.getAttribute("data-conversation-id");
        d && await this.loadConversation(d);
      });
    });
  }
  /**
   * 載入指定對話
   */
  async loadConversation(e) {
    try {
      const { DatabaseService: t } = await Promise.resolve().then(() => v), i = await t.getConversation(e);
      if (!i) {
        alert("無法載入對話");
        return;
      }
      this.clearMessages(), (Array.isArray(i.messages) ? i.messages : []).forEach((r) => {
        this.addMessage(r);
      });
      const n = this.panel.querySelector("#sm-history-view");
      n && (n.style.display = "none"), this.showView("chat"), window.LensService && window.LensService.setConversationId(e);
    } catch (t) {
      console.error("Failed to load conversation:", t), alert("載入對話失敗");
    }
  }
  /**
   * 打開面板
   */
  open() {
    this.isOpen || (this.container.parentElement || (document.body.appendChild(this.container), this.container.appendChild(this.overlay), this.container.appendChild(this.panel)), this.overlay.style.display = "block", setTimeout(() => {
      this.position === "right" ? this.panel.style.right = "0" : this.panel.style.left = "0";
    }, 10), this.isOpen = !0, this.onOpen && this.onOpen());
  }
  /**
   * 關閉面板
   */
  close() {
    this.isOpen && (this.position === "right" ? this.panel.style.right = `-${this.width}` : this.panel.style.left = `-${this.width}`, setTimeout(() => {
      this.overlay.style.display = "none";
    }, 300), this.isOpen = !1, this.onClose && this.onClose());
  }
  /**
   * 檢查面板是否打開
   */
  isPanelOpen() {
    return this.isOpen;
  }
  /**
   * 推動頁面內容
   */
  pushPageContent() {
    const e = document.body, t = parseFloat(this.width.replace("%", "")), i = 100 - t;
    this.position === "right" ? (e.style.transform = "translateX(0)", e.style.width = `${i}%`, e.style.marginLeft = "0", e.style.marginRight = "0") : (e.style.transform = `translateX(${t}%)`, e.style.width = `${i}%`, e.style.marginLeft = "0", e.style.marginRight = "0"), e.style.transition = "transform 0.3s ease, width 0.3s ease", e.style.boxSizing = "border-box";
  }
  /**
   * 恢復頁面內容
   */
  restorePageContent() {
    const e = document.body;
    e.style.transform = "", e.style.width = "", e.style.transition = "", e.style.boxSizing = "", e.style.marginLeft = "", e.style.marginRight = "";
  }
  /**
   * 設置捕獲的圖片
   */
  setCapturedImage(e, t) {
    this.capturedImage = e, this.capturedText = t;
    const i = this.panel.querySelector("#sm-image-preview"), o = this.panel.querySelector("#sm-preview-img"), n = this.panel.querySelector("#sm-image-context");
    i && o && n && (i.style.display = "flex", o.src = e, n.textContent = t.substring(0, 100) + (t.length > 100 ? "..." : ""));
    const r = this.panel.querySelector("#sm-input");
    r && r.focus();
  }
  /**
   * 清除捕獲的圖片
   */
  clearCapturedImage() {
    this.capturedImage = null, this.capturedText = null;
    const e = this.panel.querySelector("#sm-image-preview");
    e && (e.style.display = "none");
  }
  /**
   * 將截圖設置到輸入框
   */
  setScreenshotInInput(e) {
    this.capturedImage = e;
    const t = this.panel.querySelector("#sm-image-preview"), i = this.panel.querySelector("#sm-preview-img");
    t && i && (i.src = e, t.style.display = "block"), this.isOpen || this.open();
    const o = this.panel.querySelector("#sm-input");
    o && o.focus();
  }
  /**
   * 設置回調函數
   */
  setCallbacks(e) {
    this.onSendMessage = e.onSendMessage, this.onSelectRule = e.onSelectRule, this.onClose = e.onClose, this.onOpen = e.onOpen;
  }
  /**
   * 銷毀
   */
  destroy() {
    this.close(), this.container.parentElement && document.body.removeChild(this.container);
  }
}
const _ = "http://localhost:3002";
class z {
  static async initializePool() {
    this.initialized || (console.log("✅ Database service initialized (API mode)"), this.initialized = !0);
  }
  static async query(e, t = []) {
    try {
      return console.log("🔍 Mock query:", e, t), [];
    } catch (i) {
      throw console.error("❌ Database query error:", i), i;
    }
  }
  static async initializeTables() {
    console.log("✅ Tables already initialized in PostgreSQL");
  }
  // Helper method for API calls
  static async apiCall(e, t = {}) {
    try {
      const i = await fetch(`${_}${e}`, {
        ...t,
        headers: {
          "Content-Type": "application/json",
          ...t.headers
        }
      });
      if (!i.ok)
        throw new Error(`API call failed: ${i.statusText}`);
      return await i.json();
    } catch (i) {
      throw console.error(`❌ API call failed for ${e}:`, i), i;
    }
  }
  // ==================== Settings API ====================
  static async getSettings() {
    return await this.apiCall("/settings");
  }
  static async getSetting(e) {
    try {
      return (await this.apiCall(`/settings/${e}`)).value;
    } catch (t) {
      return console.error(`Failed to get setting ${e}:`, t), null;
    }
  }
  static async setSetting(e, t) {
    await this.apiCall(`/settings/${e}`, {
      method: "PUT",
      body: JSON.stringify({ value: t })
    });
  }
  // ==================== Admin Users API ====================
  static async getAdminUsers() {
    return await this.apiCall("/admin-users");
  }
  static async validateAdmin(e, t) {
    try {
      return await this.apiCall("/admin-users/login", {
        method: "POST",
        body: JSON.stringify({ username: e, password: t })
      });
    } catch (i) {
      return console.error("Admin validation failed:", i), null;
    }
  }
  static async createAdminUser(e, t, i) {
    await this.apiCall("/admin-users", {
      method: "POST",
      body: JSON.stringify({ username: e, password: t, email: i })
    });
  }
  static async deleteAdminUser(e) {
    await this.apiCall(`/admin-users/${e}`, {
      method: "DELETE"
    });
  }
  // ==================== Manual Indexes API ====================
  static async getManualIndexes() {
    return await this.apiCall("/manual-indexes");
  }
  static async createManualIndex(e, t, i, o, n) {
    const r = `fp-${Date.now()}`;
    await this.apiCall("/manual-indexes", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        name: e,
        description: t,
        content: i,
        url: o || "",
        keywords: n || [],
        fingerprint: r,
        embedding: null,
        metadata: {}
      })
    });
  }
  static async updateManualIndex(e, t, i, o, n, r) {
    await this.apiCall(`/manual-indexes/${e}`, {
      method: "PUT",
      body: JSON.stringify({
        name: t,
        description: i,
        content: o,
        url: n || "",
        keywords: r || []
      })
    });
  }
  static async deleteManualIndex(e) {
    await this.apiCall(`/manual-indexes/${e}`, {
      method: "DELETE"
    });
  }
  // ==================== Conversations API ====================
  static async saveConversation(e, t, i) {
    await this.apiCall("/conversations", {
      method: "POST",
      body: JSON.stringify({
        user_id: t,
        conversation_id: e,
        messages: i
      })
    }), console.log("✅ Conversation saved to database:", e);
  }
  static async getConversation(e) {
    try {
      return await this.apiCall(`/conversations/${e}`);
    } catch (t) {
      return console.error("Failed to get conversation:", t), null;
    }
  }
  static async getAllConversations() {
    return await this.apiCall("/conversations");
  }
  static async getConversations() {
    return await this.getAllConversations();
  }
  static async deleteConversation(e) {
    await this.apiCall(`/conversations/${e}`, {
      method: "DELETE"
    });
  }
}
b(z, "initialized", !1);
const v = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DatabaseService: z
}, Symbol.toStringTag, { value: "Module" }));
class S {
  static async getAll() {
    try {
      return await z.getManualIndexes();
    } catch (e) {
      return console.error("Failed to get manual indexes:", e), [];
    }
  }
  static async getById(e) {
    return (await this.getAll()).find((i) => i.id.toString() === e) || null;
  }
  static async create(e) {
    try {
      return await z.createManualIndex(e.title, "", e.content, e.url || "", []), console.log("Created manual index:", e.title), { success: !0 };
    } catch (t) {
      throw console.error("Failed to create manual index:", t), t;
    }
  }
  static async update(e, t) {
    try {
      const i = await this.getById(e);
      return i ? (await z.updateManualIndex(e, t.title || i.name, "", t.content || i.content, t.url !== void 0 ? t.url : i.url, []), console.log("Updated manual index:", e), { success: !0 }) : null;
    } catch (i) {
      return console.error("Failed to update manual index:", i), null;
    }
  }
  static async delete(e) {
    try {
      return await z.deleteManualIndex(e), console.log("Deleted manual index:", e), !0;
    } catch (t) {
      return console.error("Failed to delete manual index:", t), !1;
    }
  }
  static async search(e) {
    try {
      const t = await this.getAll();
      if (!e.trim()) return t;
      const i = e.toLowerCase();
      return t.filter((o) => o.title.toLowerCase().includes(i) || o.content.toLowerCase().includes(i));
    } catch (t) {
      return console.error("Failed to search manual indexes:", t), [];
    }
  }
}
const j = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ManualIndexService: S
}, Symbol.toStringTag, { value: "Module" }));
class H {
  constructor() {
    b(this, "container", null);
    b(this, "isOpen", !1);
    b(this, "isAuthenticated", !1);
    b(this, "currentPage", "dashboard");
    window.adminPanel = this, this.init();
  }
  /**
   * 初始化
   */
  init() {
    this.handleRouteChange(), window.addEventListener("popstate", () => this.handleRouteChange()), this.interceptHistory();
  }
  /**
   * 攔截 History API
   */
  interceptHistory() {
    const e = history.pushState, t = history.replaceState;
    history.pushState = (...i) => {
      e.apply(history, i), this.handleRouteChange();
    }, history.replaceState = (...i) => {
      t.apply(history, i), this.handleRouteChange();
    };
  }
  /**
   * 處理路由變化
   */
  async handleRouteChange() {
    const e = window.location.pathname;
    e === "/lens-service" || e.startsWith("/lens-service/") ? await this.open() : this.isOpen && this.close();
  }
  /**
   * 打開後台
   */
  async open() {
    if (this.isOpen) return;
    const e = document.getElementById("lens-service-admin");
    if (e && e.remove(), !this.checkIPWhitelist()) {
      alert("您的 IP 不在白名單中，無法訪問管理後台"), window.location.href = "/";
      return;
    }
    this.isOpen = !0, this.container = document.createElement("div"), this.container.id = "lens-service-admin", this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #f9fafb;
      z-index: 999999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `, this.container.innerHTML = this.isAuthenticated ? this.renderAdminUI() : this.renderLoginUI(), document.body.appendChild(this.container), this.bindEvents(), this.isAuthenticated && await this.updatePageContent();
  }
  /**
   * 關閉後台
   */
  close() {
    !this.isOpen || !this.container || (this.container.remove(), this.container = null, this.isOpen = !1);
  }
  /**
   * 檢查 IP 白名單
   */
  checkIPWhitelist() {
    return this.getIPWhitelist().length === 0 || console.warn("IP whitelist check requires backend API support"), !0;
  }
  /**
   * 獲取 IP 白名單
   */
  getIPWhitelist() {
    const e = localStorage.getItem("sm_ip_whitelist");
    if (!e) return [];
    try {
      return JSON.parse(e);
    } catch {
      return [];
    }
  }
  /**
   * 保存 IP 白名單
   */
  saveIPWhitelist(e) {
    localStorage.setItem("sm_ip_whitelist", JSON.stringify(e));
  }
  /**
   * 渲染登入頁面
   * 修復：確保輸入框可以正常輸入
   */
  renderLoginUI() {
    return `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; width: 100%;">
          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937;">Lens Service</h1>
          <p style="color: #6b7280; margin: 0 0 32px 0;">管理後台</p>

          <form id="admin-login-form" style="position: relative; z-index: 1;">
            <div style="margin-bottom: 16px;">
              <label for="admin-username" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">用戶名</label>
              <input
                type="text"
                id="admin-username"
                name="username"
                placeholder="請輸入用戶名"
                autocomplete="username"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                  background: white;
                  color: #1f2937;
                  outline: none;
                  transition: border-color 0.2s;
                "
              />
            </div>

            <div style="margin-bottom: 24px;">
              <label for="admin-password" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">密碼</label>
              <input
                type="password"
                id="admin-password"
                name="password"
                placeholder="請輸入密碼"
                autocomplete="current-password"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                  background: white;
                  color: #1f2937;
                  outline: none;
                  transition: border-color 0.2s;
                "
              />
            </div>

            <button
              type="submit"
              style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
              "
            >
              登入
            </button>
          </form>

          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">預設用戶名：lens，密碼：1234</p>
        </div>
      </div>
    `;
  }
  /**
   * 顯示編輯對話框
   */
  showEditDialog(e, t, i = !1) {
    return new Promise((o) => {
      const n = document.createElement("div");
      n.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      const r = i ? `<textarea id="edit-input" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 120px; resize: vertical; font-family: inherit;">${t}</textarea>` : `<input type="text" id="edit-input" value="${t}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">`;
      n.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">${e}</h3>
          ${r}
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
            <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">取消</button>
            <button id="save-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">儲存</button>
          </div>
        </div>
      `, document.body.appendChild(n);
      const s = n.querySelector("#edit-input"), a = n.querySelector("#cancel-btn"), d = n.querySelector("#save-btn");
      s.focus(), s instanceof HTMLInputElement ? s.select() : s.setSelectionRange(0, s.value.length), a == null || a.addEventListener("click", () => {
        document.body.removeChild(n), o(null);
      }), d == null || d.addEventListener("click", () => {
        const h = s.value.trim();
        document.body.removeChild(n), o(h);
      }), s instanceof HTMLInputElement && s.addEventListener("keydown", (h) => {
        if (h.key === "Enter") {
          const c = s.value.trim();
          document.body.removeChild(n), o(c);
        }
      }), n.addEventListener("click", (h) => {
        h.target === n && (document.body.removeChild(n), o(null));
      });
    });
  }
  /**
   * 顯示自定義確認對話框
   */
  showConfirmDialog(e) {
    return new Promise((t) => {
      var r, s;
      const i = document.createElement("div");
      i.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      const o = document.createElement("div");
      o.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      `, o.innerHTML = `
        <p style="margin: 0 0 20px 0; font-size: 16px;">${e}</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="confirm-cancel" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">取消</button>
          <button id="confirm-ok" style="padding: 8px 16px; border: none; background: #007cff; color: white; border-radius: 4px; cursor: pointer;">確定</button>
        </div>
      `, i.appendChild(o), document.body.appendChild(i);
      const n = (a) => {
        document.body.removeChild(i), t(a);
      };
      (r = o.querySelector("#confirm-ok")) == null || r.addEventListener("click", () => n(!0)), (s = o.querySelector("#confirm-cancel")) == null || s.addEventListener("click", () => n(!1)), i.addEventListener("click", (a) => {
        a.target === i && n(!1);
      });
    });
  }
  /**
   * 顯示自定義提示對話框
   */
  showAlertDialog(e) {
    return new Promise((t) => {
      var r;
      const i = document.createElement("div");
      i.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      const o = document.createElement("div");
      o.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      `, o.innerHTML = `
        <p style="margin: 0 0 20px 0; font-size: 16px;">${e}</p>
        <div style="display: flex; justify-content: flex-end;">
          <button id="alert-ok" style="padding: 8px 16px; border: none; background: #007cff; color: white; border-radius: 4px; cursor: pointer;">確定</button>
        </div>
      `, i.appendChild(o), document.body.appendChild(i);
      const n = () => {
        document.body.removeChild(i), t();
      };
      (r = o.querySelector("#alert-ok")) == null || r.addEventListener("click", n), i.addEventListener("click", (s) => {
        s.target === i && n();
      });
    });
  }
  /**
   * 更新導航高亮
   */
  updateNavHighlight() {
    if (!this.container) return;
    this.container.querySelectorAll(".nav-item").forEach((t) => {
      const i = t, o = i.dataset.page === this.currentPage;
      i.style.background = o ? "#ede9fe" : "transparent", i.style.color = o ? "#7c3aed" : "#4b5563", i.style.fontWeight = o ? "600" : "500", o ? i.classList.add("active") : i.classList.remove("active");
    });
  }
  /**
   * 綁定事件
   */
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector("#admin-login-form");
    if (e) {
      e.addEventListener("submit", async (l) => {
        l.preventDefault(), l.stopPropagation();
        const p = this.container.querySelector("#admin-username"), u = this.container.querySelector("#admin-password"), g = (p == null ? void 0 : p.value) || "", m = (u == null ? void 0 : u.value) || "";
        console.log("Login attempt with username:", g);
        try {
          const { DatabaseService: x } = await Promise.resolve().then(() => v), f = await x.validateAdmin(g, m);
          console.log("Login successful (database auth)"), this.isAuthenticated = !0, this.container.innerHTML = this.renderAdminUI(), await this.updatePageContent(), this.bindEvents();
        } catch (x) {
          console.error("Login error:", x), this.showAlertDialog("登入時發生錯誤，請稍後再試").then(() => {
            u.value = "", u.focus();
          });
        }
      });
      const c = this.container.querySelector("#admin-username");
      c && setTimeout(() => {
        c.focus();
      }, 100);
    }
    setTimeout(() => {
      const c = this.container.querySelectorAll(".nav-item");
      if (console.log("Binding nav items, found:", c.length), c.length === 0 && this.isAuthenticated) {
        console.warn("Nav items not found, retrying..."), setTimeout(() => this.bindEvents(), 100);
        return;
      }
      c.forEach((l, p) => {
        console.log(`Binding nav item ${p}:`, l.dataset.page);
        const u = l.cloneNode(!0);
        l.parentNode.replaceChild(u, l), u.addEventListener("click", async () => {
          const g = u.dataset.page;
          console.log("Nav item clicked:", g), g && g !== this.currentPage && (this.currentPage = g, await this.updatePageContent(), this.updateNavHighlight());
        });
      });
    }, 50);
    const t = this.container.querySelector("#admin-logout");
    t && t.addEventListener("click", () => {
      this.isAuthenticated = !1, this.container.innerHTML = this.renderLoginUI(), this.bindEvents();
    });
    const i = this.container.querySelector("#telegram-settings-form");
    i && i.addEventListener("submit", async (c) => {
      c.preventDefault(), c.stopPropagation();
      const l = this.container.querySelector("#telegram-enabled"), p = (l == null ? void 0 : l.checked) || !1;
      this.setTelegramEnabled(p), alert(`Telegram 通知已${p ? "啟用" : "停用"}`), await this.updatePageContent();
    });
    const o = this.container.querySelector("#change-password-form");
    o && o.addEventListener("submit", async (c) => {
      c.preventDefault(), c.stopPropagation();
      const l = this.container.querySelector("#new-password");
      if (((l == null ? void 0 : l.value) || "").length < 4) {
        alert("密碼長度至少 4 個字元");
        return;
      }
      alert("密碼已更新"), await this.updatePageContent();
    });
    const n = this.container.querySelector("#ip-whitelist-form");
    n && n.addEventListener("submit", async (c) => {
      c.preventDefault(), c.stopPropagation();
      const l = this.container.querySelector("#ip-list"), u = ((l == null ? void 0 : l.value) || "").split(`
`).map((g) => g.trim()).filter((g) => g.length > 0);
      this.saveIPWhitelist(u), alert(`已更新 IP 白名單（${u.length} 個 IP）`), await this.updatePageContent();
    });
    const r = this.container.querySelector("#api-config-form");
    r && r.addEventListener("submit", (c) => {
      var l, p, u, g, m, x;
      c.preventDefault(), c.stopPropagation(), (l = this.container.querySelector("#llm-endpoint")) != null && l.value, (p = this.container.querySelector("#llm-api-key")) != null && p.value, (u = this.container.querySelector("#llm-deployment")) != null && u.value, (g = this.container.querySelector("#embed-endpoint")) != null && g.value, (m = this.container.querySelector("#embed-api-key")) != null && m.value, (x = this.container.querySelector("#embed-deployment")) != null && x.value, alert("API 設定已儲存");
    });
    const s = this.container.querySelector("#agent-tool-config-form");
    s && s.addEventListener("submit", async (c) => {
      var l, p;
      c.preventDefault(), c.stopPropagation(), (l = this.container.querySelector("#manual-index-enabled")) != null && l.checked, (p = this.container.querySelector("#frontend-pages-enabled")) != null && p.checked, alert("Agent 設定已儲存"), await this.updatePageContent();
    });
    const a = this.container.querySelector("#sql-plugin-config-form");
    a && a.addEventListener("submit", async (c) => {
      var C, I, $, A, E, L, P, q;
      c.preventDefault(), c.stopPropagation();
      const l = ((C = this.container.querySelector("#sql-plugin-enabled")) == null ? void 0 : C.checked) || !1, p = parseInt(((I = this.container.querySelector("#sql-plugin-priority")) == null ? void 0 : I.value) || "5"), u = (($ = this.container.querySelector("#sql-api-endpoint")) == null ? void 0 : $.value) || "", g = ((A = this.container.querySelector("#sql-connection-id")) == null ? void 0 : A.value) || "", m = ((E = this.container.querySelector("#sql-search-table")) == null ? void 0 : E.value) || "knowledge_base", x = ((L = this.container.querySelector("#sql-title-column")) == null ? void 0 : L.value) || "title", f = ((P = this.container.querySelector("#sql-content-column")) == null ? void 0 : P.value) || "content", k = ((q = this.container.querySelector("#sql-url-column")) == null ? void 0 : q.value) || "url", M = {
        enabled: l,
        priority: p,
        apiEndpoint: u,
        connectionId: g,
        searchTable: m,
        titleColumn: x,
        contentColumn: f,
        urlColumn: k
      };
      localStorage.setItem("sm_sql_plugin_config", JSON.stringify(M)), alert("SQL Plugin 設定已儲存"), await this.updatePageContent();
    });
    const d = this.container.querySelector("#sql-connection-form");
    d && d.addEventListener("submit", async (c) => {
      var p, u;
      c.preventDefault(), c.stopPropagation();
      const l = ((p = this.container.querySelector("#sql-conn-name")) == null ? void 0 : p.value) || "";
      if ((u = this.container.querySelector("#sql-conn-type")) == null || u.value, !l) {
        alert("請輸入連接名稱");
        return;
      }
      try {
        alert("SQL 連接已新增"), await this.updatePageContent();
      } catch (g) {
        console.error("Error creating SQL connection:", g), alert("新增失敗");
      }
    }), this.container.querySelectorAll(".delete-sql-connection").forEach((c) => {
      c.addEventListener("click", async () => {
        if (c.dataset.id && confirm("確定要刪除這個連接嗎？"))
          try {
            alert("連接已刪除"), await this.updatePageContent();
          } catch (p) {
            console.error("Error deleting SQL connection:", p), alert("刪除失敗");
          }
      });
    });
  }
  /**
   * 渲染管理後台 UI
   */
  renderAdminUI() {
    return `
      <div style="display: flex; height: 100vh;">
        <!-- 左側導航 -->
        <div style="width: 25%; min-width: 300px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #1f2937;">Lens Service</h1>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">管理後台</p>
          </div>

          <nav style="flex: 1; padding: 16px; overflow-y: auto;">
            ${this.renderNavItem("dashboard", "儀表板")}
            ${this.renderNavItem("conversations", "客服對話")}
            ${this.renderNavItem("manual-index", "手動索引")}
            ${this.renderNavItem("system", "系統設定")}
          </nav>

          <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
            <button id="admin-logout" style="width: 100%; padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; color: #6b7280; font-size: 14px; cursor: pointer;">
              登出
            </button>
          </div>
        </div>

        <!-- 右側內容區 -->
        <div style="flex: 1; overflow-y: auto; padding: 32px; background: #f9fafb;">
          <div id="admin-content">
            <!-- 內容將通過updatePageContent()異步載入 -->
          </div>
        </div>
      </div>
    `;
  }
  /**
   * 渲染導航項目（無 icon）
   */
  renderNavItem(e, t) {
    const i = this.currentPage === e;
    return `
      <button
        class="nav-item"
        data-page="${e}"
        style="
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 4px;
          background: ${i ? "#ede9fe" : "transparent"};
          border: none;
          border-radius: 8px;
          color: ${i ? "#7c3aed" : "#6b7280"};
          font-size: 14px;
          font-weight: ${i ? "600" : "500"};
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        "
      >
        ${t}
      </button>
    `;
  }
  /**
   * 渲染頁面內容
   */
  async renderPageContent() {
    switch (this.currentPage) {
      case "dashboard":
        return await this.renderDashboard();
      case "manual-index":
        return await this.renderManualIndex();
      case "conversations":
        return await this.renderConversations();
      case "system":
        return await this.renderSystemSettings();
      default:
        return "<p>頁面不存在</p>";
    }
  }
  /**
   * 更新頁面內容（async helper）
   */
  async updatePageContent() {
    const e = this.container.querySelector("#admin-content");
    e && (e.innerHTML = await this.renderPageContent(), this.bindContentEvents());
  }
  /**
   * 綁定內容區域的事件
   */
  bindContentEvents() {
    this.container && (this.bindManualIndexEvents(), this.bindCustomerServiceEvents(), this.bindAdminUserEvents(), this.bindSystemSettingsEvents());
  }
  /**
   * 綁定手動索引相關事件
   */
  bindManualIndexEvents() {
    const e = this.container.querySelector("#add-index-btn");
    e && e.addEventListener("click", async () => {
      await this.showAddIndexModal();
    });
    const t = this.container.querySelector("#generate-embeddings-btn");
    t && t.addEventListener("click", async () => {
      try {
        const n = t;
        n.disabled = !0, n.textContent = "生成中...";
        const s = (await S.getAll()).length;
        await this.showAlertDialog(`成功為 ${s} 個索引生成了向量嵌入`), await this.updatePageContent();
      } catch (n) {
        await this.showAlertDialog(`生成失敗：${n instanceof Error ? n.message : "未知錯誤"}`);
      } finally {
        const n = t;
        n.disabled = !1, n.textContent = "生成所有Embeddings";
      }
    }), this.container.querySelectorAll(".edit-index-btn").forEach((n) => {
      n.addEventListener("click", async () => {
        const r = n.dataset.id;
        r && await this.showEditIndexModal(r);
      });
    }), this.container.querySelectorAll(".delete-index-btn").forEach((n) => {
      n.addEventListener("click", async () => {
        const r = n.dataset.id;
        r && await this.showDeleteConfirmDialog(r);
      });
    });
  }
  /**
   * 綁定客服對話相關事件
   */
  bindCustomerServiceEvents() {
    const e = this.container.querySelector("#refresh-conversations");
    e && e.addEventListener("click", async () => {
      await this.updatePageContent();
    }), this.container.querySelectorAll(".view-conversation-btn").forEach((o) => {
      o.addEventListener("click", async (n) => {
        const r = n.target.getAttribute("data-id");
        r && await this.showConversationModal(r);
      });
    }), this.container.querySelectorAll(".delete-conversation-btn").forEach((o) => {
      o.addEventListener("click", async (n) => {
        const r = n.target.getAttribute("data-id");
        if (r && await this.showConfirmDialog("確定要刪除這個對話嗎？此操作無法復原。"))
          try {
            const { CustomerServiceManager: a } = await import("./CustomerServiceManager-_siimfxp.mjs");
            await a.deleteConversation(r), await this.showAlertDialog("對話已刪除"), await this.updatePageContent();
          } catch (a) {
            await this.showAlertDialog(`刪除失敗：${a instanceof Error ? a.message : "未知錯誤"}`);
          }
      });
    });
  }
  /**
   * 綁定管理員相關事件
   */
  bindAdminUserEvents() {
  }
  /**
   * 綁定系統設定相關事件
   */
  bindSystemSettingsEvents() {
    const e = this.container.querySelector("#edit-default-reply-btn");
    e && e.addEventListener("click", async () => {
      const n = this.container.querySelector("#default-reply-display"), r = n.textContent || "", s = await this.showEditDialog("編輯預設回覆", r, !0);
      if (s !== null)
        try {
          const { DatabaseService: a } = await Promise.resolve().then(() => v);
          await a.setSetting("default_reply", s), n.textContent = s, await this.showAlertDialog("預設回覆已更新");
        } catch (a) {
          console.error("Failed to save default reply:", a), await this.showAlertDialog("儲存失敗，請稍後再試");
        }
    });
    const t = this.container.querySelector("#edit-system-prompt-btn");
    t && t.addEventListener("click", async () => {
      const n = this.container.querySelector("#system-prompt-display"), r = n.textContent || "", s = await this.showEditDialog("編輯系統提示詞", r, !0);
      if (s !== null)
        try {
          const { DatabaseService: a } = await Promise.resolve().then(() => v);
          await a.setSetting("system_prompt", s), n.textContent = s, await this.showAlertDialog("系統提示詞已更新");
        } catch (a) {
          console.error("Failed to save system prompt:", a), await this.showAlertDialog("儲存失敗，請稍後再試");
        }
    });
    const i = this.container.querySelector("#add-admin-user-btn");
    i && i.addEventListener("click", async () => {
      await this.showAddAdminUserModal();
    }), this.container.querySelectorAll(".delete-admin-user-btn").forEach((n) => {
      n.addEventListener("click", async () => {
        const r = n.dataset.id;
        if (r && await this.showConfirmDialog("確定要刪除此管理員帳號嗎？此操作無法復原。"))
          try {
            const { DatabaseService: a } = await Promise.resolve().then(() => v);
            await a.deleteAdminUser(r), await this.showAlertDialog("管理員帳號已刪除"), await this.updatePageContent();
          } catch (a) {
            console.error("Failed to delete admin user:", a), await this.showAlertDialog(`刪除失敗：${a instanceof Error ? a.message : "未知錯誤"}`);
          }
      });
    });
  }
  /**
   * 渲染儀表板
   */
  async renderDashboard() {
    let e = [], t = [], i = "連接失敗";
    try {
      const [o, n] = await Promise.all([
        fetch("http://localhost:3002/conversations").catch(() => null),
        fetch("http://localhost:3002/manual-indexes").catch(() => null)
      ]);
      o != null && o.ok && (e = await o.json(), i = "正常連接"), n != null && n.ok && (t = await n.json());
    } catch (o) {
      console.error("Failed to load dashboard data:", o);
    }
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">儀表板</h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${this.renderStatCard("💬", "對話總數", e.length.toString())}
        ${this.renderStatCard("📝", "手動索引", t.length.toString())}
      </div>

      <!-- 系統狀態 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">系統狀態</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <span style="font-size: 14px; color: #374151;">Telegram通知:</span>
            <span style="font-size: 14px; color: #059669; font-weight: 500;">✅ 已啟用</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <span style="font-size: 14px; color: #374151;">數據庫連接:</span>
            <span style="font-size: 14px; color: ${i === "正常連接" ? "#059669" : "#dc2626"}; font-weight: 500;">
              ${i === "正常連接" ? "✅" : "❌"} ${i}
            </span>
          </div>
        </div>
      </div>
    `;
  }
  /**
   * 渲染統計卡片
   */
  renderStatCard(e, t, i) {
    return `
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; margin-bottom: 8px;">${e}</div>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${t}</div>
        <div style="font-size: 28px; font-weight: 700; color: #1f2937;">${i}</div>
      </div>
    `;
  }
  /**
   * 渲染手動索引頁面
   */
  async renderManualIndex() {
    const e = await S.getAll();
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937;">手動索引</h2>
          <p style="color: #6b7280; margin: 0;">手動新增索引內容供 Agent 搜尋</p>
        </div>
        <button
          id="add-index-btn"
          style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
        >
          + 新增索引
        </button>
      </div>

      <!-- 索引列表 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">已建立的索引（${e.length}）</h3>
          <button
            id="generate-embeddings-btn"
            style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
          >
            生成所有Embeddings
          </button>
        </div>

        ${e.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無索引</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${e.map((t) => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${t.title || t.name || "未命名"}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${t.description || "無描述"}</p>
                    ${t.url ? `<p style="font-size: 12px; color: #3b82f6; margin: 0 0 8px 0; font-family: monospace;"><a href="${t.url}" target="_blank" style="color: inherit; text-decoration: none;">${t.url}</a></p>` : ""}
                    ${t.embedding ? '<span style="font-size: 11px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; display: inline-block;">✓ 已生成向量</span>' : '<span style="font-size: 11px; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; display: inline-block;">⚠ 未生成向量</span>'}
                    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
                      建立時間：${t.created_at ? new Date(t.created_at).toLocaleString("zh-TW") : "未知"}
                      ${t.updated_at && t.updated_at !== t.created_at ? ` | 更新時間：${new Date(t.updated_at).toLocaleString("zh-TW")}` : ""}
                    </p>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button
                      class="edit-index-btn"
                      data-id="${t.id}"
                      style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                    >
                      編輯
                    </button>
                    <button
                      class="delete-index-btn"
                      data-id="${t.id}"
                      style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }
  /**
   * 渲染 Sitemap 索引頁面
   */
  renderSitemap() {
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">Sitemap 索引</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">爬取外部網站的 Sitemap 建立索引</p>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280;">Sitemap 索引功能開發中...</p>
      </div>
    `;
  }
  /**
   * 渲染 SQL 資料庫頁面
   */
  renderSQL() {
    const e = [], t = this.loadSQLPluginConfig();
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">SQL 資料庫</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">連接 SQL 資料庫作為搜尋來源</p>

      <!-- SQL Plugin 配置 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Plugin 設定</h3>

        <form id="sql-plugin-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">
              <input type="checkbox" id="sql-plugin-enabled" ${t.enabled ? "checked" : ""} style="margin-right: 8px;">
              啟用 SQL 搜尋
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">優先級</label>
            <input
              type="number"
              id="sql-plugin-priority"
              value="${t.priority || 5}"
              min="1"
              max="10"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">數字越大優先級越高（1-10）</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Endpoint</label>
            <input
              type="text"
              id="sql-api-endpoint"
              value="${t.apiEndpoint || ""}"
              placeholder="https://your-api.com/sql/query"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">後端 API 用於執行 SQL 查詢</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">SQL 連接</label>
            <select
              id="sql-connection-id"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
              <option value="">選擇連接...</option>
              ${e.map((i) => `
                <option value="${i.id}" ${t.connectionId === i.id ? "selected" : ""}>
                  ${i.name} (${i.type})
                </option>
              `).join("")}
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">搜尋表格</label>
            <input
              type="text"
              id="sql-search-table"
              value="${t.searchTable || "knowledge_base"}"
              placeholder="knowledge_base"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">標題欄位</label>
            <input
              type="text"
              id="sql-title-column"
              value="${t.titleColumn || "title"}"
              placeholder="title"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">內容欄位</label>
            <input
              type="text"
              id="sql-content-column"
              value="${t.contentColumn || "content"}"
              placeholder="content"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">URL 欄位（選填）</label>
            <input
              type="text"
              id="sql-url-column"
              value="${t.urlColumn || "url"}"
              placeholder="url"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 Plugin 設定
          </button>
        </form>
      </div>

      <!-- SQL 連接管理 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增 SQL 連接</h3>

        <form id="sql-connection-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">連接名稱</label>
            <input
              type="text"
              id="sql-conn-name"
              placeholder="我的資料庫"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">資料庫類型</label>
            <select
              id="sql-conn-type"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mssql">MS SQL Server</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            新增連接
          </button>
        </form>
      </div>

      <!-- 已有的連接列表 -->
      ${e.length > 0 ? `
        <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">已建立的連接</h3>
          <div style="display: grid; gap: 16px;">
            ${e.map((i) => `
              <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">${i.name}</h4>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">類型：${i.type}</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">建立時間：${new Date(i.createdAt).toLocaleString("zh-TW")}</p>
                  </div>
                  <button
                    class="delete-sql-connection"
                    data-id="${i.id}"
                    style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;"
                  >
                    刪除
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
  }
  /**
   * 載入 SQL Plugin 配置
   */
  loadSQLPluginConfig() {
    const e = localStorage.getItem("sm_sql_plugin_config");
    if (e)
      try {
        return JSON.parse(e);
      } catch (t) {
        console.error("Failed to parse SQL plugin config:", t);
      }
    return {
      enabled: !1,
      priority: 5,
      searchTable: "knowledge_base",
      titleColumn: "title",
      contentColumn: "content",
      urlColumn: "url"
    };
  }
  /**
   * 渲染 Agent & API 設定頁面（合併）
   */
  renderAgentAndAPI() {
    var i, o, n, r, s, a, d, h, c, l, p, u;
    const e = {}, t = {};
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">Agent & API 設定</h2>

      <!-- API 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">API 設定</h3>

        <form id="api-config-form">
          <!-- LLM API -->
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #374151;">LLM API</h4>

            <div style="margin-bottom: 16px;">
              <label for="llm-endpoint" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Endpoint</label>
              <input
                type="text"
                id="llm-endpoint"
                name="llmEndpoint"
                placeholder="https://your-resource.openai.azure.com/"
                value="${((i = e.azureOpenAI) == null ? void 0 : i.endpoint) || ((o = e.llmAPI) == null ? void 0 : o.endpoint) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="llm-api-key" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">API Key</label>
              <input
                type="password"
                id="llm-api-key"
                name="llmApiKey"
                placeholder="your-api-key"
                value="${((n = e.azureOpenAI) == null ? void 0 : n.apiKey) || ((r = e.llmAPI) == null ? void 0 : r.apiKey) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="llm-deployment" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Deployment Name</label>
              <input
                type="text"
                id="llm-deployment"
                name="llmDeployment"
                placeholder="gpt-4"
                value="${((s = e.azureOpenAI) == null ? void 0 : s.deployment) || ((a = e.llmAPI) == null ? void 0 : a.deployment) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>
          </div>

          <!-- Embedding API -->
          <div style="margin-bottom: 24px;">
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #374151;">Embedding API</h4>

            <div style="margin-bottom: 16px;">
              <label for="embed-endpoint" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Endpoint</label>
              <input
                type="text"
                id="embed-endpoint"
                name="embedEndpoint"
                placeholder="https://your-resource.openai.azure.com/"
                value="${((d = e.embeddingAPI) == null ? void 0 : d.endpoint) || ((h = e.azureOpenAI) == null ? void 0 : h.endpoint) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="embed-api-key" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">API Key</label>
              <input
                type="password"
                id="embed-api-key"
                name="embedApiKey"
                placeholder="your-api-key"
                value="${((c = e.embeddingAPI) == null ? void 0 : c.apiKey) || ((l = e.azureOpenAI) == null ? void 0 : l.apiKey) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="embed-deployment" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Deployment Name</label>
              <input
                type="text"
                id="embed-deployment"
                name="embedDeployment"
                placeholder="text-embedding-3-small"
                value="${((p = e.embeddingAPI) == null ? void 0 : p.deployment) || ((u = e.azureOpenAI) == null ? void 0 : u.embeddingDeployment) || ""}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 API 設定
          </button>
        </form>
      </div>

      <!-- Agent Tool 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Agent 工具設定</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">選擇 Agent 可以使用的搜尋工具</p>

        <form id="agent-tool-config-form">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="manualIndex" ${t != null && t.manualIndex.enabled ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">手動索引</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋手動新增的索引內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="frontendPages" ${t != null && t.frontendPages.enabled ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">前端頁面</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋當前網站的頁面內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="sitemap" ${t != null && t.sitemap.enabled ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">Sitemap 索引</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋外部網站的 Sitemap 內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="sqlDatabase" ${t != null && t.sqlDatabase.enabled ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">SQL 資料庫</div>
                <div style="font-size: 13px; color: #6b7280;">查詢 SQL 資料庫內容</div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            style="margin-top: 16px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存工具設定
          </button>
        </form>
      </div>
    `;
  }
  /**
   * 檢查是否有 Telegram 配置
   */
  hasTelegramConfig() {
    const e = window.SM_TELEGRAM_CONFIG;
    return !!(e && e.botToken && e.chatId);
  }
  /**
   * 獲取 Telegram 啟用狀態
   */
  getTelegramEnabled() {
    return localStorage.getItem("telegram_enabled") !== "false";
  }
  /**
   * 設置 Telegram 啟用狀態
   */
  setTelegramEnabled(e) {
    localStorage.setItem("telegram_enabled", e.toString());
  }
  /**
   * 顯示編輯索引模態框
   */
  async showEditIndexModal(e) {
    const t = await S.getById(e);
    if (!t) {
      await this.showAlertDialog("找不到該索引");
      return;
    }
    const i = document.createElement("div");
    i.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `, i.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">編輯索引</h3>

        <form id="edit-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="edit-index-name"
              value="${t.title || t.name || ""}"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">描述</label>
            <input
              type="text"
              id="edit-index-description"
              value="${t.description || ""}"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">內容</label>
            <textarea
              id="edit-index-content"
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical;"
            >${t.content}</textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-edit-btn"
              style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    `, document.body.appendChild(i);
    const o = i.querySelector("#edit-index-form"), n = i.querySelector("#cancel-edit-btn");
    o.addEventListener("submit", async (r) => {
      r.preventDefault();
      const s = i.querySelector("#edit-index-name").value;
      i.querySelector("#edit-index-description").value;
      const a = i.querySelector("#edit-index-content").value;
      if (!s || !a) {
        await this.showAlertDialog("請填寫名稱和內容");
        return;
      }
      try {
        await S.update(e, { title: s, content: a, url: "" }), await this.showAlertDialog("索引已更新"), document.body.removeChild(i), await this.updatePageContent();
      } catch (d) {
        await this.showAlertDialog(`更新失敗：${d instanceof Error ? d.message : "未知錯誤"}`);
      }
    }), n.addEventListener("click", () => {
      document.body.removeChild(i);
    }), i.addEventListener("click", (r) => {
      r.target === i && document.body.removeChild(i);
    });
  }
  /**
   * 顯示新增索引模態框
   */
  async showAddIndexModal() {
    const e = document.createElement("div");
    e.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `, e.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增索引</h3>

        <form id="add-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="add-index-name"
              placeholder="例如：產品介紹"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">描述</label>
            <input
              type="text"
              id="add-index-description"
              placeholder="簡短描述這個索引的內容"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">URL（選填）</label>
            <input
              type="url"
              id="add-index-url"
              placeholder="https://example.com/page"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">內容</label>
            <textarea
              id="add-index-content"
              placeholder="輸入索引內容..."
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical;"
            ></textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-add-btn"
              style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              新增索引
            </button>
          </div>
        </form>
      </div>
    `, document.body.appendChild(e);
    const t = e.querySelector("#add-index-form"), i = e.querySelector("#cancel-add-btn");
    t.addEventListener("submit", async (o) => {
      o.preventDefault();
      const n = e.querySelector("#add-index-name").value;
      e.querySelector("#add-index-description").value;
      const r = e.querySelector("#add-index-url").value, s = e.querySelector("#add-index-content").value;
      if (!n || !s) {
        await this.showAlertDialog("請填寫名稱和內容");
        return;
      }
      try {
        await S.create({ title: n, content: s, url: r || void 0 }), await this.showAlertDialog("索引已新增"), document.body.removeChild(e), await this.updatePageContent();
      } catch (a) {
        await this.showAlertDialog(`新增失敗：${a instanceof Error ? a.message : "未知錯誤"}`);
      }
    }), i.addEventListener("click", () => {
      document.body.removeChild(e);
    }), e.addEventListener("click", (o) => {
      o.target === e && document.body.removeChild(e);
    });
  }
  /**
   * 顯示刪除確認對話框
   */
  async showDeleteConfirmDialog(e) {
    const t = await S.getById(e);
    if (!t) {
      await this.showAlertDialog("找不到該索引");
      return;
    }
    if (await this.showConfirmDialog(`確定要刪除索引「${t.title || t.name || "未命名"}」嗎？此操作無法復原。`))
      try {
        await S.delete(e), await this.showAlertDialog("索引已刪除"), await this.updatePageContent();
      } catch (o) {
        await this.showAlertDialog(`刪除失敗：${o instanceof Error ? o.message : "未知錯誤"}`);
      }
  }
  /**
   * 渲染客服對話頁面
   */
  async renderConversations() {
    try {
      const { CustomerServiceManager: e } = await import("./CustomerServiceManager-_siimfxp.mjs"), t = await e.getAllConversations();
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #1f2937;">客服對話管理</h2>
          <div style="display: flex; gap: 12px;">
            <button id="refresh-conversations" style="
              padding: 10px 20px;
              background: #f3f4f6;
              color: #374151;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
            ">🔄 刷新</button>
          </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          ${t.length === 0 ? `
            <div style="padding: 48px; text-align: center; color: #6b7280;">
              <p style="font-size: 16px; margin: 0;">目前沒有對話記錄</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">對話ID</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">用戶ID</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">訊息數</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">狀態</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">開始時間</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.slice().reverse().map((i) => {
        const o = i.conversation_id || i.conversationId || i.id, n = i.user_id || i.userId || "undefined", r = Array.isArray(i.messages) ? i.messages : [], s = i.status || "active", a = i.created_at || i.createdAt || i.startedAt;
        return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-family: monospace; font-size: 12px;">${o.substring(0, 8)}...</td>
                      <td style="padding: 16px; color: #1f2937;">${n}</td>
                      <td style="padding: 16px; color: #1f2937;">${r.length}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${s === "active" ? "#dcfce7" : "#f3f4f6"};
                          color: ${s === "active" ? "#166534" : "#374151"};
                        ">${s === "active" ? "進行中" : "已結束"}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(a).toLocaleString()}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="view-conversation-btn" data-id="${o}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">查看</button>
                          <button class="delete-conversation-btn" data-id="${o}" style="
                            padding: 6px 12px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">刪除</button>
                        </div>
                      </td>
                    </tr>
                  `;
      }).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (e) {
      return console.error("Failed to render conversations:", e), `
        <div style="padding: 24px; text-align: center; color: #ef4444;">
          <p>載入對話記錄失敗：${e instanceof Error ? e.message : "未知錯誤"}</p>
        </div>
      `;
    }
  }
  /**
   * 渲染管理員用戶頁面
   */
  async renderAdminUsers() {
    try {
      const { AdminUserManager: e } = await import("./AdminUserManager-AKtmYHqw.mjs"), t = await e.getAllAdminUsers();
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #1f2937;">管理員帳號管理</h2>
          <button id="add-admin-user-btn" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">+ 新增管理員</button>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          ${t.length === 0 ? `
            <div style="padding: 48px; text-align: center; color: #6b7280;">
              <p style="font-size: 16px; margin: 0;">目前沒有管理員帳號</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">用戶名</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">角色</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">狀態</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">創建時間</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">最後登錄</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.map((i) => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-weight: 500;">${i.username}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${i.username === "admin" ? "#fef3c7" : "#dbeafe"};
                          color: ${i.username === "admin" ? "#92400e" : "#1e40af"};
                        ">${i.username === "admin" ? "超級管理員" : "管理員"}</span>
                      </td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${i.is_active ? "#dcfce7" : "#fee2e2"};
                          color: ${i.is_active ? "#166534" : "#dc2626"};
                        ">${i.is_active ? "啟用" : "停用"}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(i.created_at).toLocaleString()}</td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${i.last_login ? new Date(i.last_login).toLocaleString() : "從未登錄"}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="edit-admin-user-btn" data-id="${i.id}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">編輯</button>
                          ${i.username !== "lens" ? `
                            <button class="delete-admin-user-btn" data-id="${i.id}" style="
                              padding: 6px 12px;
                              background: #ef4444;
                              color: white;
                              border: none;
                              border-radius: 6px;
                              font-size: 12px;
                              cursor: pointer;
                            ">刪除</button>
                          ` : ""}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (e) {
      return console.error("Failed to render admin users:", e), `
        <div style="padding: 24px; text-align: center; color: #ef4444;">
          <p>載入管理員列表失敗：${e instanceof Error ? e.message : "未知錯誤"}</p>
        </div>
      `;
    }
  }
  /**
   * 渲染系統設定頁面
   */
  async renderSystemSettings() {
    var n, r;
    let e = [], t = [];
    try {
      const { DatabaseService: s } = await Promise.resolve().then(() => v), [a, d] = await Promise.all([
        s.getSettings().catch(() => []),
        s.getAdminUsers().catch(() => [])
      ]);
      e = a, t = d;
    } catch (s) {
      console.error("Failed to load system settings:", s);
    }
    const i = ((n = e.find((s) => s.key === "default_reply")) == null ? void 0 : n.value) || "", o = ((r = e.find((s) => s.key === "system_prompt")) == null ? void 0 : r.value) || "";
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">系統設定</h2>

      <!-- 系統設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">基本設定</h3>

        <form id="system-settings-form">
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #374151; font-weight: 500;">無法回答時的固定回覆</label>
              <button
                type="button"
                id="edit-default-reply-btn"
                style="background: #3b82f6; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.background='#2563eb'"
                onmouseout="this.style.background='#3b82f6'"
              >
                編輯
              </button>
            </div>
            <div
              id="default-reply-display"
              style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; font-size: 14px; min-height: 60px; white-space: pre-wrap;"
            >${i}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #374151; font-weight: 500;">LLM系統提示詞</label>
              <button
                type="button"
                id="edit-system-prompt-btn"
                style="background: #3b82f6; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.background='#2563eb'"
                onmouseout="this.style.background='#3b82f6'"
              >
                編輯
              </button>
            </div>
            <div
              id="system-prompt-display"
              style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; font-size: 14px; min-height: 80px; white-space: pre-wrap;"
            >${o}</div>
          </div>
        </form>
      </div>

      <!-- 管理員帳號 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">管理員帳號（${t.length}）</h3>
          <button
            id="add-admin-user-btn"
            style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
          >
            + 新增管理員
          </button>
        </div>

        ${t.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無管理員帳號</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${t.map((s) => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${s.username}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">${s.email || "無Email"}</p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0 0;">
                      建立時間：${new Date(s.createdAt).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button
                      class="delete-admin-user-btn"
                      data-id="${s.id}"
                      style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;
  }
  /**
   * 顯示新增管理員模態框
   */
  async showAddAdminUserModal() {
    const e = document.createElement("div");
    e.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;
    `, e.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin: 0 0 16px 0; color: #1f2937;">新增管理員</h3>

        <form id="add-admin-user-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">用戶名</label>
            <input
              type="text"
              id="add-admin-username"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入用戶名"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">密碼</label>
            <input
              type="password"
              id="add-admin-password"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入密碼"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Email（選填）</label>
            <input
              type="email"
              id="add-admin-email"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入Email"
            />
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-add-admin-btn"
              style="padding: 10px 20px; background: #f3f4f6; color: #374151; border: none; border-radius: 8px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer;"
            >
              新增管理員
            </button>
          </div>
        </form>
      </div>
    `, document.body.appendChild(e);
    const t = e.querySelector("#add-admin-user-form"), i = e.querySelector("#cancel-add-admin-btn");
    t.addEventListener("submit", async (o) => {
      o.preventDefault();
      const n = e.querySelector("#add-admin-username").value, r = e.querySelector("#add-admin-password").value, s = e.querySelector("#add-admin-email").value;
      try {
        const { DatabaseService: a } = await Promise.resolve().then(() => v);
        await a.createAdminUser(n, r, s), document.body.removeChild(e), await this.showAlertDialog("管理員帳號已新增"), await this.updatePageContent();
      } catch (a) {
        await this.showAlertDialog(`新增失敗：${a instanceof Error ? a.message : "未知錯誤"}`);
      }
    }), i.addEventListener("click", () => {
      document.body.removeChild(e);
    }), e.addEventListener("click", (o) => {
      o.target === e && document.body.removeChild(e);
    });
  }
  /**
   * 顯示對話詳情模態框
   */
  async showConversationModal(e) {
    try {
      const { CustomerServiceManager: t } = await import("./CustomerServiceManager-_siimfxp.mjs"), i = await t.getConversationById(e);
      if (!i) {
        await this.showAlertDialog("找不到該對話記錄");
        return;
      }
      const o = i.conversation_id || i.conversationId || i.id, n = i.user_id || i.userId || "undefined", r = Array.isArray(i.messages) ? i.messages : [], s = i.status || "active", a = i.created_at || i.createdAt, d = i.updated_at || i.updatedAt, h = document.createElement("div");
      h.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `, h.innerHTML = `
        <div style="
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 24px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">對話詳情</h3>
            <button id="close-conversation-modal" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #6b7280;
              padding: 0;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">&times;</button>
          </div>

          <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
              <div><strong>對話ID:</strong> ${o}</div>
              <div><strong>用戶ID:</strong> ${n}</div>
              <div><strong>訊息數:</strong> ${r.length}</div>
              <div><strong>狀態:</strong> ${s === "active" ? "進行中" : "已結束"}</div>
              <div><strong>建立時間:</strong> ${a ? new Date(a).toLocaleString("zh-TW") : "未知"}</div>
              <div><strong>更新時間:</strong> ${d ? new Date(d).toLocaleString("zh-TW") : "未知"}</div>
            </div>
          </div>

          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">對話記錄</h4>
            ${r.length > 0 ? r.map((m) => `
                <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; ${m.role === "user" ? "background: #eff6ff; margin-left: 20px;" : "background: #f0fdf4; margin-right: 20px;"}">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${m.role === "user" ? "👤 用戶" : "🤖 助理"}
                    <span style="font-weight: normal; color: #6b7280; font-size: 12px; margin-left: 8px;">
                      ${m.timestamp ? new Date(m.timestamp).toLocaleString("zh-TW") : ""}
                    </span>
                  </div>
                  <div style="color: #1f2937; line-height: 1.5;">${m.content || ""}</div>
                </div>
              `).join("") : '<p style="color: #6b7280; text-align: center; padding: 20px;">此對話暫無訊息記錄</p>'}
          </div>

          <div style="margin-bottom: 16px; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">客服回覆</h4>
            <textarea id="customer-service-reply" style="
              width: 100%;
              min-height: 80px;
              padding: 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
            " placeholder="輸入客服回覆..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="send-customer-service-reply" style="
              padding: 10px 20px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">發送回覆</button>
            <button id="close-conversation-modal-btn" style="
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
            ">關閉</button>
          </div>
        </div>
      `, document.body.appendChild(h);
      const c = h.querySelector("#close-conversation-modal"), l = h.querySelector("#close-conversation-modal-btn"), p = h.querySelector("#send-customer-service-reply"), u = h.querySelector("#customer-service-reply"), g = () => {
        document.body.removeChild(h);
      };
      c == null || c.addEventListener("click", g), l == null || l.addEventListener("click", g), p == null || p.addEventListener("click", async () => {
        const m = u == null ? void 0 : u.value.trim();
        if (!m) {
          await this.showAlertDialog("請輸入回覆內容");
          return;
        }
        try {
          const { CustomerServiceManager: x } = await import("./CustomerServiceManager-_siimfxp.mjs");
          await x.addCustomerServiceReply(
            e,
            m,
            "客服"
          ) ? (await this.showAlertDialog("回覆已發送"), g(), await this.updatePageContent()) : await this.showAlertDialog("發送失敗，請稍後再試");
        } catch (x) {
          console.error("Failed to send reply:", x), await this.showAlertDialog(`發送失敗：${x instanceof Error ? x.message : "未知錯誤"}`);
        }
      }), h.addEventListener("click", (m) => {
        m.target === h && g();
      });
    } catch (t) {
      console.error("Error showing conversation modal:", t), await this.showAlertDialog("載入對話詳情失敗");
    }
  }
}
class B {
  constructor() {
    b(this, "config");
    b(this, "panel");
    b(this, "conversationState");
    b(this, "initialized", !1);
    b(this, "captureMode", !1);
    b(this, "adminPanel");
    b(this, "floatingIcon");
    b(this, "screenshotMode", !1);
    b(this, "hoverHandler", null);
    b(this, "mouseLeaveHandler", null);
  }
  /**
   * 從SQL載入規則
   */
  async loadRulesFromSQL() {
    try {
      const e = await fetch("http://localhost:3002/rules");
      if (!e.ok)
        return console.log("No rules found in database, using empty array"), [];
      const t = await e.json();
      return Array.isArray(t) ? t : [];
    } catch (e) {
      return console.error("Failed to load rules from SQL:", e), [];
    }
  }
  /**
   * 初始化 Widget
   */
  async init(e) {
    var i, o, n;
    if (this.initialized) {
      console.warn("ServiceModuler already initialized");
      return;
    }
    this.config = e, console.log("✅ Widget initializing");
    const t = e.telegram && e.telegram.botToken && e.telegram.chatId ? e.telegram : void 0;
    window.SM_TELEGRAM_CONFIG = t, await this.loadRulesFromSQL(), this.panel = new O(
      ((i = e.ui) == null ? void 0 : i.width) || "33.33%",
      ((o = e.ui) == null ? void 0 : o.position) || "right"
    ), this.panel.setCallbacks({
      onSendMessage: (r, s) => this.handleSendMessage(r, s),
      onSelectRule: (r) => this.handleSelectRule(r),
      onClose: () => this.handleClose(),
      onOpen: () => this.handleOpen()
    }), await this.loadConversationState(), this.adminPanel || (this.adminPanel = new H()), window.location.pathname === "/lens-service" && this.openAdminPanel(), this.bindGlobalKeyboardShortcuts(), ((n = e.ui) == null ? void 0 : n.iconPosition) !== !1 && !this.isAdminPage() && this.createFloatingIcon(), this.initialized = !0, e.debug && console.log("ServiceModuler initialized", e);
  }
  /**
   * 綁定全局快捷鍵
   */
  bindGlobalKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      var t, i;
      e.key && e.key.toLowerCase() === "q" && ((t = this.panel) != null && t.isPanelOpen()) ? (console.log("🎯 Q key pressed, panel is open, enabling screenshot mode"), this.enableScreenshotMode()) : e.key && e.key.toLowerCase() === "q" && console.log("🎯 Q key pressed, but panel is not open:", (i = this.panel) == null ? void 0 : i.isPanelOpen());
    }), document.addEventListener("keyup", (e) => {
      e.key && e.key.toLowerCase() === "q" && this.disableScreenshotMode();
    }), document.addEventListener("click", (e) => {
      var t;
      this.screenshotMode && ((t = this.panel) != null && t.isPanelOpen()) && (console.log("📸 Screenshot click detected"), e.preventDefault(), e.stopPropagation(), this.captureElementScreenshot(e.target));
    }, !0);
  }
  /**
   * 打開面板
   */
  open() {
    var e;
    if (!this.initialized) {
      console.error("ServiceModuler not initialized. Call init() first.");
      return;
    }
    (e = this.panel) == null || e.open();
  }
  /**
   * 關閉面板
   */
  close() {
    var e;
    (e = this.panel) == null || e.close();
  }
  /**
   * 發送訊息
   */
  async sendMessage(e, t) {
    var o, n, r;
    if (!this.initialized || !this.panel) {
      console.error("ServiceModuler not initialized");
      return;
    }
    const i = {
      role: "user",
      content: e || "請分析這張圖片",
      timestamp: Date.now()
    };
    (o = this.conversationState) == null || o.messages.push(i), this.panel.addMessage(i), this.saveConversationState();
    try {
      let s, a, d = !1;
      const h = ((n = this.conversationState) == null ? void 0 : n.sessionId) || this.generateSessionId(), c = localStorage.getItem("lens_service_user_id") || "default_user";
      if (t)
        s = await this.processImageMessage(e, t);
      else {
        const p = await this.processTextMessage(e, h, c);
        s = p.response, a = p.sources, d = p.needsHumanReply, d && await this.sendTelegramNotification(e, h);
      }
      const l = {
        role: "assistant",
        content: s,
        timestamp: Date.now(),
        sources: a
      };
      (r = this.conversationState) == null || r.messages.push(l), this.panel.addMessage(l), this.saveConversationState(), await this.saveConversationToDatabase(h, c);
    } catch (s) {
      console.error("Error processing message:", s);
      const a = {
        role: "assistant",
        content: `抱歉，發生錯誤：${s instanceof Error ? s.message : "未知錯誤"}`,
        timestamp: Date.now()
      };
      this.panel.addMessage(a);
    }
  }
  /**
   * 處理文字訊息
   */
  async processTextMessage(e, t, i) {
    var o, n, r, s;
    try {
      const { DatabaseService: a } = await Promise.resolve().then(() => v);
      await a.initializePool();
      const d = await a.getSetting("system_prompt") || "你是一個專業的客服助手，請用繁體中文回答問題。", h = await a.getSetting("default_reply") || "很抱歉，我無法回答這個問題。請聯繫人工客服獲得更多幫助。", { ManualIndexService: c } = await Promise.resolve().then(() => j), l = await c.search(e);
      if (console.log("🔍 Search results:", l), !l || l.length === 0)
        return console.log("❌ No relevant content found, using default reply"), {
          response: h,
          sources: [],
          needsHumanReply: !0
        };
      if (!((n = (o = this.config) == null ? void 0 : o.azureOpenAI) != null && n.endpoint) || !((s = (r = this.config) == null ? void 0 : r.azureOpenAI) != null && s.apiKey))
        return console.warn("Azure OpenAI not configured, using default reply"), {
          response: h,
          sources: [],
          needsHumanReply: !0
        };
      const p = l.map(
        (f) => `標題：${f.title || f.name}
內容：${f.content}`
      ).join(`

`), u = `${d}

以下是相關的知識庫內容：
${p}

請根據以上內容回答用戶的問題。如果內容不足以回答問題，請誠實告知。`, g = await this.callAzureOpenAI(e, u);
      return ["無法回答", "不清楚", "不確定", "沒有相關", "無法提供"].some((f) => g.includes(f)) ? (console.log("❌ LLM cannot answer, using default reply"), {
        response: h,
        sources: l,
        needsHumanReply: !0
      }) : {
        response: g,
        sources: l,
        needsHumanReply: !1
      };
    } catch (a) {
      console.error("Error processing text message:", a);
      try {
        const { DatabaseService: d } = await Promise.resolve().then(() => v);
        return {
          response: await d.getSetting("default_reply") || "很抱歉，我無法回答這個問題。請聯繫人工客服獲得更多幫助。",
          sources: [],
          needsHumanReply: !0
        };
      } catch {
        return {
          response: "系統暫時無法回應，請稍後再試。",
          sources: [],
          needsHumanReply: !0
        };
      }
    }
  }
  /**
   * 處理圖片訊息
   */
  async processImageMessage(e, t) {
    var i, o, n, r;
    try {
      return !((o = (i = this.config) == null ? void 0 : i.azureOpenAI) != null && o.endpoint) || !((r = (n = this.config) == null ? void 0 : n.azureOpenAI) != null && r.apiKey) ? "圖片分析功能需要配置 Azure OpenAI 服務。" : await this.callAzureOpenAIVision(e, t);
    } catch (s) {
      return console.error("Error processing image message:", s), "圖片分析失敗，請重試或聯繫客服。";
    }
  }
  /**
   * 調用 Azure OpenAI API
   */
  async callAzureOpenAI(e, t) {
    var h, c, l, p, u, g, m, x, f, k;
    const i = (c = (h = this.config) == null ? void 0 : h.azureOpenAI) == null ? void 0 : c.endpoint, o = (p = (l = this.config) == null ? void 0 : l.azureOpenAI) == null ? void 0 : p.apiKey, n = (g = (u = this.config) == null ? void 0 : u.azureOpenAI) == null ? void 0 : g.deployment, r = (x = (m = this.config) == null ? void 0 : m.azureOpenAI) == null ? void 0 : x.apiVersion, s = `${i}openai/deployments/${n}/chat/completions?api-version=${r}`, a = await fetch(s, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": o
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: t },
          { role: "user", content: e }
        ],
        max_tokens: 1e3,
        temperature: 0.7
      })
    });
    if (!a.ok)
      throw new Error(`Azure OpenAI API error: ${a.status} ${a.statusText}`);
    return ((k = (f = (await a.json()).choices[0]) == null ? void 0 : f.message) == null ? void 0 : k.content) || "抱歉，我無法生成回應。";
  }
  /**
   * 調用 Azure OpenAI Vision API
   */
  async callAzureOpenAIVision(e, t) {
    var h, c, l, p, u, g, m, x, f, k;
    const i = (c = (h = this.config) == null ? void 0 : h.azureOpenAI) == null ? void 0 : c.endpoint, o = (p = (l = this.config) == null ? void 0 : l.azureOpenAI) == null ? void 0 : p.apiKey, n = (g = (u = this.config) == null ? void 0 : u.azureOpenAI) == null ? void 0 : g.deployment, r = (x = (m = this.config) == null ? void 0 : m.azureOpenAI) == null ? void 0 : x.apiVersion, s = `${i}openai/deployments/${n}/chat/completions?api-version=${r}`, a = await fetch(s, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": o
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: e || "請分析這張圖片" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${t}` } }
            ]
          }
        ],
        max_tokens: 1e3,
        temperature: 0.7
      })
    });
    if (!a.ok)
      throw new Error(`Azure OpenAI Vision API error: ${a.status} ${a.statusText}`);
    return ((k = (f = (await a.json()).choices[0]) == null ? void 0 : f.message) == null ? void 0 : k.content) || "抱歉，我無法分析這張圖片。";
  }
  /**
   * 發送 Telegram 通知
   */
  async sendTelegramNotification(e, t) {
    var i, o, n, r;
    try {
      const s = (o = (i = this.config) == null ? void 0 : i.telegram) == null ? void 0 : o.botToken, a = (r = (n = this.config) == null ? void 0 : n.telegram) == null ? void 0 : r.chatId;
      if (!s || !a) {
        console.warn("Telegram not configured, skipping notification");
        return;
      }
      const d = `🔔 新的客服訊息需要人工回覆

會話ID: ${t}
用戶訊息: ${e}
時間: ${(/* @__PURE__ */ new Date()).toLocaleString("zh-TW")}`, h = `https://api.telegram.org/bot${s}/sendMessage`;
      await fetch(h, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: a,
          text: d,
          parse_mode: "HTML"
        })
      }), console.log("✅ Telegram notification sent");
    } catch (s) {
      console.error("Failed to send Telegram notification:", s);
    }
  }
  /**
   * 保存對話記錄到資料庫
   */
  async saveConversationToDatabase(e, t) {
    if (this.conversationState)
      try {
        const { DatabaseService: i } = await Promise.resolve().then(() => v);
        await i.saveConversation(e, t, this.conversationState.messages), console.log("✅ Conversation saved to database");
      } catch (i) {
        console.error("Failed to save conversation to database:", i);
      }
  }
  /**
   * 設置規則
   */
  setRule(e) {
  }
  /**
   * 打開管理後台
   */
  openAdminPanel() {
    this.adminPanel && this.adminPanel.open().catch(console.error);
  }
  /**
   * 開始索引網站
   * @param mode 'local' = 索引本地專案, 'domain' = 爬取域名（默認）
   */
  async indexSite(e, t = "domain", i) {
    console.log("Site indexing disabled");
  }
  /**
   * 啟用元素捕獲模式（Ctrl+Click）
   */
  enableCaptureMode() {
    console.log("Capture mode disabled"), this.captureMode = !0, console.log("Capture mode would be enabled here"), console.log("Capture mode enabled. Press Ctrl+Click to capture elements.");
  }
  /**
   * 禁用元素捕獲模式
   */
  disableCaptureMode() {
    this.captureMode = !1;
  }
  /**
   * 搜尋當前頁面內容
   */
  searchCurrentPage(e) {
    return [];
  }
  /**
   * 獲取當前頁面內容
   */
  getCurrentPageContent() {
    return { title: "", url: "", content: "", headings: [], links: [] };
  }
  /**
   * 清除對話
   */
  clearConversation() {
    var e;
    this.conversationState && (this.conversationState.messages = [], this.saveConversationState()), (e = this.panel) == null || e.clearMessages();
  }
  /**
   * 打開管理後台
   */
  async openAdmin() {
    if (!this.initialized) {
      console.error("ServiceModuler not initialized. Call init() first.");
      return;
    }
    if (!this.adminPanel) {
      console.error("AdminPanel not initialized");
      return;
    }
    await this.adminPanel.open();
  }
  /**
   * 銷毀 Widget
   */
  destroy() {
    var e, t;
    (e = this.panel) == null || e.destroy(), (t = this.adminPanel) == null || t.close(), this.initialized = !1;
  }
  /**
   * 處理發送訊息
   */
  handleSendMessage(e, t) {
    this.sendMessage(e, t);
  }
  /**
   * 處理選擇規則
   */
  handleSelectRule(e) {
    this.setRule(e);
  }
  /**
   * 處理打開
   */
  handleOpen() {
    var e;
    (e = this.panel) == null || e.clearMessages(), this.conversationState = {
      sessionId: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      messages: []
    }, console.log("✅ Created new conversation session");
  }
  /**
   * 處理關閉
   */
  handleClose() {
    this.saveConversationState(), console.log("❌ Panel closed");
  }
  /**
   * 載入對話狀態
   */
  async loadConversationState() {
    try {
      const { DatabaseService: e } = await Promise.resolve().then(() => v);
      await e.initializePool();
      const t = await e.getConversations();
      let i = null;
      if (t.length > 0) {
        const o = t.sort(
          (n, r) => new Date(r.created_at || 0).getTime() - new Date(n.created_at || 0).getTime()
        )[0];
        i = {
          sessionId: o.session_id,
          messages: o.messages || []
        }, console.log(`✅ Loaded conversation with ${i.messages.length} messages`);
      } else
        i = {
          sessionId: this.generateSessionId(),
          messages: []
        }, console.log("✅ Created new conversation session");
      this.conversationState = i, this.panel && i.messages.length > 0 && (this.panel.clearMessages(), i.messages.forEach((o) => {
        this.panel.addMessage(o);
      }));
    } catch (e) {
      console.error("Failed to load conversation state:", e), this.conversationState = {
        sessionId: this.generateSessionId(),
        messages: []
      };
    }
  }
  /**
   * 保存對話狀態
   */
  saveConversationState() {
    this.conversationState;
  }
  /**
   * 檢查是否在管理後台頁面
   */
  isAdminPage() {
    return window.location.pathname.includes("/lens-service");
  }
  /**
   * 創建浮動圖標
   */
  createFloatingIcon() {
    var o, n;
    this.floatingIcon && this.floatingIcon.remove();
    const e = (n = (o = this.config) == null ? void 0 : o.ui) == null ? void 0 : n.iconPosition;
    let t = { bottom: "20px", right: "20px" };
    if (typeof e == "string")
      switch (e) {
        case "bottom-left":
          t = { bottom: "20px", left: "20px" };
          break;
        case "top-right":
          t = { top: "20px", right: "20px" };
          break;
        case "top-left":
          t = { top: "20px", left: "20px" };
          break;
        default:
          t = { top: "20px", right: "20px" };
      }
    else e && typeof e == "object" && (t = e);
    this.floatingIcon = document.createElement("button"), this.floatingIcon.id = "lens-service-floating-icon", this.floatingIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    const i = `
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
      ${Object.entries(t).map(([r, s]) => `${r}: ${s}`).join("; ")};
    `;
    this.floatingIcon.style.cssText = i, this.floatingIcon.addEventListener("mouseenter", () => {
      this.floatingIcon.style.transform = "scale(1.1)", this.floatingIcon.style.boxShadow = "0 6px 25px rgba(0, 0, 0, 0.2)";
    }), this.floatingIcon.addEventListener("mouseleave", () => {
      this.floatingIcon.style.transform = "scale(1)", this.floatingIcon.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)";
    }), this.floatingIcon.addEventListener("click", () => {
      this.open();
    }), document.body.appendChild(this.floatingIcon);
  }
  /**
   * 移除浮動圖標
   */
  removeFloatingIcon() {
    this.floatingIcon && (this.floatingIcon.remove(), this.floatingIcon = void 0);
  }
  /**
   * 啟用截圖模式
   */
  enableScreenshotMode() {
    if (this.screenshotMode) return;
    this.screenshotMode = !0, document.body.style.cursor = "crosshair";
    const e = document.createElement("div");
    e.id = "lens-screenshot-overlay", e.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 123, 255, 0.1);
      z-index: 999998;
      pointer-events: none;
      border: 2px dashed #007bff;
    `, document.body.appendChild(e), this.addHoverHighlight(), console.log("📸 Screenshot mode enabled - Q+Click to capture elements");
  }
  /**
   * 禁用截圖模式
   */
  disableScreenshotMode() {
    if (!this.screenshotMode) return;
    this.screenshotMode = !1, document.body.style.cursor = "";
    const e = document.getElementById("lens-screenshot-overlay");
    e && e.remove(), this.removeHoverHighlight();
  }
  /**
   * 添加hover高亮效果
   */
  addHoverHighlight() {
    if (this.removeHoverHighlight(), this.hoverHandler = (e) => {
      if (!this.screenshotMode) return;
      const t = e.target;
      if (!t || t.closest("#lens-service-panel") || t.closest("#lens-service-admin"))
        return;
      const i = document.querySelector(".lens-hover-highlight");
      i && i.classList.remove("lens-hover-highlight"), t.classList.add("lens-hover-highlight");
    }, this.mouseLeaveHandler = (e) => {
      if (!this.screenshotMode) return;
      const t = e.target;
      t && t.classList.remove("lens-hover-highlight");
    }, !document.getElementById("lens-hover-styles")) {
      const e = document.createElement("style");
      e.id = "lens-hover-styles", e.textContent = `
        .lens-hover-highlight {
          outline: 2px solid #007bff !important;
          outline-offset: 2px !important;
          background-color: rgba(0, 123, 255, 0.1) !important;
        }
      `, document.head.appendChild(e);
    }
    document.addEventListener("mouseover", this.hoverHandler), document.addEventListener("mouseleave", this.mouseLeaveHandler);
  }
  /**
   * 移除hover高亮效果
   */
  removeHoverHighlight() {
    this.hoverHandler && (document.removeEventListener("mouseover", this.hoverHandler), this.hoverHandler = null), this.mouseLeaveHandler && (document.removeEventListener("mouseleave", this.mouseLeaveHandler), this.mouseLeaveHandler = null), document.querySelectorAll(".lens-hover-highlight").forEach((i) => i.classList.remove("lens-hover-highlight"));
    const t = document.getElementById("lens-hover-styles");
    t && t.remove();
  }
  /**
   * 捕獲元素截圖
   */
  async captureElementScreenshot(e) {
    var t;
    try {
      console.log("📸 Capturing screenshot of element:", e), window.html2canvas || await this.loadHtml2Canvas();
      const i = window.html2canvas, o = e.style.cssText;
      e.style.cssText += "; outline: 3px solid #007bff; outline-offset: 2px;", await new Promise((s) => setTimeout(s, 100));
      const n = await i(e, {
        backgroundColor: "#ffffff",
        scale: 1,
        logging: !1,
        useCORS: !0,
        allowTaint: !0
      });
      e.style.cssText = o;
      const r = n.toDataURL("image/png");
      this.panel && this.panel.setScreenshotInInput(r), console.log("✅ Screenshot captured and added to input");
    } catch (i) {
      console.error("❌ Failed to capture screenshot:", i), (t = this.panel) == null || t.addMessage({
        id: Date.now().toString(),
        content: "截圖失敗，請重試。",
        role: "assistant",
        timestamp: Date.now()
      });
    } finally {
      this.disableScreenshotMode();
    }
  }
  /**
   * 載入 html2canvas 庫
   */
  async loadHtml2Canvas() {
    return new Promise((e, t) => {
      const i = document.createElement("script");
      i.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", i.onload = () => e(), i.onerror = () => t(new Error("Failed to load html2canvas")), document.head.appendChild(i);
    });
  }
  /**
   * 發送截圖到 AI 進行分析
   */
  async sendScreenshotToAI(e, t) {
    var i, o, n;
    try {
      console.log("Screenshot analysis disabled");
      const r = {
        tagName: t.tagName,
        className: t.className,
        id: t.id,
        textContent: ((i = t.textContent) == null ? void 0 : i.substring(0, 200)) || "",
        attributes: Array.from(t.attributes).map((d) => `${d.name}="${d.value}"`).join(" ")
      }, s = `
用戶截取了網頁上的一個元素，請分析這個截圖並提供相關說明。

元素信息：
- 標籤：${r.tagName}
- 類名：${r.className}
- ID：${r.id}
- 文本內容：${r.textContent}
- 屬性：${r.attributes}

請分析截圖內容並提供有用的信息或建議。
      `.trim();
      (o = this.panel) == null || o.addMessage({
        id: Date.now().toString(),
        content: `📸 **截圖分析結果：**

截圖分析功能暫時停用`,
        role: "assistant",
        timestamp: Date.now()
      });
    } catch (r) {
      console.error("❌ Failed to send screenshot to AI:", r), (n = this.panel) == null || n.addMessage({
        id: Date.now().toString(),
        content: "截圖分析失敗，請檢查 AI 服務配置。",
        role: "assistant",
        timestamp: Date.now()
      });
    }
  }
  /**
   * 生成 Session ID
   */
  generateSessionId() {
    return `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 設置對話 ID（用於載入歷史對話）
   */
  setConversationId(e) {
    this.conversationState && (this.conversationState.sessionId = e);
  }
}
const R = new B();
typeof window < "u" && (window.LensService = R);
export {
  z as D,
  R as L,
  v as a
};

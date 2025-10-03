var F = Object.defineProperty;
var Y = (g, e, t) => e in g ? F(g, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : g[e] = t;
var l = (g, e, t) => Y(g, typeof e != "symbol" ? e + "" : e, t);
class Q {
  constructor(e) {
    l(this, "endpoint");
    l(this, "apiKey");
    l(this, "deployment");
    l(this, "embeddingDeployment");
    l(this, "apiVersion");
    if (!e)
      throw new Error("Azure OpenAI config is required");
    this.endpoint = e.endpoint, this.apiKey = e.apiKey, this.deployment = e.deployment, this.embeddingDeployment = e.embeddingDeployment || "text-embedding-3-small", this.apiVersion = e.apiVersion || "2024-02-15-preview";
  }
  /**
   * 生成對話回應（支援文字和圖片）
   */
  async chatCompletion(e, t = 0.7, n = 1e3) {
    const o = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
    try {
      const i = await fetch(o, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify({
          messages: e,
          temperature: t,
          max_tokens: n
        })
      });
      if (!i.ok)
        throw new Error(`API request failed: ${i.statusText}`);
      return (await i.json()).choices[0].message.content;
    } catch (i) {
      throw console.error("Chat completion error:", i), i;
    }
  }
  /**
   * 生成對話回應（帶圖片）
   */
  async chatCompletionWithImage(e, t, n = []) {
    const o = [
      ...n.map((i) => ({
        role: i.role,
        content: i.content
      })),
      {
        role: "user",
        content: [
          {
            type: "text",
            text: e
          },
          {
            type: "image_url",
            image_url: {
              url: t
            }
          }
        ]
      }
    ];
    return this.chatCompletion(o, 0.7, 1e3);
  }
  /**
   * 生成文字的 embedding
   */
  async generateEmbedding(e) {
    const t = `${this.endpoint}/openai/deployments/${this.embeddingDeployment}/embeddings?api-version=${this.apiVersion}`;
    try {
      const n = await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify({
          input: e
        })
      });
      if (!n.ok)
        throw new Error(`API request failed: ${n.statusText}`);
      return (await n.json()).data[0].embedding;
    } catch (n) {
      throw console.error("Embedding generation error:", n), n;
    }
  }
  /**
   * 批量生成 embeddings
   */
  async generateEmbeddings(e) {
    const t = [];
    for (let o = 0; o < e.length; o += 16) {
      const i = e.slice(o, o + 16), r = await Promise.all(
        i.map((s) => this.generateEmbedding(s))
      );
      t.push(...r);
    }
    return t;
  }
}
class b {
  /**
   * 保存對話狀態
   */
  static saveConversation(e) {
    try {
      sessionStorage.setItem(
        this.CONVERSATION_KEY,
        JSON.stringify(e)
      );
    } catch (t) {
      console.error("Failed to save conversation:", t);
    }
  }
  /**
   * 載入對話狀態
   */
  static loadConversation() {
    try {
      const e = sessionStorage.getItem(this.CONVERSATION_KEY);
      return e ? JSON.parse(e) : null;
    } catch (e) {
      return console.error("Failed to load conversation:", e), null;
    }
  }
  /**
   * 清除對話狀態
   */
  static clearConversation() {
    sessionStorage.removeItem(this.CONVERSATION_KEY);
  }
  /**
   * 保存索引頁面
   */
  static saveIndexedPages(e) {
    try {
      localStorage.setItem(
        this.INDEX_KEY,
        JSON.stringify(e)
      );
    } catch (t) {
      console.error("Failed to save indexed pages:", t);
    }
  }
  /**
   * 載入索引頁面
   */
  static loadIndexedPages() {
    try {
      const e = localStorage.getItem(this.INDEX_KEY);
      return e ? JSON.parse(e) : [];
    } catch (e) {
      return console.error("Failed to load indexed pages:", e), [];
    }
  }
  /**
   * 清除索引
   */
  static clearIndex() {
    localStorage.removeItem(this.INDEX_KEY);
  }
  /**
   * 保存配置
   */
  static saveConfig(e) {
    try {
      localStorage.setItem(
        this.CONFIG_KEY,
        JSON.stringify(e)
      );
    } catch (t) {
      console.error("Failed to save config:", t);
    }
  }
  /**
   * 載入配置
   */
  static loadConfig() {
    try {
      const e = localStorage.getItem(this.CONFIG_KEY);
      return e ? JSON.parse(e) : null;
    } catch (e) {
      return console.error("Failed to load config:", e), null;
    }
  }
  /**
   * 保存 Agent Tool 配置
   */
  static saveAgentToolConfig(e) {
    try {
      localStorage.setItem(
        this.AGENT_TOOL_CONFIG_KEY,
        JSON.stringify(e)
      );
    } catch (t) {
      console.error("Failed to save agent tool config:", t);
    }
  }
  /**
   * 載入 Agent Tool 配置
   */
  static loadAgentToolConfig() {
    try {
      const e = localStorage.getItem(this.AGENT_TOOL_CONFIG_KEY);
      return e ? JSON.parse(e) : {
        manualIndex: {
          enabled: !0,
          priority: 1,
          description: "手動新增的索引內容"
        },
        frontendPages: {
          enabled: !0,
          priority: 2,
          description: "前端專案頁面內容"
        },
        sitemap: {
          enabled: !1,
          priority: 3,
          description: "外部網站 Sitemap 內容",
          domains: []
        },
        sqlDatabase: {
          enabled: !1,
          priority: 4,
          description: "SQL 資料庫查詢結果",
          connections: []
        }
      };
    } catch (e) {
      return console.error("Failed to load agent tool config:", e), null;
    }
  }
  /**
   * 保存管理員密碼
   */
  static saveAdminPassword(e) {
    try {
      localStorage.setItem(this.ADMIN_PASSWORD_KEY, e);
    } catch (t) {
      console.error("Failed to save admin password:", t);
    }
  }
  /**
   * 載入管理員密碼
   */
  static loadAdminPassword() {
    try {
      return localStorage.getItem(this.ADMIN_PASSWORD_KEY) || "1234";
    } catch (e) {
      return console.error("Failed to load admin password:", e), "1234";
    }
  }
  /**
   * 驗證管理員密碼
   */
  static verifyAdminPassword(e) {
    return e === this.loadAdminPassword();
  }
}
l(b, "CONVERSATION_KEY", "sm_conversation"), l(b, "INDEX_KEY", "sm_indexed_pages"), l(b, "CONFIG_KEY", "sm_config"), l(b, "AGENT_TOOL_CONFIG_KEY", "sm_agent_tool_config"), l(b, "ADMIN_PASSWORD_KEY", "sm_admin_password");
class B {
  constructor(e, t) {
    l(this, "openAI");
    l(this, "siteConfig");
    this.openAI = e, this.siteConfig = t;
  }
  /**
   * 開始索引網站
   * @param mode 'local' = 索引本地專案所有頁面, 'domain' = 爬取指定域名
   */
  async indexSite(e, t = "domain", n) {
    console.log("Starting site indexing from:", e, "mode:", t);
    let o;
    t === "local" ? o = await this.discoverLocalPages() : o = await this.discoverPages(e), console.log(`Found ${o.length} pages to index`);
    const i = [];
    for (let r = 0; r < o.length; r++) {
      const s = o[r];
      try {
        const a = await this.indexPage(s);
        a && i.push(a), n && n(r + 1, o.length);
      } catch (a) {
        console.error(`Failed to index ${s}:`, a);
      }
      await this.sleep(500);
    }
    b.saveIndexedPages(i), console.log(`Indexing complete. Indexed ${i.length} pages.`);
  }
  /**
   * 發現本地專案的所有頁面
   * 通過分析當前頁面的所有內部連結
   */
  async discoverLocalPages() {
    const e = /* @__PURE__ */ new Set(), t = window.location.origin;
    return e.add(window.location.href), document.querySelectorAll("a[href]").forEach((o) => {
      const i = o.href;
      try {
        new URL(i).origin === t && e.add(i);
      } catch {
      }
    }), document.querySelectorAll("nav a[href], header a[href]").forEach((o) => {
      const i = o.href;
      try {
        new URL(i).origin === t && e.add(i);
      } catch {
      }
    }), console.log("Discovered local pages:", Array.from(e)), Array.from(e);
  }
  /**
   * 發現網站的所有頁面
   */
  async discoverPages(e) {
    const t = /* @__PURE__ */ new Set(), n = [e], o = /* @__PURE__ */ new Set(), r = new URL(e).hostname;
    for (; n.length > 0 && t.size < 100; ) {
      const s = n.shift();
      if (!o.has(s) && (o.add(s), !!this.shouldCrawl(s))) {
        t.add(s);
        try {
          const a = await this.fetchPage(s);
          this.extractLinks(a, s).forEach((c) => {
            try {
              const u = new URL(c);
              this.isSameDomain(u.hostname, r) && n.push(c);
            } catch {
            }
          });
        } catch (a) {
          console.error(`Failed to discover from ${s}:`, a);
        }
      }
    }
    return Array.from(t);
  }
  /**
   * 索引單個頁面
   */
  async indexPage(e) {
    try {
      const t = await this.fetchPage(e), { title: n, content: o } = this.extractContent(t);
      if (!o || o.length < 50)
        return null;
      const i = this.chunkText(o, 500), r = await this.openAI.generateEmbeddings(i);
      return {
        url: e,
        title: n,
        snippet: o.substring(0, 200),
        keywords: [],
        fingerprint: [],
        lastIndexed: Date.now(),
        chunks: i,
        embeddings: r
      };
    } catch (t) {
      return console.error(`Failed to index page ${e}:`, t), null;
    }
  }
  /**
   * 獲取頁面內容
   */
  async fetchPage(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return await t.text();
  }
  /**
   * 提取頁面內容
   */
  extractContent(e) {
    var s, a;
    const n = new DOMParser().parseFromString(e, "text/html"), o = ((s = n.querySelector("title")) == null ? void 0 : s.textContent) || "";
    n.querySelectorAll("script, style, nav, footer, header").forEach((d) => d.remove());
    const r = (((a = n.body) == null ? void 0 : a.textContent) || "").replace(/\s+/g, " ").trim();
    return { title: o, content: r };
  }
  /**
   * 提取連結
   */
  extractLinks(e, t) {
    const o = new DOMParser().parseFromString(e, "text/html"), i = [];
    return o.querySelectorAll("a[href]").forEach((r) => {
      const s = r.getAttribute("href");
      if (s)
        try {
          const a = new URL(s, t).href;
          i.push(a);
        } catch {
        }
    }), i;
  }
  /**
   * 文字分塊
   */
  chunkText(e, t) {
    const n = [], o = e.match(/[^.!?]+[.!?]+/g) || [e];
    let i = "";
    for (const r of o)
      (i + r).length > t && i ? (n.push(i.trim()), i = r) : i += r;
    return i && n.push(i.trim()), n;
  }
  /**
   * 檢查是否應該爬取此 URL
   */
  shouldCrawl(e) {
    var t, n;
    try {
      const o = new URL(e);
      return !((t = this.siteConfig) != null && t.remoteDomains && !this.siteConfig.remoteDomains.some(
        (r) => o.hostname.includes(r.domain)
      ) || (n = this.siteConfig) != null && n.excludePaths && this.siteConfig.excludePaths.some(
        (r) => o.pathname.startsWith(r)
      ));
    } catch {
      return !1;
    }
  }
  /**
   * 檢查是否為同域名
   */
  isSameDomain(e, t) {
    const n = (o) => o.split(".").slice(-2).join(".");
    return n(e) === n(t);
  }
  /**
   * 延遲
   */
  sleep(e) {
    return new Promise((t) => setTimeout(t, e));
  }
}
class J {
  constructor(e, t, n = []) {
    l(this, "openAI");
    l(this, "pluginManager");
    l(this, "rules");
    l(this, "currentRule");
    this.openAI = e, this.pluginManager = t, this.rules = n, n.length > 0 && (this.currentRule = n.find((o) => o.isActive) || n[0]);
  }
  /**
   * 設置當前規則
   */
  setRule(e) {
    const t = this.rules.find((n) => n.id === e);
    t && (this.currentRule = t);
  }
  /**
   * 處理用戶訊息
   */
  async processMessage(e, t) {
    var a, d;
    const n = this.shouldSearch(e);
    let o = [], i = "";
    n && (console.log("🔍 Searching for:", e), o = await this.pluginManager.search(e, 5), i = this.formatSearchContext(o), console.log(`✅ Found ${o.length} results from plugins`));
    const r = this.buildMessages(
      e,
      t,
      i
    );
    return { response: await this.openAI.chatCompletion(
      r,
      ((a = this.currentRule) == null ? void 0 : a.temperature) || 0.7,
      ((d = this.currentRule) == null ? void 0 : d.maxTokens) || 1e3
    ), sources: o };
  }
  /**
   * 判斷是否需要搜尋
   */
  shouldSearch(e) {
    const t = [
      "搜尋",
      "查詢",
      "找",
      "哪裡",
      "如何",
      "怎麼",
      "什麼",
      "search",
      "find",
      "where",
      "how",
      "what",
      "which",
      "功能",
      "頁面",
      "文件",
      "說明",
      "介紹",
      "資訊",
      "有沒有",
      "可以",
      "能不能",
      "是否"
    ], n = e.toLowerCase();
    return t.some((o) => n.includes(o));
  }
  /**
   * 格式化搜尋結果為上下文
   */
  formatSearchContext(e) {
    if (e.length === 0) return "";
    let t = `

以下是相關的參考資料：

`;
    return e.forEach((n, o) => {
      t += `[${o + 1}] ${n.title}
`, n.type && (t += `來源類型：${this.getSourceTypeName(n.type)}
`), t += `內容：${n.content || n.snippet}
`, n.url && (t += `連結：${n.url}
`), t += `
`;
    }), t;
  }
  /**
   * 獲取來源類型名稱
   */
  getSourceTypeName(e) {
    return {
      "manual-index": "手動索引",
      "frontend-page": "前端頁面",
      sitemap: "Sitemap",
      sql: "SQL 資料庫"
    }[e] || e;
  }
  /**
   * 構建訊息列表
   */
  buildMessages(e, t, n) {
    var s;
    const o = [];
    let i = ((s = this.currentRule) == null ? void 0 : s.systemPrompt) || "你是一個有幫助的 AI 助手。";
    return n && (i += `

` + n, i += `

請根據以上內容回答用戶的問題。如果內容中有相關資訊，請引用並提供來源連結。`), o.push({
      role: "system",
      content: i
    }), t.slice(-10).forEach((a) => {
      a.role !== "system" && o.push({
        role: a.role,
        content: a.content
      });
    }), o.push({
      role: "user",
      content: e
    }), o;
  }
  /**
   * 獲取所有規則
   */
  getRules() {
    return this.rules;
  }
  /**
   * 獲取當前規則
   */
  getCurrentRule() {
    return this.currentRule;
  }
}
const f = {
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
    background: rgba(0, 0, 0, 0.3);
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    align-self: flex-start;
    background: #f3f4f6;
    color: #1f2937;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.5;
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
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
  rulesView: `
    height: 100%;
    overflow-y: auto;
    padding: 20px;
  `,
  ruleItem: `
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
  `,
  ruleItemActive: `
    border-color: #6366f1;
    background: #eef2ff;
  `,
  ruleTitle: `
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  `,
  ruleDescription: `
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
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
class H {
  constructor(e = "33.33%", t = "right") {
    l(this, "container");
    l(this, "overlay");
    l(this, "panel");
    l(this, "isOpen", !1);
    l(this, "width");
    l(this, "position");
    l(this, "capturedImage", null);
    l(this, "capturedText", null);
    // 回調函數
    l(this, "onSendMessage");
    l(this, "onSelectRule");
    l(this, "onClose");
    l(this, "onOpen");
    this.width = e, this.position = t, this.container = this.createContainer(), this.overlay = this.createOverlay(), this.panel = this.createPanel();
  }
  /**
   * 創建容器
   */
  createContainer() {
    const e = document.createElement("div");
    return e.id = "sm-container", e.style.cssText = f.container, e;
  }
  /**
   * 創建遮罩層
   */
  createOverlay() {
    const e = document.createElement("div");
    return e.style.cssText = f.overlay, e.style.display = "none", e.addEventListener("click", () => this.close()), e;
  }
  /**
   * 創建面板
   */
  createPanel() {
    const e = document.createElement("div");
    return e.style.cssText = f.panel, e.style.width = this.width, this.position === "right" ? (e.style.right = `-${this.width}`, e.style.left = "auto") : (e.style.left = `-${this.width}`, e.style.right = "auto"), e.innerHTML = `
      <div id="sm-view-container" style="${f.viewContainer}">
        <!-- 右上角工具按鈕 -->
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 10;">
          <button id="sm-rules-tab" style="${f.iconButton}" title="規則">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </button>
          <button id="sm-refresh-btn" style="${f.iconButton}" title="刷新">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
            </svg>
          </button>
          <button id="sm-close-btn" style="${f.iconButton}" title="關閉">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 對話視圖 -->
        <div id="sm-chat-view" style="${f.chatView}">
          <div id="sm-messages" style="${f.messagesContainer}"></div>
          <div style="${f.inputContainer}">
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
                style="${f.input}"
              />
              <button id="sm-send-btn" style="${f.sendIconButton}" title="發送">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 規則視圖 -->
        <div id="sm-rules-view" style="${f.rulesView}; display: none;">
          <div id="sm-rules-list"></div>
        </div>
      </div>
    `, this.bindEvents(e), e;
  }
  /**
   * 綁定事件
   */
  bindEvents(e) {
    var n, o, i, r, s, a;
    (n = e.querySelector("#sm-close-btn")) == null || n.addEventListener("click", () => {
      this.close();
    }), (o = e.querySelector("#sm-send-btn")) == null || o.addEventListener("click", () => {
      this.handleSend();
    });
    const t = e.querySelector("#sm-input");
    t == null || t.addEventListener("keypress", (d) => {
      d.key === "Enter" && this.handleSend();
    }), (i = e.querySelector("#sm-chat-tab")) == null || i.addEventListener("click", () => {
      this.showView("chat");
    }), (r = e.querySelector("#sm-rules-tab")) == null || r.addEventListener("click", () => {
      this.showView("rules");
    }), (s = e.querySelector("#sm-refresh-btn")) == null || s.addEventListener("click", () => {
      this.clearMessages();
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
    const t = this.panel.querySelector("#sm-chat-view"), n = this.panel.querySelector("#sm-rules-view"), o = this.panel.querySelector("#sm-chat-tab"), i = this.panel.querySelector("#sm-rules-tab");
    e === "chat" ? (t.style.display = "flex", n.style.display = "none", o.style.cssText = f.tabButton + "; " + f.tabButtonActive, i.style.cssText = f.tabButton) : (t.style.display = "none", n.style.display = "block", o.style.cssText = f.tabButton, i.style.cssText = f.tabButton + "; " + f.tabButtonActive);
  }
  /**
   * 添加訊息
   */
  addMessage(e) {
    const t = this.panel.querySelector("#sm-messages");
    if (!t) return;
    const n = document.createElement("div");
    if (n.style.cssText = e.role === "user" ? f.userMessage : f.assistantMessage, n.textContent = e.content, e.sources && e.sources.length > 0) {
      const o = document.createElement("div");
      o.style.cssText = f.sources, o.innerHTML = "<strong>參考來源：</strong><br>", e.sources.forEach((i, r) => {
        const s = document.createElement("a");
        s.href = i.url, s.target = "_blank", s.textContent = `[${r + 1}] ${i.title}`, s.style.cssText = f.sourceLink, o.appendChild(s), o.appendChild(document.createElement("br"));
      }), n.appendChild(o);
    }
    t.appendChild(n), t.scrollTop = t.scrollHeight;
  }
  /**
   * 設置規則列表
   */
  setRules(e, t) {
    const n = this.panel.querySelector("#sm-rules-list");
    n && (n.innerHTML = "", e.forEach((o) => {
      const i = document.createElement("div");
      i.style.cssText = f.ruleItem, o.id === t && (i.style.cssText += "; " + f.ruleItemActive), i.innerHTML = `
        <h3 style="${f.ruleTitle}">${o.name}</h3>
        <p style="${f.ruleDescription}">${o.description || ""}</p>
      `, i.addEventListener("click", () => {
        this.onSelectRule && this.onSelectRule(o.id), this.showView("chat");
      }), n.appendChild(i);
    }));
  }
  /**
   * 清除訊息
   */
  clearMessages() {
    const e = this.panel.querySelector("#sm-messages");
    e && (e.innerHTML = "");
  }
  /**
   * 打開面板
   */
  open() {
    if (this.isOpen) return;
    this.container.parentElement || (document.body.appendChild(this.container), this.container.appendChild(this.overlay), this.container.appendChild(this.panel)), this.overlay.style.display = "block";
    let e = document.getElementById("sm-body-wrapper");
    e || (e = document.createElement("div"), e.id = "sm-body-wrapper", e.style.cssText = `
        transition: transform 0.3s ease;
        width: 100%;
        min-height: 100vh;
      `, Array.from(document.body.children).forEach((o) => {
      o !== this.container && e.appendChild(o);
    }), document.body.insertBefore(e, this.container));
    const t = this.position === "right" ? `-${this.width}` : this.width;
    e.style.transform = `translateX(${t})`, setTimeout(() => {
      this.position === "right" ? this.panel.style.right = "0" : this.panel.style.left = "0";
    }, 10), this.isOpen = !0, this.onOpen && this.onOpen();
  }
  /**
   * 關閉面板
   */
  close() {
    if (!this.isOpen) return;
    this.position === "right" ? this.panel.style.right = `-${this.width}` : this.panel.style.left = `-${this.width}`;
    const e = document.getElementById("sm-body-wrapper");
    e && (e.style.transform = "translateX(0)"), setTimeout(() => {
      this.overlay.style.display = "none";
    }, 300), this.isOpen = !1, this.onClose && this.onClose();
  }
  /**
   * 設置捕獲的圖片
   */
  setCapturedImage(e, t) {
    this.capturedImage = e, this.capturedText = t;
    const n = this.panel.querySelector("#sm-image-preview"), o = this.panel.querySelector("#sm-preview-img"), i = this.panel.querySelector("#sm-image-context");
    n && o && i && (n.style.display = "flex", o.src = e, i.textContent = t.substring(0, 100) + (t.length > 100 ? "..." : ""));
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
class V {
  constructor() {
    l(this, "isEnabled", !1);
    l(this, "onCapture");
    /**
     * 處理點擊事件
     */
    l(this, "handleClick", async (e) => {
      if (!e.ctrlKey || !this.isEnabled)
        return;
      e.preventDefault(), e.stopPropagation();
      const t = e.target;
      if (!t.closest("#sm-container, .sm-container"))
        try {
          const n = await this.captureElement(t), o = this.extractText(t);
          this.onCapture && this.onCapture(n, o, t), this.showCaptureEffect(t);
        } catch (n) {
          console.error("Failed to capture element:", n);
        }
    });
  }
  /**
   * 啟用捕獲模式
   */
  enable(e) {
    this.isEnabled = !0, this.onCapture = e, document.addEventListener("click", this.handleClick, !0), this.addHoverStyles(), console.log("Capture mode enabled. Press Ctrl+Click to capture elements.");
  }
  /**
   * 禁用捕獲模式
   */
  disable() {
    this.isEnabled = !1, document.removeEventListener("click", this.handleClick, !0), this.removeHoverStyles(), console.log("Capture mode disabled.");
  }
  /**
   * 截圖元素
   * 注意：需要 html2canvas 庫，目前已移除以減少依賴
   */
  async captureElement(e) {
    return console.warn("Screenshot feature is disabled. Install html2canvas to enable it."), "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }
  /**
   * 提取元素文字
   */
  extractText(e) {
    const t = e.cloneNode(!0);
    return t.querySelectorAll("script, style").forEach((o) => o.remove()), (t.textContent || "").replace(/\s+/g, " ").trim();
  }
  /**
   * 添加懸停樣式
   */
  addHoverStyles() {
    const e = document.createElement("style");
    e.id = "sm-capture-styles", e.textContent = `
      body.sm-capture-mode * {
        cursor: crosshair !important;
      }
      
      body.sm-capture-mode *:hover {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px !important;
        background-color: rgba(99, 102, 241, 0.1) !important;
      }
    `, document.head.appendChild(e), document.body.classList.add("sm-capture-mode");
  }
  /**
   * 移除懸停樣式
   */
  removeHoverStyles() {
    const e = document.getElementById("sm-capture-styles");
    e && e.remove(), document.body.classList.remove("sm-capture-mode");
  }
  /**
   * 顯示捕獲效果
   */
  showCaptureEffect(e) {
    const t = e.getBoundingClientRect(), n = document.createElement("div");
    n.style.cssText = `
      position: fixed;
      top: ${t.top}px;
      left: ${t.left}px;
      width: ${t.width}px;
      height: ${t.height}px;
      background: rgba(99, 102, 241, 0.3);
      border: 2px solid #6366f1;
      pointer-events: none;
      z-index: 999999;
      animation: sm-capture-flash 0.5s ease-out;
    `;
    const o = `
      @keyframes sm-capture-flash {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.1); }
      }
    `, i = document.createElement("style");
    i.textContent = o, document.head.appendChild(i), document.body.appendChild(n), setTimeout(() => {
      n.remove(), i.remove();
    }, 500);
  }
}
class U {
  /**
   * 提取當前頁面的所有文字內容
   */
  static extractCurrentPageContent() {
    var s;
    const e = document.title, t = window.location.href, n = document.body.cloneNode(!0);
    n.querySelectorAll("script, style, nav, footer, header, .sm-container").forEach((a) => a.remove());
    const o = ((s = n.textContent) == null ? void 0 : s.replace(/\s+/g, " ").trim()) || "", i = [];
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((a) => {
      var u;
      const d = parseInt(a.tagName.substring(1)), c = ((u = a.textContent) == null ? void 0 : u.trim()) || "";
      c && i.push({ level: d, text: c });
    });
    const r = [];
    return document.querySelectorAll("a[href]").forEach((a) => {
      var u;
      const d = ((u = a.textContent) == null ? void 0 : u.trim()) || "", c = a.href;
      d && c && r.push({ text: d, href: c });
    }), {
      title: e,
      url: t,
      content: o,
      headings: i,
      links: r
    };
  }
  /**
   * 搜尋當前頁面內容
   */
  static searchInCurrentPage(e) {
    const t = [], n = e.toLowerCase(), o = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (r) => {
          const s = r.parentElement;
          if (!s) return NodeFilter.FILTER_REJECT;
          const a = s.tagName.toLowerCase();
          return a === "script" || a === "style" || s.closest(".sm-container") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let i;
    for (; i = o.nextNode(); ) {
      const r = i.textContent || "", s = r.toLowerCase();
      if (s.includes(n)) {
        const a = i.parentElement, d = s.indexOf(n), c = Math.max(0, d - 50), u = Math.min(r.length, d + e.length + 50), w = r.substring(c, u);
        t.push({
          text: r.trim(),
          context: "..." + w + "...",
          element: a
        });
      }
    }
    return t;
  }
}
class k {
  /**
   * 獲取或創建當前用戶
   */
  static getCurrentUser() {
    const e = localStorage.getItem(this.USER_KEY);
    if (e) {
      const t = JSON.parse(e), n = this.getOrCreateSessionId();
      return t.sessionId = n, t.metadata.lastSeen = Date.now(), this.saveUser(t), t;
    }
    return this.createNewUser();
  }
  /**
   * 創建新用戶
   */
  static createNewUser() {
    const e = this.generateUserId(), t = this.getOrCreateSessionId(), n = {
      id: e,
      sessionId: t,
      metadata: {
        userAgent: navigator.userAgent,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        totalConversations: 0
      }
    };
    return this.saveUser(n), console.log("Created new user:", n.id), n;
  }
  /**
   * 保存用戶資料
   */
  static saveUser(e) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(e));
  }
  /**
   * 獲取或創建 session ID
   */
  static getOrCreateSessionId() {
    let e = sessionStorage.getItem(this.SESSION_KEY);
    return e || (e = this.generateSessionId(), sessionStorage.setItem(this.SESSION_KEY, e)), e;
  }
  /**
   * 生成用戶 ID
   */
  static generateUserId() {
    return "user_" + this.generateRandomId();
  }
  /**
   * 生成 session ID
   */
  static generateSessionId() {
    return "session_" + this.generateRandomId();
  }
  /**
   * 生成隨機 ID
   */
  static generateRandomId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  /**
   * 增加用戶的對話計數
   */
  static incrementConversationCount() {
    const e = this.getCurrentUser();
    e.metadata.totalConversations++, this.saveUser(e);
  }
  /**
   * 獲取用戶 ID
   */
  static getUserId() {
    return this.getCurrentUser().id;
  }
  /**
   * 獲取 session ID
   */
  static getSessionId() {
    return this.getCurrentUser().sessionId;
  }
}
l(k, "USER_KEY", "sm_user"), l(k, "SESSION_KEY", "sm_session");
class O {
  /**
   * 獲取當前對話
   * 如果沒有活躍對話，創建新對話
   */
  static getCurrentConversation() {
    const e = localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
    if (e) {
      const t = this.getConversationById(e);
      if (t && t.status === "active")
        return t;
    }
    return this.createNewConversation();
  }
  /**
   * 創建新對話
   */
  static createNewConversation() {
    const e = k.getUserId(), t = this.generateConversationId(), n = {
      id: t,
      userId: e,
      messages: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      status: "active",
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    };
    return this.saveConversation(n), localStorage.setItem(this.CURRENT_CONVERSATION_KEY, t), k.incrementConversationCount(), console.log("Created new conversation:", t), n;
  }
  /**
   * 添加訊息到當前對話
   */
  static addMessage(e, t, n, o) {
    const i = this.getCurrentConversation(), r = {
      id: this.generateMessageId(),
      conversationId: i.id,
      role: e,
      content: t,
      imageBase64: n,
      timestamp: Date.now(),
      metadata: o
    };
    return i.messages.push(r), i.lastMessageAt = Date.now(), this.saveConversation(i), r;
  }
  /**
   * 獲取當前對話的所有訊息
   */
  static getMessages() {
    return this.getCurrentConversation().messages;
  }
  /**
   * 關閉當前對話
   */
  static closeCurrentConversation() {
    const e = this.getCurrentConversation();
    e.status = "closed", this.saveConversation(e), localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
  /**
   * 獲取所有對話（用於後台）
   */
  static getAllConversations() {
    const e = localStorage.getItem(this.CONVERSATIONS_KEY);
    if (!e) return [];
    try {
      return JSON.parse(e);
    } catch (t) {
      return console.error("Failed to parse conversations:", t), [];
    }
  }
  /**
   * 根據 ID 獲取對話
   */
  static getConversationById(e) {
    return this.getAllConversations().find((n) => n.id === e) || null;
  }
  /**
   * 根據用戶 ID 獲取對話
   */
  static getConversationsByUserId(e) {
    return this.getAllConversations().filter((n) => n.userId === e);
  }
  /**
   * 保存對話
   */
  static saveConversation(e) {
    const t = this.getAllConversations(), n = t.findIndex((o) => o.id === e.id);
    n >= 0 ? t[n] = e : t.push(e), localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(t));
  }
  /**
   * 人工接管對話
   */
  static takeoverConversation(e, t) {
    const n = this.getConversationById(e);
    n && (n.status = "human-takeover", n.humanAgentId = t, this.saveConversation(n));
  }
  /**
   * 添加人工回覆
   */
  static addHumanReply(e, t, n) {
    const o = this.getConversationById(e);
    if (!o)
      throw new Error("Conversation not found");
    const i = {
      id: this.generateMessageId(),
      conversationId: e,
      role: "human-agent",
      content: t,
      timestamp: Date.now(),
      metadata: {
        agentId: n
      }
    };
    return o.messages.push(i), o.lastMessageAt = Date.now(), this.saveConversation(o), i;
  }
  /**
   * 檢查是否有新訊息（用於輪詢）
   */
  static hasNewMessages(e, t) {
    const n = this.getConversationById(e);
    if (!n) return !1;
    const o = n.messages[n.messages.length - 1];
    return o && o.id !== t;
  }
  /**
   * 獲取新訊息（用於輪詢）
   */
  static getNewMessages(e, t) {
    const n = this.getConversationById(e);
    if (!n) return [];
    const o = n.messages.findIndex((i) => i.id === t);
    return o < 0 ? [] : n.messages.slice(o + 1);
  }
  /**
   * 生成對話 ID
   */
  static generateConversationId() {
    return "conv_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  /**
   * 生成訊息 ID
   */
  static generateMessageId() {
    return "msg_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  /**
   * 清除所有對話（用於測試）
   */
  static clearAll() {
    localStorage.removeItem(this.CONVERSATIONS_KEY), localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
}
l(O, "CONVERSATIONS_KEY", "sm_conversations"), l(O, "CURRENT_CONVERSATION_KEY", "sm_current_conversation");
class I {
  /**
   * 提取頁面主要內容
   */
  extract(e = document) {
    return {
      title: this.extractTitle(e),
      mainContent: this.extractMainContent(e),
      sections: this.extractSections(e),
      images: this.extractImages(e),
      metadata: this.extractMetadata(e)
    };
  }
  /**
   * 提取標題
   */
  extractTitle(e) {
    var i, r, s;
    const t = (i = e.querySelector('meta[property="og:title"]')) == null ? void 0 : i.getAttribute("content");
    if (t) return t;
    const n = (r = e.querySelector("title")) == null ? void 0 : r.textContent;
    return n || ((s = e.querySelector("h1")) == null ? void 0 : s.textContent) || "Untitled";
  }
  /**
   * 提取主要內容（去除雜訊）
   */
  extractMainContent(e) {
    const t = e.cloneNode(!0);
    this.removeNoise(t);
    const n = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      ".main-content",
      "#content",
      "#main"
    ];
    for (const i of n) {
      const r = t.querySelector(i);
      if (r && r.textContent && r.textContent.length > 100)
        return this.cleanText(r.textContent);
    }
    const o = t.querySelector("body");
    return o ? this.cleanText(o.textContent || "") : "";
  }
  /**
   * 移除雜訊元素
   */
  removeNoise(e) {
    [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      ".sidebar",
      ".advertisement",
      ".ad",
      ".cookie-banner",
      ".popup",
      ".modal",
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]'
    ].forEach((n) => {
      e.querySelectorAll(n).forEach((o) => o.remove());
    });
  }
  /**
   * 提取章節
   */
  extractSections(e) {
    const t = [];
    return e.querySelectorAll("h1, h2, h3, h4").forEach((o) => {
      const i = this.cleanText(o.textContent || "");
      if (!i) return;
      let r = "", s = o.nextElementSibling;
      for (; s && !s.matches("h1, h2, h3, h4"); ) {
        const a = s.textContent || "";
        a.trim() && (r += a + " "), s = s.nextElementSibling;
      }
      r.trim() && t.push({
        heading: i,
        content: this.cleanText(r),
        relevance: this.calculateRelevance(o, r)
      });
    }), t.sort((o, i) => i.relevance - o.relevance);
  }
  /**
   * 計算章節相關性
   */
  calculateRelevance(e, t) {
    let n = 0;
    const o = e.tagName.toLowerCase();
    o === "h1" ? n += 3 : o === "h2" ? n += 2 : o === "h3" && (n += 1);
    const i = t.length;
    return i > 500 ? n += 3 : i > 200 ? n += 2 : i > 50 && (n += 1), e.closest('main, article, [role="main"]') && (n += 2), n;
  }
  /**
   * 提取圖片
   */
  extractImages(e) {
    const t = [];
    return e.querySelectorAll("img").forEach((n) => {
      const o = n.src, i = n.alt || "";
      if (n.width < 50 || n.height < 50 || o.includes("ad") || o.includes("banner")) return;
      const r = this.getImageContext(n);
      t.push({ src: o, alt: i, context: r });
    }), t;
  }
  /**
   * 獲取圖片上下文
   */
  getImageContext(e) {
    const t = e.closest("figure");
    if (t) {
      const o = t.querySelector("figcaption");
      if (o) return this.cleanText(o.textContent || "");
    }
    const n = e.parentElement;
    if (n) {
      const o = n.textContent || "";
      return this.cleanText(o.substring(0, 200));
    }
    return "";
  }
  /**
   * 提取元數據
   */
  extractMetadata(e) {
    var i, r, s;
    const t = ((i = e.querySelector('meta[name="description"]')) == null ? void 0 : i.getAttribute("content")) || ((r = e.querySelector('meta[property="og:description"]')) == null ? void 0 : r.getAttribute("content")) || void 0, n = (s = e.querySelector('meta[name="keywords"]')) == null ? void 0 : s.getAttribute("content"), o = n ? n.split(",").map((a) => a.trim()) : void 0;
    return { description: t, keywords: o };
  }
  /**
   * 清理文字
   */
  cleanText(e) {
    return e.replace(/\s+/g, " ").replace(/\n+/g, `
`).trim();
  }
  /**
   * 搜尋相關內容片段
   */
  searchRelevantSections(e, t = 5) {
    const n = this.extract(), o = e.toLowerCase().split(/\s+/);
    return n.sections.map((r) => {
      let s = r.relevance;
      const a = r.heading.toLowerCase();
      o.forEach((c) => {
        a.includes(c) && (s += 5);
      });
      const d = r.content.toLowerCase();
      return o.forEach((c) => {
        const u = (d.match(new RegExp(c, "g")) || []).length;
        s += u * 2;
      }), {
        heading: r.heading,
        content: r.content,
        score: s
      };
    }).sort((r, s) => s.score - r.score).slice(0, t);
  }
  /**
   * 提取純文字內容
   */
  extractText(e) {
    const t = e.cloneNode(!0);
    return t.querySelectorAll("script, style, noscript").forEach((n) => n.remove()), t.textContent || "";
  }
  /**
   * 提取關鍵字
   */
  extractKeywords(e, t = 20) {
    const n = e.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, " ").split(/\s+/).filter((i) => i.length > 1), o = /* @__PURE__ */ new Map();
    for (const i of n)
      o.set(i, (o.get(i) || 0) + 1);
    return Array.from(o.entries()).sort((i, r) => r[1] - i[1]).slice(0, t).map(([i]) => i);
  }
  /**
   * 生成 Fingerprint（SimHash）
   */
  generateFingerprint(e, t = 64) {
    const n = this.extractKeywords(e, 50), o = new Array(t).fill(0);
    for (const i of n) {
      const r = this.simpleHash(i, t);
      for (let s = 0; s < t; s++)
        r[s] === 1 ? o[s]++ : o[s]--;
    }
    return o.map((i) => i > 0 ? 1 : 0);
  }
  /**
   * 簡單的 hash 函數
   */
  simpleHash(e, t) {
    let n = 0;
    for (let i = 0; i < e.length; i++)
      n = (n << 5) - n + e.charCodeAt(i), n = n & n;
    const o = new Array(t).fill(0);
    for (let i = 0; i < t; i++)
      o[i] = n >> i & 1;
    return o;
  }
}
class A {
  /**
   * 獲取所有手動索引
   */
  static getAll() {
    const e = localStorage.getItem(this.STORAGE_KEY);
    if (!e) return [];
    try {
      return JSON.parse(e);
    } catch (t) {
      return console.error("Failed to parse manual indexes:", t), [];
    }
  }
  /**
   * 根據 ID 獲取索引
   */
  static getById(e) {
    return this.getAll().find((n) => n.id === e) || null;
  }
  /**
   * 創建新索引
   */
  static create(e) {
    const t = new I(), n = t.extractKeywords(e.content), o = t.generateFingerprint(e.content), i = {
      id: this.generateId(),
      name: e.name,
      description: e.description,
      content: e.content,
      keywords: n,
      fingerprint: o,
      metadata: e.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, r = this.getAll();
    return r.push(i), this.saveAll(r), console.log("Created manual index:", i.id), i;
  }
  /**
   * 更新索引
   */
  static update(e, t) {
    const n = this.getAll(), o = n.find((i) => i.id === e);
    if (!o) return null;
    if (t.name !== void 0 && (o.name = t.name), t.description !== void 0 && (o.description = t.description), t.metadata !== void 0 && (o.metadata = t.metadata), t.content !== void 0) {
      o.content = t.content;
      const i = new I();
      o.keywords = i.extractKeywords(t.content), o.fingerprint = i.generateFingerprint(t.content);
    }
    return o.updatedAt = Date.now(), this.saveAll(n), console.log("Updated manual index:", e), o;
  }
  /**
   * 刪除索引
   */
  static delete(e) {
    const t = this.getAll(), n = t.filter((o) => o.id !== e);
    return n.length === t.length ? !1 : (this.saveAll(n), console.log("Deleted manual index:", e), !0);
  }
  /**
   * 搜尋索引
   */
  static search(e, t = 5) {
    const n = this.getAll();
    if (n.length === 0) return [];
    const o = new I(), i = o.extractKeywords(e), r = o.generateFingerprint(e);
    return n.map((a) => {
      const d = this.calculateSimilarity(
        i,
        r,
        a.keywords,
        a.fingerprint
      );
      return { index: a, score: d };
    }).filter((a) => a.score > 0).sort((a, d) => d.score - a.score).slice(0, t);
  }
  /**
   * 計算相似度
   */
  static calculateSimilarity(e, t, n, o) {
    const i = this.calculateKeywordScore(e, n), r = this.calculateFingerprintScore(t, o);
    return i * 0.5 + r * 0.5;
  }
  /**
   * 計算關鍵字分數
   */
  static calculateKeywordScore(e, t) {
    return e.length === 0 || t.length === 0 ? 0 : e.filter((o) => t.includes(o)).length / Math.max(e.length, t.length);
  }
  /**
   * 計算 Fingerprint 分數（Jaccard similarity）
   */
  static calculateFingerprintScore(e, t) {
    if (e.length === 0 || t.length === 0) return 0;
    let n = 0, o = 0;
    for (let i = 0; i < Math.max(e.length, t.length); i++) {
      const r = e[i] || 0, s = t[i] || 0;
      r === 1 && s === 1 && n++, (r === 1 || s === 1) && o++;
    }
    return o > 0 ? n / o : 0;
  }
  /**
   * 保存所有索引
   */
  static saveAll(e) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(e));
  }
  /**
   * 生成 ID
   */
  static generateId() {
    return "idx_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  /**
   * 清除所有索引（用於測試）
   */
  static clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  /**
   * 匯出索引（JSON）
   */
  static exportToJSON() {
    const e = this.getAll();
    return JSON.stringify(e, null, 2);
  }
  /**
   * 匯入索引（JSON）
   */
  static importFromJSON(e) {
    try {
      const t = JSON.parse(e);
      if (!Array.isArray(t))
        throw new Error("Invalid format: expected array");
      const o = [...this.getAll(), ...t];
      return this.saveAll(o), console.log(`Imported ${t.length} manual indexes`), t.length;
    } catch (t) {
      throw console.error("Failed to import indexes:", t), t;
    }
  }
}
l(A, "STORAGE_KEY", "sm_manual_indexes");
class z {
  /**
   * 獲取所有 SQL 連接
   */
  static getAll() {
    const e = localStorage.getItem(this.STORAGE_KEY);
    if (!e) return [];
    try {
      return JSON.parse(e);
    } catch (t) {
      return console.error("Failed to parse SQL connections:", t), [];
    }
  }
  /**
   * 根據 ID 獲取連接
   */
  static getById(e) {
    return this.getAll().find((n) => n.id === e) || null;
  }
  /**
   * 創建新連接
   */
  static create(e) {
    const t = {
      id: this.generateId(),
      name: e.name,
      type: e.type,
      enabled: !0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      config: {
        host: e.host,
        port: e.port,
        database: e.database,
        username: e.username,
        password: e.password
      },
      queryTemplate: e.queryTemplate,
      resultMapping: e.resultMapping
    }, n = this.getAll();
    return n.push(t), this.saveAll(n), console.log("Created SQL connection:", t.id), t;
  }
  /**
   * 更新連接
   */
  static update(e, t) {
    const n = this.getAll(), o = n.find((i) => i.id === e);
    return o ? (t.name !== void 0 && (o.name = t.name), t.type !== void 0 && (o.type = t.type), t.enabled !== void 0 && (o.enabled = t.enabled), t.config !== void 0 && (o.config = { ...o.config, ...t.config }), t.queryTemplate !== void 0 && (o.queryTemplate = t.queryTemplate), t.resultMapping !== void 0 && (o.resultMapping = { ...o.resultMapping, ...t.resultMapping }), this.saveAll(n), console.log("Updated SQL connection:", e), o) : null;
  }
  /**
   * 刪除連接
   */
  static delete(e) {
    const t = this.getAll(), n = t.filter((o) => o.id !== e);
    return n.length === t.length ? !1 : (this.saveAll(n), console.log("Deleted SQL connection:", e), !0);
  }
  /**
   * 測試連接
   * 注意：需要後端 API 支援
   */
  static async testConnection(e, t) {
    const n = this.getById(e);
    if (!n)
      throw new Error("Connection not found");
    try {
      return (await (await fetch(`${t}/sql/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: n.type,
          config: n.config
        })
      })).json()).success === !0;
    } catch (o) {
      return console.error("Failed to test connection:", o), !1;
    }
  }
  /**
   * 執行查詢
   * 注意：需要後端 API 支援
   */
  static async query(e, t, n) {
    const o = this.getById(e);
    if (!o || !o.enabled)
      return [];
    try {
      const i = o.queryTemplate.replace(/\{\{query\}\}/g, t), s = await (await fetch(`${n}/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: o.type,
          config: o.config,
          sql: i
        })
      })).json();
      if (!s.success || !s.rows)
        throw new Error(s.error || "Query failed");
      return s.rows.map((a) => ({
        title: a[o.resultMapping.titleField] || "",
        content: a[o.resultMapping.contentField] || "",
        url: o.resultMapping.urlField ? a[o.resultMapping.urlField] : void 0
      }));
    } catch (i) {
      return console.error("Failed to execute query:", i), [];
    }
  }
  /**
   * 搜尋（通過所有啟用的連接）
   */
  static async search(e, t, n, o = 5) {
    const i = this.getAll().filter((a) => a.enabled), r = n && n.length > 0 ? i.filter((a) => n.includes(a.id)) : i;
    if (r.length === 0) return [];
    const s = [];
    for (const a of r)
      try {
        const d = await this.query(a.id, e, t);
        for (const c of d)
          s.push({
            ...c,
            connectionName: a.name
          });
      } catch (d) {
        console.error(`Failed to search connection ${a.name}:`, d);
      }
    return s.slice(0, o);
  }
  /**
   * 獲取連接統計
   */
  static getStats() {
    const e = this.getAll(), t = {
      total: e.length,
      enabled: e.filter((n) => n.enabled).length,
      byType: {}
    };
    for (const n of e)
      t.byType[n.type] = (t.byType[n.type] || 0) + 1;
    return t;
  }
  static saveAll(e) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(e));
  }
  static generateId() {
    return "sql_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  static clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  /**
   * 匯出連接配置（不包含密碼）
   */
  static exportConfig() {
    const e = this.getAll().map((t) => ({
      ...t,
      config: {
        ...t.config,
        password: "***"
        // 隱藏密碼
      }
    }));
    return JSON.stringify(e, null, 2);
  }
}
l(z, "STORAGE_KEY", "sm_sql_connections");
class j {
  constructor() {
    l(this, "container", null);
    l(this, "isOpen", !1);
    l(this, "isAuthenticated", !1);
    l(this, "currentPage", "dashboard");
    this.init();
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
    history.pushState = (...n) => {
      e.apply(history, n), this.handleRouteChange();
    }, history.replaceState = (...n) => {
      t.apply(history, n), this.handleRouteChange();
    };
  }
  /**
   * 處理路由變化
   */
  handleRouteChange() {
    const e = window.location.pathname;
    e === "/lens-service" || e.startsWith("/lens-service/") ? this.open() : this.isOpen && this.close();
  }
  /**
   * 打開後台
   */
  open() {
    if (!this.isOpen) {
      if (!this.checkIPWhitelist()) {
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
    `, this.container.innerHTML = this.isAuthenticated ? this.renderAdminUI() : this.renderLoginUI(), document.body.appendChild(this.container), this.bindEvents();
    }
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

          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">預設密碼：1234</p>
        </div>
      </div>
    `;
  }
  /**
   * 綁定事件
   */
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector("#admin-login-form");
    if (e) {
      e.addEventListener("submit", (h) => {
        h.preventDefault(), h.stopPropagation();
        const m = this.container.querySelector("#admin-password"), x = (m == null ? void 0 : m.value) || "";
        console.log("Login attempt with password:", x), b.verifyAdminPassword(x) ? (this.isAuthenticated = !0, this.container.innerHTML = this.renderAdminUI(), this.bindEvents(), console.log("Login successful")) : (alert("密碼錯誤"), m.value = "", m.focus());
      });
      const p = this.container.querySelector("#admin-password");
      p && setTimeout(() => {
        p.focus();
      }, 100);
    }
    this.container.querySelectorAll(".nav-item").forEach((p) => {
      p.addEventListener("click", () => {
        const h = p.dataset.page;
        if (h) {
          this.currentPage = h;
          const m = this.container.querySelector("#admin-content");
          m && (m.innerHTML = this.renderPageContent()), this.container.innerHTML = this.renderAdminUI(), this.bindEvents();
        }
      });
    });
    const n = this.container.querySelector("#admin-logout");
    n && n.addEventListener("click", () => {
      this.isAuthenticated = !1, this.container.innerHTML = this.renderLoginUI(), this.bindEvents();
    });
    const o = this.container.querySelector("#change-password-form");
    o && o.addEventListener("submit", (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#new-password"), m = (h == null ? void 0 : h.value) || "";
      if (m.length < 4) {
        alert("密碼長度至少 4 個字元");
        return;
      }
      b.saveAdminPassword(m), alert("密碼已更新");
      const x = this.container.querySelector("#admin-content");
      x && (x.innerHTML = this.renderPageContent(), this.bindEvents());
    });
    const i = this.container.querySelector("#ip-whitelist-form");
    i && i.addEventListener("submit", (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#ip-list"), x = ((h == null ? void 0 : h.value) || "").split(`
`).map((y) => y.trim()).filter((y) => y.length > 0);
      this.saveIPWhitelist(x), alert(`已更新 IP 白名單（${x.length} 個 IP）`);
      const v = this.container.querySelector("#admin-content");
      v && (v.innerHTML = this.renderPageContent(), this.bindEvents());
    });
    const r = this.container.querySelector("#add-manual-index-form");
    r && r.addEventListener("submit", (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#index-name"), m = this.container.querySelector("#index-description"), x = this.container.querySelector("#index-content"), v = (h == null ? void 0 : h.value) || "", y = (m == null ? void 0 : m.value) || "", S = (x == null ? void 0 : x.value) || "";
      if (!v || !S) {
        alert("請填寫名稱和內容");
        return;
      }
      try {
        A.create({ name: v, description: y, content: S }), alert("索引已新增");
        const C = this.container.querySelector("#admin-content");
        C && (C.innerHTML = this.renderPageContent(), this.bindEvents());
      } catch (C) {
        alert(`新增失敗：${C instanceof Error ? C.message : "未知錯誤"}`);
      }
    }), this.container.querySelectorAll(".delete-index-btn").forEach((p) => {
      p.addEventListener("click", () => {
        const h = p.dataset.id;
        if (h && confirm("確定要刪除這個索引嗎？"))
          try {
            A.delete(h), alert("索引已刪除");
            const m = this.container.querySelector("#admin-content");
            m && (m.innerHTML = this.renderPageContent(), this.bindEvents());
          } catch (m) {
            alert(`刪除失敗：${m instanceof Error ? m.message : "未知錯誤"}`);
          }
      });
    });
    const a = this.container.querySelector("#api-config-form");
    a && a.addEventListener("submit", (p) => {
      var L, M, P, T, $, q;
      p.preventDefault(), p.stopPropagation();
      const h = ((L = this.container.querySelector("#llm-endpoint")) == null ? void 0 : L.value) || "", m = ((M = this.container.querySelector("#llm-api-key")) == null ? void 0 : M.value) || "", x = ((P = this.container.querySelector("#llm-deployment")) == null ? void 0 : P.value) || "", v = ((T = this.container.querySelector("#embed-endpoint")) == null ? void 0 : T.value) || "", y = (($ = this.container.querySelector("#embed-api-key")) == null ? void 0 : $.value) || "", S = ((q = this.container.querySelector("#embed-deployment")) == null ? void 0 : q.value) || "", C = {
        azureOpenAI: {
          endpoint: h,
          apiKey: m,
          deployment: x,
          embeddingDeployment: S
        },
        llmAPI: {
          endpoint: h,
          apiKey: m,
          deployment: x
        },
        embeddingAPI: {
          endpoint: v,
          apiKey: y,
          deployment: S
        }
      };
      b.saveConfig(C), alert("API 設定已儲存");
    });
    const d = this.container.querySelector("#agent-tool-config-form");
    d && d.addEventListener("submit", (p) => {
      var v, y;
      p.preventDefault(), p.stopPropagation();
      const h = ((v = this.container.querySelector("#manual-index-enabled")) == null ? void 0 : v.checked) || !1, m = ((y = this.container.querySelector("#frontend-pages-enabled")) == null ? void 0 : y.checked) || !1, x = b.loadAgentToolConfig();
      if (x) {
        x.manualIndex.enabled = h, x.frontendPages.enabled = m, b.saveAgentToolConfig(x), alert("Agent 設定已儲存");
        const S = this.container.querySelector("#admin-content");
        S && (S.innerHTML = this.renderPageContent(), this.bindEvents());
      }
    });
    const c = this.container.querySelector("#sql-plugin-config-form");
    c && c.addEventListener("submit", (p) => {
      var T, $, q, R, N, _, D, K;
      p.preventDefault(), p.stopPropagation();
      const h = ((T = this.container.querySelector("#sql-plugin-enabled")) == null ? void 0 : T.checked) || !1, m = parseInt((($ = this.container.querySelector("#sql-plugin-priority")) == null ? void 0 : $.value) || "5"), x = ((q = this.container.querySelector("#sql-api-endpoint")) == null ? void 0 : q.value) || "", v = ((R = this.container.querySelector("#sql-connection-id")) == null ? void 0 : R.value) || "", y = ((N = this.container.querySelector("#sql-search-table")) == null ? void 0 : N.value) || "knowledge_base", S = ((_ = this.container.querySelector("#sql-title-column")) == null ? void 0 : _.value) || "title", C = ((D = this.container.querySelector("#sql-content-column")) == null ? void 0 : D.value) || "content", L = ((K = this.container.querySelector("#sql-url-column")) == null ? void 0 : K.value) || "url", M = {
        enabled: h,
        priority: m,
        apiEndpoint: x,
        connectionId: v,
        searchTable: y,
        titleColumn: S,
        contentColumn: C,
        urlColumn: L
      };
      localStorage.setItem("sm_sql_plugin_config", JSON.stringify(M)), alert("SQL Plugin 設定已儲存");
      const P = this.container.querySelector("#admin-content");
      P && (P.innerHTML = this.renderPageContent(), this.bindEvents());
    });
    const u = this.container.querySelector("#sql-connection-form");
    u && u.addEventListener("submit", (p) => {
      var x, v;
      p.preventDefault(), p.stopPropagation();
      const h = ((x = this.container.querySelector("#sql-conn-name")) == null ? void 0 : x.value) || "", m = (v = this.container.querySelector("#sql-conn-type")) == null ? void 0 : v.value;
      if (!h) {
        alert("請輸入連接名稱");
        return;
      }
      try {
        z.create({
          name: h,
          type: m,
          host: "localhost",
          port: 3306,
          database: "mydb",
          username: "user",
          password: "password",
          queryTemplate: "SELECT * FROM {table} WHERE {conditions}",
          resultMapping: {
            titleField: "title",
            contentField: "content",
            urlField: "url"
          }
        }), alert("SQL 連接已新增");
        const y = this.container.querySelector("#admin-content");
        y && (y.innerHTML = this.renderPageContent(), this.bindEvents());
      } catch (y) {
        console.error("Error creating SQL connection:", y), alert("新增失敗");
      }
    }), this.container.querySelectorAll(".delete-sql-connection").forEach((p) => {
      p.addEventListener("click", () => {
        const h = p.dataset.id;
        if (h && confirm("確定要刪除這個連接嗎？"))
          try {
            z.delete(h), alert("連接已刪除");
            const m = this.container.querySelector("#admin-content");
            m && (m.innerHTML = this.renderPageContent(), this.bindEvents());
          } catch (m) {
            console.error("Error deleting SQL connection:", m), alert("刪除失敗");
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
        <div style="width: 250px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #1f2937;">Lens Service</h1>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">管理後台</p>
          </div>

          <nav style="flex: 1; padding: 16px; overflow-y: auto;">
            ${this.renderNavItem("dashboard", "儀表板")}
            ${this.renderNavItem("manual-index", "手動索引")}
            ${this.renderNavItem("conversations", "客服記錄")}
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
            ${this.renderPageContent()}
          </div>
        </div>
      </div>
    `;
  }
  /**
   * 渲染導航項目（無 icon）
   */
  renderNavItem(e, t) {
    const n = this.currentPage === e;
    return `
      <button
        class="nav-item"
        data-page="${e}"
        style="
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 4px;
          background: ${n ? "#ede9fe" : "transparent"};
          border: none;
          border-radius: 8px;
          color: ${n ? "#7c3aed" : "#6b7280"};
          font-size: 14px;
          font-weight: ${n ? "600" : "500"};
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
  renderPageContent() {
    switch (this.currentPage) {
      case "dashboard":
        return this.renderDashboard();
      case "manual-index":
        return this.renderManualIndex();
      case "conversations":
        return this.renderConversations();
      case "system":
        return this.renderSystemSettings();
      default:
        return "<p>頁面不存在</p>";
    }
  }
  /**
   * 渲染儀表板
   */
  renderDashboard() {
    var o, i;
    const e = O.getAllConversations(), t = A.getAll(), n = b.loadAgentToolConfig();
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">儀表板</h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${this.renderStatCard("💬", "對話總數", e.length.toString())}
        ${this.renderStatCard("📝", "手動索引", t.length.toString())}
      </div>

      <!-- Agent 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Agent 設定</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">配置 Agent 使用的搜尋工具</p>

        <form id="agent-tool-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="manual-index-enabled" ${(o = n == null ? void 0 : n.manualIndex) != null && o.enabled ? "checked" : ""} style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 14px; color: #374151; font-weight: 500;">啟用手動索引搜尋</span>
            </label>
            <p style="margin: 4px 0 0 26px; font-size: 12px; color: #6b7280;">搜尋手動新增的索引內容</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="frontend-pages-enabled" ${(i = n == null ? void 0 : n.frontendPages) != null && i.enabled ? "checked" : ""} style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 14px; color: #374151; font-weight: 500;">啟用前端頁面搜尋</span>
            </label>
            <p style="margin: 4px 0 0 26px; font-size: 12px; color: #6b7280;">搜尋當前網站的所有頁面內容</p>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存設定
          </button>
        </form>
      </div>
    `;
  }
  /**
   * 渲染統計卡片
   */
  renderStatCard(e, t, n) {
    return `
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; margin-bottom: 8px;">${e}</div>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${t}</div>
        <div style="font-size: 28px; font-weight: 700; color: #1f2937;">${n}</div>
      </div>
    `;
  }
  /**
   * 渲染手動索引頁面
   */
  renderManualIndex() {
    const e = A.getAll();
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">手動索引</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">手動新增索引內容供 Agent 搜尋</p>

      <!-- 新增索引表單 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增索引</h3>

        <form id="add-manual-index-form">
          <div style="margin-bottom: 16px;">
            <label for="index-name" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="index-name"
              name="name"
              placeholder="例如：產品介紹"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label for="index-description" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">描述</label>
            <input
              type="text"
              id="index-description"
              name="description"
              placeholder="簡短描述這個索引的內容"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label for="index-content" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">內容</label>
            <textarea
              id="index-content"
              name="content"
              placeholder="輸入索引內容..."
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937; resize: vertical;"
            ></textarea>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            新增索引
          </button>
        </form>
      </div>

      <!-- 索引列表 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">已建立的索引（${e.length}）</h3>

        ${e.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無索引</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${e.map((t) => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${t.name}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">${t.description || "無描述"}</p>
                  </div>
                  <button
                    class="delete-index-btn"
                    data-id="${t.id}"
                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                  >
                    刪除
                  </button>
                </div>
                <p style="font-size: 13px; color: #9ca3af; margin: 8px 0 0 0;">
                  ${t.content.substring(0, 150)}${t.content.length > 150 ? "..." : ""}
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
                  建立時間：${new Date(t.createdAt).toLocaleString("zh-TW")}
                </p>
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
    const e = z.getAll(), t = this.loadSQLPluginConfig();
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
              ${e.map((n) => `
                <option value="${n.id}" ${t.connectionId === n.id ? "selected" : ""}>
                  ${n.name} (${n.type})
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
            ${e.map((n) => `
              <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">${n.name}</h4>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">類型：${n.type}</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">建立時間：${new Date(n.createdAt).toLocaleString("zh-TW")}</p>
                  </div>
                  <button
                    class="delete-sql-connection"
                    data-id="${n.id}"
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
   * 渲染客服記錄頁面
   */
  renderConversations() {
    const e = O.getAllConversations();
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">客服記錄</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">查看所有用戶對話記錄</p>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">統計資訊</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">總對話數</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${e.length}</div>
          </div>
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">總訊息數</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${e.reduce((t, n) => t + n.messages.length, 0)}</div>
          </div>
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">活躍用戶</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${new Set(e.map((t) => t.userId)).size}</div>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">對話列表</h3>

        ${e.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無對話記錄</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${e.slice().reverse().map((t) => {
      const n = t.messages[t.messages.length - 1], o = t.messages.length, i = t.messages.filter((s) => s.role === "user").length, r = t.messages.filter((s) => s.role === "assistant").length;
      return `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='#7c3aed'; this.style.boxShadow='0 4px 6px rgba(124, 58, 237, 0.1)'"
                     onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'"
                     onclick="this.querySelector('.conversation-details').style.display = this.querySelector('.conversation-details').style.display === 'none' ? 'block' : 'none'">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                      <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">
                        對話 ID: ${(t.conversationId || t.id).substring(0, 8)}...
                      </h4>
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        用戶 ID: ${t.userId.substring(0, 8)}...
                      </p>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 12px; color: #9ca3af;">
                        ${new Date(t.createdAt || t.startedAt).toLocaleString("zh-TW")}
                      </div>
                      <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                        ${o} 則訊息
                      </div>
                    </div>
                  </div>

                  <div style="padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 12px;">
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">最後訊息：</div>
                    <div style="font-size: 14px; color: #1f2937;">
                      ${n ? n.content.substring(0, 100) + (n.content.length > 100 ? "..." : "") : "無訊息"}
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                    <span>👤 用戶: ${i}</span>
                    <span>🤖 助手: ${r}</span>
                    <span>📅 ${new Date(t.updatedAt || t.lastMessageAt).toLocaleDateString("zh-TW")}</span>
                  </div>

                  <!-- 對話詳情（預設隱藏） -->
                  <div class="conversation-details" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #1f2937;">完整對話記錄</h5>
                    <div style="max-height: 400px; overflow-y: auto;">
                      ${t.messages.map((s) => `
                        <div style="margin-bottom: 12px; padding: 12px; background: ${s.role === "user" ? "#ede9fe" : "#f3f4f6"}; border-radius: 6px;">
                          <div style="font-size: 12px; font-weight: 600; color: ${s.role === "user" ? "#7c3aed" : "#6b7280"}; margin-bottom: 4px;">
                            ${s.role === "user" ? "👤 用戶" : "🤖 助手"} - ${new Date(s.timestamp).toLocaleString("zh-TW")}
                          </div>
                          <div style="font-size: 14px; color: #1f2937; white-space: pre-wrap;">
                            ${s.content}
                          </div>
                          ${s.sources && s.sources.length > 0 ? `
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">參考來源：</div>
                              ${s.sources.map((a, d) => `
                                <div style="font-size: 12px; color: #7c3aed; margin-top: 2px;">
                                  [${d + 1}] ${a.title}
                                </div>
                              `).join("")}
                            </div>
                          ` : ""}
                        </div>
                      `).join("")}
                    </div>
                  </div>
                </div>
              `;
    }).join("")}
          </div>
        `}
      </div>
    `;
  }
  /**
   * 渲染 Agent & API 設定頁面（合併）
   */
  renderAgentAndAPI() {
    var n, o, i, r, s, a, d, c, u, w, p, h;
    const e = b.loadConfig() || {}, t = b.loadAgentToolConfig();
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
                value="${((n = e.azureOpenAI) == null ? void 0 : n.endpoint) || ((o = e.llmAPI) == null ? void 0 : o.endpoint) || ""}"
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
                value="${((i = e.azureOpenAI) == null ? void 0 : i.apiKey) || ((r = e.llmAPI) == null ? void 0 : r.apiKey) || ""}"
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
                value="${((d = e.embeddingAPI) == null ? void 0 : d.endpoint) || ((c = e.azureOpenAI) == null ? void 0 : c.endpoint) || ""}"
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
                value="${((u = e.embeddingAPI) == null ? void 0 : u.apiKey) || ((w = e.azureOpenAI) == null ? void 0 : w.apiKey) || ""}"
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
                value="${((p = e.embeddingAPI) == null ? void 0 : p.deployment) || ((h = e.azureOpenAI) == null ? void 0 : h.embeddingDeployment) || ""}"
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
   * 渲染系統設定頁面（包含密碼和 IP 白名單）
   */
  renderSystemSettings() {
    const e = b.loadAdminPassword(), t = this.getIPWhitelist();
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">系統設定</h2>

      <!-- 密碼設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">管理員密碼</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">當前密碼：${e}</p>

        <form id="change-password-form">
          <div style="margin-bottom: 16px;">
            <label for="new-password" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">新密碼</label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              placeholder="請輸入新密碼"
              autocomplete="new-password"
              style="
                width: 100%;
                max-width: 400px;
                padding: 10px 14px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
                background: white;
                color: #1f2937;
                outline: none;
              "
              required
            />
          </div>

          <button
            type="submit"
            style="
              padding: 10px 20px;
              background: #7c3aed;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            更新密碼
          </button>
        </form>
      </div>

      <!-- IP 白名單設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">IP 白名單</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">限制可以訪問管理後台的 IP 地址</p>

        <div style="margin-bottom: 16px;">
          <p style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">當前白名單：</p>
          <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #4b5563;">
            ${t.length > 0 ? t.join("<br>") : "（空白 - 允許所有 IP）"}
          </div>
        </div>

        <form id="ip-whitelist-form">
          <div style="margin-bottom: 16px;">
            <label for="ip-list" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">IP 列表（每行一個）</label>
            <textarea
              id="ip-list"
              name="ipList"
              placeholder="例如：&#10;192.168.1.1&#10;10.0.0.1"
              rows="5"
              style="
                width: 100%;
                max-width: 400px;
                padding: 10px 14px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                font-family: monospace;
                box-sizing: border-box;
                background: white;
                color: #1f2937;
                outline: none;
                resize: vertical;
              "
            >${t.join(`
`)}</textarea>
          </div>

          <button
            type="submit"
            style="
              padding: 10px 20px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            更新白名單
          </button>
        </form>
      </div>
    `;
  }
  /**
   * 渲染資料庫管理頁面
   */
  renderDatabaseManagement() {
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">資料庫管理</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">配置服務用資料庫，用於存儲對話記錄和索引數據</p>

      <!-- 說明 -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #1e40af;">💡 重要說明</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <li>此處配置的資料庫用於<strong>存儲服務數據</strong>（對話記錄、手動索引等）</li>
          <li>與「SQL 資料庫」頁面的配置不同，該頁面用於 Agent 搜尋外部資料</li>
          <li>由於瀏覽器安全限制，需要提供一個<strong>後端 API</strong>來連接資料庫</li>
          <li>API 需要支援基本的 CRUD 操作（創建、讀取、更新、刪除）</li>
        </ul>
      </div>

      <!-- API 配置 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">後端 API 配置</h3>

        <form id="database-api-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Base URL</label>
            <input
              type="text"
              id="db-api-url"
              placeholder="https://your-api.com/api"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">後端 API 的基礎 URL</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Key（選填）</label>
            <input
              type="password"
              id="db-api-key"
              placeholder="your-api-key"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">如果 API 需要認證，請提供 API Key</p>
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 API 配置
          </button>
        </form>
      </div>

      <!-- Schema 驗證 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">資料庫 Schema 驗證</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">驗證資料庫是否包含所需的表格和欄位</p>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #374151;">必需的表格</h4>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">1. conversations（對話記錄）</h5>
            <div style="font-family: monospace; font-size: 13px; color: #6b7280; line-height: 1.6;">
              - id (VARCHAR/UUID, PRIMARY KEY)<br>
              - user_id (VARCHAR)<br>
              - conversation_id (VARCHAR)<br>
              - messages (JSON/TEXT)<br>
              - created_at (TIMESTAMP)<br>
              - updated_at (TIMESTAMP)
            </div>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">2. manual_indexes（手動索引）</h5>
            <div style="font-family: monospace; font-size: 13px; color: #6b7280; line-height: 1.6;">
              - id (VARCHAR/UUID, PRIMARY KEY)<br>
              - name (VARCHAR)<br>
              - description (TEXT)<br>
              - content (TEXT)<br>
              - keywords (JSON/TEXT)<br>
              - fingerprint (TEXT)<br>
              - created_at (TIMESTAMP)<br>
              - updated_at (TIMESTAMP)
            </div>
          </div>
        </div>

        <button
          id="verify-schema-btn"
          style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
        >
          驗證 Schema
        </button>

        <div id="schema-verification-result" style="margin-top: 16px; display: none;"></div>
      </div>

      <!-- API 端點說明 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">後端 API 端點要求</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">您的後端 API 需要實現以下端點：</p>

        <div style="font-family: monospace; font-size: 13px; background: #f9fafb; padding: 16px; border-radius: 8px; line-height: 1.8;">
          <div style="margin-bottom: 12px;">
            <strong style="color: #10b981;">GET</strong> <span style="color: #1f2937;">/conversations</span><br>
            <span style="color: #6b7280; font-size: 12px;">獲取所有對話記錄</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/conversations</span><br>
            <span style="color: #6b7280; font-size: 12px;">創建新對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #f59e0b;">PUT</strong> <span style="color: #1f2937;">/conversations/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">更新對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #ef4444;">DELETE</strong> <span style="color: #1f2937;">/conversations/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">刪除對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #10b981;">GET</strong> <span style="color: #1f2937;">/manual-indexes</span><br>
            <span style="color: #6b7280; font-size: 12px;">獲取所有手動索引</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/manual-indexes</span><br>
            <span style="color: #6b7280; font-size: 12px;">創建新索引</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #ef4444;">DELETE</strong> <span style="color: #1f2937;">/manual-indexes/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">刪除索引</span>
          </div>

          <div>
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/verify-schema</span><br>
            <span style="color: #6b7280; font-size: 12px;">驗證資料庫 Schema</span>
          </div>
        </div>
      </div>
    `;
  }
}
class W {
  constructor() {
    l(this, "plugins", /* @__PURE__ */ new Map());
  }
  /**
   * 註冊 Plugin
   */
  register(e) {
    this.plugins.has(e.id) && console.warn(`Plugin ${e.id} already registered, replacing...`), this.plugins.set(e.id, e), console.log(`✅ Plugin registered: ${e.name} (${e.id})`);
  }
  /**
   * 取消註冊 Plugin
   */
  unregister(e) {
    const t = this.plugins.get(e);
    t && (t.dispose(), this.plugins.delete(e), console.log(`❌ Plugin unregistered: ${t.name} (${e})`));
  }
  /**
   * 獲取 Plugin
   */
  getPlugin(e) {
    return this.plugins.get(e);
  }
  /**
   * 獲取所有 Plugin
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  /**
   * 獲取所有啟用的 Plugin
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter((e) => e.enabled && e.isAvailable()).sort((e, t) => t.priority - e.priority);
  }
  /**
   * 初始化所有 Plugin
   */
  async initializeAll() {
    const e = this.getAllPlugins();
    console.log(`🔌 Initializing ${e.length} plugins...`), await Promise.all(
      e.map(async (t) => {
        try {
          await t.initialize(), console.log(`✅ Plugin initialized: ${t.name}`);
        } catch (n) {
          console.error(`❌ Failed to initialize plugin ${t.name}:`, n);
        }
      })
    );
  }
  /**
   * 執行搜尋（所有啟用的 Plugin）
   */
  async search(e, t = 5) {
    const n = this.getEnabledPlugins();
    if (n.length === 0)
      return console.warn("No enabled plugins available for search"), [];
    console.log(`🔍 Searching with ${n.length} plugins:`, n.map((r) => r.name));
    const i = (await Promise.all(
      n.map(async (r) => {
        try {
          return (await r.search(e, t)).map((a) => ({
            ...a,
            metadata: {
              ...a.metadata,
              pluginId: r.id,
              pluginName: r.name,
              priority: r.priority
            }
          }));
        } catch (s) {
          return console.error(`Error searching with plugin ${r.name}:`, s), [];
        }
      })
    )).flat();
    return i.sort((r, s) => {
      var c, u;
      const a = ((c = r.metadata) == null ? void 0 : c.priority) || 0, d = ((u = s.metadata) == null ? void 0 : u.priority) || 0;
      return a !== d ? d - a : (s.score || 0) - (r.score || 0);
    }), i.slice(0, t);
  }
  /**
   * 清理所有 Plugin
   */
  disposeAll() {
    this.plugins.forEach((e) => e.dispose()), this.plugins.clear(), console.log("🧹 All plugins disposed");
  }
}
class G {
  constructor() {
    l(this, "id", "manual-index");
    l(this, "name", "手動索引");
    l(this, "description", "搜尋管理員手動新增的索引內容");
    l(this, "priority", 10);
    l(this, "enabled", !0);
  }
  async initialize() {
    const e = A.getAll();
    console.log(`📚 Manual Index Plugin: ${e.length} indexes loaded`);
  }
  async search(e, t = 5) {
    try {
      return A.search(e, t).map(({ index: o, score: i }) => ({
        type: "manual-index",
        title: o.name,
        snippet: o.content.substring(0, 200),
        content: o.content,
        url: `#manual-index-${o.id}`,
        score: i,
        metadata: {
          description: o.description,
          createdAt: o.createdAt,
          indexId: o.id
        }
      }));
    } catch (n) {
      return console.error("Error in ManualIndexPlugin.search:", n), [];
    }
  }
  isAvailable() {
    return A.getAll().length > 0;
  }
  getConfig() {
    return {
      enabled: this.enabled,
      priority: this.priority,
      indexCount: A.getAll().length
    };
  }
  updateConfig(e) {
    typeof e.enabled == "boolean" && (this.enabled = e.enabled), typeof e.priority == "number" && (this.priority = e.priority);
  }
  dispose() {
  }
}
class X {
  constructor() {
    l(this, "id", "frontend-pages");
    l(this, "name", "前端頁面");
    l(this, "description", "搜尋當前網站已索引的頁面內容");
    l(this, "priority", 8);
    l(this, "enabled", !0);
    l(this, "extractor");
    this.extractor = new I();
  }
  async initialize() {
    const e = b.loadIndexedPages();
    console.log(`📄 Frontend Page Plugin: ${e.length} pages loaded`);
  }
  async search(e, t = 5) {
    try {
      const n = b.loadIndexedPages();
      if (n.length === 0)
        return [];
      const o = this.extractor.extractKeywords(e);
      return n.map((r) => {
        const s = `${r.title} ${r.snippet}`.toLowerCase(), d = o.filter(
          (c) => s.includes(c.toLowerCase())
        ).length / o.length;
        return { page: r, score: d };
      }).filter((r) => r.score > 0).sort((r, s) => s.score - r.score).slice(0, t).map(({ page: r, score: s }) => ({
        type: "frontend-page",
        title: r.title,
        snippet: r.snippet,
        content: r.snippet,
        url: r.url,
        score: s,
        metadata: {
          keywords: r.keywords,
          pageId: r.id
        }
      }));
    } catch (n) {
      return console.error("Error in FrontendPagePlugin.search:", n), [];
    }
  }
  isAvailable() {
    return b.loadIndexedPages().length > 0;
  }
  getConfig() {
    return {
      enabled: this.enabled,
      priority: this.priority,
      pageCount: b.loadIndexedPages().length
    };
  }
  updateConfig(e) {
    typeof e.enabled == "boolean" && (this.enabled = e.enabled), typeof e.priority == "number" && (this.priority = e.priority);
  }
  dispose() {
  }
}
class E {
  /**
   * 獲取所有 Sitemap 配置
   */
  static getAll() {
    const e = localStorage.getItem(this.STORAGE_KEY);
    if (!e) return [];
    try {
      return JSON.parse(e);
    } catch (t) {
      return console.error("Failed to parse sitemap configs:", t), [];
    }
  }
  /**
   * 根據 ID 獲取配置
   */
  static getById(e) {
    return this.getAll().find((n) => n.id === e) || null;
  }
  /**
   * 創建新的 Sitemap 配置
   */
  static async create(e) {
    const t = {
      id: this.generateId(),
      domain: e.domain,
      sitemapUrl: e.sitemapUrl,
      enabled: !0,
      autoUpdate: e.autoUpdate || !1,
      updateInterval: e.updateInterval || 60,
      // 默認 60 分鐘
      lastUpdated: 0,
      pages: []
    }, n = this.getAll();
    return n.push(t), this.saveAll(n), console.log("Created sitemap config:", t.id), await this.crawl(t.id), t.autoUpdate && this.startAutoUpdate(t.id), t;
  }
  /**
   * 更新配置
   */
  static update(e, t) {
    const n = this.getAll(), o = n.find((i) => i.id === e);
    return o ? (t.domain !== void 0 && (o.domain = t.domain), t.sitemapUrl !== void 0 && (o.sitemapUrl = t.sitemapUrl), t.enabled !== void 0 && (o.enabled = t.enabled), t.autoUpdate !== void 0 && (o.autoUpdate = t.autoUpdate), t.updateInterval !== void 0 && (o.updateInterval = t.updateInterval), this.saveAll(n), o.autoUpdate ? this.startAutoUpdate(e) : this.stopAutoUpdate(e), console.log("Updated sitemap config:", e), o) : null;
  }
  /**
   * 刪除配置
   */
  static delete(e) {
    const t = this.getAll(), n = t.filter((o) => o.id !== e);
    return n.length === t.length ? !1 : (this.saveAll(n), this.stopAutoUpdate(e), console.log("Deleted sitemap config:", e), !0);
  }
  /**
   * 爬取 Sitemap
   */
  static async crawl(e) {
    const t = this.getById(e);
    if (!t)
      throw new Error("Sitemap config not found");
    console.log("Crawling sitemap:", t.sitemapUrl);
    try {
      const o = await (await fetch(t.sitemapUrl)).text(), r = new DOMParser().parseFromString(o, "text/xml"), s = Array.from(r.querySelectorAll("url loc")).map((p) => p.textContent || "");
      console.log(`Found ${s.length} URLs in sitemap`);
      const d = s.slice(0, 50), c = [];
      for (const p of d)
        try {
          const h = await this.crawlPage(p);
          h && c.push(h);
        } catch (h) {
          console.error(`Failed to crawl ${p}:`, h);
        }
      t.pages = c, t.lastUpdated = Date.now();
      const u = this.getAll(), w = u.findIndex((p) => p.id === e);
      w >= 0 && (u[w] = t, this.saveAll(u)), console.log(`Crawled ${c.length} pages successfully`);
    } catch (n) {
      throw console.error("Failed to crawl sitemap:", n), n;
    }
  }
  /**
   * 爬取單個頁面
   */
  static async crawlPage(e) {
    var t;
    try {
      const o = await (await fetch(e)).text(), r = new DOMParser().parseFromString(o, "text/html"), s = ((t = r.querySelector("title")) == null ? void 0 : t.textContent) || e, a = new I(), d = a.extractText(r.body), c = a.extractKeywords(d), u = a.generateFingerprint(d);
      return {
        url: e,
        title: s,
        content: d.substring(0, 5e3),
        // 限制長度
        keywords: c,
        fingerprint: u,
        lastCrawled: Date.now()
      };
    } catch (n) {
      return console.error(`Failed to crawl page ${e}:`, n), null;
    }
  }
  /**
   * 搜尋 Sitemap 頁面
   */
  static search(e, t, n = 5) {
    const o = this.getAll().filter((c) => c.enabled), i = t && t.length > 0 ? o.filter((c) => t.includes(c.domain)) : o;
    if (i.length === 0) return [];
    const r = new I(), s = r.extractKeywords(e), a = r.generateFingerprint(e), d = [];
    for (const c of i)
      for (const u of c.pages) {
        const w = this.calculateSimilarity(
          s,
          a,
          u.keywords,
          u.fingerprint
        );
        w > 0 && d.push({ page: u, domain: c.domain, score: w });
      }
    return d.sort((c, u) => u.score - c.score).slice(0, n);
  }
  /**
   * 計算相似度
   */
  static calculateSimilarity(e, t, n, o) {
    const i = this.calculateKeywordScore(e, n), r = this.calculateFingerprintScore(t, o);
    return i * 0.5 + r * 0.5;
  }
  static calculateKeywordScore(e, t) {
    return e.length === 0 || t.length === 0 ? 0 : e.filter((o) => t.includes(o)).length / Math.max(e.length, t.length);
  }
  static calculateFingerprintScore(e, t) {
    if (e.length === 0 || t.length === 0) return 0;
    let n = 0, o = 0;
    for (let i = 0; i < Math.max(e.length, t.length); i++) {
      const r = e[i] || 0, s = t[i] || 0;
      r === 1 && s === 1 && n++, (r === 1 || s === 1) && o++;
    }
    return o > 0 ? n / o : 0;
  }
  /**
   * 啟動自動更新
   */
  static startAutoUpdate(e) {
    this.stopAutoUpdate(e);
    const t = this.getById(e);
    if (!t || !t.autoUpdate) return;
    const n = t.updateInterval * 60 * 1e3, o = window.setInterval(() => {
      console.log(`Auto-updating sitemap: ${e}`), this.crawl(e).catch((i) => console.error("Auto-update failed:", i));
    }, n);
    this.updateTimers.set(e, o);
  }
  /**
   * 停止自動更新
   */
  static stopAutoUpdate(e) {
    const t = this.updateTimers.get(e);
    t && (clearInterval(t), this.updateTimers.delete(e));
  }
  /**
   * 初始化所有自動更新
   */
  static initAutoUpdates() {
    const e = this.getAll().filter((t) => t.enabled && t.autoUpdate);
    for (const t of e)
      this.startAutoUpdate(t.id);
    console.log(`Initialized ${e.length} auto-update timers`);
  }
  static saveAll(e) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(e));
  }
  static generateId() {
    return "sitemap_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  static clearAll() {
    this.updateTimers.forEach((e) => clearInterval(e)), this.updateTimers.clear(), localStorage.removeItem(this.STORAGE_KEY);
  }
}
l(E, "STORAGE_KEY", "sm_sitemap_configs"), l(E, "updateTimers", /* @__PURE__ */ new Map());
class Z {
  constructor() {
    l(this, "id", "sitemap");
    l(this, "name", "Sitemap 索引");
    l(this, "description", "搜尋外部網站的 Sitemap 內容");
    l(this, "priority", 6);
    l(this, "enabled", !1);
    // 預設關閉，需要配置 Sitemap 後才啟用
    l(this, "extractor");
    this.extractor = new I();
  }
  async initialize() {
    const e = E.getAll();
    console.log(`🗺️ Sitemap Plugin: ${e.length} sitemaps loaded`), e.length > 0 && (this.enabled = !0);
  }
  async search(e, t = 5) {
    try {
      const n = E.getAll();
      if (n.length === 0)
        return [];
      const o = [], i = this.extractor.extractKeywords(e);
      for (const r of n)
        try {
          const s = await E.search(r.id, i, 3);
          o.push(...s.map(({ page: a, score: d }) => ({
            type: "sitemap",
            title: a.title,
            snippet: a.content.substring(0, 200),
            content: a.content.substring(0, 500),
            url: a.url,
            score: d,
            metadata: {
              domain: r.domain,
              lastUpdated: r.lastUpdated,
              sitemapId: r.id
            }
          })));
        } catch (s) {
          console.error(`Error searching sitemap ${r.domain}:`, s);
        }
      return o.sort((r, s) => (s.score || 0) - (r.score || 0)).slice(0, t);
    } catch (n) {
      return console.error("Error in SitemapPlugin.search:", n), [];
    }
  }
  isAvailable() {
    return E.getAll().length > 0;
  }
  getConfig() {
    return {
      enabled: this.enabled,
      priority: this.priority,
      sitemapCount: E.getAll().length
    };
  }
  updateConfig(e) {
    typeof e.enabled == "boolean" && (this.enabled = e.enabled), typeof e.priority == "number" && (this.priority = e.priority);
  }
  dispose() {
  }
}
class ee {
  constructor(e) {
    l(this, "id", "sql-database");
    l(this, "name", "SQL 資料庫");
    l(this, "description", "搜尋 SQL 資料庫中的內容");
    l(this, "priority", 5);
    l(this, "enabled", !1);
    // 預設關閉，需要配置後才能啟用
    l(this, "config");
    l(this, "extractor");
    this.config = {
      enabled: !1,
      priority: 5,
      searchTable: "knowledge_base",
      searchColumns: ["title", "content"],
      titleColumn: "title",
      contentColumn: "content",
      urlColumn: "url",
      ...e
    }, this.enabled = this.config.enabled, this.priority = this.config.priority, this.extractor = new I();
  }
  async initialize() {
    if (!this.config.connectionId) {
      console.warn("⚠️ SQL Plugin: No connection ID configured"), this.enabled = !1;
      return;
    }
    if (!this.config.apiEndpoint) {
      console.warn("⚠️ SQL Plugin: No API endpoint configured"), this.enabled = !1;
      return;
    }
    try {
      if (!z.getById(this.config.connectionId)) {
        console.warn(`⚠️ SQL Plugin: Connection ${this.config.connectionId} not found`), this.enabled = !1;
        return;
      }
      if (!await z.testConnection(
        this.config.connectionId,
        this.config.apiEndpoint
      )) {
        console.warn("⚠️ SQL Plugin: Connection test failed"), this.enabled = !1;
        return;
      }
      console.log("✅ SQL Plugin: Connection test successful");
    } catch (e) {
      console.error("❌ SQL Plugin initialization error:", e), this.enabled = !1;
    }
  }
  async search(e, t = 5) {
    if (!this.isAvailable())
      return [];
    try {
      const n = this.extractor.extractKeywords(e, 5), o = this.buildSearchQuery(n, t), i = await z.query(
        this.config.connectionId,
        o,
        this.config.apiEndpoint
      );
      return this.convertToSources(i);
    } catch (n) {
      return console.error("Error in SQLPlugin.search:", n), [];
    }
  }
  /**
   * 構建搜尋 SQL 查詢
   */
  buildSearchQuery(e, t) {
    const { searchTable: n, searchColumns: o, titleColumn: i, contentColumn: r, urlColumn: s } = this.config, a = o.map((d) => e.map((c) => `${d} LIKE '%${c}%'`).join(" OR ")).join(" OR ");
    return `
      SELECT 
        ${i} as title,
        ${r} as content,
        ${s} as url
      FROM ${n}
      WHERE ${a}
      LIMIT ${t}
    `.trim();
  }
  /**
   * 轉換查詢結果為 Source 格式
   */
  convertToSources(e) {
    return e.map((t, n) => ({
      type: "sql",
      title: t.title || `結果 ${n + 1}`,
      snippet: t.content ? t.content.substring(0, 200) : "",
      content: t.content || "",
      url: t.url || "#",
      score: 1 - n * 0.1,
      // 簡單的分數計算
      metadata: {
        source: "sql-database",
        connectionId: this.config.connectionId,
        table: this.config.searchTable
      }
    }));
  }
  isAvailable() {
    return this.enabled && !!this.config.connectionId && !!this.config.apiEndpoint && !!this.config.searchTable;
  }
  getConfig() {
    return { ...this.config };
  }
  updateConfig(e) {
    this.config = { ...this.config, ...e }, typeof e.enabled == "boolean" && (this.enabled = e.enabled), typeof e.priority == "number" && (this.priority = e.priority), this.initialize().catch((t) => {
      console.error("Error reinitializing SQL Plugin:", t);
    });
  }
  dispose() {
    this.enabled = !1;
  }
}
function te() {
  const g = localStorage.getItem("sm_sql_plugin_config"), e = g ? JSON.parse(g) : {};
  return new ee(e);
}
function ne() {
  const g = new W();
  return g.register(new G()), g.register(new X()), g.register(new Z()), g.register(te()), g;
}
function oe(g) {
  const e = localStorage.getItem("sm_plugin_configs");
  if (e)
    try {
      const t = JSON.parse(e);
      Object.keys(t).forEach((n) => {
        const o = g.getPlugin(n);
        o && o.updateConfig(t[n]);
      }), console.log("✅ Plugin configs loaded from localStorage");
    } catch (t) {
      console.error("Error loading plugin configs:", t);
    }
}
class ie {
  constructor() {
    l(this, "config");
    l(this, "openAI");
    l(this, "indexing");
    l(this, "agent");
    l(this, "panel");
    l(this, "capture");
    l(this, "conversationState");
    l(this, "initialized", !1);
    l(this, "captureMode", !1);
    l(this, "adminPanel");
    l(this, "pluginManager");
  }
  /**
   * 初始化 Widget
   */
  init(e) {
    var t, n, o;
    if (this.initialized) {
      console.warn("ServiceModuler already initialized");
      return;
    }
    this.config = e, k.getCurrentUser(), console.log("User ID:", k.getUserId()), this.pluginManager = ne(), oe(this.pluginManager), this.pluginManager.initializeAll().then(() => {
      console.log("✅ All plugins initialized");
    }).catch((i) => {
      console.error("❌ Plugin initialization error:", i);
    }), this.openAI = new Q(e.azureOpenAI || e.llmAPI), this.indexing = new B(this.openAI, e.siteConfig), this.agent = new J(this.openAI, this.pluginManager, e.rules || []), this.capture = new V(), this.panel = new H(
      ((t = e.ui) == null ? void 0 : t.width) || "33.33%",
      ((n = e.ui) == null ? void 0 : n.position) || "right"
    ), this.panel.setCallbacks({
      onSendMessage: (i, r) => this.handleSendMessage(i, r),
      onSelectRule: (i) => this.handleSelectRule(i),
      onClose: () => this.handleClose(),
      onOpen: () => this.handleOpen()
    }), this.loadConversationState(), this.agent && this.panel.setRules(
      this.agent.getRules(),
      (o = this.agent.getCurrentRule()) == null ? void 0 : o.id
    ), this.adminPanel = new j(), this.initialized = !0, e.debug && console.log("ServiceModuler initialized", e);
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
    var o, i, r, s;
    if (!this.initialized || !this.agent || !this.panel || !this.openAI) {
      console.error("ServiceModuler not initialized");
      return;
    }
    const n = {
      role: "user",
      content: e || "請分析這張圖片",
      timestamp: Date.now()
    };
    (o = this.conversationState) == null || o.messages.push(n), this.panel.addMessage(n), this.saveConversationState();
    try {
      let a, d;
      if (t)
        a = await this.openAI.chatCompletionWithImage(
          e || "請分析這張圖片並回答問題",
          t,
          ((i = this.conversationState) == null ? void 0 : i.messages.slice(0, -1)) || []
          // 不包含剛添加的用戶訊息
        );
      else {
        const u = await this.agent.processMessage(
          e,
          ((r = this.conversationState) == null ? void 0 : r.messages) || []
        );
        a = u.response, d = u.sources;
      }
      const c = {
        role: "assistant",
        content: a,
        timestamp: Date.now(),
        sources: d
      };
      (s = this.conversationState) == null || s.messages.push(c), this.panel.addMessage(c), this.saveConversationState();
    } catch (a) {
      console.error("Error processing message:", a);
      const d = {
        role: "assistant",
        content: `抱歉，發生錯誤：${a instanceof Error ? a.message : "未知錯誤"}`,
        timestamp: Date.now()
      };
      this.panel.addMessage(d);
    }
  }
  /**
   * 設置規則
   */
  setRule(e) {
    var t;
    this.agent && (this.agent.setRule(e), this.panel && this.panel.setRules(
      this.agent.getRules(),
      (t = this.agent.getCurrentRule()) == null ? void 0 : t.id
    ));
  }
  /**
   * 開始索引網站
   * @param mode 'local' = 索引本地專案, 'domain' = 爬取域名（默認）
   */
  async indexSite(e, t = "domain", n) {
    if (!this.indexing) {
      console.error("Indexing service not initialized");
      return;
    }
    const o = e || window.location.origin;
    await this.indexing.indexSite(o, t, n);
  }
  /**
   * 啟用元素捕獲模式（Ctrl+Click）
   */
  enableCaptureMode() {
    if (!this.capture || !this.panel) {
      console.error("Capture service not initialized");
      return;
    }
    this.captureMode = !0, this.capture.enable((e, t, n) => {
      console.log("Element captured:", { text: t, element: n }), this.open(), this.panel.setCapturedImage(e, t);
    }), console.log("Capture mode enabled. Press Ctrl+Click to capture elements.");
  }
  /**
   * 禁用元素捕獲模式
   */
  disableCaptureMode() {
    this.capture && (this.capture.disable(), this.captureMode = !1);
  }
  /**
   * 搜尋當前頁面內容
   */
  searchCurrentPage(e) {
    return U.searchInCurrentPage(e).map((n) => ({
      text: n.text,
      context: n.context
    }));
  }
  /**
   * 獲取當前頁面內容
   */
  getCurrentPageContent() {
    return U.extractCurrentPageContent();
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
  openAdmin() {
    if (!this.initialized) {
      console.error("ServiceModuler not initialized. Call init() first.");
      return;
    }
    if (!this.adminPanel) {
      console.error("AdminPanel not initialized");
      return;
    }
    this.adminPanel.open();
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
    console.log("✅ Panel opened");
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
  loadConversationState() {
    let e = b.loadConversation();
    e || (e = {
      sessionId: this.generateSessionId(),
      messages: []
    }), this.conversationState = e, this.panel && e.messages.length > 0 && e.messages.forEach((t) => {
      this.panel.addMessage(t);
    });
  }
  /**
   * 保存對話狀態
   */
  saveConversationState() {
    this.conversationState && b.saveConversation(this.conversationState);
  }
  /**
   * 生成 Session ID
   */
  generateSessionId() {
    return `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
const re = new ie();
typeof window < "u" && (window.LensService = re);
export {
  re as default
};

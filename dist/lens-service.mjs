var F = Object.defineProperty;
var U = (g, e, t) => e in g ? F(g, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : g[e] = t;
var d = (g, e, t) => U(g, typeof e != "symbol" ? e + "" : e, t);
class j {
  constructor(e) {
    d(this, "endpoint");
    d(this, "apiKey");
    d(this, "deployment");
    d(this, "embeddingDeployment");
    d(this, "apiVersion");
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
  /**
   * 發送視覺消息（截圖分析）
   */
  async sendVisionMessage(e, t) {
    const n = [
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
              url: t.startsWith("data:") ? t : `data:image/png;base64,${t}`
            }
          }
        ]
      }
    ];
    return await this.chatCompletion(n, 0.7, 1500);
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
d(b, "CONVERSATION_KEY", "sm_conversation"), d(b, "INDEX_KEY", "sm_indexed_pages"), d(b, "CONFIG_KEY", "sm_config"), d(b, "AGENT_TOOL_CONFIG_KEY", "sm_agent_tool_config"), d(b, "ADMIN_PASSWORD_KEY", "sm_admin_password");
class H {
  constructor(e, t) {
    d(this, "openAI");
    d(this, "siteConfig");
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
              const p = new URL(c);
              this.isSameDomain(p.hostname, r) && n.push(c);
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
    n.querySelectorAll("script, style, nav, footer, header").forEach((l) => l.remove());
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
class B {
  constructor(e, t, n = [], o) {
    d(this, "openAI");
    d(this, "pluginManager");
    d(this, "rules");
    d(this, "currentRule");
    d(this, "telegramBotToken");
    d(this, "telegramChatId");
    this.openAI = e, this.pluginManager = t, this.rules = n, this.telegramBotToken = o == null ? void 0 : o.botToken, this.telegramChatId = o == null ? void 0 : o.chatId, n.length > 0 && (this.currentRule = n.find((i) => i.isActive) || n[0]);
  }
  /**
   * 設置當前規則
   */
  setRule(e) {
    const t = this.rules.find((n) => n.id === e);
    t && (this.currentRule = t);
  }
  /**
   * 從SQL數據庫獲取系統設定
   */
  async getSystemSettings() {
    var e, t;
    try {
      const n = await fetch("http://localhost:3002/settings");
      if (n.ok) {
        const o = await n.json(), i = ((e = o.find((s) => s.key === "system_prompt")) == null ? void 0 : e.value) || "你是一個專業的客服助理，請根據提供的資料回答用戶問題。如果沒有相關資料，請告知用戶會轉交給人工客服處理。", r = ((t = o.find((s) => s.key === "default_reply")) == null ? void 0 : t.value) || "此問題我們會在 3 小時內給予回覆，請稍候。";
        return { systemPrompt: i, defaultReply: r };
      }
    } catch (n) {
      console.error("Failed to load system settings:", n);
    }
    return {
      systemPrompt: "你是一個專業的客服助理，請根據提供的資料回答用戶問題。如果沒有相關資料，請告知用戶會轉交給人工客服處理。",
      defaultReply: "此問題我們會在 3 小時內給予回覆，請稍候。"
    };
  }
  /**
   * 處理用戶訊息（新的兩階段流程）
   */
  async processMessage(e, t, n, o) {
    console.log("🤖 Starting two-stage LLM process...");
    const i = await this.determineSearchTools(e);
    console.log("🔧 Tools to use:", i);
    let r = [], s = "";
    i.length > 0 && (console.log("🔍 Searching with tools:", i), r = await this.pluginManager.search(e, 5), s = this.formatSearchContext(r), console.log(`✅ Found ${r.length} results`));
    const { response: a, canAnswer: l } = await this.generateResponse(
      e,
      t,
      s
    );
    return l ? { response: a, sources: r, needsHumanReply: !1 } : (console.log("⚠️ Cannot answer, sending to Telegram..."), await this.sendToTelegram(n, o, e), {
      response: "此問題我們會在 3 小時內給予回覆，請稍候。",
      sources: [],
      needsHumanReply: !0
    });
  }
  /**
   * 階段 1: 使用 LLM 判斷需要使用哪些 search tools
   */
  async determineSearchTools(e) {
    const n = (await this.pluginManager.getEnabledPlugins()).map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description || `Search ${i.name}`
    }));
    if (n.length === 0)
      return [];
    const o = `你是一個工具選擇助手。根據用戶的問題，判斷需要使用哪些搜尋工具。

可用的工具：
${n.map((i) => `- ${i.id}: ${i.description}`).join(`
`)}

請以 JSON 格式回覆，例如：
{
  "tools": ["manual-index", "frontend-pages"],
  "reason": "用戶詢問功能說明，需要搜尋手動索引和前端頁面"
}

如果不需要任何工具，返回：
{
  "tools": [],
  "reason": "這是一般對話，不需要搜尋"
}`;
    try {
      const i = await this.openAI.chatCompletion(
        [
          { role: "system", content: o },
          { role: "user", content: e }
        ],
        0.3,
        500
      ), r = JSON.parse(i);
      return console.log("Tool selection reason:", r.reason), r.tools || [];
    } catch (i) {
      return console.error("Failed to determine tools:", i), n.map((r) => r.id);
    }
  }
  /**
   * 階段 3: 基於搜尋結果生成回覆
   */
  async generateResponse(e, t, n) {
    var l, c, p;
    const { systemPrompt: o, defaultReply: i } = await this.getSystemSettings();
    let r = ((l = this.currentRule) == null ? void 0 : l.systemPrompt) || o;
    r += `

你的任務是根據提供的搜尋結果回答用戶問題。

重要規則：
1. 如果搜尋結果中有明確相關的資訊，請基於這些資訊回答
2. 如果搜尋結果不足以回答問題，請在回覆中明確說明 "CANNOT_ANSWER"
3. 不要編造或猜測資訊
4. 如果能回答，請提供清晰、準確的答案

${n ? `
搜尋結果：
${n}` : `
沒有找到相關的搜尋結果。`}`;
    const s = this.getRecentQA(t, 2), a = [
      { role: "system", content: r }
    ];
    s.length > 0 && a.push({
      role: "system",
      content: `
--- 對話記憶（前 ${s.length} 次 QA）---
${s.join(`

`)}`
    }), a.push({
      role: "user",
      content: e
    });
    try {
      const h = await this.openAI.chatCompletion(
        a,
        ((c = this.currentRule) == null ? void 0 : c.temperature) || 0.7,
        ((p = this.currentRule) == null ? void 0 : p.maxTokens) || 1e3
      ), u = !h.includes("CANNOT_ANSWER");
      return u ? { response: h.replace(/CANNOT_ANSWER/g, "").trim() || h, canAnswer: u } : { response: i, canAnswer: !1 };
    } catch (h) {
      return console.error("Failed to generate response:", h), {
        response: "抱歉，系統暫時無法處理您的請求。",
        canAnswer: !1
      };
    }
  }
  /**
   * 獲取最近的 N 次 QA 對話
   */
  getRecentQA(e, t) {
    const n = [];
    let o = "";
    for (let i = e.length - 1; i >= 0 && n.length < t; i--) {
      const r = e[i];
      r.role === "assistant" && o ? (n.unshift(`Q: ${o}
A: ${r.content}`), o = "") : r.role === "user" && (o = r.content);
    }
    return n;
  }
  /**
   * 發送無法回答的問題到 Telegram
   */
  async sendToTelegram(e, t, n) {
    if (!this.telegramBotToken || !this.telegramChatId) {
      console.warn("Telegram config not set, skipping notification");
      return;
    }
    const o = `🔔 新的客服問題需要人工回覆

Session ID: ${e}
User ID: ${t}
問題: ${n}

請到後台管理系統查看並回覆。`;
    try {
      const i = await fetch(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: o,
            parse_mode: "HTML"
          })
        }
      );
      if (!i.ok)
        throw new Error(`Telegram API error: ${i.statusText}`);
      console.log("✅ Sent to Telegram successfully");
    } catch (i) {
      console.error("Failed to send to Telegram:", i);
    }
  }
  /**
   * 格式化搜尋結果為上下文
   */
  formatSearchContext(e) {
    if (e.length === 0) return "";
    let t = "";
    return e.forEach((n, o) => {
      t += `[來源 ${o + 1}] ${n.title}
`, n.type && (t += `類型：${this.getSourceTypeName(n.type)}
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
    background: transparent;
    color: #1f2937;
    padding: 16px 0;
    border-radius: 0;
    max-width: 100%;
    word-wrap: break-word;
    font-size: 15px;
    line-height: 1.6;
    border-bottom: 1px solid #f1f5f9;
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
class K {
  /**
   * 將 Markdown 文本轉換為 HTML
   */
  static render(e) {
    if (!e) return "";
    let t = e;
    return t = t.replace(/```(\w+)?\n([\s\S]*?)```/g, (n, o, i) => `<pre style="background: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; border-left: 4px solid #6366f1;"><code class="language-${o || ""}" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.4;">${this.escapeHtml(i.trim())}</code></pre>`), t = t.replace(/`([^`]+)`/g, (n, o) => `<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; color: #e11d48;">${this.escapeHtml(o)}</code>`), t = t.replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 16px 0 8px 0; color: #1f2937;">$1</h3>'), t = t.replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 20px 0 10px 0; color: #1f2937;">$1</h2>'), t = t.replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 12px 0; color: #1f2937;">$1</h1>'), t = t.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>'), t = t.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>'), t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #6366f1; text-decoration: none; border-bottom: 1px solid #6366f1;">$1</a>'), t = t.replace(/^[\s]*[-*+] (.*)$/gm, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>'), t = t.replace(/(<li[^>]*>.*<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 20px; list-style-type: disc;">$1</ul>'), t = t.replace(/^[\s]*\d+\. (.*)$/gm, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>'), t = t.replace(/(<li[^>]*>.*<\/li>)/s, '<ol style="margin: 12px 0; padding-left: 20px;">$1</ol>'), t = t.replace(/^> (.*)$/gm, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 12px 0; color: #6b7280; font-style: italic;">$1</blockquote>'), t = t.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">'), t = t.replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6; color: #374151;">'), t = t.replace(/\n/g, "<br>"), t.startsWith("<") || (t = `<p style="margin: 12px 0; line-height: 1.6; color: #374151;">${t}</p>`), t;
  }
  /**
   * 轉義 HTML 特殊字符
   */
  static escapeHtml(e) {
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML;
  }
}
class Q {
  constructor(e = "33.33%", t = "right") {
    d(this, "container");
    d(this, "overlay");
    d(this, "panel");
    d(this, "isOpen", !1);
    d(this, "width");
    d(this, "position");
    d(this, "capturedImage", null);
    d(this, "capturedText", null);
    // 回調函數
    d(this, "onSendMessage");
    d(this, "onSelectRule");
    d(this, "onClose");
    d(this, "onOpen");
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
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; z-index: 10;">
          <button id="sm-rules-tab" style="${f.iconButton}" title="規則">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </button>
          <button id="sm-history-btn" style="${f.iconButton}" title="歷史記錄">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
          <button id="sm-refresh-btn" style="${f.iconButton}" title="刷新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
            </svg>
          </button>
          <button id="sm-close-btn" style="${f.iconButton}" title="關閉">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    var o, i, r, s, a, l;
    (o = e.querySelector("#sm-close-btn")) == null || o.addEventListener("click", () => {
      this.close();
    });
    const t = e.querySelector("#sm-send-btn");
    t ? (console.log("✅ Send button found, binding click event"), t.addEventListener("click", (c) => {
      console.log("🔥 Send button clicked via addEventListener!"), c.preventDefault(), c.stopPropagation(), this.handleSend();
    }), t.onclick = (c) => {
      console.log("🔥 Send button clicked via onclick!"), c.preventDefault(), c.stopPropagation(), this.handleSend();
    }, e.addEventListener("click", (c) => {
      (c.target.id === "sm-send-btn" || c.target.closest("#sm-send-btn")) && (console.log("🔥 Send button clicked via delegation!"), c.preventDefault(), c.stopPropagation(), this.handleSend());
    })) : console.error("❌ Send button not found!");
    const n = e.querySelector("#sm-input");
    n ? (console.log("✅ Input field found, binding events"), n.addEventListener("keypress", (c) => {
      c.key === "Enter" && (console.log("🔥 Enter key pressed in input"), this.handleSend());
    }), n.addEventListener("input", (c) => {
      console.log("🔥 Input event:", c.target.value);
    }), n.addEventListener("focus", () => {
      console.log("🔥 Input focused");
    }), n.addEventListener("blur", () => {
      console.log("🔥 Input blurred");
    })) : console.error("❌ Input field not found!"), (i = e.querySelector("#sm-chat-tab")) == null || i.addEventListener("click", () => {
      this.showView("chat");
    }), (r = e.querySelector("#sm-rules-tab")) == null || r.addEventListener("click", () => {
      this.showView("rules");
    }), (s = e.querySelector("#sm-refresh-btn")) == null || s.addEventListener("click", () => {
      this.clearMessages();
    }), (a = e.querySelector("#sm-history-btn")) == null || a.addEventListener("click", () => {
      this.showHistory();
    }), (l = e.querySelector("#sm-remove-image")) == null || l.addEventListener("click", () => {
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
    if (n.style.cssText = e.role === "user" ? f.userMessage : f.assistantMessage, e.role === "assistant" ? n.innerHTML = K.render(e.content) : n.textContent = e.content, e.sources && e.sources.length > 0) {
      const o = document.createElement("div");
      o.style.cssText = f.sources, o.innerHTML = "<strong>參考來源：</strong><br>", e.sources.forEach((i, r) => {
        const s = document.createElement("a");
        s.href = i.url, s.target = "_blank", s.textContent = `[${r + 1}] ${i.title}`, s.style.cssText = f.sourceLink, o.appendChild(s), o.appendChild(document.createElement("br"));
      }), n.appendChild(o);
    }
    t.appendChild(n), setTimeout(() => {
      t.scrollTop = t.scrollHeight;
    }, 10);
  }
  /**
   * 設置規則列表
   */
  setRules(e, t) {
    const n = this.panel.querySelector("#sm-rules-list");
    if (n) {
      if (n.innerHTML = "", e.length === 0) {
        const o = document.createElement("div");
        o.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      `, o.textContent = "沒有規則", n.appendChild(o);
        return;
      }
      e.forEach((o) => {
        const i = document.createElement("div");
        i.style.cssText = f.ruleItem, o.id === t && (i.style.cssText += "; " + f.ruleItemActive), i.innerHTML = `
        <h3 style="${f.ruleTitle}">${o.name}</h3>
        <p style="${f.ruleDescription}">${o.description || ""}</p>
      `, i.addEventListener("click", () => {
          this.onSelectRule && this.onSelectRule(o.id), this.showView("chat");
        }), n.appendChild(i);
      });
    }
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
      const e = await fetch("http://localhost:3002/conversations");
      if (!e.ok) {
        alert("目前沒有對話記錄");
        return;
      }
      const t = await e.json();
      if (!Array.isArray(t) || t.length === 0)
        alert("目前沒有對話記錄");
      else {
        const n = t.map(
          (o) => `對話 ID: ${o.id}
時間: ${new Date(o.created_at).toLocaleString()}
訊息數: ${Array.isArray(o.messages) ? o.messages.length : 0}`
        ).join(`

`);
        alert(`找到 ${t.length} 條對話記錄

${n}`);
      }
    } catch (e) {
      console.error("Failed to load history:", e), alert("載入歷史記錄失敗");
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
    const e = document.body, t = parseFloat(this.width.replace("%", "")), n = 100 - t;
    this.position === "right" ? (e.style.transform = "translateX(0)", e.style.width = `${n}%`, e.style.marginLeft = "0", e.style.marginRight = "0") : (e.style.transform = `translateX(${t}%)`, e.style.width = `${n}%`, e.style.marginLeft = "0", e.style.marginRight = "0"), e.style.transition = "transform 0.3s ease, width 0.3s ease", e.style.boxSizing = "border-box";
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
   * 將截圖設置到輸入框
   */
  setScreenshotInInput(e) {
    this.capturedImage = e;
    const t = this.panel.querySelector("#sm-image-preview"), n = this.panel.querySelector("#sm-preview-img");
    t && n && (n.src = e, t.style.display = "block"), this.isOpen || this.open();
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
class J {
  constructor() {
    d(this, "isEnabled", !1);
    d(this, "onCapture");
    /**
     * 處理點擊事件
     */
    d(this, "handleClick", async (e) => {
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
class N {
  /**
   * 提取當前頁面的所有文字內容
   */
  static extractCurrentPageContent() {
    var s;
    const e = document.title, t = window.location.href, n = document.body.cloneNode(!0);
    n.querySelectorAll("script, style, nav, footer, header, .sm-container").forEach((a) => a.remove());
    const o = ((s = n.textContent) == null ? void 0 : s.replace(/\s+/g, " ").trim()) || "", i = [];
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((a) => {
      var p;
      const l = parseInt(a.tagName.substring(1)), c = ((p = a.textContent) == null ? void 0 : p.trim()) || "";
      c && i.push({ level: l, text: c });
    });
    const r = [];
    return document.querySelectorAll("a[href]").forEach((a) => {
      var p;
      const l = ((p = a.textContent) == null ? void 0 : p.trim()) || "", c = a.href;
      l && c && r.push({ text: l, href: c });
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
        const a = i.parentElement, l = s.indexOf(n), c = Math.max(0, l - 50), p = Math.min(r.length, l + e.length + 50), h = r.substring(c, p);
        t.push({
          text: r.trim(),
          context: "..." + h + "...",
          element: a
        });
      }
    }
    return t;
  }
}
class S {
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
      const l = r.content.toLowerCase();
      return o.forEach((c) => {
        const p = (l.match(new RegExp(c, "g")) || []).length;
        s += p * 2;
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
class C {
  /**
   * 設置配置（為了兼容性）
   */
  static setConfig(e) {
    this.baseUrl = "/api/lens";
  }
  /**
   * 執行SQL查詢（通過Next.js API Routes）
   */
  static async query(e, t = []) {
    try {
      const o = await (await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sql: e, params: t })
      })).json();
      if (!o.success)
        throw new Error(o.error || "Database query failed");
      return o.data;
    } catch (n) {
      throw console.error("Database query error:", n), n;
    }
  }
  /**
   * 系統設定相關方法
   */
  static async getSettings() {
    try {
      const t = await (await fetch(`${this.baseUrl}/settings`)).json();
      if (!t.success)
        throw new Error(t.error || "Failed to fetch settings");
      return t.data;
    } catch (e) {
      throw console.error("Get settings error:", e), e;
    }
  }
  static async updateSetting(e, t) {
    try {
      const o = await (await fetch(`${this.baseUrl}/settings/${e}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ value: t })
      })).json();
      if (!o.success)
        throw new Error(o.error || "Failed to update setting");
      return o.data;
    } catch (n) {
      throw console.error("Update setting error:", n), n;
    }
  }
  /**
   * 管理員用戶相關方法
   */
  static async getAdminUsers() {
    try {
      const t = await (await fetch(`${this.baseUrl}/admin-users`)).json();
      if (!t.success)
        throw new Error(t.error || "Failed to fetch admin users");
      return t.data;
    } catch (e) {
      throw console.error("Get admin users error:", e), e;
    }
  }
  static async createAdminUser(e, t, n) {
    try {
      const i = await (await fetch(`${this.baseUrl}/admin-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: e, password: t, email: n })
      })).json();
      if (!i.success)
        throw new Error(i.error || "Failed to create admin user");
      return i.data;
    } catch (o) {
      throw console.error("Create admin user error:", o), o;
    }
  }
  static async deleteAdminUser(e) {
    try {
      const n = await (await fetch(`${this.baseUrl}/admin-users/${e}`, {
        method: "DELETE"
      })).json();
      if (!n.success)
        throw new Error(n.error || "Failed to delete admin user");
      return n.data;
    } catch (t) {
      throw console.error("Delete admin user error:", t), t;
    }
  }
  /**
   * 登入驗證
   */
  static async login(e, t) {
    try {
      const o = await (await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: e, password: t })
      })).json();
      if (!o.success)
        throw new Error(o.error || "Login failed");
      return o.data;
    } catch (n) {
      throw console.error("Login error:", n), n;
    }
  }
  /**
   * 手動索引相關方法
   */
  static async getManualIndexes() {
    return this.query(`
      SELECT id, name, description, url, content, embedding, metadata, 
             created_at, updated_at
      FROM manual_indexes 
      ORDER BY created_at DESC
    `);
  }
  static async createManualIndex(e) {
    const t = `
      INSERT INTO manual_indexes (name, description, url, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, description, url, content, created_at, updated_at
    `, n = [e.name, e.description, e.url || null, e.content];
    return (await this.query(t, n))[0];
  }
  // 為了兼容性，添加saveManualIndex別名
  static async saveManualIndex(e) {
    return this.createManualIndex(e);
  }
  static async updateManualIndex(e, t) {
    const n = `
      UPDATE manual_indexes 
      SET name = $1, description = $2, url = $3, content = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, description, url, content, created_at, updated_at
    `, o = [t.name, t.description, t.url || null, t.content, e];
    return (await this.query(n, o))[0];
  }
  static async deleteManualIndex(e) {
    return (await this.query("DELETE FROM manual_indexes WHERE id = $1 RETURNING *", [e]))[0];
  }
  /**
   * 對話記錄相關方法
   */
  static async getConversations() {
    return this.query(`
      SELECT id, user_id, messages, status, created_at, updated_at
      FROM conversations 
      ORDER BY created_at DESC
    `);
  }
  static async deleteConversation(e) {
    return (await this.query("DELETE FROM conversations WHERE id = $1 RETURNING *", [e]))[0];
  }
  /**
   * 健康檢查
   */
  static async healthCheck() {
    try {
      return (await (await fetch(`${this.baseUrl.replace("/api", "")}/health`)).json()).status === "healthy";
    } catch (e) {
      return console.error("Health check failed:", e), !1;
    }
  }
}
d(C, "baseUrl", "/api/lens");
const I = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DatabaseService: C
}, Symbol.toStringTag, { value: "Module" }));
class x {
  /**
   * 設置OpenAI服務實例（用於生成embeddings）
   */
  static setOpenAIService(e) {
    this.openAIService = e;
  }
  /**
   * 獲取所有手動索引
   */
  static async getAll() {
    try {
      return await C.getManualIndexes();
    } catch (e) {
      return console.error("Failed to get manual indexes:", e), [];
    }
  }
  /**
   * 根據 ID 獲取索引
   */
  static async getById(e) {
    return (await this.getAll()).find((n) => n.id === e) || null;
  }
  /**
   * 創建新索引
   */
  static async create(e) {
    const t = new S(), n = t.extractKeywords(e.content), o = t.generateFingerprint(e.content);
    let i;
    if (this.openAIService)
      try {
        const a = `${e.name} ${e.description} ${e.content}`;
        i = await this.openAIService.generateEmbedding(a), console.log("Generated embedding for manual index:", e.name);
      } catch (a) {
        console.warn("Failed to generate embedding:", a);
      }
    const r = {
      id: this.generateId(),
      name: e.name,
      description: e.description,
      content: e.content,
      url: e.url,
      keywords: n,
      fingerprint: o,
      embedding: i,
      metadata: e.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, s = await this.getAll();
    return s.push(r), await this.saveAll(s), console.log("Created manual index:", r.id), r;
  }
  /**
   * 更新索引
   */
  static async update(e, t) {
    const n = await this.getAll(), o = n.find((i) => i.id === e);
    if (!o) return null;
    if (t.name !== void 0 && (o.name = t.name), t.description !== void 0 && (o.description = t.description), t.metadata !== void 0 && (o.metadata = t.metadata), t.content !== void 0) {
      o.content = t.content;
      const i = new S();
      if (o.keywords = i.extractKeywords(t.content), o.fingerprint = i.generateFingerprint(t.content), this.openAIService)
        try {
          const r = `${o.name} ${o.description} ${t.content}`;
          o.embedding = await this.openAIService.generateEmbedding(r), console.log("Updated embedding for manual index:", o.name);
        } catch (r) {
          console.warn("Failed to update embedding:", r);
        }
    }
    return o.updatedAt = Date.now(), await this.saveAll(n), console.log("Updated manual index:", e), o;
  }
  /**
   * 刪除索引
   */
  static async delete(e) {
    const t = await this.getAll();
    return t.filter((o) => o.id !== e).length === t.length ? !1 : (await C.deleteManualIndex(e), console.log("Deleted manual index:", e), !0);
  }
  /**
   * 搜尋索引（混合搜索：BM25 + Vector Search）
   */
  static async search(e, t = 5) {
    const n = await this.getAll();
    if (n.length === 0) return [];
    const o = new S(), i = o.extractKeywords(e), r = o.generateFingerprint(e);
    let s = null;
    if (this.openAIService)
      try {
        s = await this.openAIService.generateEmbedding(e);
      } catch (l) {
        console.warn("Failed to generate query embedding:", l);
      }
    return n.map((l) => {
      const c = this.calculateBM25Score(i, l), p = this.calculateFingerprintScore(r, l.fingerprint), h = s && l.embedding ? this.calculateCosineSimilarity(s, l.embedding) : 0;
      let u;
      return h > 0 ? u = c * 0.4 + h * 0.4 + p * 0.2 : u = c * 0.6 + p * 0.4, {
        index: l,
        score: u,
        breakdown: {
          bm25Score: c,
          vectorScore: h,
          fingerprintScore: p
        }
      };
    }).filter((l) => l.score > 0).sort((l, c) => c.score - l.score).slice(0, t);
  }
  /**
   * 計算BM25分數
   */
  static calculateBM25Score(e, t) {
    if (e.length === 0 || t.keywords.length === 0) return 0;
    const n = 1.2, o = 0.75, i = t.content.length, r = 1e3;
    let s = 0;
    for (const a of e) {
      const l = t.keywords.filter((u) => u === a).length;
      if (l === 0) continue;
      const c = Math.log(10 / 2), p = l * (n + 1), h = l + n * (1 - o + o * (i / r));
      s += c * (p / h);
    }
    return Math.min(s / e.length, 1);
  }
  /**
   * 計算餘弦相似度
   */
  static calculateCosineSimilarity(e, t) {
    if (e.length !== t.length) return 0;
    let n = 0, o = 0, i = 0;
    for (let r = 0; r < e.length; r++)
      n += e[r] * t[r], o += e[r] * e[r], i += t[r] * t[r];
    return o === 0 || i === 0 ? 0 : n / (Math.sqrt(o) * Math.sqrt(i));
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
  static async saveAll(e) {
    for (const t of e)
      await C.saveManualIndex(t);
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
  static async clearAll() {
    const e = await this.getAll();
    for (const t of e)
      await C.deleteManualIndex(t.id);
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
  static async importFromJSON(e) {
    try {
      const t = JSON.parse(e);
      if (!Array.isArray(t))
        throw new Error("Invalid format: expected array");
      const o = [...await this.getAll(), ...t];
      return await this.saveAll(o), console.log(`Imported ${t.length} manual indexes`), t.length;
    } catch (t) {
      throw console.error("Failed to import indexes:", t), t;
    }
  }
  /**
   * 為現有索引生成embeddings（批量處理）
   */
  static async generateEmbeddingsForAll() {
    if (!this.openAIService)
      return console.warn("OpenAI service not available for embedding generation"), 0;
    const e = await this.getAll();
    let t = 0;
    for (const n of e)
      if (!n.embedding)
        try {
          const o = `${n.name} ${n.description} ${n.content}`;
          n.embedding = await this.openAIService.generateEmbedding(o), n.updatedAt = Date.now(), t++, console.log(`Generated embedding for: ${n.name}`), await new Promise((i) => setTimeout(i, 100));
        } catch (o) {
          console.error(`Failed to generate embedding for ${n.name}:`, o);
        }
    return t > 0 && (await this.saveAll(e), console.log(`Generated embeddings for ${t} indexes`)), t;
  }
}
d(x, "openAIService", null);
class A {
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
        const l = await this.query(a.id, e, t);
        for (const c of l)
          s.push({
            ...c,
            connectionName: a.name
          });
      } catch (l) {
        console.error(`Failed to search connection ${a.name}:`, l);
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
d(A, "STORAGE_KEY", "sm_sql_connections");
class W {
  constructor() {
    d(this, "container", null);
    d(this, "isOpen", !1);
    d(this, "isAuthenticated", !1);
    d(this, "currentPage", "dashboard");
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
    history.pushState = (...n) => {
      e.apply(history, n), this.handleRouteChange();
    }, history.replaceState = (...n) => {
      t.apply(history, n), this.handleRouteChange();
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
  showEditDialog(e, t, n = !1) {
    return new Promise((o) => {
      const i = document.createElement("div");
      i.style.cssText = `
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
      const r = n ? `<textarea id="edit-input" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 120px; resize: vertical; font-family: inherit;">${t}</textarea>` : `<input type="text" id="edit-input" value="${t}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">`;
      i.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">${e}</h3>
          ${r}
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
            <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">取消</button>
            <button id="save-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">儲存</button>
          </div>
        </div>
      `, document.body.appendChild(i);
      const s = i.querySelector("#edit-input"), a = i.querySelector("#cancel-btn"), l = i.querySelector("#save-btn");
      s.focus(), s instanceof HTMLInputElement ? s.select() : s.setSelectionRange(0, s.value.length), a == null || a.addEventListener("click", () => {
        document.body.removeChild(i), o(null);
      }), l == null || l.addEventListener("click", () => {
        const c = s.value.trim();
        document.body.removeChild(i), o(c);
      }), s instanceof HTMLInputElement && s.addEventListener("keydown", (c) => {
        if (c.key === "Enter") {
          const p = s.value.trim();
          document.body.removeChild(i), o(p);
        }
      }), i.addEventListener("click", (c) => {
        c.target === i && (document.body.removeChild(i), o(null));
      });
    });
  }
  /**
   * 顯示自定義確認對話框
   */
  showConfirmDialog(e) {
    return new Promise((t) => {
      var r, s;
      const n = document.createElement("div");
      n.style.cssText = `
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
      `, n.appendChild(o), document.body.appendChild(n);
      const i = (a) => {
        document.body.removeChild(n), t(a);
      };
      (r = o.querySelector("#confirm-ok")) == null || r.addEventListener("click", () => i(!0)), (s = o.querySelector("#confirm-cancel")) == null || s.addEventListener("click", () => i(!1)), n.addEventListener("click", (a) => {
        a.target === n && i(!1);
      });
    });
  }
  /**
   * 顯示自定義提示對話框
   */
  showAlertDialog(e) {
    return new Promise((t) => {
      var r;
      const n = document.createElement("div");
      n.style.cssText = `
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
      `, n.appendChild(o), document.body.appendChild(n);
      const i = () => {
        document.body.removeChild(n), t();
      };
      (r = o.querySelector("#alert-ok")) == null || r.addEventListener("click", i), n.addEventListener("click", (s) => {
        s.target === n && i();
      });
    });
  }
  /**
   * 綁定事件
   */
  bindEvents() {
    if (!this.container) return;
    const e = this.container.querySelector("#admin-login-form");
    if (e) {
      e.addEventListener("submit", async (h) => {
        h.preventDefault(), h.stopPropagation();
        const u = this.container.querySelector("#admin-username"), m = this.container.querySelector("#admin-password"), y = (u == null ? void 0 : u.value) || "", v = (m == null ? void 0 : m.value) || "";
        console.log("Login attempt with username:", y);
        try {
          const { DatabaseService: w } = await Promise.resolve().then(() => I), z = await w.login(y, v);
          console.log("Login successful (database auth)"), this.isAuthenticated = !0, this.container.innerHTML = this.renderAdminUI(), await this.updatePageContent(), this.bindEvents();
        } catch (w) {
          console.error("Login error:", w), this.showAlertDialog("登入時發生錯誤，請稍後再試").then(() => {
            m.value = "", m.focus();
          });
        }
      });
      const p = this.container.querySelector("#admin-username");
      p && setTimeout(() => {
        p.focus();
      }, 100);
    }
    setTimeout(() => {
      const p = this.container.querySelectorAll(".nav-item");
      if (console.log("Binding nav items, found:", p.length), p.length === 0 && this.isAuthenticated) {
        console.warn("Nav items not found, retrying..."), setTimeout(() => this.bindEvents(), 100);
        return;
      }
      p.forEach((h, u) => {
        console.log(`Binding nav item ${u}:`, h.dataset.page);
        const m = h.cloneNode(!0);
        h.parentNode.replaceChild(m, h), m.addEventListener("click", async () => {
          const y = m.dataset.page;
          console.log("Nav item clicked:", y), y && (this.currentPage = y, this.container.innerHTML = this.renderAdminUI(), await this.updatePageContent(), this.bindEvents());
        });
      });
    }, 50);
    const t = this.container.querySelector("#admin-logout");
    t && t.addEventListener("click", () => {
      this.isAuthenticated = !1, this.container.innerHTML = this.renderLoginUI(), this.bindEvents();
    });
    const n = this.container.querySelector("#telegram-settings-form");
    n && n.addEventListener("submit", async (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#telegram-enabled"), u = (h == null ? void 0 : h.checked) || !1;
      this.setTelegramEnabled(u), alert(`Telegram 通知已${u ? "啟用" : "停用"}`), await this.updatePageContent();
    });
    const o = this.container.querySelector("#change-password-form");
    o && o.addEventListener("submit", async (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#new-password"), u = (h == null ? void 0 : h.value) || "";
      if (u.length < 4) {
        alert("密碼長度至少 4 個字元");
        return;
      }
      b.saveAdminPassword(u), alert("密碼已更新"), await this.updatePageContent();
    });
    const i = this.container.querySelector("#ip-whitelist-form");
    i && i.addEventListener("submit", async (p) => {
      p.preventDefault(), p.stopPropagation();
      const h = this.container.querySelector("#ip-list"), m = ((h == null ? void 0 : h.value) || "").split(`
`).map((y) => y.trim()).filter((y) => y.length > 0);
      this.saveIPWhitelist(m), alert(`已更新 IP 白名單（${m.length} 個 IP）`), await this.updatePageContent();
    });
    const r = this.container.querySelector("#api-config-form");
    r && r.addEventListener("submit", (p) => {
      var L, q, k, $, T, P;
      p.preventDefault(), p.stopPropagation();
      const h = ((L = this.container.querySelector("#llm-endpoint")) == null ? void 0 : L.value) || "", u = ((q = this.container.querySelector("#llm-api-key")) == null ? void 0 : q.value) || "", m = ((k = this.container.querySelector("#llm-deployment")) == null ? void 0 : k.value) || "", y = (($ = this.container.querySelector("#embed-endpoint")) == null ? void 0 : $.value) || "", v = ((T = this.container.querySelector("#embed-api-key")) == null ? void 0 : T.value) || "", w = ((P = this.container.querySelector("#embed-deployment")) == null ? void 0 : P.value) || "", z = {
        azureOpenAI: {
          endpoint: h,
          apiKey: u,
          deployment: m,
          embeddingDeployment: w
        },
        llmAPI: {
          endpoint: h,
          apiKey: u,
          deployment: m
        },
        embeddingAPI: {
          endpoint: y,
          apiKey: v,
          deployment: w
        }
      };
      b.saveConfig(z), alert("API 設定已儲存");
    });
    const s = this.container.querySelector("#agent-tool-config-form");
    s && s.addEventListener("submit", async (p) => {
      var y, v;
      p.preventDefault(), p.stopPropagation();
      const h = ((y = this.container.querySelector("#manual-index-enabled")) == null ? void 0 : y.checked) || !1, u = ((v = this.container.querySelector("#frontend-pages-enabled")) == null ? void 0 : v.checked) || !1, m = b.loadAgentToolConfig();
      m && (m.manualIndex.enabled = h, m.frontendPages.enabled = u, b.saveAgentToolConfig(m), alert("Agent 設定已儲存"), await this.updatePageContent());
    });
    const a = this.container.querySelector("#sql-plugin-config-form");
    a && a.addEventListener("submit", async (p) => {
      var k, $, T, P, D, O, _, R;
      p.preventDefault(), p.stopPropagation();
      const h = ((k = this.container.querySelector("#sql-plugin-enabled")) == null ? void 0 : k.checked) || !1, u = parseInt((($ = this.container.querySelector("#sql-plugin-priority")) == null ? void 0 : $.value) || "5"), m = ((T = this.container.querySelector("#sql-api-endpoint")) == null ? void 0 : T.value) || "", y = ((P = this.container.querySelector("#sql-connection-id")) == null ? void 0 : P.value) || "", v = ((D = this.container.querySelector("#sql-search-table")) == null ? void 0 : D.value) || "knowledge_base", w = ((O = this.container.querySelector("#sql-title-column")) == null ? void 0 : O.value) || "title", z = ((_ = this.container.querySelector("#sql-content-column")) == null ? void 0 : _.value) || "content", L = ((R = this.container.querySelector("#sql-url-column")) == null ? void 0 : R.value) || "url", q = {
        enabled: h,
        priority: u,
        apiEndpoint: m,
        connectionId: y,
        searchTable: v,
        titleColumn: w,
        contentColumn: z,
        urlColumn: L
      };
      localStorage.setItem("sm_sql_plugin_config", JSON.stringify(q)), alert("SQL Plugin 設定已儲存"), await this.updatePageContent();
    });
    const l = this.container.querySelector("#sql-connection-form");
    l && l.addEventListener("submit", async (p) => {
      var m, y;
      p.preventDefault(), p.stopPropagation();
      const h = ((m = this.container.querySelector("#sql-conn-name")) == null ? void 0 : m.value) || "", u = (y = this.container.querySelector("#sql-conn-type")) == null ? void 0 : y.value;
      if (!h) {
        alert("請輸入連接名稱");
        return;
      }
      try {
        A.create({
          name: h,
          type: u,
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
        }), alert("SQL 連接已新增"), await this.updatePageContent();
      } catch (v) {
        console.error("Error creating SQL connection:", v), alert("新增失敗");
      }
    }), this.container.querySelectorAll(".delete-sql-connection").forEach((p) => {
      p.addEventListener("click", async () => {
        const h = p.dataset.id;
        if (h && confirm("確定要刪除這個連接嗎？"))
          try {
            A.delete(h), alert("連接已刪除"), await this.updatePageContent();
          } catch (u) {
            console.error("Error deleting SQL connection:", u), alert("刪除失敗");
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
        const i = t;
        i.disabled = !0, i.textContent = "生成中...";
        const r = await x.generateEmbeddingsForAll();
        await this.showAlertDialog(`成功為 ${r} 個索引生成了向量嵌入`), await this.updatePageContent();
      } catch (i) {
        await this.showAlertDialog(`生成失敗：${i instanceof Error ? i.message : "未知錯誤"}`);
      } finally {
        const i = t;
        i.disabled = !1, i.textContent = "生成所有Embeddings";
      }
    }), this.container.querySelectorAll(".edit-index-btn").forEach((i) => {
      i.addEventListener("click", async () => {
        const r = i.dataset.id;
        r && await this.showEditIndexModal(r);
      });
    }), this.container.querySelectorAll(".delete-index-btn").forEach((i) => {
      i.addEventListener("click", async () => {
        const r = i.dataset.id;
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
      o.addEventListener("click", async (i) => {
        const r = i.target.getAttribute("data-id");
        r && await this.showConversationModal(r);
      });
    }), this.container.querySelectorAll(".delete-conversation-btn").forEach((o) => {
      o.addEventListener("click", async (i) => {
        const r = i.target.getAttribute("data-id");
        if (r && await this.showConfirmDialog("確定要刪除這個對話嗎？此操作無法復原。"))
          try {
            const { CustomerServiceManager: a } = await import("./CustomerServiceManager-CDEnprzI.mjs");
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
      const i = this.container.querySelector("#default-reply-display"), r = i.textContent || "", s = await this.showEditDialog("編輯預設回覆", r, !0);
      if (s !== null)
        try {
          const { DatabaseService: a } = await Promise.resolve().then(() => I);
          await a.updateSetting("default_reply", s), i.textContent = s, await this.showAlertDialog("預設回覆已更新");
        } catch (a) {
          console.error("Failed to save default reply:", a), await this.showAlertDialog("儲存失敗，請稍後再試");
        }
    });
    const t = this.container.querySelector("#edit-system-prompt-btn");
    t && t.addEventListener("click", async () => {
      const i = this.container.querySelector("#system-prompt-display"), r = i.textContent || "", s = await this.showEditDialog("編輯系統提示詞", r, !0);
      if (s !== null)
        try {
          const { DatabaseService: a } = await Promise.resolve().then(() => I);
          await a.updateSetting("system_prompt", s), i.textContent = s, await this.showAlertDialog("系統提示詞已更新");
        } catch (a) {
          console.error("Failed to save system prompt:", a), await this.showAlertDialog("儲存失敗，請稍後再試");
        }
    });
    const n = this.container.querySelector("#add-admin-user-btn");
    n && n.addEventListener("click", async () => {
      await this.showAddAdminUserModal();
    }), this.container.querySelectorAll(".delete-admin-user-btn").forEach((i) => {
      i.addEventListener("click", async () => {
        const r = i.dataset.id;
        if (r && await this.showConfirmDialog("確定要刪除此管理員帳號嗎？此操作無法復原。"))
          try {
            const { DatabaseService: a } = await Promise.resolve().then(() => I);
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
    let e = [], t = [], n = "連接失敗";
    try {
      const [o, i] = await Promise.all([
        fetch("http://localhost:3002/conversations").catch(() => null),
        fetch("http://localhost:3002/manual-indexes").catch(() => null)
      ]);
      o != null && o.ok && (e = await o.json(), n = "正常連接"), i != null && i.ok && (t = await i.json());
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
            <span style="font-size: 14px; color: ${n === "正常連接" ? "#059669" : "#dc2626"}; font-weight: 500;">
              ${n === "正常連接" ? "✅" : "❌"} ${n}
            </span>
          </div>
        </div>
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
  async renderManualIndex() {
    const e = await x.getAll();
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
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${t.name}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">${t.description || "無描述"}</p>
                    ${t.url ? `<p style="font-size: 12px; color: #3b82f6; margin: 0 0 8px 0; font-family: monospace;"><a href="${t.url}" target="_blank" style="color: inherit; text-decoration: none;">${t.url}</a></p>` : ""}
                    ${t.embedding ? '<span style="font-size: 11px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; display: inline-block;">✓ 已生成向量</span>' : '<span style="font-size: 11px; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; display: inline-block;">⚠ 未生成向量</span>'}
                    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
                      建立時間：${new Date(t.createdAt).toLocaleString("zh-TW")}
                      ${t.updatedAt !== t.createdAt ? ` | 更新時間：${new Date(t.updatedAt).toLocaleString("zh-TW")}` : ""}
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
    const e = A.getAll(), t = this.loadSQLPluginConfig();
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
   * 渲染 Agent & API 設定頁面（合併）
   */
  renderAgentAndAPI() {
    var n, o, i, r, s, a, l, c, p, h, u, m;
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
                value="${((l = e.embeddingAPI) == null ? void 0 : l.endpoint) || ((c = e.azureOpenAI) == null ? void 0 : c.endpoint) || ""}"
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
                value="${((p = e.embeddingAPI) == null ? void 0 : p.apiKey) || ((h = e.azureOpenAI) == null ? void 0 : h.apiKey) || ""}"
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
                value="${((u = e.embeddingAPI) == null ? void 0 : u.deployment) || ((m = e.azureOpenAI) == null ? void 0 : m.embeddingDeployment) || ""}"
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
    const t = await x.getById(e);
    if (!t) {
      await this.showAlertDialog("找不到該索引");
      return;
    }
    const n = document.createElement("div");
    n.style.cssText = `
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
    `, n.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">編輯索引</h3>

        <form id="edit-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="edit-index-name"
              value="${t.name}"
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
    `, document.body.appendChild(n);
    const o = n.querySelector("#edit-index-form"), i = n.querySelector("#cancel-edit-btn");
    o.addEventListener("submit", async (r) => {
      r.preventDefault();
      const s = n.querySelector("#edit-index-name").value, a = n.querySelector("#edit-index-description").value, l = n.querySelector("#edit-index-content").value;
      if (!s || !l) {
        await this.showAlertDialog("請填寫名稱和內容");
        return;
      }
      try {
        await x.update(e, { name: s, description: a, content: l }), await this.showAlertDialog("索引已更新"), document.body.removeChild(n), await this.updatePageContent();
      } catch (c) {
        await this.showAlertDialog(`更新失敗：${c instanceof Error ? c.message : "未知錯誤"}`);
      }
    }), i.addEventListener("click", () => {
      document.body.removeChild(n);
    }), n.addEventListener("click", (r) => {
      r.target === n && document.body.removeChild(n);
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
    const t = e.querySelector("#add-index-form"), n = e.querySelector("#cancel-add-btn");
    t.addEventListener("submit", async (o) => {
      o.preventDefault();
      const i = e.querySelector("#add-index-name").value, r = e.querySelector("#add-index-description").value, s = e.querySelector("#add-index-url").value, a = e.querySelector("#add-index-content").value;
      if (!i || !a) {
        await this.showAlertDialog("請填寫名稱和內容");
        return;
      }
      try {
        await x.create({ name: i, description: r, content: a, url: s || void 0 }), await this.showAlertDialog("索引已新增"), document.body.removeChild(e), await this.updatePageContent();
      } catch (l) {
        await this.showAlertDialog(`新增失敗：${l instanceof Error ? l.message : "未知錯誤"}`);
      }
    }), n.addEventListener("click", () => {
      document.body.removeChild(e);
    }), e.addEventListener("click", (o) => {
      o.target === e && document.body.removeChild(e);
    });
  }
  /**
   * 顯示刪除確認對話框
   */
  async showDeleteConfirmDialog(e) {
    const t = await x.getById(e);
    if (!t) {
      await this.showAlertDialog("找不到該索引");
      return;
    }
    if (await this.showConfirmDialog(`確定要刪除索引「${t.name}」嗎？此操作無法復原。`))
      try {
        await x.delete(e), await this.showAlertDialog("索引已刪除"), await this.updatePageContent();
      } catch (o) {
        await this.showAlertDialog(`刪除失敗：${o instanceof Error ? o.message : "未知錯誤"}`);
      }
  }
  /**
   * 渲染客服對話頁面
   */
  async renderConversations() {
    try {
      const { CustomerServiceManager: e } = await import("./CustomerServiceManager-CDEnprzI.mjs"), t = await e.getAllConversations();
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
                  ${t.slice().reverse().map((n) => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-family: monospace; font-size: 12px;">${n.id.substring(0, 8)}...</td>
                      <td style="padding: 16px; color: #1f2937;">${n.userId}</td>
                      <td style="padding: 16px; color: #1f2937;">${n.messages.length}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${n.status === "active" ? "#dcfce7" : "#f3f4f6"};
                          color: ${n.status === "active" ? "#166534" : "#374151"};
                        ">${n.status === "active" ? "進行中" : "已結束"}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(n.startedAt).toLocaleString()}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="view-conversation-btn" data-id="${n.id}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">查看</button>
                          <button class="delete-conversation-btn" data-id="${n.id}" style="
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
                  `).join("")}
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
      const { AdminUserManager: e } = await import("./AdminUserManager-CYA3JVwT.mjs"), t = await e.getAllAdminUsers();
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
                  ${t.map((n) => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-weight: 500;">${n.username}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${n.role === "super_admin" ? "#fef3c7" : "#dbeafe"};
                          color: ${n.role === "super_admin" ? "#92400e" : "#1e40af"};
                        ">${n.role === "super_admin" ? "超級管理員" : "管理員"}</span>
                      </td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${n.is_active ? "#dcfce7" : "#fee2e2"};
                          color: ${n.is_active ? "#166534" : "#dc2626"};
                        ">${n.is_active ? "啟用" : "停用"}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(n.created_at).toLocaleString()}</td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${n.last_login ? new Date(n.last_login).toLocaleString() : "從未登錄"}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="edit-admin-user-btn" data-id="${n.id}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">編輯</button>
                          ${n.username !== "lens" ? `
                            <button class="delete-admin-user-btn" data-id="${n.id}" style="
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
    var i, r;
    let e = [], t = [];
    try {
      const { DatabaseService: s } = await Promise.resolve().then(() => I), [a, l] = await Promise.all([
        s.getSettings().catch(() => []),
        s.getAdminUsers().catch(() => [])
      ]);
      e = a, t = l;
    } catch (s) {
      console.error("Failed to load system settings:", s);
    }
    const n = ((i = e.find((s) => s.key === "default_reply")) == null ? void 0 : i.value) || "", o = ((r = e.find((s) => s.key === "system_prompt")) == null ? void 0 : r.value) || "";
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
            >${n}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #374151; font-weight: 500;">LLM系統提示詞</label>
              <button
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
    const t = e.querySelector("#add-admin-user-form"), n = e.querySelector("#cancel-add-admin-btn");
    t.addEventListener("submit", async (o) => {
      o.preventDefault();
      const i = e.querySelector("#add-admin-username").value, r = e.querySelector("#add-admin-password").value, s = e.querySelector("#add-admin-email").value;
      try {
        const { DatabaseService: a } = await Promise.resolve().then(() => I);
        await a.createAdminUser(i, r, s), document.body.removeChild(e), await this.showAlertDialog("管理員帳號已新增"), await this.updatePageContent();
      } catch (a) {
        await this.showAlertDialog(`新增失敗：${a instanceof Error ? a.message : "未知錯誤"}`);
      }
    }), n.addEventListener("click", () => {
      document.body.removeChild(e);
    }), e.addEventListener("click", (o) => {
      o.target === e && document.body.removeChild(e);
    });
  }
  /**
   * 顯示對話詳情模態框
   */
  async showConversationModal(e) {
    var t;
    try {
      const { CustomerServiceManager: n } = await import("./CustomerServiceManager-CDEnprzI.mjs"), o = await n.getConversationById(e);
      if (!o) {
        await this.showAlertDialog("找不到該對話記錄");
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
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `, i.innerHTML = `
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
              <div><strong>對話ID:</strong> ${o.id}</div>
              <div><strong>用戶ID:</strong> ${o.userId}</div>
              <div><strong>訊息數:</strong> ${((t = o.messages) == null ? void 0 : t.length) || 0}</div>
              <div><strong>狀態:</strong> ${o.status}</div>
              <div><strong>建立時間:</strong> ${o.createdAt ? new Date(o.createdAt).toLocaleString("zh-TW") : "未知"}</div>
              <div><strong>更新時間:</strong> ${o.updatedAt ? new Date(o.updatedAt).toLocaleString("zh-TW") : "未知"}</div>
            </div>
          </div>

          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">對話記錄</h4>
            ${o.messages && o.messages.length > 0 ? o.messages.map((l) => `
                <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; ${l.role === "user" ? "background: #eff6ff; margin-left: 20px;" : "background: #f0fdf4; margin-right: 20px;"}">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${l.role === "user" ? "👤 用戶" : "🤖 助理"}
                    <span style="font-weight: normal; color: #6b7280; font-size: 12px; margin-left: 8px;">
                      ${new Date(l.timestamp).toLocaleString("zh-TW")}
                    </span>
                  </div>
                  <div style="color: #1f2937; line-height: 1.5;">${l.content}</div>
                </div>
              `).join("") : '<p style="color: #6b7280; text-align: center; padding: 20px;">此對話暫無訊息記錄</p>'}
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
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
      `, document.body.appendChild(i);
      const r = i.querySelector("#close-conversation-modal"), s = i.querySelector("#close-conversation-modal-btn"), a = () => {
        document.body.removeChild(i);
      };
      r == null || r.addEventListener("click", a), s == null || s.addEventListener("click", a), i.addEventListener("click", (l) => {
        l.target === i && a();
      });
    } catch (n) {
      console.error("Error showing conversation modal:", n), await this.showAlertDialog("載入對話詳情失敗");
    }
  }
}
class M {
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
d(M, "USER_KEY", "sm_user"), d(M, "SESSION_KEY", "sm_session");
class Y {
  constructor() {
    d(this, "plugins", /* @__PURE__ */ new Map());
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
  async getEnabledPlugins() {
    const e = this.getAllPlugins(), t = [];
    for (const n of e)
      n.enabled && await n.isAvailable() && t.push(n);
    return t.sort((n, o) => o.priority - n.priority);
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
    const n = await this.getEnabledPlugins();
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
      var c, p;
      const a = ((c = r.metadata) == null ? void 0 : c.priority) || 0, l = ((p = s.metadata) == null ? void 0 : p.priority) || 0;
      return a !== l ? l - a : (s.score || 0) - (r.score || 0);
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
    d(this, "id", "manual-index");
    d(this, "name", "手動索引");
    d(this, "description", "搜尋管理員手動新增的索引內容");
    d(this, "priority", 10);
    d(this, "enabled", !0);
  }
  async initialize() {
    const e = await x.getAll();
    console.log(`📚 Manual Index Plugin: ${e.length} indexes loaded`);
  }
  async search(e, t = 5) {
    try {
      return (await x.search(e, t)).map(({ index: o, score: i, breakdown: r }) => ({
        type: "manual-index",
        title: o.name,
        snippet: o.content.substring(0, 200),
        content: o.content,
        url: `#manual-index-${o.id}`,
        score: i,
        metadata: {
          description: o.description,
          createdAt: o.createdAt,
          indexId: o.id,
          hasEmbedding: !!o.embedding,
          scoreBreakdown: r
        }
      }));
    } catch (n) {
      return console.error("Error in ManualIndexPlugin.search:", n), [];
    }
  }
  async isAvailable() {
    return (await x.getAll()).length > 0;
  }
  async getConfig() {
    const e = await x.getAll();
    return {
      enabled: this.enabled,
      priority: this.priority,
      indexCount: e.length
    };
  }
  updateConfig(e) {
    typeof e.enabled == "boolean" && (this.enabled = e.enabled), typeof e.priority == "number" && (this.priority = e.priority);
  }
  dispose() {
  }
}
class V {
  constructor() {
    d(this, "id", "frontend-pages");
    d(this, "name", "前端頁面");
    d(this, "description", "搜尋當前網站已索引的頁面內容");
    d(this, "priority", 8);
    d(this, "enabled", !0);
    d(this, "extractor");
    this.extractor = new S();
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
        const s = `${r.title} ${r.snippet}`.toLowerCase(), l = o.filter(
          (c) => s.includes(c.toLowerCase())
        ).length / o.length;
        return { page: r, score: l };
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
      const o = await (await fetch(t.sitemapUrl)).text(), r = new DOMParser().parseFromString(o, "text/xml"), s = Array.from(r.querySelectorAll("url loc")).map((u) => u.textContent || "");
      console.log(`Found ${s.length} URLs in sitemap`);
      const l = s.slice(0, 50), c = [];
      for (const u of l)
        try {
          const m = await this.crawlPage(u);
          m && c.push(m);
        } catch (m) {
          console.error(`Failed to crawl ${u}:`, m);
        }
      t.pages = c, t.lastUpdated = Date.now();
      const p = this.getAll(), h = p.findIndex((u) => u.id === e);
      h >= 0 && (p[h] = t, this.saveAll(p)), console.log(`Crawled ${c.length} pages successfully`);
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
      const o = await (await fetch(e)).text(), r = new DOMParser().parseFromString(o, "text/html"), s = ((t = r.querySelector("title")) == null ? void 0 : t.textContent) || e, a = new S(), l = a.extractText(r.body), c = a.extractKeywords(l), p = a.generateFingerprint(l);
      return {
        url: e,
        title: s,
        content: l.substring(0, 5e3),
        // 限制長度
        keywords: c,
        fingerprint: p,
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
    const r = new S(), s = r.extractKeywords(e), a = r.generateFingerprint(e), l = [];
    for (const c of i)
      for (const p of c.pages) {
        const h = this.calculateSimilarity(
          s,
          a,
          p.keywords,
          p.fingerprint
        );
        h > 0 && l.push({ page: p, domain: c.domain, score: h });
      }
    return l.sort((c, p) => p.score - c.score).slice(0, n);
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
d(E, "STORAGE_KEY", "sm_sitemap_configs"), d(E, "updateTimers", /* @__PURE__ */ new Map());
class X {
  constructor() {
    d(this, "id", "sitemap");
    d(this, "name", "Sitemap 索引");
    d(this, "description", "搜尋外部網站的 Sitemap 內容");
    d(this, "priority", 6);
    d(this, "enabled", !1);
    // 預設關閉，需要配置 Sitemap 後才啟用
    d(this, "extractor");
    this.extractor = new S();
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
          o.push(...s.map(({ page: a, score: l }) => ({
            type: "sitemap",
            title: a.title,
            snippet: a.content.substring(0, 200),
            content: a.content.substring(0, 500),
            url: a.url,
            score: l,
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
class Z {
  constructor(e) {
    d(this, "id", "sql-database");
    d(this, "name", "SQL 資料庫");
    d(this, "description", "搜尋 SQL 資料庫中的內容");
    d(this, "priority", 5);
    d(this, "enabled", !1);
    // 預設關閉，需要配置後才能啟用
    d(this, "config");
    d(this, "extractor");
    this.config = {
      enabled: !1,
      priority: 5,
      searchTable: "knowledge_base",
      searchColumns: ["title", "content"],
      titleColumn: "title",
      contentColumn: "content",
      urlColumn: "url",
      ...e
    }, this.enabled = this.config.enabled, this.priority = this.config.priority, this.extractor = new S();
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
      if (!A.getById(this.config.connectionId)) {
        console.warn(`⚠️ SQL Plugin: Connection ${this.config.connectionId} not found`), this.enabled = !1;
        return;
      }
      if (!await A.testConnection(
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
      const n = this.extractor.extractKeywords(e, 5), o = this.buildSearchQuery(n, t), i = await A.query(
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
    const { searchTable: n, searchColumns: o, titleColumn: i, contentColumn: r, urlColumn: s } = this.config, a = o.map((l) => e.map((c) => `${l} LIKE '%${c}%'`).join(" OR ")).join(" OR ");
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
function ee() {
  const g = localStorage.getItem("sm_sql_plugin_config"), e = g ? JSON.parse(g) : {};
  return new Z(e);
}
function te() {
  const g = new Y();
  return g.register(new G()), g.register(new V()), g.register(new X()), g.register(ee()), g;
}
function ne(g) {
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
class oe {
  constructor() {
    d(this, "config");
    d(this, "openAI");
    d(this, "indexing");
    d(this, "agent");
    d(this, "panel");
    d(this, "capture");
    d(this, "conversationState");
    d(this, "initialized", !1);
    d(this, "captureMode", !1);
    d(this, "adminPanel");
    d(this, "pluginManager");
    d(this, "floatingIcon");
    d(this, "screenshotMode", !1);
    d(this, "hoverHandler", null);
    d(this, "mouseLeaveHandler", null);
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
    var o, i, r, s;
    if (this.initialized) {
      console.warn("ServiceModuler already initialized");
      return;
    }
    this.config = e, M.getCurrentUser(), console.log("User ID:", M.getUserId()), this.pluginManager = te(), ne(this.pluginManager), this.pluginManager.initializeAll().then(() => {
      console.log("✅ All plugins initialized");
    }).catch((a) => {
      console.error("❌ Plugin initialization error:", a);
    }), this.openAI = new j(e.azureOpenAI || e.llmAPI), this.indexing = new H(this.openAI, e.siteConfig), x.setOpenAIService(this.openAI), C.setConfig({});
    const t = e.telegram && e.telegram.botToken && e.telegram.chatId ? e.telegram : void 0;
    window.SM_TELEGRAM_CONFIG = t;
    const n = await this.loadRulesFromSQL();
    this.agent = new B(
      this.openAI,
      this.pluginManager,
      n,
      t
    ), this.capture = new J(), this.panel = new Q(
      ((o = e.ui) == null ? void 0 : o.width) || "33.33%",
      ((i = e.ui) == null ? void 0 : i.position) || "right"
    ), this.panel.setCallbacks({
      onSendMessage: (a, l) => this.handleSendMessage(a, l),
      onSelectRule: (a) => this.handleSelectRule(a),
      onClose: () => this.handleClose(),
      onOpen: () => this.handleOpen()
    }), this.loadConversationState(), this.agent && this.panel.setRules(
      this.agent.getRules(),
      (r = this.agent.getCurrentRule()) == null ? void 0 : r.id
    ), this.adminPanel || (this.adminPanel = new W()), window.location.pathname === "/lens-service" && this.openAdminPanel(), this.bindGlobalKeyboardShortcuts(), ((s = e.ui) == null ? void 0 : s.iconPosition) !== !1 && this.createFloatingIcon(), this.initialized = !0, e.debug && console.log("ServiceModuler initialized", e);
  }
  /**
   * 綁定全局快捷鍵
   */
  bindGlobalKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      var t, n;
      e.key && e.key.toLowerCase() === "q" && ((t = this.panel) != null && t.isPanelOpen()) ? (console.log("🎯 Q key pressed, panel is open, enabling screenshot mode"), this.enableScreenshotMode()) : e.key && e.key.toLowerCase() === "q" && console.log("🎯 Q key pressed, but panel is not open:", (n = this.panel) == null ? void 0 : n.isPanelOpen());
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
    var o, i, r, s, a;
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
      let l, c, p = !1;
      const h = ((i = this.conversationState) == null ? void 0 : i.sessionId) || this.generateSessionId(), u = localStorage.getItem("lens_service_user_id") || "default_user";
      if (t)
        l = await this.openAI.chatCompletionWithImage(
          e || "請分析這張圖片並回答問題",
          t,
          ((r = this.conversationState) == null ? void 0 : r.messages.slice(0, -1)) || []
          // 不包含剛添加的用戶訊息
        );
      else {
        const y = await this.agent.processMessage(
          e,
          ((s = this.conversationState) == null ? void 0 : s.messages) || [],
          h,
          u
        );
        l = y.response, c = y.sources, p = y.needsHumanReply;
      }
      const m = {
        role: "assistant",
        content: l,
        timestamp: Date.now(),
        sources: c
      };
      (a = this.conversationState) == null || a.messages.push(m), this.panel.addMessage(m), this.saveConversationState(), await this.saveConversationToDatabase(h, u);
    } catch (l) {
      console.error("Error processing message:", l);
      const c = {
        role: "assistant",
        content: `抱歉，發生錯誤：${l instanceof Error ? l.message : "未知錯誤"}`,
        timestamp: Date.now()
      };
      this.panel.addMessage(c);
    }
  }
  /**
   * 保存對話記錄到資料庫
   */
  async saveConversationToDatabase(e, t) {
    if (this.conversationState)
      try {
        if (!(await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: t,
            conversationId: e,
            messages: this.conversationState.messages
          })
        })).ok)
          throw new Error("Failed to save conversation");
        console.log("✅ Conversation saved to database");
      } catch (n) {
        console.error("Failed to save conversation to database:", n);
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
   * 打開管理後台
   */
  openAdminPanel() {
    this.adminPanel && this.adminPanel.open().catch(console.error);
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
    return N.searchInCurrentPage(e).map((n) => ({
      text: n.text,
      context: n.context
    }));
  }
  /**
   * 獲取當前頁面內容
   */
  getCurrentPageContent() {
    return N.extractCurrentPageContent();
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
   * 創建浮動圖標
   */
  createFloatingIcon() {
    var o, i;
    this.floatingIcon && this.floatingIcon.remove();
    const e = (i = (o = this.config) == null ? void 0 : o.ui) == null ? void 0 : i.iconPosition;
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
    const n = `
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
    this.floatingIcon.style.cssText = n, this.floatingIcon.addEventListener("mouseenter", () => {
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
      const n = document.querySelector(".lens-hover-highlight");
      n && n.classList.remove("lens-hover-highlight"), t.classList.add("lens-hover-highlight");
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
    this.hoverHandler && (document.removeEventListener("mouseover", this.hoverHandler), this.hoverHandler = null), this.mouseLeaveHandler && (document.removeEventListener("mouseleave", this.mouseLeaveHandler), this.mouseLeaveHandler = null), document.querySelectorAll(".lens-hover-highlight").forEach((n) => n.classList.remove("lens-hover-highlight"));
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
      const n = window.html2canvas, o = e.style.cssText;
      e.style.cssText += "; outline: 3px solid #007bff; outline-offset: 2px;", await new Promise((s) => setTimeout(s, 100));
      const i = await n(e, {
        backgroundColor: "#ffffff",
        scale: 1,
        logging: !1,
        useCORS: !0,
        allowTaint: !0
      });
      e.style.cssText = o;
      const r = i.toDataURL("image/png");
      this.panel && this.panel.setScreenshotInInput(r), console.log("✅ Screenshot captured and added to input");
    } catch (n) {
      console.error("❌ Failed to capture screenshot:", n), (t = this.panel) == null || t.addMessage({
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
      const n = document.createElement("script");
      n.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", n.onload = () => e(), n.onerror = () => t(new Error("Failed to load html2canvas")), document.head.appendChild(n);
    });
  }
  /**
   * 發送截圖到 AI 進行分析
   */
  async sendScreenshotToAI(e, t) {
    var n, o, i;
    try {
      if (!this.openAI)
        throw new Error("OpenAI service not initialized");
      const r = {
        tagName: t.tagName,
        className: t.className,
        id: t.id,
        textContent: ((n = t.textContent) == null ? void 0 : n.substring(0, 200)) || "",
        attributes: Array.from(t.attributes).map((l) => `${l.name}="${l.value}"`).join(" ")
      }, s = `
用戶截取了網頁上的一個元素，請分析這個截圖並提供相關說明。

元素信息：
- 標籤：${r.tagName}
- 類名：${r.className}
- ID：${r.id}
- 文本內容：${r.textContent}
- 屬性：${r.attributes}

請分析截圖內容並提供有用的信息或建議。
      `.trim(), a = await this.openAI.sendVisionMessage(s, e);
      (o = this.panel) == null || o.addMessage({
        id: Date.now().toString(),
        content: `📸 **截圖分析結果：**

${a}`,
        role: "assistant",
        timestamp: Date.now()
      });
    } catch (r) {
      console.error("❌ Failed to send screenshot to AI:", r), (i = this.panel) == null || i.addMessage({
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
}
const ie = new oe();
typeof window < "u" && (window.LensService = ie);
export {
  ie as default
};

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/DatabaseService.ts
var DatabaseService_exports = {};
__export(DatabaseService_exports, {
  DatabaseService: () => DatabaseService
});
var API_BASE_URL, DatabaseService;
var init_DatabaseService = __esm({
  "src/services/DatabaseService.ts"() {
    "use strict";
    API_BASE_URL = "/api/widget";
    DatabaseService = class {
      static initialized = false;
      static async initializePool() {
        if (this.initialized) {
          return;
        }
        console.log("\u2705 Database service initialized (API mode)");
        this.initialized = true;
      }
      static async query(sql, params = []) {
        try {
          console.log("\u{1F50D} Query (via API):", sql, params);
          return [];
        } catch (error) {
          console.error("\u274C Database query error:", error);
          throw error;
        }
      }
      static async initializeTables() {
        console.log("\u2705 Tables already initialized in PostgreSQL");
      }
      // Helper method for API calls
      static async apiCall(endpoint, options = {}) {
        try {
          const token = localStorage.getItem("auth_token");
          const response = await fetch(API_BASE_URL + endpoint, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              ...token ? { "Authorization": `Bearer ${token}` } : {},
              ...options.headers
            }
          });
          if (!response.ok) {
            throw new Error("API call failed: " + response.statusText);
          }
          return await response.json();
        } catch (error) {
          console.error("\u274C API call failed for " + endpoint + ":", error);
          throw error;
        }
      }
      // ==================== Settings ====================
      static async getSettings() {
        try {
          return await this.apiCall("/settings");
        } catch (error) {
          console.error("Failed to get settings:", error);
          return [];
        }
      }
      static async getSetting(key) {
        try {
          const response = await this.apiCall("/settings/" + key);
          return response.value;
        } catch (error) {
          console.error("Failed to get setting " + key + ":", error);
          return null;
        }
      }
      static async setSetting(key, value) {
        try {
          await this.apiCall("/settings/" + key, {
            method: "PUT",
            body: JSON.stringify({ value })
          });
        } catch (error) {
          console.error("Failed to set setting " + key + ":", error);
          throw error;
        }
      }
      // ==================== Admin Users ====================
      static async getAdminUsers() {
        try {
          return await this.apiCall("/admin-users");
        } catch (error) {
          console.error("Failed to get admin users:", error);
          return [];
        }
      }
      static async validateAdmin(username, password) {
        try {
          return await this.apiCall("/admin-users/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
          });
        } catch (error) {
          console.error("Admin validation failed:", error);
          return null;
        }
      }
      static async createAdminUser(username, password, email) {
        await this.apiCall("/admin-users", {
          method: "POST",
          body: JSON.stringify({ username, password, email })
        });
      }
      static async deleteAdminUser(id) {
        await this.apiCall("/admin-users/" + id, {
          method: "DELETE"
        });
      }
      // ==================== Manual Indexes ====================
      static async getManualIndexes() {
        try {
          return await this.apiCall("/manual-indexes");
        } catch (error) {
          console.error("Failed to get manual indexes:", error);
          return [];
        }
      }
      static async createManualIndex(name, description, content, url, keywords) {
        await this.apiCall("/manual-indexes", {
          method: "POST",
          body: JSON.stringify({ name, description, content, url, keywords })
        });
      }
      static async updateManualIndex(id, name, description, content, url, keywords) {
        await this.apiCall("/manual-indexes/" + id, {
          method: "PUT",
          body: JSON.stringify({ name, description, content, url, keywords })
        });
      }
      static async deleteManualIndex(id) {
        await this.apiCall("/manual-indexes/" + id, {
          method: "DELETE"
        });
      }
      static async generateAllEmbeddings() {
        try {
          return await this.apiCall("/manual-indexes/generate-embeddings", {
            method: "POST"
          });
        } catch (error) {
          console.error("Failed to generate embeddings:", error);
          throw error;
        }
      }
      static async importUrlsBatch(urls) {
        try {
          return await this.apiCall("/manual-indexes/import-urls-batch", {
            method: "POST",
            body: JSON.stringify({ urls })
          });
        } catch (error) {
          console.error("Failed to import URLs:", error);
          throw error;
        }
      }
      // ==================== Orders & Subscriptions ====================
      static async getUserOrders(userId) {
        try {
          const response = await this.apiCall(`/orders/me`);
          return response.orders || [];
        } catch (error) {
          console.error("Failed to get user orders:", error);
          return [];
        }
      }
      static async getUserSubscriptions(userId) {
        try {
          const response = await this.apiCall(`/subscriptions/me`);
          return response.subscriptions || [];
        } catch (error) {
          console.error("Failed to get user subscriptions:", error);
          return [];
        }
      }
      // ==================== Conversations ====================
      static async saveConversation(conversation_id, user_id, messages) {
        try {
          await this.apiCall("/conversations/save", {
            method: "POST",
            body: JSON.stringify({ conversationId: conversation_id, messages })
          });
          console.log("\u2705 Conversation saved to database:", conversation_id);
        } catch (error) {
          console.error("Failed to save conversation:", error);
          throw error;
        }
      }
      static async getConversation(conversation_id) {
        try {
          return await this.apiCall("/conversations/" + conversation_id);
        } catch (error) {
          console.error("Failed to get conversation:", error);
          return null;
        }
      }
      static async getAllConversations() {
        try {
          return await this.apiCall("/conversations");
        } catch (error) {
          console.error("Failed to get conversations:", error);
          return [];
        }
      }
      static async getConversations() {
        return await this.getAllConversations();
      }
      static async deleteConversation(conversation_id) {
        await this.apiCall("/conversations/" + conversation_id, {
          method: "DELETE"
        });
      }
      static async getConversationsByUserId(user_id) {
        try {
          return await this.apiCall("/conversations/user/" + user_id);
        } catch (error) {
          console.error("Failed to get conversations by user_id:", error);
          return [];
        }
      }
    };
  }
});

// src/services/ContentExtractorService.ts
import axios from "axios";
import * as cheerio from "cheerio";
var pdfParse = null;
async function loadPdfParse() {
  if (pdfParse) return pdfParse;
  try {
    const pdfParseModule = await import("pdf-parse");
    if (typeof pdfParseModule === "function") {
      pdfParse = pdfParseModule;
    } else if (pdfParseModule.default && typeof pdfParseModule.default === "function") {
      pdfParse = pdfParseModule.default;
    } else {
      console.warn("pdf-parse module structure not recognized");
    }
  } catch (e) {
    console.warn("pdf-parse not available, PDF processing will be limited:", e);
  }
  return pdfParse;
}
var ContentExtractorService = class {
  MAX_CHUNK_SIZE = 2e3;
  MIN_CHUNK_SIZE = 500;
  /**
   * 從 URL 提取內容
   */
  async extractFromUrl(url) {
    const fileType = this.detectFileType(url);
    try {
      const response = await axios.get(url, {
        responseType: fileType === "pdf" ? "arraybuffer" : "text",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 3e4
      });
      switch (fileType) {
        case "pdf":
          return await this.extractFromPDF(response.data, url);
        case "html":
          return this.extractFromHTML(response.data, url);
        case "txt":
          return this.extractFromText(response.data, url);
        default:
          return this.extractFromText(response.data, url);
      }
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }
  /**
   * 檢測文件類型
   */
  detectFileType(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith(".pdf") || urlLower.includes("arxiv.org/pdf")) {
      return "pdf";
    }
    if (urlLower.endsWith(".txt")) {
      return "txt";
    }
    if (urlLower.endsWith(".html") || urlLower.endsWith(".htm")) {
      return "html";
    }
    return "html";
  }
  /**
   * 從 HTML 提取內容（使用 Cheerio）
   */
  extractFromHTML(html, url) {
    const $ = cheerio.load(html);
    $("script, style, nav, header, footer, aside, .advertisement, .ads").remove();
    const title = $("title").text().trim() || $('meta[property="og:title"]').attr("content") || $("h1").first().text().trim() || "Untitled";
    const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
    const keywordsStr = $('meta[name="keywords"]').attr("content") || "";
    const keywords = keywordsStr.split(",").map((k) => k.trim()).filter((k) => k);
    const author = $('meta[name="author"]').attr("content") || $('meta[property="article:author"]').attr("content");
    const publishDate = $('meta[property="article:published_time"]').attr("content") || $('meta[name="publish-date"]').attr("content");
    let mainContent = "";
    const mainSelectors = ["article", "main", '[role="main"]', ".content", ".post-content", "#content"];
    let $main = null;
    for (const selector of mainSelectors) {
      $main = $(selector).first();
      if ($main.length > 0) break;
    }
    if (!$main || $main.length === 0) {
      $main = $("body");
    }
    mainContent = $main.text();
    mainContent = this.cleanText(mainContent);
    return {
      title,
      description: description || title,
      keywords,
      content: mainContent,
      metadata: {
        url,
        fileType: "html",
        author,
        publishDate
      }
    };
  }
  /**
   * 從 PDF 提取內容
   */
  async extractFromPDF(buffer, url) {
    const parser = await loadPdfParse();
    if (!parser) {
      throw new Error("PDF parsing is not available. Please install pdf-parse package.");
    }
    try {
      const data = await parser(buffer);
      const title = data.info?.Title || "PDF Document";
      const author = data.info?.Author;
      const content = this.cleanText(data.text);
      const lines = content.split("\n").filter((l) => l.trim());
      const description = lines.slice(0, 3).join(" ").substring(0, 200);
      return {
        title,
        description,
        keywords: [],
        content,
        metadata: {
          url,
          fileType: "pdf",
          author,
          pages: data.numpages
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
  /**
   * 從純文本提取內容
   */
  extractFromText(text, url) {
    const content = this.cleanText(text);
    const lines = content.split("\n").filter((l) => l.trim());
    const title = lines[0]?.substring(0, 100) || "Text Document";
    const description = lines.slice(0, 3).join(" ").substring(0, 200);
    return {
      title,
      description,
      keywords: [],
      content,
      metadata: {
        url,
        fileType: "txt"
      }
    };
  }
  /**
   * 清理文本
   */
  cleanText(text) {
    return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
  }
  /**
   * 結構化切 Chunk
   */
  async chunkContent(extracted) {
    const { title, description, content, metadata } = extracted;
    const documentTree = this.parseDocumentStructure(content);
    const chunks = this.splitByStructure(documentTree, title);
    return chunks.map((chunk, index) => ({
      name: chunks.length > 1 ? `${title} (Part ${index + 1}/${chunks.length})` : title,
      description: `${description} - ${chunk.headingPath.join(" > ")}`,
      content: chunk.content,
      metadata: {
        chunk: index + 1,
        totalChunks: chunks.length,
        headingPath: chunk.headingPath,
        originalUrl: metadata.url,
        fileType: metadata.fileType
      }
    }));
  }
  /**
   * 解析文檔結構
   */
  parseDocumentStructure(content) {
    const lines = content.split("\n");
    const nodes = [];
    let currentParagraph = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentParagraph) {
          nodes.push({
            type: "paragraph",
            text: currentParagraph.trim()
          });
          currentParagraph = "";
        }
        continue;
      }
      const isHeading = this.isLikelyHeading(trimmed);
      if (isHeading) {
        if (currentParagraph) {
          nodes.push({
            type: "paragraph",
            text: currentParagraph.trim()
          });
          currentParagraph = "";
        }
        const level = this.detectHeadingLevel(trimmed);
        nodes.push({
          type: "heading",
          level,
          text: trimmed.replace(/^#+\s*/, "")
          // 移除 markdown 標記
        });
      } else {
        currentParagraph += (currentParagraph ? " " : "") + trimmed;
      }
    }
    if (currentParagraph) {
      nodes.push({
        type: "paragraph",
        text: currentParagraph.trim()
      });
    }
    return nodes;
  }
  /**
   * 檢測是否像標題
   */
  isLikelyHeading(text) {
    if (/^#{1,6}\s/.test(text)) return true;
    if (text.length < 80 && !/[.!?。！？]$/.test(text)) {
      if (text === text.toUpperCase() || /^[A-Z]/.test(text)) {
        return true;
      }
    }
    return false;
  }
  /**
   * 檢測標題層級
   */
  detectHeadingLevel(text) {
    const match = text.match(/^(#{1,6})\s/);
    if (match) {
      return match[1].length;
    }
    if (text === text.toUpperCase()) return 1;
    if (text.length < 30) return 2;
    return 3;
  }
  /**
   * 按結構切分（改進版：確保每個 chunk 都包含完整的標題層級）
   */
  splitByStructure(nodes, rootTitle) {
    const chunks = [];
    let currentChunk = "";
    let currentHeadings = [rootTitle];
    let headingStack = [];
    const rebuildHeadingContext = () => {
      return headingStack.map((h) => h.text).join("\n\n") + "\n\n";
    };
    for (const node of nodes) {
      if (node.type === "heading") {
        const level = node.level || 1;
        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }
        headingStack.push({ level, text: node.text });
        currentHeadings = [rootTitle, ...headingStack.map((h) => h.text)];
        if (currentChunk.length > this.MAX_CHUNK_SIZE) {
          chunks.push({
            content: currentChunk.trim(),
            headingPath: [...currentHeadings]
          });
          currentChunk = rebuildHeadingContext();
        }
        currentChunk += `${node.text}

`;
      } else if (node.type === "paragraph") {
        const newContent = currentChunk + node.text + "\n\n";
        if (newContent.length > this.MAX_CHUNK_SIZE && currentChunk.length > this.MIN_CHUNK_SIZE) {
          chunks.push({
            content: currentChunk.trim(),
            headingPath: [...currentHeadings]
          });
          currentChunk = rebuildHeadingContext() + node.text + "\n\n";
        } else {
          currentChunk = newContent;
        }
      }
    }
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        headingPath: [...currentHeadings]
      });
    }
    return chunks;
  }
};

// src/server.ts
init_DatabaseService();

// src/services/HybridSearchService.ts
import axios2 from "axios";
var HybridSearchService = class {
  /**
   * Generate embedding using Azure OpenAI
   */
  static async generateEmbedding(text) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Azure OpenAI configuration missing");
    }
    const url = `${endpoint}openai/deployments/${deployment}/embeddings?api-version=2023-05-15`;
    const response = await axios2.post(
      url,
      { input: text.substring(0, 8e3) },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        }
      }
    );
    return response.data.data[0].embedding;
  }
  /**
   * Perform hybrid search (Vector + BM25)
   */
  static async search(options) {
    const { query, limit = 3, type, minScore = 0.15 } = options;
    try {
      const isBrowser = typeof window !== "undefined";
      const apiUrl = isBrowser ? "" : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await axios2.post(`${apiUrl}/api/widget/manual-indexes/search`, {
        query,
        limit,
        type,
        minScore
      });
      if (response.data.success) {
        return response.data.results;
      } else {
        console.error("Hybrid search API error:", response.data.error);
        return [];
      }
    } catch (error) {
      console.error("Error performing hybrid search:", error);
      throw error;
    }
  }
  /**
   * Search only in manual indexes
   */
  static async searchManual(query, limit = 5) {
    return this.search({ query, limit, type: "manual" });
  }
  /**
   * Search only in URL knowledge base
   */
  static async searchURL(query, limit = 5) {
    return this.search({ query, limit, type: "url" });
  }
};

// src/services/ManualIndexService.ts
init_DatabaseService();
import axios3 from "axios";
var ManualIndexService = class {
  static generateFingerprint(text) {
    return Buffer.from(text).toString("base64").substring(0, 64);
  }
  static async generateEmbedding(text) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Azure OpenAI configuration missing");
    }
    const url = endpoint + "/openai/deployments/" + deployment + "/embeddings?api-version=2023-05-15";
    const response = await axios3.post(
      url,
      { input: text.substring(0, 8e3) },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        }
      }
    );
    return response.data.data[0].embedding;
  }
  static async getAll() {
    return await DatabaseService.getManualIndexes();
  }
  static async getAllURLs() {
    const indexes = await DatabaseService.getManualIndexes();
    return indexes.filter((index) => index.type === "url");
  }
  static async getById(id) {
    const indexes = await DatabaseService.getManualIndexes();
    return indexes.find((index) => index.id === id) || null;
  }
  static async create(data) {
    await DatabaseService.createManualIndex(
      data.title,
      data.description || "",
      data.content,
      data.url
    );
    const indexes = await DatabaseService.getManualIndexes();
    const created = indexes.find((index) => index.name === data.title);
    if (!created) {
      throw new Error("Failed to create manual index");
    }
    return created;
  }
  static async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Manual index not found");
    }
    await DatabaseService.updateManualIndex(
      id,
      data.title || existing.name,
      data.description || existing.description || "",
      data.content || existing.content,
      data.url || existing.url
    );
    return await this.getById(id);
  }
  static async delete(id) {
    await DatabaseService.deleteManualIndex(id);
    return true;
  }
  static async search(query, limit = 3, minScore = 0.15) {
    console.log(`\u{1F50D} ManualIndexService.search() using Hybrid Search (limit=${limit}, minScore=${minScore})`);
    const results = await HybridSearchService.search({ query, limit, minScore });
    console.log("\u2705 Found", results.length, "results");
    return results;
  }
};

// src/services/ConversationService.ts
init_DatabaseService();
var ConversationService = class {
  static CONVERSATIONS_KEY = "sm_conversations";
  static CURRENT_CONVERSATION_KEY = "sm_current_conversation";
  /**
   * 獲取當前對話
   * 如果沒有活躍對話，創建新對話
   */
  static async getCurrentConversation() {
    const currentId = localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
    if (currentId) {
      const conversation = await this.getConversationById(currentId);
      if (conversation && conversation.status === "active") {
        return conversation;
      }
    }
    return await this.createNewConversation();
  }
  /**
   * 創建新對話
   */
  static async createNewConversation() {
    const userId = typeof localStorage !== "undefined" ? localStorage.getItem("lens_service_user_id") || "anonymous" : "anonymous";
    const conversationId = this.generateConversationId();
    const conversation = {
      id: conversationId,
      userId,
      messages: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      status: "active",
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    };
    await this.saveConversation(conversation);
    localStorage.setItem(this.CURRENT_CONVERSATION_KEY, conversationId);
    console.log("Created new conversation:", conversationId);
    return conversation;
  }
  /**
   * 添加訊息到當前對話
   */
  static async addMessage(role, content, imageBase64, metadata) {
    const conversation = await this.getCurrentConversation();
    const message = {
      id: this.generateMessageId(),
      conversationId: conversation.id,
      role,
      content,
      imageBase64,
      timestamp: Date.now(),
      metadata
    };
    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();
    await this.saveConversation(conversation);
    return message;
  }
  /**
   * 獲取當前對話的所有訊息
   */
  static async getMessages() {
    const conversation = await this.getCurrentConversation();
    return conversation.messages;
  }
  /**
   * 關閉當前對話
   */
  static async closeCurrentConversation() {
    const conversation = await this.getCurrentConversation();
    conversation.status = "closed";
    await this.saveConversation(conversation);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
  /**
   * 獲取所有對話（用於後台）
   */
  static async getAllConversations() {
    try {
      const conversations = await DatabaseService.getConversations();
      return conversations.map((conv) => ({
        id: conv.id,
        userId: conv.user_id || "unknown",
        messages: conv.messages || [],
        startedAt: new Date(conv.created_at).getTime(),
        lastMessageAt: new Date(conv.updated_at).getTime(),
        status: "active",
        metadata: {}
      }));
    } catch (e) {
      console.error("Failed to load conversations:", e);
      return [];
    }
  }
  /**
   * 根據 ID 獲取對話
   */
  static async getConversationById(id) {
    const conversations = await this.getAllConversations();
    return conversations.find((c) => c.id === id) || null;
  }
  /**
   * 根據用戶 ID 獲取對話
   */
  static async getConversationsByUserId(userId) {
    try {
      const conversations = await DatabaseService.getConversationsByUserId(userId);
      return conversations.map((conv) => ({
        id: conv.conversation_id,
        userId: conv.user_id || "unknown",
        messages: conv.messages || [],
        startedAt: new Date(conv.created_at).getTime(),
        lastMessageAt: new Date(conv.updated_at).getTime(),
        status: "active",
        metadata: {}
      }));
    } catch (e) {
      console.error("Failed to load conversations by user_id:", e);
      return [];
    }
  }
  /**
   * 保存對話
   */
  static async saveConversation(conversation) {
    try {
      await DatabaseService.saveConversation(conversation.id, conversation.userId, conversation.messages);
      console.log("\u2705 Conversation saved to database");
    } catch (error) {
      console.error("\u274C Error saving conversation:", error);
    }
    const conversations = [];
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id);
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
    localStorage.setItem(this.CURRENT_CONVERSATION_KEY, conversation.id);
  }
  /**
   * 人工接管對話
   */
  static async takeoverConversation(conversationId, agentId) {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return;
    conversation.status = "human-takeover";
    conversation.humanAgentId = agentId;
    await this.saveConversation(conversation);
  }
  /**
   * 添加人工回覆
   */
  static async addHumanReply(conversationId, content, agentId) {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    const message = {
      id: this.generateMessageId(),
      conversationId,
      role: "human-agent",
      content,
      timestamp: Date.now(),
      metadata: {
        agentId
      }
    };
    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();
    await this.saveConversation(conversation);
    return message;
  }
  /**
   * 檢查是否有新訊息（用於輪詢）
   */
  static async hasNewMessages(conversationId, lastMessageId) {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return false;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage && lastMessage.id !== lastMessageId;
  }
  /**
   * 獲取新訊息（用於輪詢）
   */
  static async getNewMessages(conversationId, lastMessageId) {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return [];
    const lastIndex = conversation.messages.findIndex((m) => m.id === lastMessageId);
    if (lastIndex < 0) return [];
    return conversation.messages.slice(lastIndex + 1);
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
    localStorage.removeItem(this.CONVERSATIONS_KEY);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
};

// src/services/UserService.ts
var UserService = class {
  /**
   * 檢查是否已登入（檢查是否有 JWT token）
   */
  static isAuthenticated() {
    if (typeof localStorage === "undefined") return false;
    const token = localStorage.getItem("auth_token");
    return !!token;
  }
  /**
   * 清除認證資訊（登出時調用）
   */
  static clearAuth() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem("auth_token");
  }
};

// src/services/ConfigService.ts
init_DatabaseService();
var ConfigService = class {
  static STORAGE_KEY = "lens-service-config";
  static DEFAULT_CONFIG = {
    searchMode: {
      projectSearch: true,
      siteSearch: false
    },
    toolDescriptions: {
      projectSearch: "\u641C\u5C0B\u7576\u524D\u5C08\u6848\u7684\u6240\u6709\u9801\u9762\u5167\u5BB9\u3002\u9069\u7528\u65BC\u8A62\u554F\u672C\u5C08\u6848\u76F8\u95DC\u7684\u554F\u984C\u3002",
      siteSearch: "\u641C\u5C0B\u6574\u500B\u7DB2\u7AD9\u7684\u6240\u6709\u9801\u9762\u5167\u5BB9\uFF08\u57FA\u65BC sitemap\uFF09\u3002\u9069\u7528\u65BC\u8A62\u554F\u7DB2\u7AD9\u6574\u9AD4\u8CC7\u8A0A\u7684\u554F\u984C\u3002"
    },
    autoRefresh: {
      enabled: false,
      interval: 864e5
      // 24 小時
    }
  };
  /**
   * 獲取配置
   */
  static getConfig() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return { ...this.DEFAULT_CONFIG, ...config };
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
    return { ...this.DEFAULT_CONFIG };
  }
  /**
   * 儲存配置
   */
  static saveConfig(config) {
    try {
      const current = this.getConfig();
      const updated = { ...current, ...config };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save config:", error);
      throw error;
    }
  }
  /**
   * 更新 Azure OpenAI 配置
   */
  static updateAzureOpenAI(config) {
    this.saveConfig({ azureOpenAI: config });
  }
  /**
   * 更新搜尋模式
   */
  static updateSearchMode(mode) {
    this.saveConfig({ searchMode: mode });
  }
  /**
   * 更新 Tool Descriptions
   */
  static updateToolDescriptions(descriptions) {
    this.saveConfig({ toolDescriptions: descriptions });
  }
  /**
   * 更新網站配置
   */
  static updateSiteConfig(config) {
    this.saveConfig({ siteConfig: config });
  }
  /**
   * 更新自動刷新設定
   */
  static updateAutoRefresh(enabled, interval) {
    this.saveConfig({
      autoRefresh: { enabled, interval }
    });
  }
  /**
   * 更新最後更新時間
   */
  static updateLastUpdated(type) {
    const config = this.getConfig();
    const lastUpdated = config.lastUpdated || {};
    lastUpdated[type] = Date.now();
    this.saveConfig({ lastUpdated });
  }
  /**
   * 重置所有配置
   */
  static reset() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem("lens-service-site-index");
      localStorage.removeItem("lens-service-project-index");
      console.log("Config reset successfully");
    } catch (error) {
      console.error("Failed to reset config:", error);
      throw error;
    }
  }
  /**
   * 檢查是否已配置 Azure OpenAI
   */
  static hasAzureOpenAI() {
    const config = this.getConfig();
    return !!(config.azureOpenAI?.endpoint && config.azureOpenAI?.apiKey && config.azureOpenAI?.deployment);
  }
  /**
   * 檢查是否已配置網站索引
   */
  static hasSiteConfig() {
    const config = this.getConfig();
    return !!(config.siteConfig?.sitemapUrl || config.siteConfig?.domains);
  }
  /**
   * 獲取啟用的搜尋工具
   */
  static getEnabledSearchTools() {
    const config = this.getConfig();
    const tools = [];
    if (config.searchMode.projectSearch) {
      tools.push("search_project");
    }
    if (config.searchMode.siteSearch) {
      tools.push("search_site");
    }
    return tools;
  }
  /**
   * 導出配置（用於備份）
   */
  static exportConfig() {
    const config = this.getConfig();
    return JSON.stringify(config, null, 2);
  }
  /**
   * 導入配置（用於還原）
   */
  static importConfig(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      this.saveConfig(config);
    } catch (error) {
      console.error("Failed to import config:", error);
      throw new Error("Invalid config format");
    }
  }
  /**
   * 獲取系統設定
   */
  static async getSystemSettings() {
    try {
      return await DatabaseService.getSettings();
    } catch (error) {
      console.error("Failed to get system settings:", error);
      return [];
    }
  }
  /**
   * 獲取單個系統設定
   */
  static async getSystemSetting(key) {
    try {
      return await DatabaseService.getSetting(key);
    } catch (error) {
      console.error("Failed to get system setting:", error);
      return null;
    }
  }
  /**
   * 設置系統設定
   */
  static async setSystemSetting(key, value) {
    try {
      await DatabaseService.setSetting(key, value);
      console.log("System setting updated:", key);
    } catch (error) {
      console.error("Failed to set system setting:", error);
      throw error;
    }
  }
};

// src/services/KnowledgeBaseService.ts
import axios4 from "axios";
import * as cheerio2 from "cheerio";
var KnowledgeBaseService = class {
  static CHUNK_SIZE = 500;
  static CHUNK_OVERLAP = 50;
  static generateFingerprint(content) {
    return Buffer.from(content).toString("base64").substring(0, 64);
  }
  static detectFileType(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith(".pdf")) return "pdf";
    if (urlLower.endsWith(".docx") || urlLower.endsWith(".doc")) return "docx";
    if (urlLower.endsWith(".xlsx") || urlLower.endsWith(".xls")) return "excel";
    if (urlLower.endsWith(".csv")) return "csv";
    if (urlLower.endsWith(".txt")) return "text";
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
    if (urlLower.match(/\.(mp4|avi|mov|wmv)$/)) return "video";
    return "webpage";
  }
  static splitIntoChunks(text) {
    const chunks = [];
    let startIndex = 0;
    let chunkIndex = 0;
    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);
      const chunk = text.substring(startIndex, endIndex);
      chunks.push({
        content: chunk.trim(),
        index: chunkIndex
      });
      startIndex += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
      chunkIndex++;
    }
    return chunks.filter((chunk) => chunk.content.length > 0);
  }
  static async generateEmbedding(text) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    if (!endpoint || !apiKey || !deployment) {
      throw new Error("Azure OpenAI configuration missing");
    }
    const url = endpoint + "/openai/deployments/" + deployment + "/embeddings?api-version=2023-05-15";
    const response = await axios4.post(
      url,
      { input: text.substring(0, 8e3) },
      { headers: { "Content-Type": "application/json", "api-key": apiKey } }
    );
    return response.data.data[0].embedding;
  }
  static async fetchURLContent(url, fileType) {
    const response = await axios4.get(url, {
      timeout: 3e4,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (fileType === "webpage" || fileType === "text") {
      if (typeof response.data === "string") {
        const $ = cheerio2.load(response.data);
        $("script, style, nav, footer, header").remove();
        const text = $("body").text().trim();
        return text.replace(/\s+/g, " ").substring(0, 5e4);
      }
      return response.data.substring(0, 5e4);
    }
    return "[" + fileType.toUpperCase() + " file: " + url + "]";
  }
  static async processURL(id, url, fileType) {
    try {
      console.warn("processURL not yet implemented in API mode");
      return;
    } catch (error) {
      console.error("\u274C Error processing URL: " + url, error);
    }
  }
  static async addUrl(url, fileType, name) {
    console.warn("addUrl not yet implemented in API mode");
    throw new Error("Not implemented");
  }
  static async getFiles() {
    console.warn("getFiles not yet implemented in API mode");
    return [];
  }
  static async deleteFile(id) {
    console.warn("deleteFile not yet implemented in API mode");
  }
  static async removeInvalidUrls() {
    console.warn("removeInvalidUrls not yet implemented in API mode");
    return 0;
  }
  static async refreshFile(id) {
    console.warn("refreshFile not yet implemented in API mode");
  }
  static async batchAddUrls(urls) {
    const results = [];
    for (const url of urls) {
      try {
        const file = await this.addUrl(url.trim());
        results.push(file);
      } catch (error) {
        console.error("Error adding URL: " + url, error);
      }
    }
    return results;
  }
  static parseBatchImportText(text) {
    return text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  }
  static async refreshAll() {
    const files = await this.getFiles();
    for (const file of files) {
      if (file.url) {
        await this.refreshFile(file.id).catch(console.error);
      }
    }
  }
  static getFileTypeText(fileType) {
    const types = {
      webpage: "\u7DB2\u9801",
      pdf: "PDF",
      docx: "Word",
      excel: "Excel",
      csv: "CSV",
      text: "\u6587\u5B57",
      image: "\u5716\u7247",
      video: "\u5F71\u7247"
    };
    return types[fileType] || fileType;
  }
  static getStatusText(status) {
    const statuses = {
      pending: '<span style="color: #f59e0b;">\u23F3 \u7B49\u5F85\u8655\u7406</span>',
      processing: '<span style="color: #3b82f6;">\u2699\uFE0F \u8655\u7406\u4E2D</span>',
      active: '<span style="color: #10b981;">\u2705 \u6B63\u5E38</span>',
      error: '<span style="color: #ef4444;">\u274C \u932F\u8AA4</span>',
      invalid: '<span style="color: #6b7280;">\u26A0\uFE0F \u5931\u6548</span>'
    };
    return statuses[status] || `<span style="color: #6b7280;">${status}</span>`;
  }
  static formatTime(date) {
    return new Date(date).toLocaleString("zh-TW");
  }
};

// src/services/CustomerServiceManager.ts
var CustomerServiceManager = class {
  /**
   * 獲取所有對話列表
   */
  static async getAllConversations() {
    try {
      const { DatabaseService: DatabaseService2 } = await Promise.resolve().then(() => (init_DatabaseService(), DatabaseService_exports));
      await DatabaseService2.initializePool();
      const conversations = await DatabaseService2.getConversations();
      return Array.isArray(conversations) ? conversations : [];
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  }
  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(id) {
    try {
      const { DatabaseService: DatabaseService2 } = await Promise.resolve().then(() => (init_DatabaseService(), DatabaseService_exports));
      await DatabaseService2.initializePool();
      return await DatabaseService2.getConversation(id);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      return null;
    }
  }
  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(conversationId, content, agentName = "\u5BA2\u670D") {
    try {
      const adminId = localStorage.getItem("lens_admin_user_id") || "admin";
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content,
          adminId,
          adminName: agentName
        })
      });
      if (!response.ok) {
        console.error("Failed to add reply:", await response.text());
        return false;
      }
      const result = await response.json();
      console.log("\u2705 Admin reply added:", result);
      return true;
    } catch (error) {
      console.error("Failed to add customer service reply:", error);
      return false;
    }
  }
  /**
   * 刪除對話
   */
  static async deleteConversation(id) {
    try {
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        console.error("Failed to delete conversation:", await response.text());
        return false;
      }
      console.log("\u2705 Conversation deleted:", id);
      return true;
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      return false;
    }
  }
  /**
   * 標記對話為已處理
   */
  static async markConversationAsHandled(id) {
    try {
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "handled",
          handledAt: Date.now()
        })
      });
      if (!response.ok) {
        console.error("Failed to mark conversation as handled:", await response.text());
        return false;
      }
      console.log("\u2705 Conversation marked as handled:", id);
      return true;
    } catch (error) {
      console.error("Failed to mark conversation as handled:", error);
      return false;
    }
  }
  /**
   * 獲取待處理的對話數量
   */
  static async getPendingConversationsCount() {
    try {
      const conversations = await this.getAllConversations();
      return conversations.filter((conv) => conv.status === "active").length;
    } catch (error) {
      console.error("Failed to get pending conversations count:", error);
      return 0;
    }
  }
};
export {
  ConfigService,
  ContentExtractorService,
  ConversationService,
  CustomerServiceManager,
  DatabaseService,
  HybridSearchService,
  KnowledgeBaseService,
  ManualIndexService,
  UserService
};

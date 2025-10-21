export interface ServiceModulerConfig {
  // 用戶 ID（從登入系統傳入）
  userId?: string;

  // 保持向後兼容
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
    embeddingDeployment?: string;
    apiVersion?: string;
    embeddingApiVersion?: string;
  };

  // 新版：LLM API 配置（分離）
  llmAPI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
    apiVersion?: string;
  };

  // 新版：Embedding API 配置（分離）
  embeddingAPI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
    apiVersion?: string;
  };

  // Telegram 通報配置
  telegram?: {
    botToken: string;
    chatId: string;
  };

  // 資料庫配置
  database?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };

  // 網站配置
  siteConfig?: {
    // 本地專案模式（默認啟用）
    localMode?: boolean;         // 默認 true，索引當前專案所有頁面

    // 遠程域名配置（附加功能，需要在後台配置）
    remoteDomains?: Array<{
      domain: string;            // 主域名，如 'ask-lens.ai'
      subdomains?: string[];     // 包含的子域名，如 ['quant', 'audio']
      excludeSubdomains?: string[];  // 排除的子域名
      enabled?: boolean;         // 是否啟用
    }>;

    // 路徑過濾
    includePaths?: string[];     // 包含的路徑
    excludePaths?: string[];     // 排除的路徑
  };

  // UI 配置
  ui?: {
    // 側邊欄配置
    position?: 'left' | 'right'; // 側邊欄位置
    width?: string;              // 側邊欄寬度，默認 '33.33%'
    primaryColor?: string;
    language?: 'zh-TW' | 'en';

    // 客服圖標位置配置
    iconPosition?: {
      bottom?: string;    // 距離底部的距離，如 '20px'
      right?: string;     // 距離右邊的距離，如 '20px'
      top?: string;       // 距離頂部的距離，如 '20px'
      left?: string;      // 距離左邊的距離，如 '20px'
    } | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | false; // false 表示不顯示浮動圖標
  };
  
  // 功能配置
  features?: {
    enableScreenshot?: boolean;
    enableRules?: boolean;
    enableSearch?: boolean;
  };
  
  // 規則配置
  rules?: Rule[];
  
  // 調試模式
  debug?: boolean;

  // API端點配置
  apiEndpoint?: string;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}

export interface Message {
  id?: string; // 可選，向後兼容
  conversationId?: string; // 可選，向後兼容
  role: 'user' | 'assistant' | 'system' | 'human-agent';
  content: string;
  imageBase64?: string;
  timestamp: number;
  sources?: Source[];
  metadata?: {
    toolsUsed?: string[];
    searchResults?: any[];
    agentId?: string; // 用於人工回覆
    [key: string]: any; // 允許其他自定義欄位
  };
}

export interface Source {
  type?: 'manual-index' | 'frontend-page' | 'sitemap' | 'sql' | 'agent-content';
  url: string;
  title: string;
  snippet?: string;  // 可選，向後兼容
  content?: string;  // 新增，用於完整內容
  score?: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface ConversationState {
  sessionId: string;
  messages: Message[];
  currentRule?: string;
}

// ==================== 新增：用戶管理 ====================

export interface User {
  id: string; // 唯一用戶 ID
  sessionId: string; // 當前 session ID
  fingerprint?: string; // 瀏覽器指紋
  metadata: {
    userAgent: string;
    firstSeen: number; // timestamp
    lastSeen: number; // timestamp
    totalConversations: number;
  };
}

export interface Conversation {
  id: string;
  conversationId?: string; // 向後兼容
  userId: string;
  messages: Message[];
  startedAt: number; // timestamp
  lastMessageAt: number; // timestamp
  createdAt?: number; // 向後兼容
  updatedAt?: number; // 向後兼容
  status: 'active' | 'closed' | 'human-takeover';
  humanAgentId?: string; // 如果有人工接管
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
}

// ==================== 新增：索引管理 ====================

export interface ManualIndex {
  id: string;
  name: string;
  description: string;
  content: string;
  url?: string; // 新增URL欄位
  keywords: string[];
  fingerprint: number[];
  embedding?: number[]; // 新增：向量嵌入，用於語義搜索
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface SitemapConfig {
  id: string;
  domain: string;
  sitemapUrl: string;
  enabled: boolean;
  autoUpdate: boolean;
  updateInterval: number; // 分鐘
  lastUpdated: number;
  pages: SitemapPage[];
}

export interface SitemapPage {
  url: string;
  title: string;
  content: string;
  keywords: string[];
  fingerprint: number[];
  lastCrawled: number;
}

export interface SQLConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mssql' | 'sqlite';
  enabled: boolean;
  createdAt: string;
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  queryTemplate: string; // SQL query template with {{query}} placeholder
  resultMapping: {
    titleField: string;
    contentField: string;
    urlField?: string;
  };
}

// ==================== 新增：Agent Tool 配置 ====================

export interface AgentToolConfig {
  manualIndex: {
    enabled: boolean;
    priority: number; // 1-4, 數字越小優先級越高
    description: string;
  };
  frontendPages: {
    enabled: boolean;
    priority: number;
    description: string;
  };
  sitemap: {
    enabled: boolean;
    priority: number;
    description: string;
    domains: string[]; // 啟用哪些 sitemap
  };
  sqlDatabase: {
    enabled: boolean;
    priority: number;
    description: string;
    connections: string[]; // 啟用哪些 SQL 連接
  };
}

export interface IndexedPage {
  id: number;
  url: string;
  title: string;
  snippet: string;
  keywords: string[];
  fingerprint: number[];
}

export interface SearchIndex {
  version: string;
  lastUpdated: number;
  type: 'site' | 'project';
  config: {
    totalPages: number;
    totalKeywords: number;
  };
  bloomFilter: {
    bits: string;
    size: number;
    hashCount: number;
  };
  invertedIndex: {
    [keyword: string]: Array<{ id: number; score: number }>;
  };
  tfidf: {
    [pageId: number]: { [keyword: string]: number };
  };
  pages: IndexedPage[];
}

export interface SearchSettings {
  enableProjectSearch: boolean;
  enableSiteSearch: boolean;
  projectSearchDescription: string;
  siteSearchDescription: string;
  autoRefresh: boolean;
  refreshInterval: number;  // milliseconds
  sitemapUrl?: string;
}


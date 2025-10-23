export interface ServiceModulerConfig {
    userId?: string;
    azureOpenAI?: {
        endpoint: string;
        apiKey: string;
        deployment: string;
        embeddingDeployment?: string;
        apiVersion?: string;
        embeddingApiVersion?: string;
    };
    llmAPI?: {
        endpoint: string;
        apiKey: string;
        deployment: string;
        apiVersion?: string;
    };
    embeddingAPI?: {
        endpoint: string;
        apiKey: string;
        deployment: string;
        apiVersion?: string;
    };
    telegram?: {
        botToken: string;
        chatId: string;
    };
    database?: {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
    };
    siteConfig?: {
        localMode?: boolean;
        remoteDomains?: Array<{
            domain: string;
            subdomains?: string[];
            excludeSubdomains?: string[];
            enabled?: boolean;
        }>;
        includePaths?: string[];
        excludePaths?: string[];
    };
    ui?: {
        position?: 'left' | 'right';
        width?: string;
        primaryColor?: string;
        language?: 'zh-TW' | 'en';
        iconPosition?: {
            bottom?: string;
            right?: string;
            top?: string;
            left?: string;
        } | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | false;
    };
    features?: {
        enableScreenshot?: boolean;
        enableRules?: boolean;
        enableSearch?: boolean;
    };
    rules?: Rule[];
    debug?: boolean;
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
    id?: string;
    conversationId?: string;
    role: 'user' | 'assistant' | 'system' | 'human-agent';
    content: string;
    imageBase64?: string;
    timestamp: number;
    sources?: Source[];
    metadata?: {
        toolsUsed?: string[];
        searchResults?: any[];
        agentId?: string;
        [key: string]: any;
    };
}
export interface Source {
    type?: 'manual-index' | 'frontend-page' | 'sitemap' | 'sql' | 'agent-content';
    url: string;
    title: string;
    snippet?: string;
    content?: string;
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
export interface User {
    id: string;
    sessionId: string;
    fingerprint?: string;
    metadata: {
        userAgent: string;
        firstSeen: number;
        lastSeen: number;
        totalConversations: number;
    };
}
export interface Conversation {
    id: string;
    conversationId?: string;
    userId: string;
    messages: Message[];
    startedAt: number;
    lastMessageAt: number;
    createdAt?: number;
    updatedAt?: number;
    status: 'active' | 'closed' | 'human-takeover';
    humanAgentId?: string;
    metadata?: {
        userAgent?: string;
        referrer?: string;
    };
}
export interface ManualIndex {
    id: string;
    name: string;
    description: string;
    content: string;
    url?: string;
    keywords: string[];
    fingerprint: number[];
    embedding?: number[];
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
    updateInterval: number;
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
    queryTemplate: string;
    resultMapping: {
        titleField: string;
        contentField: string;
        urlField?: string;
    };
}
export interface AgentToolConfig {
    manualIndex: {
        enabled: boolean;
        priority: number;
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
        domains: string[];
    };
    sqlDatabase: {
        enabled: boolean;
        priority: number;
        description: string;
        connections: string[];
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
        [keyword: string]: Array<{
            id: number;
            score: number;
        }>;
    };
    tfidf: {
        [pageId: number]: {
            [keyword: string]: number;
        };
    };
    pages: IndexedPage[];
}
export interface SearchSettings {
    enableProjectSearch: boolean;
    enableSiteSearch: boolean;
    projectSearchDescription: string;
    siteSearchDescription: string;
    autoRefresh: boolean;
    refreshInterval: number;
    sitemapUrl?: string;
}

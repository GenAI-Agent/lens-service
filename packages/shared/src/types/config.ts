/**
 * Lens Service v3 - Configuration Types
 */

// ============================================================================
// LLM Configuration
// ============================================================================

export interface LLMEndpointConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion?: string;
}

export interface LLMConfig {
  endpoints: LLMEndpointConfig[];
  defaultTemperature: number;
  defaultMaxTokens: number;
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
}

export interface EmbeddingConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion?: string;
  dimensions?: number;
}

// ============================================================================
// Database Configuration
// ============================================================================

export interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

// ============================================================================
// Telegram Configuration
// ============================================================================

export interface TelegramConfig {
  botToken: string;
  chatIds: {
    default: string;
    customerService?: string;
    logistics?: string;
  };
}

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  enableCustomerService: boolean;
  enableOrder: boolean;
  enablePageGenerator: boolean;
  enableRecommender: boolean;
  enableWebUse: boolean;
  maxIterations: number;
  timeoutMs: number;
}

// ============================================================================
// Retrieval Configuration
// ============================================================================

export interface RetrievalConfig {
  bm25Weight: number;
  vectorWeight: number;
  usageVectorWeight: number;
  rerankTopK: number;
  minScore: number;
}

export interface RerankerConfig {
  provider: 'cohere' | 'bge' | 'custom';
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface CoRetrievalConfig {
  enabled: boolean;
  learningRate: number;
  updateIntervalHours: number;
  minFeedbackForUpdate: number;
}

// ============================================================================
// Widget Configuration
// ============================================================================

export interface WidgetUIConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  language: 'zh-TW' | 'en';
  showIcon: boolean;
}

export interface WidgetConfig {
  apiKey: string;
  apiEndpoint: string;
  ui: WidgetUIConfig;
  features: {
    chat: boolean;
    orders: boolean;
    recommendations: boolean;
    pageGeneration: boolean;
    webUse: boolean;
  };
}

// ============================================================================
// Main Service Configuration
// ============================================================================

export interface ServiceConfig {
  llm: LLMConfig;
  embedding: EmbeddingConfig;
  database: DatabaseConfig;
  redis?: RedisConfig;
  telegram?: TelegramConfig;
  agent: AgentConfig;
  retrieval: RetrievalConfig;
  reranker?: RerankerConfig;
  coRetrieval: CoRetrievalConfig;
  debug?: boolean;
}

// ============================================================================
// Environment Configuration Loader
// ============================================================================

export interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  redisUrl?: string;
  azureOpenAIEndpoints: LLMEndpointConfig[];
  embeddingConfig: EmbeddingConfig;
  telegramBotToken?: string;
  telegramChatIds?: TelegramConfig['chatIds'];
  cohereApiKey?: string;
  widgetApiKeySecret: string;
}

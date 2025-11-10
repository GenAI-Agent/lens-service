/**
 * Server-side exports for lens-service
 * Use this file when importing lens-service in Node.js/Next.js API routes
 */

export { ContentExtractorService } from './services/ContentExtractorService';
export { DatabaseService } from './services/DatabaseService';
export { ManualIndexService } from './services/ManualIndexService';
export { ConversationService } from './services/ConversationService';
export { UserService } from './services/UserService';
export { ConfigService } from './services/ConfigService';
export { HybridSearchService } from './services/HybridSearchService';
export { KnowledgeBaseService } from './services/KnowledgeBaseService';
export { CustomerServiceManager } from './services/CustomerServiceManager';
export { RuleStorageService } from './services/RuleStorageService';
export { RuleParserService } from './services/RuleParserService';
export { EmbeddingService } from './services/EmbeddingService';
export { SearchIndexService } from './services/SearchIndexService';
export { ProductIndexService } from './services/ProductIndexService';
export { StaticPageIndexService } from './services/StaticPageIndexService';
export { ImageGenerationService } from './services/ImageGenerationService';
export { RotatingChatOpenAI } from './services/RotatingChatOpenAI';
export { ApiKeyRotationService, getApiKeyRotationService } from './services/ApiKeyRotationService';
export type { AzureOpenAIConfig } from './services/ApiKeyRotationService';
export type { SearchDocument, SearchResult, SearchOptions } from './services/SearchIndexService';
export type { ProductData } from './services/ProductIndexService';
export type { ImageGenerationOptions, ImageGenerationResult } from './services/ImageGenerationService';

// Agent 服務
export { AgentService } from './agent/AgentService';
export type { AgentMessage, AgentResponse } from './agent/AgentService';
export { ConfigManager } from './agent/ConfigManager';
export type { ConfigManagerOptions } from './agent/ConfigManager';

// Agent 工具（供進階使用）
export {
  databaseTools,
  telegramTools,
  aipageTools,
  scraperTools,
  searchTools,
  manualIndexTools,
  initDatabaseTools,
  initTelegramTools,
  initAIPageTools,
  initSearchTools,
  getAIPageContent,
  listAIPages,
} from './agent';


/**
 * Lens Service v3 - Services
 */

// LLM Service
export {
  LLMService,
  getLLMService,
  setLLMService,
  type LLMProvider,
  type LLMConfig,
  type LLMServiceOptions,
  type ChatOptions,
  type ChatResponse,
} from './llm-service';

// Embedding Service
export {
  EmbeddingService,
  type EmbeddingServiceOptions,
  type EmbeddingResult,
} from './embedding-service';

// Database Service
export {
  DatabaseService,
  type DatabaseServiceOptions,
} from './database-service';

// Schema Registry
export {
  SchemaRegistry,
  type SchemaRegistryOptions,
  DEFAULT_SCHEMAS,
} from './schema-registry';

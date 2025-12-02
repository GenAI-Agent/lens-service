/**
 * Lens Service v3 - Constants
 */

// ============================================================================
// Agent Constants
// ============================================================================

export const AGENT_TYPES = [
  'supervisor',
  'customer_service',
  'order',
  'page_generator',
  'recommender',
  'web_use',
] as const;

export const DEFAULT_MAX_STEPS = 10;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 4096;

// ============================================================================
// Tool Categories
// ============================================================================

export const TOOL_CATEGORIES = [
  'rag',
  'sql',
  'page',
  'recommendation',
  'web',
  'notification',
  'utility',
] as const;

// ============================================================================
// Retrieval Constants
// ============================================================================

export const DEFAULT_TOP_K = 10;
export const DEFAULT_MIN_SCORE = 0.5;
export const DEFAULT_RERANK_TOP_K = 5;

export const SEARCH_MODES = ['hybrid', 'vector_only', 'bm25_only'] as const;

export const FUSION_STRATEGIES = ['rrf', 'weighted_sum', 'max_score'] as const;

export const DEFAULT_FUSION_WEIGHTS = {
  bm25: 0.3,
  contentVector: 0.4,
  usageVector: 0.3,
} as const;

export const DEFAULT_BM25_PARAMS = {
  k1: 1.2,
  b: 0.75,
} as const;

// RRF constant (typically 60)
export const RRF_K = 60;

// ============================================================================
// Co-Retrieval Constants
// ============================================================================

export const DEFAULT_USAGE_VECTOR_UPDATE_INTERVAL_MS = 3600000; // 1 hour
export const DEFAULT_USAGE_VECTOR_LEARNING_RATE = 0.1;
export const DEFAULT_USAGE_VECTOR_BATCH_SIZE = 100;
export const MIN_FEEDBACK_FOR_UPDATE = 10;

// ============================================================================
// Page Block Types
// ============================================================================

export const BLOCK_TYPES = [
  'hero',
  'product-grid',
  'product-card',
  'product-carousel',
  'testimonial',
  'testimonial-grid',
  'cta',
  'cta-banner',
  'text',
  'rich-text',
  'image',
  'image-gallery',
  'video',
  'comparison-table',
  'pricing-table',
  'faq',
  'accordion',
  'tabs',
  'features',
  'stats',
  'team',
  'contact-form',
  'newsletter',
  'social-links',
  'footer',
  'divider',
  'spacer',
  'custom-html',
] as const;

export const PAGE_THEMES = ['light', 'dark', 'colorful', 'minimal', 'custom'] as const;

// ============================================================================
// Database Column Types
// ============================================================================

export const COLUMN_TYPES = [
  'varchar',
  'text',
  'integer',
  'bigint',
  'decimal',
  'boolean',
  'timestamp',
  'date',
  'json',
  'jsonb',
  'vector',
  'uuid',
] as const;

// ============================================================================
// Notification Constants
// ============================================================================

export const NOTIFICATION_CHANNELS = ['telegram', 'email'] as const;

export const NOTIFICATION_TYPES = [
  'customer_service',
  'logistics',
  'error',
  'custom',
] as const;

export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'critical'] as const;

// ============================================================================
// Skill Pre/Post Action Types
// ============================================================================

export const PRE_ACTION_TYPES = [
  'scrape_urls',
  'search_database',
  'call_api',
  'load_context',
] as const;

export const POST_ACTION_TYPES = [
  'auto_generate_page',
  'send_notification',
  'save_to_database',
  'trigger_webhook',
] as const;

// ============================================================================
// Social Platforms
// ============================================================================

export const SOCIAL_PLATFORMS = [
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
] as const;

// ============================================================================
// Video Types
// ============================================================================

export const VIDEO_TYPES = ['youtube', 'vimeo', 'mp4', 'embed'] as const;

// ============================================================================
// Document Content Types
// ============================================================================

export const DOCUMENT_CONTENT_TYPES = [
  'knowledge_base',
  'product',
  'ai_page',
  'static_page',
  'article',
] as const;

// ============================================================================
// Feedback Sources
// ============================================================================

export const FEEDBACK_SOURCES = [
  'user_click',
  'agent_selection',
  'purchase',
  'explicit_feedback',
] as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // LLM Errors
  LLM_CONNECTION_ERROR: 'LLM_CONNECTION_ERROR',
  LLM_RATE_LIMIT: 'LLM_RATE_LIMIT',
  LLM_TOKEN_LIMIT: 'LLM_TOKEN_LIMIT',
  LLM_API_KEY_INVALID: 'LLM_API_KEY_INVALID',

  // Database Errors
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_VALIDATION_ERROR: 'DB_VALIDATION_ERROR',
  DB_PERMISSION_DENIED: 'DB_PERMISSION_DENIED',

  // Retrieval Errors
  RETRIEVAL_NO_RESULTS: 'RETRIEVAL_NO_RESULTS',
  RETRIEVAL_EMBEDDING_ERROR: 'RETRIEVAL_EMBEDDING_ERROR',
  RETRIEVAL_RERANK_ERROR: 'RETRIEVAL_RERANK_ERROR',

  // Agent Errors
  AGENT_MAX_STEPS_EXCEEDED: 'AGENT_MAX_STEPS_EXCEEDED',
  AGENT_TOOL_NOT_FOUND: 'AGENT_TOOL_NOT_FOUND',
  AGENT_SKILL_NOT_FOUND: 'AGENT_SKILL_NOT_FOUND',

  // Page Errors
  PAGE_GENERATION_ERROR: 'PAGE_GENERATION_ERROR',
  PAGE_STORAGE_ERROR: 'PAGE_STORAGE_ERROR',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',

  // Web Use Errors
  WEB_ELEMENT_NOT_FOUND: 'WEB_ELEMENT_NOT_FOUND',
  WEB_ACTION_FAILED: 'WEB_ACTION_FAILED',

  // Notification Errors
  NOTIFICATION_SEND_FAILED: 'NOTIFICATION_SEND_FAILED',
  NOTIFICATION_CHANNEL_UNAVAILABLE: 'NOTIFICATION_CHANNEL_UNAVAILABLE',
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

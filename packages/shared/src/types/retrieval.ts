/**
 * Lens Service v3 - Retrieval Types
 */

// ============================================================================
// Document Types
// ============================================================================

export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  contentType: DocumentContentType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentContentType =
  | 'knowledge_base'
  | 'product'
  | 'ai_page'
  | 'static_page'
  | 'article';

// ============================================================================
// Embedding Types
// ============================================================================

export interface DocumentEmbedding {
  docId: string;
  tableName: string;
  contentVector: number[];           // Fixed content embedding
  usageVector: number[];             // Learnable usage embedding
  contentVectorUpdatedAt: Date;
  usageVectorUpdatedAt: Date;
}

export interface QueryEmbedding {
  query: string;
  vector: number[];
  generatedAt: Date;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchOptions {
  query: string;
  tableName: string;
  topK?: number;
  minScore?: number;
  filters?: SearchFilters;
  includeContent?: boolean;
  mode?: SearchMode;
}

export type SearchMode = 'hybrid' | 'vector_only' | 'bm25_only';

export interface SearchFilters {
  contentTypes?: DocumentContentType[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  contentType: DocumentContentType;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  metadata?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  bm25Score: number;
  contentVectorScore: number;
  usageVectorScore: number;
  rrfScore: number;
  rerankScore?: number;
}

// ============================================================================
// Rerank Types
// ============================================================================

export interface RerankOptions {
  query: string;
  documents: SearchResult[];
  topK: number;
  model?: string;
}

export interface RerankResult {
  id: string;
  originalScore: number;
  rerankScore: number;
  rank: number;
}

// ============================================================================
// Co-Retrieval Learning Types
// ============================================================================

export interface FeedbackEvent {
  queryVector: number[];
  retrievedDocs: string[];
  usedDocs: string[];
  skippedDocs: string[];
  source: FeedbackSource;
  tableName: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export type FeedbackSource =
  | 'user_click'
  | 'agent_selection'
  | 'purchase'
  | 'explicit_feedback';

export interface CoRetrievalMatrixEntry {
  docA: string;
  docB: string;
  tableName: string;
  coOccurrence: number;
  positive: number;
  negative: number;
  affinity: number;  // Computed: (positive - negative) / coOccurrence
}

export interface UsageVectorUpdateJob {
  docId: string;
  tableName: string;
  reason: 'feedback_received' | 'scheduled_update' | 'manual_trigger';
  createdAt: Date;
  processedAt?: Date;
}

// ============================================================================
// Hybrid Retrieval Pipeline Types
// ============================================================================

export interface HybridRetrievalPipeline {
  // Stage 1: Multi-path Retrieval
  bm25Retriever: BM25RetrieverConfig;
  vectorRetriever: VectorRetrieverConfig;
  usageVectorRetriever: VectorRetrieverConfig;

  // Stage 2: Fusion
  fusionStrategy: FusionStrategy;
  fusionWeights: FusionWeights;

  // Stage 3: Reranking
  reranker: RerankerConfig;
}

export interface BM25RetrieverConfig {
  enabled: boolean;
  k1: number;  // BM25 parameter
  b: number;   // BM25 parameter
  topK: number;
}

export interface VectorRetrieverConfig {
  enabled: boolean;
  vectorColumn: 'content_vector' | 'usage_vector';
  topK: number;
  distanceMetric: 'cosine' | 'euclidean' | 'inner_product';
}

export type FusionStrategy = 'rrf' | 'weighted_sum' | 'max_score';

export interface FusionWeights {
  bm25: number;
  contentVector: number;
  usageVector: number;
}

export interface RerankerConfig {
  enabled: boolean;
  provider: 'cohere' | 'bge' | 'custom';
  model?: string;
  topK: number;
}

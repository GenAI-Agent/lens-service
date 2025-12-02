/**
 * Lens Service v3 - Retrieval Pipeline
 *
 * Orchestrates the full retrieval process:
 * 1. Hybrid retrieval (BM25 + Content Vector + Usage Vector)
 * 2. RRF Fusion
 * 3. Reranking (optional)
 * 4. Feedback recording for Co-Retrieval Learning
 */

import type { SearchOptions, SearchResult, SearchMode } from '@lens-service/shared';
import { HybridRetriever, type RetrievalResult } from './hybrid-retriever';
import { Reranker, type RerankedResults } from './reranker';
import { CoRetrievalLearning } from './co-retrieval';
import { DatabaseService } from '../services/database-service';
import { EmbeddingService } from '../services/embedding-service';

export interface RetrievalPipelineConfig {
  databaseService: DatabaseService;
  embeddingService: EmbeddingService;
  reranker?: Reranker;
  coRetrievalTables?: string[];  // Tables to enable co-retrieval learning
  enableRerank?: boolean;
  rerankTopK?: number;
}

export interface PipelineSearchOptions extends SearchOptions {
  skipRerank?: boolean;
  recordFeedback?: boolean;
  sessionId?: string;
  userId?: string;
}

export interface PipelineSearchResult {
  results: SearchResult[];
  totalFound: number;
  searchMode: SearchMode;
  reranked: boolean;
  timing: {
    retrievalMs: number;
    rerankMs: number;
    totalMs: number;
  };
}

export class RetrievalPipeline {
  private hybridRetriever: HybridRetriever;
  private reranker: Reranker | null;
  private coRetrievalInstances: Map<string, CoRetrievalLearning> = new Map();
  private enableRerank: boolean;
  private rerankTopK: number;
  private embeddingService: EmbeddingService;

  constructor(config: RetrievalPipelineConfig) {
    this.hybridRetriever = new HybridRetriever({
      databaseService: config.databaseService,
      embeddingService: config.embeddingService,
    });

    this.reranker = config.reranker ?? null;
    this.enableRerank = config.enableRerank ?? !!config.reranker;
    this.rerankTopK = config.rerankTopK ?? 5;
    this.embeddingService = config.embeddingService;

    // Initialize co-retrieval learning for specified tables
    if (config.coRetrievalTables) {
      for (const tableName of config.coRetrievalTables) {
        this.coRetrievalInstances.set(
          tableName,
          new CoRetrievalLearning(config.databaseService, config.embeddingService, {
            tableName,
          })
        );
      }
    }
  }

  /**
   * Execute the full retrieval pipeline
   */
  async search(options: PipelineSearchOptions): Promise<PipelineSearchResult> {
    const startTime = Date.now();

    // Step 1: Hybrid retrieval
    const retrievalResult = await this.hybridRetriever.search(options);
    const retrievalMs = Date.now() - startTime;

    let finalResults = retrievalResult.results;
    let reranked = false;
    let rerankMs = 0;

    // Step 2: Reranking (if enabled and not skipped)
    if (
      this.enableRerank &&
      this.reranker &&
      !options.skipRerank &&
      retrievalResult.results.length > 0
    ) {
      const rerankStart = Date.now();
      const rerankResult = await this.reranker.rerank(
        options.query,
        retrievalResult.results,
        options.topK ?? this.rerankTopK
      );
      finalResults = rerankResult.results;
      rerankMs = rerankResult.rerankDurationMs;
      reranked = true;
    }

    const totalMs = Date.now() - startTime;

    return {
      results: finalResults,
      totalFound: retrievalResult.totalFound,
      searchMode: retrievalResult.searchMode,
      reranked,
      timing: {
        retrievalMs,
        rerankMs,
        totalMs,
      },
    };
  }

  /**
   * Search and record agent selection feedback
   */
  async searchWithFeedback(
    options: PipelineSearchOptions,
    selectedDocIds: string[]
  ): Promise<PipelineSearchResult> {
    // Execute search
    const result = await this.search(options);

    // Record feedback if co-retrieval is enabled for this table
    const coRetrieval = this.coRetrievalInstances.get(options.tableName);
    if (coRetrieval && options.recordFeedback !== false) {
      const queryVector = await this.embeddingService.generateEmbedding(options.query);
      const retrievedDocIds = result.results.map((r) => r.id);

      await coRetrieval.recordAgentSelection(
        queryVector,
        retrievedDocIds,
        selectedDocIds,
        options.sessionId,
        options.userId
      );
    }

    return result;
  }

  /**
   * Record user click feedback
   */
  async recordUserClick(
    tableName: string,
    query: string,
    retrievedDocIds: string[],
    clickedDocId: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    const coRetrieval = this.coRetrievalInstances.get(tableName);
    if (!coRetrieval) {
      console.warn(`[RetrievalPipeline] Co-retrieval not enabled for table: ${tableName}`);
      return;
    }

    const queryVector = await this.embeddingService.generateEmbedding(query);
    await coRetrieval.recordUserClick(queryVector, retrievedDocIds, clickedDocId, sessionId, userId);
  }

  /**
   * Record purchase feedback
   */
  async recordPurchase(
    tableName: string,
    query: string,
    retrievedDocIds: string[],
    purchasedDocIds: string[],
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    const coRetrieval = this.coRetrievalInstances.get(tableName);
    if (!coRetrieval) {
      console.warn(`[RetrievalPipeline] Co-retrieval not enabled for table: ${tableName}`);
      return;
    }

    const queryVector = await this.embeddingService.generateEmbedding(query);
    await coRetrieval.recordPurchase(queryVector, retrievedDocIds, purchasedDocIds, sessionId, userId);
  }

  /**
   * Get document co-retrieval statistics
   */
  async getDocumentStats(
    tableName: string,
    docId: string
  ): Promise<{
    totalCoOccurrences: number;
    positiveSignals: number;
    negativeSignals: number;
    topRelatedDocs: Array<{ id: string; affinity: number }>;
  } | null> {
    const coRetrieval = this.coRetrievalInstances.get(tableName);
    if (!coRetrieval) return null;

    return coRetrieval.getDocumentStats(docId);
  }

  /**
   * Initialize co-retrieval tables
   */
  async initializeCoRetrievalTables(): Promise<void> {
    for (const coRetrieval of this.coRetrievalInstances.values()) {
      await coRetrieval.initializeTables();
    }
  }

  /**
   * Start periodic co-retrieval updates
   */
  startCoRetrievalUpdates(): void {
    for (const coRetrieval of this.coRetrievalInstances.values()) {
      coRetrieval.startPeriodicUpdates();
    }
  }

  /**
   * Get hybrid retriever for direct access
   */
  getHybridRetriever(): HybridRetriever {
    return this.hybridRetriever;
  }

  /**
   * Get co-retrieval instance for a table
   */
  getCoRetrieval(tableName: string): CoRetrievalLearning | undefined {
    return this.coRetrievalInstances.get(tableName);
  }

  /**
   * Create RetrievalPipeline from environment
   */
  static fromEnv(
    databaseService: DatabaseService,
    embeddingService: EmbeddingService
  ): RetrievalPipeline {
    const reranker = Reranker.fromEnv();

    // Get co-retrieval enabled tables from env
    const coRetrievalTablesStr = process.env.CO_RETRIEVAL_TABLES || 'products,manual_indexes';
    const coRetrievalTables = coRetrievalTablesStr.split(',').map((t) => t.trim());

    return new RetrievalPipeline({
      databaseService,
      embeddingService,
      reranker: reranker ?? undefined,
      coRetrievalTables,
      enableRerank: !!reranker,
      rerankTopK: parseInt(process.env.RERANK_TOP_K || '5', 10),
    });
  }
}

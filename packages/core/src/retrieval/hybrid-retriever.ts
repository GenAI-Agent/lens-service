/**
 * Lens Service v3 - Hybrid Retriever
 *
 * Implements multi-path retrieval combining:
 * 1. BM25 (keyword-based) search
 * 2. Content vector similarity search
 * 3. Usage vector similarity search (from Co-Retrieval Learning)
 *
 * Uses Reciprocal Rank Fusion (RRF) to combine results.
 */

import type {
  SearchResult,
  SearchOptions,
  SearchMode,
  ScoreBreakdown,
  FusionWeights,
  DocumentContentType,
} from '@lens-service/shared';
import { RRF_K, DEFAULT_FUSION_WEIGHTS } from '@lens-service/shared';
import { DatabaseService } from '../services/database-service';
import { EmbeddingService } from '../services/embedding-service';

export interface HybridRetrieverOptions {
  databaseService: DatabaseService;
  embeddingService: EmbeddingService;
  fusionWeights?: FusionWeights;
  defaultTopK?: number;
  defaultMinScore?: number;
}

export interface RetrievalResult {
  results: SearchResult[];
  totalFound: number;
  searchMode: SearchMode;
  durationMs: number;
}

interface RankedDocument {
  id: string;
  bm25Rank?: number;
  contentVectorRank?: number;
  usageVectorRank?: number;
  bm25Score?: number;
  contentVectorScore?: number;
  usageVectorScore?: number;
  data: Record<string, unknown>;
}

export class HybridRetriever {
  private db: DatabaseService;
  private embedding: EmbeddingService;
  private fusionWeights: FusionWeights;
  private defaultTopK: number;
  private defaultMinScore: number;

  constructor(options: HybridRetrieverOptions) {
    this.db = options.databaseService;
    this.embedding = options.embeddingService;
    this.fusionWeights = options.fusionWeights ?? DEFAULT_FUSION_WEIGHTS;
    this.defaultTopK = options.defaultTopK ?? 10;
    this.defaultMinScore = options.defaultMinScore ?? 0.3;
  }

  /**
   * Perform hybrid search across a table
   */
  async search(options: SearchOptions): Promise<RetrievalResult> {
    const startTime = Date.now();
    const {
      query,
      tableName,
      topK = this.defaultTopK,
      minScore = this.defaultMinScore,
      filters,
      includeContent = true,
      mode = 'hybrid',
    } = options;

    // Generate query embedding
    const queryVector = await this.embedding.generateEmbedding(query);

    // Execute search based on mode
    let results: SearchResult[];

    switch (mode) {
      case 'vector_only':
        results = await this.vectorOnlySearch(
          tableName,
          queryVector,
          topK,
          minScore,
          filters,
          includeContent
        );
        break;

      case 'bm25_only':
        results = await this.bm25OnlySearch(
          tableName,
          query,
          topK,
          filters,
          includeContent
        );
        break;

      case 'hybrid':
      default:
        results = await this.hybridSearch(
          tableName,
          query,
          queryVector,
          topK,
          minScore,
          filters,
          includeContent
        );
        break;
    }

    return {
      results,
      totalFound: results.length,
      searchMode: mode,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Hybrid search combining BM25 + content vector + usage vector
   */
  private async hybridSearch(
    tableName: string,
    query: string,
    queryVector: number[],
    topK: number,
    minScore: number,
    filters?: SearchOptions['filters'],
    includeContent: boolean = true
  ): Promise<SearchResult[]> {
    // Fetch more candidates than needed for better fusion
    const candidateMultiplier = 3;
    const candidateK = topK * candidateMultiplier;

    // Execute all three retrieval paths in parallel
    const [bm25Results, contentVectorResults, usageVectorResults] = await Promise.all([
      this.bm25Search(tableName, query, candidateK, filters),
      this.vectorSearch(tableName, 'content_vector', queryVector, candidateK, filters),
      this.vectorSearch(tableName, 'usage_vector', queryVector, candidateK, filters),
    ]);

    // Build ranked document map
    const docMap = new Map<string, RankedDocument>();

    // Add BM25 results with ranks
    bm25Results.forEach((doc, rank) => {
      const id = doc.id as string;
      docMap.set(id, {
        id,
        bm25Rank: rank + 1,
        bm25Score: doc.bm25_score as number,
        data: doc,
      });
    });

    // Add content vector results
    contentVectorResults.forEach((doc, rank) => {
      const id = doc.id as string;
      const existing = docMap.get(id) || { id, data: doc };
      existing.contentVectorRank = rank + 1;
      existing.contentVectorScore = doc.similarity as number;
      existing.data = { ...existing.data, ...doc };
      docMap.set(id, existing);
    });

    // Add usage vector results
    usageVectorResults.forEach((doc, rank) => {
      const id = doc.id as string;
      const existing = docMap.get(id) || { id, data: doc };
      existing.usageVectorRank = rank + 1;
      existing.usageVectorScore = doc.similarity as number;
      existing.data = { ...existing.data, ...doc };
      docMap.set(id, existing);
    });

    // Calculate RRF scores and sort
    const scoredDocs = Array.from(docMap.values()).map((doc) => {
      const rrfScore = this.calculateRRFScore(doc);
      return { ...doc, rrfScore };
    });

    scoredDocs.sort((a, b) => b.rrfScore - a.rrfScore);

    // Convert to SearchResult format
    const results: SearchResult[] = scoredDocs
      .slice(0, topK)
      .filter((doc) => doc.rrfScore >= minScore)
      .map((doc) => this.toSearchResult(doc, includeContent));

    return results;
  }

  /**
   * Vector-only search (content vector)
   */
  private async vectorOnlySearch(
    tableName: string,
    queryVector: number[],
    topK: number,
    minScore: number,
    filters?: SearchOptions['filters'],
    includeContent: boolean = true
  ): Promise<SearchResult[]> {
    const results = await this.vectorSearch(tableName, 'content_vector', queryVector, topK, filters);

    return results
      .filter((doc) => (doc.similarity as number) >= minScore)
      .map((doc) => ({
        id: doc.id as string,
        title: (doc.name || doc.title) as string,
        content: includeContent ? (doc.content || doc.description || '') as string : '',
        url: doc.url as string | undefined,
        contentType: (doc.content_type || 'knowledge_base') as DocumentContentType,
        score: doc.similarity as number,
        scoreBreakdown: {
          bm25Score: 0,
          contentVectorScore: doc.similarity as number,
          usageVectorScore: 0,
          rrfScore: doc.similarity as number,
        },
        metadata: doc,
      }));
  }

  /**
   * BM25-only search
   */
  private async bm25OnlySearch(
    tableName: string,
    query: string,
    topK: number,
    filters?: SearchOptions['filters'],
    includeContent: boolean = true
  ): Promise<SearchResult[]> {
    const results = await this.bm25Search(tableName, query, topK, filters);

    return results.map((doc) => ({
      id: doc.id as string,
      title: (doc.name || doc.title) as string,
      content: includeContent ? (doc.content || doc.description || '') as string : '',
      url: doc.url as string | undefined,
      contentType: (doc.content_type || 'knowledge_base') as DocumentContentType,
      score: (doc.bm25_score || 1) as number,
      scoreBreakdown: {
        bm25Score: (doc.bm25_score || 1) as number,
        contentVectorScore: 0,
        usageVectorScore: 0,
        rrfScore: (doc.bm25_score || 1) as number,
      },
      metadata: doc,
    }));
  }

  /**
   * Execute BM25 search using PostgreSQL full-text search
   */
  private async bm25Search(
    tableName: string,
    query: string,
    limit: number,
    filters?: SearchOptions['filters']
  ): Promise<Record<string, unknown>[]> {
    // Build filter conditions
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Content type filter
    if (filters?.contentTypes?.length) {
      conditions.push(`content_type = ANY($${params.length + 1})`);
      params.push(filters.contentTypes);
    }

    // Date range filter
    if (filters?.dateRange?.from) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(filters.dateRange.from);
    }
    if (filters?.dateRange?.to) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(filters.dateRange.to);
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // Use PostgreSQL full-text search with ts_rank
    const sql = `
      SELECT *,
        ts_rank_cd(
          to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')),
          plainto_tsquery('english', $1)
        ) as bm25_score
      FROM ${tableName}
      WHERE to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, ''))
        @@ plainto_tsquery('english', $1)
      ${whereClause}
      ORDER BY bm25_score DESC
      LIMIT $${params.length + 2}
    `;

    params.unshift(query);
    params.push(limit);

    const result = await this.db.query(sql, params);
    return result.data;
  }

  /**
   * Execute vector similarity search
   */
  private async vectorSearch(
    tableName: string,
    vectorColumn: string,
    queryVector: number[],
    limit: number,
    filters?: SearchOptions['filters']
  ): Promise<Record<string, unknown>[]> {
    // Build filter conditions
    const conditions: Record<string, unknown> = {};

    if (filters?.contentTypes?.length) {
      conditions.content_type = filters.contentTypes;
    }

    const result = await this.db.vectorSearch(tableName, vectorColumn, queryVector, {
      topK: limit,
      distanceMetric: 'cosine',
      conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
    });

    return result.data;
  }

  /**
   * Calculate RRF score from multiple ranks
   */
  private calculateRRFScore(doc: RankedDocument): number {
    let score = 0;

    // BM25 contribution
    if (doc.bm25Rank !== undefined) {
      score += this.fusionWeights.bm25 * this.rrfScore(doc.bm25Rank);
    }

    // Content vector contribution
    if (doc.contentVectorRank !== undefined) {
      score += this.fusionWeights.contentVector * this.rrfScore(doc.contentVectorRank);
    }

    // Usage vector contribution
    if (doc.usageVectorRank !== undefined) {
      score += this.fusionWeights.usageVector * this.rrfScore(doc.usageVectorRank);
    }

    return score;
  }

  /**
   * RRF score for a single rank
   */
  private rrfScore(rank: number): number {
    return 1 / (RRF_K + rank);
  }

  /**
   * Convert ranked document to SearchResult
   */
  private toSearchResult(doc: RankedDocument & { rrfScore: number }, includeContent: boolean): SearchResult {
    return {
      id: doc.id,
      title: (doc.data.name || doc.data.title || '') as string,
      content: includeContent ? (doc.data.content || doc.data.description || '') as string : '',
      url: doc.data.url as string | undefined,
      contentType: (doc.data.content_type || 'knowledge_base') as DocumentContentType,
      score: doc.rrfScore,
      scoreBreakdown: {
        bm25Score: doc.bm25Score ?? 0,
        contentVectorScore: doc.contentVectorScore ?? 0,
        usageVectorScore: doc.usageVectorScore ?? 0,
        rrfScore: doc.rrfScore,
      },
      metadata: doc.data,
    };
  }

  /**
   * Update fusion weights dynamically
   */
  setFusionWeights(weights: FusionWeights): void {
    this.fusionWeights = weights;
  }
}

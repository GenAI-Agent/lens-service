/**
 * Lens Service v3 - Reranker
 *
 * Cross-encoder reranking to improve retrieval precision.
 * Supports Cohere, BGE, and custom reranking models.
 */

import type { SearchResult, RerankOptions, RerankResult } from '@lens-service/shared';

export interface RerankerConfig {
  provider: 'cohere' | 'bge' | 'custom';
  apiKey?: string;
  model?: string;
  endpoint?: string;
  maxCandidates?: number;
}

export interface RerankedResults {
  results: SearchResult[];
  rerankDurationMs: number;
}

export class Reranker {
  private config: RerankerConfig;

  constructor(config: RerankerConfig) {
    this.config = {
      maxCandidates: 100,
      ...config,
    };
  }

  /**
   * Rerank search results using cross-encoder
   */
  async rerank(
    query: string,
    documents: SearchResult[],
    topK: number
  ): Promise<RerankedResults> {
    const startTime = Date.now();

    // Limit candidates for efficiency
    const candidates = documents.slice(0, this.config.maxCandidates);

    if (candidates.length === 0) {
      return { results: [], rerankDurationMs: 0 };
    }

    let rerankResults: RerankResult[];

    switch (this.config.provider) {
      case 'cohere':
        rerankResults = await this.rerankWithCohere(query, candidates);
        break;

      case 'bge':
        rerankResults = await this.rerankWithBGE(query, candidates);
        break;

      case 'custom':
        rerankResults = await this.rerankWithCustom(query, candidates);
        break;

      default:
        throw new Error(`Unsupported reranker provider: ${this.config.provider}`);
    }

    // Sort by rerank score and take top K
    rerankResults.sort((a, b) => b.rerankScore - a.rerankScore);
    const topResults = rerankResults.slice(0, topK);

    // Merge rerank scores back into search results
    const rerankedSearchResults: SearchResult[] = topResults.map((rr) => {
      const original = candidates.find((d) => d.id === rr.id)!;
      return {
        ...original,
        score: rr.rerankScore, // Use rerank score as final score
        scoreBreakdown: {
          ...original.scoreBreakdown!,
          rerankScore: rr.rerankScore,
        },
      };
    });

    return {
      results: rerankedSearchResults,
      rerankDurationMs: Date.now() - startTime,
    };
  }

  /**
   * Rerank using Cohere Rerank API
   */
  private async rerankWithCohere(
    query: string,
    documents: SearchResult[]
  ): Promise<RerankResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Cohere API key required for reranking');
    }

    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'rerank-english-v3.0',
        query,
        documents: documents.map((d) => ({
          text: `${d.title}\n${d.content}`,
        })),
        top_n: documents.length,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere rerank API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return data.results.map((result: { index: number; relevance_score: number }, rank: number) => ({
      id: documents[result.index].id,
      originalScore: documents[result.index].score,
      rerankScore: result.relevance_score,
      rank: rank + 1,
    }));
  }

  /**
   * Rerank using BGE reranker (self-hosted or API)
   */
  private async rerankWithBGE(
    query: string,
    documents: SearchResult[]
  ): Promise<RerankResult[]> {
    const endpoint = this.config.endpoint || 'http://localhost:8080/rerank';

    const pairs = documents.map((d) => ({
      query,
      passage: `${d.title}\n${d.content}`,
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.config.model || 'BAAI/bge-reranker-v2-m3',
        pairs,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`BGE rerank API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Expect response format: { scores: number[] }
    const scores: number[] = data.scores || data;

    return scores.map((score: number, index: number) => ({
      id: documents[index].id,
      originalScore: documents[index].score,
      rerankScore: score,
      rank: 0, // Will be set after sorting
    }));
  }

  /**
   * Rerank using custom endpoint
   */
  private async rerankWithCustom(
    query: string,
    documents: SearchResult[]
  ): Promise<RerankResult[]> {
    if (!this.config.endpoint) {
      throw new Error('Custom reranker endpoint required');
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        query,
        documents: documents.map((d) => ({
          id: d.id,
          title: d.title,
          content: d.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom rerank API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Expect response format: { results: [{ id, score }] }
    return data.results.map((result: { id: string; score: number }, rank: number) => {
      const original = documents.find((d) => d.id === result.id);
      return {
        id: result.id,
        originalScore: original?.score ?? 0,
        rerankScore: result.score,
        rank: rank + 1,
      };
    });
  }

  /**
   * Create Reranker from environment variables
   */
  static fromEnv(): Reranker | null {
    const provider = process.env.RERANKER_PROVIDER as RerankerConfig['provider'];

    if (!provider) {
      console.log('[Reranker] No reranker configured');
      return null;
    }

    return new Reranker({
      provider,
      apiKey: process.env.RERANKER_API_KEY,
      model: process.env.RERANKER_MODEL,
      endpoint: process.env.RERANKER_ENDPOINT,
      maxCandidates: parseInt(process.env.RERANKER_MAX_CANDIDATES || '100', 10),
    });
  }
}

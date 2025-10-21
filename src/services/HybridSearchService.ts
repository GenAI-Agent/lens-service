// import { prisma } from '../lib/prisma'; // Removed: Using API mode
import axios from 'axios';

export interface SearchResult {
  id: string;
  name: string;
  content: string;
  url?: string;
  type: string;
  file_type?: string;
  status?: string;
  vector_score: number;
  bm25_score: number;
  rrf_score: number;
  hybrid_score: number;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  type?: 'manual' | 'url';
  minScore?: number;
}

/**
 * Hybrid Search Service
 * 使用 Vector Search + BM25 進行混合搜尋
 */
export class HybridSearchService {
  /**
   * Generate embedding using Azure OpenAI
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      throw new Error('Azure OpenAI configuration missing');
    }

    const url = `${endpoint}openai/deployments/${deployment}/embeddings?api-version=2023-05-15`;

    const response = await axios.post(
      url,
      { input: text.substring(0, 8000) },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      }
    );

    return response.data.data[0].embedding;
  }

  /**
   * Perform hybrid search (Vector + BM25)
   */
  static async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 3, type, minScore = 0.15 } = options;

    try {
      // Use API-based hybrid search
      // In browser environment, use relative URL; in Node.js, use full URL
      const isBrowser = typeof window !== 'undefined';
      const apiUrl = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      const response = await axios.post(`${apiUrl}/api/widget/manual-indexes/search`, {
        query,
        limit,
        type,
        minScore,
      });

      if (response.data.success) {
        return response.data.results;
      } else {
        console.error('Hybrid search API error:', response.data.error);
        return [];
      }

      /* Commented out: Prisma-based implementation
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      // Build WHERE clause for type filter
      const typeFilter = type ? `AND type = '${type}'` : '';

      // Hybrid search: Vector similarity + BM25
      // Using RRF (Reciprocal Rank Fusion) to combine scores
      const results = await prisma.$queryRawUnsafe<SearchResult[]>(`
        WITH vector_search AS (
          SELECT
            id,
            name,
            content,
            url,
            type,
            file_type,
            status,
            1 - (embedding <=> $1::vector) as similarity,
            ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) as rank
          FROM manual_indexes
          WHERE embedding IS NOT NULL
          ${typeFilter}
          ORDER BY embedding <=> $1::vector
          LIMIT 20
        ),
        bm25_search AS (
          SELECT
            id,
            name,
            content,
            url,
            type,
            file_type,
            status,
            ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as bm25_score,
            ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) DESC) as rank
          FROM manual_indexes
          WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $2)
          ${typeFilter}
          ORDER BY bm25_score DESC
          LIMIT 20
        ),
        combined AS (
          SELECT
            COALESCE(v.id, b.id) as id,
            COALESCE(v.name, b.name) as name,
            COALESCE(v.content, b.content) as content,
            COALESCE(v.url, b.url) as url,
            COALESCE(v.type, b.type) as type,
            COALESCE(v.file_type, b.file_type) as file_type,
            COALESCE(v.status, b.status) as status,
            COALESCE(v.similarity, 0) as vector_score,
            COALESCE(b.bm25_score, 0) as bm25_score,
            -- RRF score: 1 / (k + rank)
            (COALESCE(1.0 / (60 + v.rank), 0) + COALESCE(1.0 / (60 + b.rank), 0)) as rrf_score
          FROM vector_search v
          FULL OUTER JOIN bm25_search b ON v.id = b.id
        )
        SELECT
          id,
          name,
          content,
          url,
          type,
          file_type,
          status,
          vector_score,
          bm25_score,
          rrf_score,
          (vector_score * 0.5 + bm25_score * 0.5) as hybrid_score
        FROM combined
        ORDER BY rrf_score DESC
        LIMIT $3
      `, embeddingStr, query, limit);

      return results;
      */
    } catch (error) {
      console.error('Error performing hybrid search:', error);
      throw error;
    }
  }

  /**
   * Search only in manual indexes
   */
  static async searchManual(query: string, limit: number = 5): Promise<SearchResult[]> {
    return this.search({ query, limit, type: 'manual' });
  }

  /**
   * Search only in URL knowledge base
   */
  static async searchURL(query: string, limit: number = 5): Promise<SearchResult[]> {
    return this.search({ query, limit, type: 'url' });
  }
}


/**
 * Knowledge Search Tool
 * Hybrid search: Vector similarity + BM25 keyword matching
 * Uses OpenAI for embeddings
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { ToolResult } from '../config/types';

interface KnowledgeSearchParams {
  query: string;
  topK?: number;
}

interface SearchResult {
  id: number;
  name: string;
  content: string;
  category: string | null;
  score: number;
  method: 'vector' | 'bm25' | 'hybrid';
}

export class KnowledgeSearchTool {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaClient,
    openaiApiKey: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Execute hybrid search (Vector + BM25)
   */
  async execute(params: KnowledgeSearchParams): Promise<ToolResult> {
    try {
      const { query, topK = 5 } = params;

      // Generate query embedding
      const embedding = await this.generateEmbedding(query);

      // Perform vector search
      const vectorResults = await this.vectorSearch(embedding, topK * 2);

      // Perform BM25 keyword search
      const bm25Results = await this.bm25Search(query, topK * 2);

      // Combine and re-rank results
      const combinedResults = this.combineResults(vectorResults, bm25Results, topK);

      if (combinedResults.length === 0) {
        return {
          success: true,
          result: {
            message: 'No relevant knowledge found.',
            results: [],
          },
        };
      }

      return {
        success: true,
        result: {
          message: `Found ${combinedResults.length} relevant knowledge entries.`,
          results: combinedResults.map((r) => ({
            name: r.name,
            content: r.content,
            category: r.category,
            score: r.score,
            method: r.method,
          })),
        },
      };
    } catch (error) {
      console.error('Knowledge search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Vector similarity search (using description embeddings)
   */
  private async vectorSearch(
    embedding: number[],
    limit: number
  ): Promise<SearchResult[]> {
    // Get all active knowledge base entries with embeddings
    const entries = await this.prisma.knowledgeBase.findMany({
      where: {
        isActive: true,
        embedding: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        content: true,
        category: true,
        embedding: true,
      },
    });

    // Calculate cosine similarity for each entry
    const results: SearchResult[] = [];

    for (const entry of entries) {
      if (!entry.embedding) continue;

      try {
        const entryEmbedding = JSON.parse(entry.embedding) as number[];
        const similarity = this.cosineSimilarity(embedding, entryEmbedding);

        results.push({
          id: entry.id,
          name: entry.name,
          content: entry.content,
          category: entry.category,
          score: similarity,
          method: 'vector',
        });
      } catch (error) {
        console.error(`Failed to parse embedding for entry ${entry.id}:`, error);
      }
    }

    // Sort by similarity (descending) and take top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * BM25 keyword search
   */
  private async bm25Search(query: string, limit: number): Promise<SearchResult[]> {
    // Extract keywords from query
    const queryKeywords = this.extractKeywords(query);

    if (queryKeywords.length === 0) {
      return [];
    }

    // Search using keyword overlap
    const entries = await this.prisma.knowledgeBase.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        category: true,
        keywords: true,
      },
    });

    const results: SearchResult[] = [];

    for (const entry of entries) {
      // Calculate BM25-like score (simplified) - searches content field
      const score = this.calculateBM25Score(
        queryKeywords,
        entry.keywords,
        entry.name,
        entry.description,
        entry.content
      );

      if (score > 0) {
        results.push({
          id: entry.id,
          name: entry.name,
          content: entry.content,
          category: entry.category,
          score,
          method: 'bm25',
        });
      }
    }

    // Sort by score (descending) and take top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Combine vector and BM25 results with reciprocal rank fusion
   */
  private combineResults(
    vectorResults: SearchResult[],
    bm25Results: SearchResult[],
    topK: number
  ): SearchResult[] {
    const resultMap = new Map<number, SearchResult>();
    const k = 60; // RRF constant

    // Add vector results with RRF scoring
    vectorResults.forEach((result, index) => {
      const rrf = 1 / (k + index + 1);
      resultMap.set(result.id, {
        ...result,
        score: rrf,
        method: 'hybrid',
      });
    });

    // Add/merge BM25 results with RRF scoring
    bm25Results.forEach((result, index) => {
      const rrf = 1 / (k + index + 1);
      const existing = resultMap.get(result.id);

      if (existing) {
        // Combine scores if entry exists in both
        existing.score += rrf;
      } else {
        resultMap.set(result.id, {
          ...result,
          score: rrf,
          method: 'hybrid',
        });
      }
    });

    // Convert to array and sort by combined score
    const combined = Array.from(resultMap.values());
    combined.sort((a, b) => b.score - a.score);

    return combined.slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract keywords from query (simple tokenization)
   */
  private extractKeywords(query: string): string[] {
    // Convert to lowercase and split by non-alphanumeric characters
    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fa5]+/) // Include Chinese characters
      .filter((t) => t.length > 2); // Filter out short words

    return Array.from(new Set(tokens)); // Remove duplicates
  }

  /**
   * Calculate simplified BM25 score
   * Searches content field primarily, with name and description as secondary signals
   */
  private calculateBM25Score(
    queryKeywords: string[],
    docKeywords: string[],
    name: string,
    description: string,
    content: string
  ): number {
    const nameLower = name.toLowerCase();
    const descriptionLower = description.toLowerCase();
    const contentLower = content.toLowerCase();
    const docKeywordsLower = docKeywords.map((k) => k.toLowerCase());

    let score = 0;

    for (const keyword of queryKeywords) {
      // Primary: Check if keyword exists in content (highest weight)
      if (contentLower.includes(keyword)) {
        score += 2.0;
      }

      // Secondary: Check if keyword exists in name
      if (nameLower.includes(keyword)) {
        score += 0.8;
      }

      // Secondary: Check if keyword exists in description
      if (descriptionLower.includes(keyword)) {
        score += 0.5;
      }

      // Tertiary: Check if keyword exists in document keywords (optional tags)
      if (docKeywordsLower.includes(keyword)) {
        score += 0.3;
      }
    }

    return score;
  }
}

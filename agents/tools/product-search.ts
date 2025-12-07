/**
 * Product Search Tool
 * Hybrid search: Vector similarity + BM25 keyword matching
 * Searches product descriptions and returns product name + content
 * Uses OpenAI for embeddings
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { ToolResult } from '../config/types';

interface ProductSearchParams {
  query: string;
  topK?: number;
}

interface SearchResult {
  id: number;
  productId: string;
  productName: string;
  content: string;
  score: number;
  method: 'vector' | 'bm25' | 'hybrid';
}

export class ProductSearchTool {
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
  async execute(params: ProductSearchParams): Promise<ToolResult> {
    try {
      const { query, topK = 10 } = params;

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
            message: 'No products found matching your query.',
            results: [],
          },
        };
      }

      return {
        success: true,
        result: {
          message: `Found ${combinedResults.length} products.`,
          results: combinedResults.map((r) => ({
            productName: r.productName,
            content: r.content,
            score: r.score.toFixed(3),
          })),
        },
      };
    } catch (error) {
      console.error('Product search error:', error);
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
    // Get all products with embeddings
    const products = await this.prisma.product.findMany({
      where: {
        embedding: {
          not: null,
        },
      },
      select: {
        id: true,
        productId: true,
        productName: true,
        description: true,
        content: true,
        embedding: true,
      },
    });

    // Calculate cosine similarity for each product
    const results: SearchResult[] = [];

    for (const product of products) {
      if (!product.embedding) continue;

      try {
        const productEmbedding = JSON.parse(product.embedding) as number[];
        const similarity = this.cosineSimilarity(embedding, productEmbedding);

        results.push({
          id: product.id,
          productId: product.productId,
          productName: product.productName,
          content: product.content,
          score: similarity,
          method: 'vector',
        });
      } catch (error) {
        console.error(`Failed to parse embedding for product ${product.id}:`, error);
      }
    }

    // Sort by similarity (descending) and take top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * BM25 keyword search on product descriptions
   */
  private async bm25Search(query: string, limit: number): Promise<SearchResult[]> {
    // Extract keywords from query
    const queryKeywords = this.extractKeywords(query);

    if (queryKeywords.length === 0) {
      return [];
    }

    // Search all products
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        productId: true,
        productName: true,
        description: true,
        content: true,
      },
    });

    const results: SearchResult[] = [];

    for (const product of products) {
      // Calculate BM25-like score (simplified) - searches description field
      const score = this.calculateBM25Score(
        queryKeywords,
        product.productName,
        product.description,
        product.content
      );

      if (score > 0) {
        results.push({
          id: product.id,
          productId: product.productId,
          productName: product.productName,
          content: product.content,
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
      .filter((t) => t.length > 1); // Filter out single character words

    return Array.from(new Set(tokens)); // Remove duplicates
  }

  /**
   * Calculate simplified BM25 score
   * Searches description field primarily (which contains the book title)
   */
  private calculateBM25Score(
    queryKeywords: string[],
    productName: string,
    description: string,
    content: string
  ): number {
    const productNameLower = productName.toLowerCase();
    const descriptionLower = description.toLowerCase();
    const contentLower = content.toLowerCase();

    let score = 0;

    for (const keyword of queryKeywords) {
      // Primary: Check if keyword exists in description (highest weight)
      // Description contains the book title, so this is our main search field
      if (descriptionLower.includes(keyword)) {
        score += 3.0;
      }

      // Secondary: Check if keyword exists in product name
      if (productNameLower.includes(keyword)) {
        score += 2.0;
      }

      // Tertiary: Check if keyword exists in content (author, publisher, category, price)
      if (contentLower.includes(keyword)) {
        score += 1.0;
      }
    }

    return score;
  }
}

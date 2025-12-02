/**
 * Lens Service v3 - Embedding Service
 *
 * Generates text embeddings using Azure OpenAI or OpenAI embedding models.
 * Supports batch processing and automatic chunking for large inputs.
 */

import type { EmbeddingConfig, EmbeddingProvider } from '@lens-service/shared';

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingServiceOptions {
  provider: EmbeddingProvider;
  endpoint: string;
  apiKey: string;
  deployment?: string;  // Azure deployment name
  model?: string;       // OpenAI model name
  dimensions?: number;  // Vector dimensions (default varies by model)
  maxBatchSize?: number; // Max texts per batch (default 2048 for OpenAI)
}

export class EmbeddingService {
  private readonly provider: EmbeddingProvider;
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly deployment?: string;
  private readonly model: string;
  private readonly dimensions?: number;
  private readonly maxBatchSize: number;
  private readonly isAzure: boolean;

  constructor(options: EmbeddingServiceOptions) {
    this.provider = options.provider;
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.deployment = options.deployment;
    this.model = options.model || 'text-embedding-3-small';
    this.dimensions = options.dimensions;
    this.maxBatchSize = options.maxBatchSize ?? 2048;
    this.isAzure = this.provider === 'azure-openai';

    if (!this.endpoint) {
      throw new Error('EmbeddingService requires endpoint');
    }
    if (!this.apiKey) {
      throw new Error('EmbeddingService requires apiKey');
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const results = await this.generateEmbeddings([text]);
    return results[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    // Process in chunks if exceeds max batch size
    if (texts.length > this.maxBatchSize) {
      console.log(
        `[EmbeddingService] Input exceeds ${this.maxBatchSize} limit, processing in chunks`
      );
      return this.generateEmbeddingsInChunks(texts);
    }

    try {
      const url = this.buildApiUrl();
      const headers = this.buildHeaders();
      const body = this.buildRequestBody(texts);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      // Map response to standard format
      return data.data.map((item: { embedding: number[]; index: number }, index: number) => ({
        text: texts[index],
        embedding: item.embedding,
        index,
      }));
    } catch (error) {
      console.error('[EmbeddingService] Failed to generate embeddings:', error);
      throw error;
    }
  }

  /**
   * Build the API endpoint URL
   */
  private buildApiUrl(): string {
    if (this.isAzure) {
      return `${this.endpoint}/openai/deployments/${this.deployment}/embeddings?api-version=2024-02-15-preview`;
    }
    return `${this.endpoint}/v1/embeddings`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.isAzure) {
      headers['api-key'] = this.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Build request body
   */
  private buildRequestBody(texts: string[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      input: texts,
    };

    // OpenAI requires model, Azure uses deployment
    if (!this.isAzure) {
      body.model = this.model;
    }

    // Optional dimensions (supported by text-embedding-3-* models)
    if (this.dimensions) {
      body.dimensions = this.dimensions;
    }

    return body;
  }

  /**
   * Process large input in chunks
   */
  private async generateEmbeddingsInChunks(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    const totalChunks = Math.ceil(texts.length / this.maxBatchSize);

    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const chunk = texts.slice(i, i + this.maxBatchSize);
      const chunkIndex = Math.floor(i / this.maxBatchSize) + 1;

      console.log(`[EmbeddingService] Processing chunk ${chunkIndex}/${totalChunks}`);

      const chunkResults = await this.generateEmbeddings(chunk);

      // Correct the indices
      chunkResults.forEach((result) => {
        result.index = i + result.index;
      });

      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Get embedding dimensions (based on model)
   */
  getExpectedDimensions(): number {
    // Common model dimensions
    const modelDimensions: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
    };

    if (this.dimensions) {
      return this.dimensions;
    }

    return modelDimensions[this.model] ?? 1536;
  }

  /**
   * Create EmbeddingService from environment variables
   */
  static fromEnv(): EmbeddingService {
    const provider = (process.env.EMBEDDING_PROVIDER || 'azure-openai') as EmbeddingProvider;

    if (provider === 'azure-openai') {
      // Use first Azure endpoint for embeddings
      const endpoint =
        process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT ||
        process.env.AZURE_OPENAI_ENDPOINT_1 ||
        process.env.AZURE_OPENAI_ENDPOINT ||
        '';
      const apiKey =
        process.env.AZURE_OPENAI_EMBEDDING_API_KEY ||
        process.env.AZURE_OPENAI_API_KEY_1 ||
        process.env.AZURE_OPENAI_API_KEY ||
        '';
      const deployment =
        process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';

      return new EmbeddingService({
        provider,
        endpoint,
        apiKey,
        deployment,
        dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
      });
    }

    // OpenAI
    return new EmbeddingService({
      provider: 'openai',
      endpoint: process.env.OPENAI_ENDPOINT || 'https://api.openai.com',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
    });
  }
}

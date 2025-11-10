/**
 * EmbeddingService - 生成文本向量嵌入 (OpenAI text-embedding-3-small)
 *
 * 用途：
 * - 為搜尋索引生成向量
 * - 支援批次處理以提高效率
 * - 自動分塊處理大量文本
 */

import { ConfigManager } from '../agent/ConfigManager';

export interface EmbeddingConfig {
  endpoint: string;
  apiKey: string;
  deployment?: string; // Azure 部署名稱
  model?: string; // OpenAI 模型名稱
  dimensions?: number; // 向量維度 (預設 1536)
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  index: number;
}

export class EmbeddingService {
  private config: EmbeddingConfig;
  private isAzure: boolean;

  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.isAzure = !!config.deployment;

    if (!config.endpoint || !config.apiKey) {
      throw new Error('EmbeddingService requires endpoint and apiKey');
    }
  }

  /**
   * 生成單個文本的向量嵌入
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.generateEmbeddings([text]);
    return result[0].embedding;
  }

  /**
   * 批次生成多個文本的向量嵌入
   * @param texts 文本陣列（最多 2048 個）
   * @returns 向量嵌入結果陣列
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    // OpenAI API 限制：每次最多 2048 個輸入
    if (texts.length > 2048) {
      console.warn(
        `[EmbeddingService] Input exceeds 2048 limit, will process in chunks`
      );
      return this.generateEmbeddingsInChunks(texts, 2048);
    }

    try {
      const url = this.isAzure
        ? `${this.config.endpoint}/openai/deployments/${this.config.deployment}/embeddings?api-version=2024-02-15-preview`
        : `${this.config.endpoint}/v1/embeddings`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.isAzure) {
        headers['api-key'] = this.config.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const requestBody: any = {
        input: texts,
      };

      // Azure 使用 deployment，OpenAI 使用 model
      if (this.isAzure) {
        // Azure 不需要 model 參數
      } else {
        requestBody.model = this.config.model || 'text-embedding-3-small';
      }

      // 可選：指定向量維度（text-embedding-3-small 預設 1536）
      if (this.config.dimensions) {
        requestBody.dimensions = this.config.dimensions;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      // 轉換為標準格式
      return data.data.map((item: any, index: number) => ({
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
   * 分塊處理大量文本
   */
  private async generateEmbeddingsInChunks(
    texts: string[],
    chunkSize: number
  ): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      console.log(
        `[EmbeddingService] Processing chunk ${i / chunkSize + 1}/${Math.ceil(texts.length / chunkSize)}`
      );

      const chunkResults = await this.generateEmbeddings(chunk);

      // 修正索引
      chunkResults.forEach((result) => {
        result.index = i + result.index;
      });

      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * 從 ConfigManager 創建實例
   */
  static fromConfigManager(configManager: ConfigManager): EmbeddingService {
    const config = configManager.getConfig();

    if (!config.llmAPI) {
      throw new Error('LLM API configuration is required for EmbeddingService');
    }

    // 使用與 LLM 相同的 Azure OpenAI 配置
    return new EmbeddingService({
      endpoint: config.llmAPI.endpoint,
      apiKey: config.llmAPI.apiKey,
      deployment: 'text-embedding-3-small', // 需要部署 embedding 模型
      dimensions: 1536, // text-embedding-3-small 的預設維度
    });
  }
}

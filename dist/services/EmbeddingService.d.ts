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
    deployment?: string;
    model?: string;
    dimensions?: number;
}
export interface EmbeddingResult {
    text: string;
    embedding: number[];
    index: number;
}
export declare class EmbeddingService {
    private config;
    private isAzure;
    constructor(config: EmbeddingConfig);
    /**
     * 生成單個文本的向量嵌入
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * 批次生成多個文本的向量嵌入
     * @param texts 文本陣列（最多 2048 個）
     * @returns 向量嵌入結果陣列
     */
    generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
    /**
     * 分塊處理大量文本
     */
    private generateEmbeddingsInChunks;
    /**
     * 從 ConfigManager 創建實例
     */
    static fromConfigManager(configManager: ConfigManager): EmbeddingService;
}

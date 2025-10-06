import { ManualIndex } from '../types';
import { ContentExtractor } from './ContentExtractor';
import { OpenAIService } from './OpenAIService';
import { DatabaseService } from './DatabaseService';


/**
 * 手動索引管理服務
 * 允許在後台手動新增索引內容，支持BM25和向量搜索
 */
export class ManualIndexService {
  private static openAIService: OpenAIService | null = null;

  /**
   * 設置OpenAI服務實例（用於生成embeddings）
   */
  static setOpenAIService(service: OpenAIService): void {
    this.openAIService = service;
  }

  /**
   * 獲取所有手動索引
   */
  static async getAll(): Promise<ManualIndex[]> {
    try {
      return await DatabaseService.getManualIndexes();
    } catch (e) {
      console.error('Failed to get manual indexes:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取索引
   */
  static async getById(id: string): Promise<ManualIndex | null> {
    const indexes = await this.getAll();
    return indexes.find(idx => idx.id === id) || null;
  }
  
  /**
   * 創建新索引
   */
  static async create(data: {
    name: string;
    description: string;
    content: string;
    url?: string;
    metadata?: Record<string, any>;
  }): Promise<ManualIndex> {
    const extractor = new ContentExtractor();
    const keywords = extractor.extractKeywords(data.content);
    const fingerprint = extractor.generateFingerprint(data.content);

    // 生成embedding（如果OpenAI服務可用）
    let embedding: number[] | undefined;
    if (this.openAIService) {
      try {
        const textForEmbedding = `${data.name} ${data.description} ${data.content}`;
        embedding = await this.openAIService.generateEmbedding(textForEmbedding);
        console.log('Generated embedding for manual index:', data.name);
      } catch (error) {
        console.warn('Failed to generate embedding:', error);
      }
    }

    const index: ManualIndex = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      content: data.content,
      url: data.url,
      keywords: keywords,
      fingerprint: fingerprint,
      embedding: embedding,
      metadata: data.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const indexes = await this.getAll();
    indexes.push(index);
    await this.saveAll(indexes);

    console.log('Created manual index:', index.id);

    return index;
  }
  
  /**
   * 更新索引
   */
  static async update(id: string, data: {
    name?: string;
    description?: string;
    content?: string;
    metadata?: Record<string, any>;
  }): Promise<ManualIndex | null> {
    const indexes = await this.getAll();
    const index = indexes.find(idx => idx.id === id);

    if (!index) return null;

    // 更新欄位
    if (data.name !== undefined) index.name = data.name;
    if (data.description !== undefined) index.description = data.description;
    if (data.metadata !== undefined) index.metadata = data.metadata;

    // 如果內容有變，重新生成 keywords、fingerprint 和 embedding
    if (data.content !== undefined) {
      index.content = data.content;

      const extractor = new ContentExtractor();
      index.keywords = extractor.extractKeywords(data.content);
      index.fingerprint = extractor.generateFingerprint(data.content);

      // 重新生成embedding
      if (this.openAIService) {
        try {
          const textForEmbedding = `${index.name} ${index.description} ${data.content}`;
          index.embedding = await this.openAIService.generateEmbedding(textForEmbedding);
          console.log('Updated embedding for manual index:', index.name);
        } catch (error) {
          console.warn('Failed to update embedding:', error);
        }
      }
    }

    index.updatedAt = Date.now();

    await this.saveAll(indexes);

    console.log('Updated manual index:', id);

    return index;
  }
  
  /**
   * 刪除索引
   */
  static async delete(id: string): Promise<boolean> {
    const indexes = await this.getAll();
    const newIndexes = indexes.filter(idx => idx.id !== id);

    if (newIndexes.length === indexes.length) {
      return false; // 沒有找到
    }

    await DatabaseService.deleteManualIndex(id);

    console.log('Deleted manual index:', id);

    return true;
  }
  
  /**
   * 搜尋索引（混合搜索：BM25 + Vector Search）
   */
  static async search(query: string, limit: number = 5): Promise<Array<{
    index: ManualIndex;
    score: number;
    breakdown?: {
      bm25Score: number;
      vectorScore: number;
      fingerprintScore: number;
    };
  }>> {
    const indexes = await this.getAll();
    if (indexes.length === 0) return [];

    const extractor = new ContentExtractor();
    const queryKeywords = extractor.extractKeywords(query);
    const queryFingerprint = extractor.generateFingerprint(query);

    // 生成查詢的embedding（如果OpenAI服務可用）
    let queryEmbedding: number[] | null = null;
    if (this.openAIService) {
      try {
        queryEmbedding = await this.openAIService.generateEmbedding(query);
      } catch (error) {
        console.warn('Failed to generate query embedding:', error);
      }
    }

    // 計算混合相似度
    const results = indexes.map(index => {
      const bm25Score = this.calculateBM25Score(queryKeywords, index);
      const fingerprintScore = this.calculateFingerprintScore(queryFingerprint, index.fingerprint);
      const vectorScore = queryEmbedding && index.embedding
        ? this.calculateCosineSimilarity(queryEmbedding, index.embedding)
        : 0;

      // 混合評分：BM25 (40%) + Vector (40%) + Fingerprint (20%)
      let finalScore: number;
      if (vectorScore > 0) {
        finalScore = bm25Score * 0.4 + vectorScore * 0.4 + fingerprintScore * 0.2;
      } else {
        // 如果沒有vector score，使用原來的算法
        finalScore = bm25Score * 0.6 + fingerprintScore * 0.4;
      }

      return {
        index,
        score: finalScore,
        breakdown: {
          bm25Score,
          vectorScore,
          fingerprintScore
        }
      };
    });

    // 排序並返回 top N
    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * 計算BM25分數
   */
  private static calculateBM25Score(queryKeywords: string[], index: ManualIndex): number {
    if (queryKeywords.length === 0 || index.keywords.length === 0) return 0;

    const k1 = 1.2; // 詞頻飽和參數
    const b = 0.75; // 文檔長度正規化參數

    // 計算文檔長度
    const docLength = index.content.length;
    const avgDocLength = 1000; // 假設平均文檔長度

    let score = 0;

    for (const term of queryKeywords) {
      // 計算詞頻 (TF)
      const tf = index.keywords.filter(k => k === term).length;
      if (tf === 0) continue;

      // 簡化的IDF計算（在實際應用中應該基於整個語料庫）
      const idf = Math.log(10 / (1 + 1)); // 假設語料庫大小為10，包含該詞的文檔數為1

      // BM25公式
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    }

    // 正規化到0-1範圍
    return Math.min(score / queryKeywords.length, 1);
  }

  /**
   * 計算餘弦相似度
   */
  private static calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  /**
   * 計算關鍵字分數
   */
  private static calculateKeywordScore(query: string[], index: string[]): number {
    if (query.length === 0 || index.length === 0) return 0;
    
    const matches = query.filter(k => index.includes(k)).length;
    return matches / Math.max(query.length, index.length);
  }
  
  /**
   * 計算 Fingerprint 分數（Jaccard similarity）
   */
  private static calculateFingerprintScore(fp1: number[], fp2: number[]): number {
    if (fp1.length === 0 || fp2.length === 0) return 0;
    
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < Math.max(fp1.length, fp2.length); i++) {
      const a = fp1[i] || 0;
      const b = fp2[i] || 0;
      
      if (a === 1 && b === 1) intersection++;
      if (a === 1 || b === 1) union++;
    }
    
    return union > 0 ? intersection / union : 0;
  }
  
  /**
   * 保存所有索引
   */
  private static async saveAll(indexes: ManualIndex[]): Promise<void> {
    // 保存所有索引到資料庫
    for (const index of indexes) {
      await DatabaseService.saveManualIndex(index);
    }
  }
  
  /**
   * 生成 ID
   */
  private static generateId(): string {
    return 'idx_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * 清除所有索引（用於測試）
   */
  static async clearAll(): Promise<void> {
    const indexes = await this.getAll();
    for (const index of indexes) {
      await DatabaseService.deleteManualIndex(index.id);
    }
  }
  
  /**
   * 匯出索引（JSON）
   */
  static exportToJSON(): string {
    const indexes = this.getAll();
    return JSON.stringify(indexes, null, 2);
  }
  
  /**
   * 匯入索引（JSON）
   */
  static async importFromJSON(json: string): Promise<number> {
    try {
      const indexes: ManualIndex[] = JSON.parse(json);

      // 驗證格式
      if (!Array.isArray(indexes)) {
        throw new Error('Invalid format: expected array');
      }

      // 合併到現有索引
      const existing = await this.getAll();
      const merged = [...existing, ...indexes];

      await this.saveAll(merged);

      console.log(`Imported ${indexes.length} manual indexes`);

      return indexes.length;
    } catch (e) {
      console.error('Failed to import indexes:', e);
      throw e;
    }
  }

  /**
   * 為現有索引生成embeddings（批量處理）
   */
  static async generateEmbeddingsForAll(): Promise<number> {
    if (!this.openAIService) {
      console.warn('OpenAI service not available for embedding generation');
      return 0;
    }

    const indexes = await this.getAll();
    let updatedCount = 0;

    for (const index of indexes) {
      if (!index.embedding) {
        try {
          const textForEmbedding = `${index.name} ${index.description} ${index.content}`;
          index.embedding = await this.openAIService.generateEmbedding(textForEmbedding);
          index.updatedAt = Date.now();
          updatedCount++;
          console.log(`Generated embedding for: ${index.name}`);

          // 添加延遲避免API限制
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to generate embedding for ${index.name}:`, error);
        }
      }
    }

    if (updatedCount > 0) {
      await this.saveAll(indexes);
      console.log(`Generated embeddings for ${updatedCount} indexes`);
    }

    return updatedCount;
  }
}


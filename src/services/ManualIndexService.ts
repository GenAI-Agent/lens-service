import { ManualIndex } from '../types';
import { ContentExtractor } from './ContentExtractor';

/**
 * 手動索引管理服務
 * 允許在後台手動新增索引內容
 */
export class ManualIndexService {
  private static readonly STORAGE_KEY = 'sm_manual_indexes';
  
  /**
   * 獲取所有手動索引
   */
  static getAll(): ManualIndex[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse manual indexes:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取索引
   */
  static getById(id: string): ManualIndex | null {
    const indexes = this.getAll();
    return indexes.find(idx => idx.id === id) || null;
  }
  
  /**
   * 創建新索引
   */
  static create(data: {
    name: string;
    description: string;
    content: string;
    metadata?: Record<string, any>;
  }): ManualIndex {
    const extractor = new ContentExtractor();
    const keywords = extractor.extractKeywords(data.content);
    const fingerprint = extractor.generateFingerprint(data.content);
    
    const index: ManualIndex = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      content: data.content,
      keywords: keywords,
      fingerprint: fingerprint,
      metadata: data.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const indexes = this.getAll();
    indexes.push(index);
    this.saveAll(indexes);
    
    console.log('Created manual index:', index.id);
    
    return index;
  }
  
  /**
   * 更新索引
   */
  static update(id: string, data: {
    name?: string;
    description?: string;
    content?: string;
    metadata?: Record<string, any>;
  }): ManualIndex | null {
    const indexes = this.getAll();
    const index = indexes.find(idx => idx.id === id);
    
    if (!index) return null;
    
    // 更新欄位
    if (data.name !== undefined) index.name = data.name;
    if (data.description !== undefined) index.description = data.description;
    if (data.metadata !== undefined) index.metadata = data.metadata;
    
    // 如果內容有變，重新生成 keywords 和 fingerprint
    if (data.content !== undefined) {
      index.content = data.content;
      
      const extractor = new ContentExtractor();
      index.keywords = extractor.extractKeywords(data.content);
      index.fingerprint = extractor.generateFingerprint(data.content);
    }
    
    index.updatedAt = Date.now();
    
    this.saveAll(indexes);
    
    console.log('Updated manual index:', id);
    
    return index;
  }
  
  /**
   * 刪除索引
   */
  static delete(id: string): boolean {
    const indexes = this.getAll();
    const newIndexes = indexes.filter(idx => idx.id !== id);
    
    if (newIndexes.length === indexes.length) {
      return false; // 沒有找到
    }
    
    this.saveAll(newIndexes);
    
    console.log('Deleted manual index:', id);
    
    return true;
  }
  
  /**
   * 搜尋索引
   */
  static search(query: string, limit: number = 5): Array<{
    index: ManualIndex;
    score: number;
  }> {
    const indexes = this.getAll();
    if (indexes.length === 0) return [];
    
    const extractor = new ContentExtractor();
    const queryKeywords = extractor.extractKeywords(query);
    const queryFingerprint = extractor.generateFingerprint(query);
    
    // 計算相似度
    const results = indexes.map(index => {
      const score = this.calculateSimilarity(
        queryKeywords,
        queryFingerprint,
        index.keywords,
        index.fingerprint
      );
      
      return { index, score };
    });
    
    // 排序並返回 top N
    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * 計算相似度
   */
  private static calculateSimilarity(
    queryKeywords: string[],
    queryFingerprint: number[],
    indexKeywords: string[],
    indexFingerprint: number[]
  ): number {
    // 關鍵字匹配分數（50%）
    const keywordScore = this.calculateKeywordScore(queryKeywords, indexKeywords);
    
    // Fingerprint 相似度（50%）
    const fingerprintScore = this.calculateFingerprintScore(queryFingerprint, indexFingerprint);
    
    return keywordScore * 0.5 + fingerprintScore * 0.5;
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
  private static saveAll(indexes: ManualIndex[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(indexes));
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
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
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
  static importFromJSON(json: string): number {
    try {
      const indexes: ManualIndex[] = JSON.parse(json);
      
      // 驗證格式
      if (!Array.isArray(indexes)) {
        throw new Error('Invalid format: expected array');
      }
      
      // 合併到現有索引
      const existing = this.getAll();
      const merged = [...existing, ...indexes];
      
      this.saveAll(merged);
      
      console.log(`Imported ${indexes.length} manual indexes`);
      
      return indexes.length;
    } catch (e) {
      console.error('Failed to import indexes:', e);
      throw e;
    }
  }
}


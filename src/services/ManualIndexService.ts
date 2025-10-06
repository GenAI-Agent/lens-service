import { DatabaseService } from './DatabaseService';

export class ManualIndexService {
  static async getAll(): Promise<any[]> {
    try {
      return await DatabaseService.getManualIndexes();
    } catch (e) {
      console.error('Failed to get manual indexes:', e);
      return [];
    }
  }
  
  static async getById(id: string): Promise<any | null> {
    const indexes = await this.getAll();
    return indexes.find(idx => idx.id.toString() === id) || null;
  }
  
  static async create(data: { title: string; content: string; url?: string; description?: string; }): Promise<any> {
    try {
      await DatabaseService.createManualIndex(data.title, data.description || '', data.content, data.url || '', []);
      console.log('Created manual index:', data.title);
      return { success: true };
    } catch (error) {
      console.error('Failed to create manual index:', error);
      throw error;
    }
  }

  static async update(id: string, data: { title?: string; content?: string; url?: string; description?: string; }): Promise<any | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;
      await DatabaseService.updateManualIndex(
        id,
        data.title || existing.name,
        data.description !== undefined ? data.description : (existing.description || ''),
        data.content || existing.content,
        data.url !== undefined ? data.url : existing.url,
        []
      );
      console.log('Updated manual index:', id);
      return { success: true };
    } catch (error) {
      console.error('Failed to update manual index:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await DatabaseService.deleteManualIndex(id);
      console.log('Deleted manual index:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete manual index:', error);
      return false;
    }
  }
  
  /**
   * 提取中文字符和英文單詞作為關鍵字
   */
  private static extractKeywords(text: string): string[] {
    const textLower = text.toLowerCase();
    // 提取中文字符（單個字符）
    const chineseChars = textLower.match(/[\u4e00-\u9fa5]/g) || [];
    // 提取英文單詞（2個字符以上）
    const englishWords = textLower.match(/[a-z]{2,}/g) || [];
    // 提取數字
    const numbers = textLower.match(/\d+/g) || [];
    return [...chineseChars, ...englishWords, ...numbers];
  }

  /**
   * 計算 BM25 分數
   * BM25 是一種基於詞頻的排序算法，用於資訊檢索
   */
  private static calculateBM25Score(
    queryKeywords: string[],
    docKeywords: string[],
    avgDocLength: number,
    k1: number = 1.5,
    b: number = 0.75
  ): number {
    if (docKeywords.length === 0) return 0;

    let score = 0;
    const docLength = docKeywords.length;

    for (const queryKeyword of queryKeywords) {
      // 計算詞頻 (term frequency)
      const tf = docKeywords.filter(k => k === queryKeyword).length;
      if (tf === 0) continue;

      // BM25 公式
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      score += numerator / denominator;
    }

    return score;
  }

  static async search(query: string): Promise<any[]> {
    try {
      console.log('🔍 ManualIndexService.search() called with query:', query);
      const indexes = await this.getAll();
      console.log('🔍 ManualIndexService.getAll() returned:', indexes.length, 'indexes');

      if (indexes.length === 0) return [];
      if (!query.trim()) return indexes;

      // 提取查詢關鍵字
      const queryKeywords = this.extractKeywords(query);
      console.log('🔍 Query keywords:', queryKeywords);

      // 計算平均文檔長度
      const allDocKeywords = indexes.map(index => {
        const title = index.title || index.name || '';
        const description = index.description || '';
        const content = index.content || '';
        const fullText = `${title} ${description} ${content}`;
        return this.extractKeywords(fullText);
      });
      const avgDocLength = allDocKeywords.reduce((sum, keywords) => sum + keywords.length, 0) / allDocKeywords.length;

      // 計算每個索引的分數
      const scoredIndexes = indexes.map((index, i) => {
        const docKeywords = allDocKeywords[i];
        const bm25Score = this.calculateBM25Score(queryKeywords, docKeywords, avgDocLength);

        // 額外加分：標題匹配
        const title = (index.title || index.name || '').toLowerCase();
        const titleKeywords = this.extractKeywords(title);
        const titleMatchCount = queryKeywords.filter(k => titleKeywords.includes(k)).length;
        const titleBonus = titleMatchCount * 2; // 標題匹配給予 2 倍加分

        const totalScore = bm25Score + titleBonus;

        console.log('🔍 Index:', {
          title: title.substring(0, 30),
          bm25Score: bm25Score.toFixed(2),
          titleBonus: titleBonus.toFixed(2),
          totalScore: totalScore.toFixed(2)
        });

        return {
          ...index,
          _score: totalScore
        };
      });

      // 過濾出分數 > 0 的結果並排序
      const results = scoredIndexes
        .filter(index => index._score > 0)
        .sort((a, b) => b._score - a._score);

      console.log('🔍 ManualIndexService.search() returning:', results.length, 'results');
      if (results.length > 0) {
        console.log('🔍 Top result:', {
          title: results[0].title || results[0].name,
          score: results[0]._score.toFixed(2)
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to search manual indexes:', error);
      return [];
    }
  }
}

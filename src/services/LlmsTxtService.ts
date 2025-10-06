import { DatabaseService } from './DatabaseService';

/**
 * LLMs.txt 服務
 * 負責抓取和處理 llms.txt 內容
 */
export class LlmsTxtService {
  private static cache: {
    url: string;
    content: string;
    chunks: string[];
    timestamp: number;
  } | null = null;

  private static readonly CACHE_DURATION = 3600000; // 1 小時
  private static readonly CHUNK_SIZE = 500; // 每個 chunk 的字符數
  private static readonly CHUNK_OVERLAP = 100; // chunk 之間的重疊字符數

  /**
   * 獲取並處理 llms.txt 內容
   */
  static async getLlmsTxtChunks(): Promise<string[]> {
    try {
      // 從資料庫獲取 URL
      const url = await DatabaseService.getSetting('llms_txt_url');
      if (!url) {
        console.log('No llms.txt URL configured');
        return [];
      }

      // 檢查緩存
      const now = Date.now();
      if (this.cache && this.cache.url === url && (now - this.cache.timestamp) < this.CACHE_DURATION) {
        console.log('Using cached llms.txt chunks');
        return this.cache.chunks;
      }

      // 抓取內容
      console.log('Fetching llms.txt from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.status}`);
      }

      const content = await response.text();
      console.log('Fetched llms.txt content, length:', content.length);

      // 切分成 chunks
      const chunks = this.splitIntoChunks(content);
      console.log('Split into', chunks.length, 'chunks');

      // 更新緩存
      this.cache = {
        url,
        content,
        chunks,
        timestamp: now
      };

      return chunks;
    } catch (error) {
      console.error('Error fetching llms.txt:', error);
      return [];
    }
  }

  /**
   * 將文本切分成 chunks（帶重疊）
   */
  private static splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunk = text.substring(start, end);
      chunks.push(chunk);

      // 移動到下一個 chunk，考慮重疊
      start += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }

    return chunks;
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

  /**
   * 搜索相關的 chunks（使用 BM25 算法）
   */
  static async searchChunks(query: string): Promise<Array<{ chunk: string; context: string; score: number }>> {
    const chunks = await this.getLlmsTxtChunks();
    if (chunks.length === 0) {
      return [];
    }

    console.log('🔍 LlmsTxtService.searchChunks() called with query:', query);

    // 提取查詢關鍵字
    const queryKeywords = this.extractKeywords(query);
    console.log('🔍 Query keywords:', queryKeywords);

    // 計算平均文檔長度
    const allChunkKeywords = chunks.map(chunk => this.extractKeywords(chunk));
    const avgChunkLength = allChunkKeywords.reduce((sum, keywords) => sum + keywords.length, 0) / allChunkKeywords.length;

    // 計算每個 chunk 的分數
    const scoredChunks = chunks.map((chunk, index) => {
      const chunkKeywords = allChunkKeywords[index];
      const bm25Score = this.calculateBM25Score(queryKeywords, chunkKeywords, avgChunkLength);

      return {
        chunk,
        context: '',
        score: bm25Score,
        index
      };
    });

    // 過濾出分數 > 0 的結果並排序
    const results = scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log('🔍 LlmsTxtService found', results.length, 'matching chunks');
    if (results.length > 0) {
      console.log('🔍 Top chunk score:', results[0].score.toFixed(2));
    }

    // 取前 5 個結果，並添加前後文
    const topResults = results.slice(0, 5);

    // 為每個結果添加前後文（前一個和後一個 chunk）
    topResults.forEach(result => {
      const contextChunks: string[] = [];

      // 添加前一個 chunk
      if (result.index > 0) {
        contextChunks.push(chunks[result.index - 1]);
      }

      // 添加當前 chunk
      contextChunks.push(result.chunk);

      // 添加後一個 chunk
      if (result.index < chunks.length - 1) {
        contextChunks.push(chunks[result.index + 1]);
      }

      result.context = contextChunks.join('\n...\n');
    });

    return topResults.map(r => ({ chunk: r.chunk, context: r.context, score: r.score }));
  }

  /**
   * 清除緩存
   */
  static clearCache(): void {
    this.cache = null;
  }
}


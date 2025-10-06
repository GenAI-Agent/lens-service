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
   * 搜索相關的 chunks（使用簡單的文字匹配）
   */
  static async searchChunks(query: string): Promise<Array<{ chunk: string; context: string; score: number }>> {
    const chunks = await this.getLlmsTxtChunks();
    if (chunks.length === 0) {
      return [];
    }

    const results: Array<{ chunk: string; context: string; score: number; index: number }> = [];

    // 將查詢轉換為小寫以進行不區分大小寫的搜索
    const queryLower = query.toLowerCase();
    // 提取中文字符和英文單詞
    const chineseChars = queryLower.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = queryLower.match(/[a-z]+/g) || [];
    const allKeywords = [...chineseChars, ...englishWords.filter(w => w.length > 1)];

    // 搜索每個 chunk
    chunks.forEach((chunk, index) => {
      const chunkLower = chunk.toLowerCase();

      // 計算相關度分數
      let score = 0;

      // 完整查詢匹配
      if (chunkLower.includes(queryLower)) {
        score += 20;
      }

      // 關鍵字匹配（中文字符和英文單詞）
      allKeywords.forEach(keyword => {
        if (chunkLower.includes(keyword)) {
          score += 2;
        }
      });

      // 如果有分數，加入結果
      if (score > 0) {
        results.push({ chunk, context: '', score, index });
      }
    });

    // 按分數排序
    results.sort((a, b) => b.score - a.score);

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


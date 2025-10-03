/**
 * 搜尋索引構建器
 * 用於生成方案 E 的混合索引（Bloom Filter + 倒排索引 + TF-IDF）
 */

export interface IndexedPage {
  id: number;
  url: string;
  title: string;
  snippet: string;
  keywords: string[];
  fingerprint: number[];
}

export interface InvertedIndex {
  [keyword: string]: Array<{ id: number; score: number }>;
}

export interface SearchIndex {
  version: string;
  lastUpdated: number;
  type: 'site' | 'project';
  config: {
    totalPages: number;
    totalKeywords: number;
  };
  bloomFilter: {
    bits: string;  // base64 encoded
    size: number;
    hashCount: number;
  };
  invertedIndex: InvertedIndex;
  tfidf: {
    [pageId: number]: { [keyword: string]: number };
  };
  pages: IndexedPage[];
}

export class SearchIndexBuilder {
  private pages: IndexedPage[] = [];
  private documentFrequency: Map<string, number> = new Map();
  
  /**
   * 添加頁面到索引
   */
  addPage(url: string, title: string, content: string): void {
    const id = this.pages.length;
    
    // 提取關鍵字
    const keywords = this.extractKeywords(content);
    
    // 生成指紋
    const fingerprint = this.generateFingerprint(keywords);
    
    // 生成摘要
    const snippet = this.generateSnippet(content);
    
    this.pages.push({
      id,
      url,
      title,
      snippet,
      keywords,
      fingerprint
    });
    
    // 更新文檔頻率
    keywords.forEach(keyword => {
      this.documentFrequency.set(
        keyword,
        (this.documentFrequency.get(keyword) || 0) + 1
      );
    });
  }
  
  /**
   * 構建完整索引
   */
  build(type: 'site' | 'project'): SearchIndex {
    const invertedIndex = this.buildInvertedIndex();
    const tfidf = this.calculateTFIDF();
    const bloomFilter = this.buildBloomFilter();
    
    return {
      version: '1.0.0',
      lastUpdated: Date.now(),
      type,
      config: {
        totalPages: this.pages.length,
        totalKeywords: this.documentFrequency.size
      },
      bloomFilter,
      invertedIndex,
      tfidf,
      pages: this.pages
    };
  }
  
  /**
   * 提取關鍵字
   */
  private extractKeywords(content: string): string[] {
    // 移除 HTML 標籤
    const text = content.replace(/<[^>]*>/g, ' ');
    
    // 分詞（簡單版本，支援中英文）
    const words = text
      .toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter(word => word.length > 1);
    
    // 移除停用詞
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一',
      '個', '上', '也', '很', '到', '說', '要', '去', '你', '會', '著', '沒'
    ]);
    
    const filtered = words.filter(word => !stopWords.has(word));
    
    // 計算詞頻，取前 50 個
    const frequency = new Map<string, number>();
    filtered.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  }
  
  /**
   * 生成指紋（用於快速相似度比較）
   */
  private generateFingerprint(keywords: string[]): number[] {
    return keywords.slice(0, 20).map(keyword => this.simpleHash(keyword));
  }
  
  /**
   * 簡單哈希函數
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * 生成摘要
   */
  private generateSnippet(content: string, maxLength: number = 200): string {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * 構建倒排索引
   */
  private buildInvertedIndex(): InvertedIndex {
    const index: InvertedIndex = {};
    
    this.pages.forEach(page => {
      page.keywords.forEach(keyword => {
        if (!index[keyword]) {
          index[keyword] = [];
        }
        
        // 計算初步分數（基於詞頻）
        const termFrequency = page.keywords.filter(k => k === keyword).length;
        const score = termFrequency / page.keywords.length;
        
        index[keyword].push({
          id: page.id,
          score
        });
      });
    });
    
    return index;
  }
  
  /**
   * 計算 TF-IDF
   */
  private calculateTFIDF(): { [pageId: number]: { [keyword: string]: number } } {
    const tfidf: { [pageId: number]: { [keyword: string]: number } } = {};
    const totalDocs = this.pages.length;
    
    this.pages.forEach(page => {
      tfidf[page.id] = {};
      
      page.keywords.forEach(keyword => {
        // TF: 詞頻
        const tf = page.keywords.filter(k => k === keyword).length / page.keywords.length;
        
        // IDF: 逆文檔頻率
        const df = this.documentFrequency.get(keyword) || 1;
        const idf = Math.log(totalDocs / df);
        
        // TF-IDF
        tfidf[page.id][keyword] = tf * idf;
      });
    });
    
    return tfidf;
  }
  
  /**
   * 構建 Bloom Filter
   */
  private buildBloomFilter(): { bits: string; size: number; hashCount: number } {
    // 計算最佳大小
    const n = this.documentFrequency.size;  // 關鍵字數量
    const p = 0.01;  // 假陽性率 1%
    const m = Math.ceil(-(n * Math.log(p)) / (Math.log(2) ** 2));  // 位數組大小
    const k = Math.ceil((m / n) * Math.log(2));  // 哈希函數數量
    
    // 創建位數組
    const bits = new Uint8Array(Math.ceil(m / 8));
    
    // 添加所有關鍵字
    this.documentFrequency.forEach((_, keyword) => {
      for (let i = 0; i < k; i++) {
        const hash = this.bloomHash(keyword, i) % m;
        const byteIndex = Math.floor(hash / 8);
        const bitIndex = hash % 8;
        bits[byteIndex] |= (1 << bitIndex);
      }
    });
    
    // 轉換為 base64
    const base64 = this.uint8ArrayToBase64(bits);
    
    return {
      bits: base64,
      size: m,
      hashCount: k
    };
  }
  
  /**
   * Bloom Filter 哈希函數
   */
  private bloomHash(str: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * Uint8Array 轉 Base64
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = Array.from(bytes)
      .map(byte => String.fromCharCode(byte))
      .join('');
    return btoa(binary);
  }

  /**
   * 搜尋索引
   */
  search(index: SearchIndex, query: string, maxResults: number = 10): Array<{
    page: IndexedPage;
    score: number;
    matchedKeywords: string[];
  }> {
    const queryKeywords = this.extractKeywords(query);
    const results = new Map<number, { score: number; matchedKeywords: Set<string> }>();

    // 1. 使用倒排索引找到候選頁面
    queryKeywords.forEach(keyword => {
      const entries = index.invertedIndex[keyword];
      if (entries) {
        entries.forEach(entry => {
          const existing = results.get(entry.id) || { score: 0, matchedKeywords: new Set() };

          // 使用 TF-IDF 分數
          const tfidfScore = index.tfidf[entry.id]?.[keyword] || entry.score;
          existing.score += tfidfScore;
          existing.matchedKeywords.add(keyword);

          results.set(entry.id, existing);
        });
      }
    });

    // 2. 轉換為結果陣列並排序
    const sortedResults = Array.from(results.entries())
      .map(([pageId, data]) => ({
        page: index.pages[pageId],
        score: data.score,
        matchedKeywords: Array.from(data.matchedKeywords)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return sortedResults;
  }
}


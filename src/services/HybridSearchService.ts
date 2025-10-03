/**
 * 混合搜尋服務
 * 整合專案搜尋和網站搜尋
 */

import { SearchIndex } from '../types';
import { PageExtractor } from './PageExtractor';

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  screenshots?: Array<{
    heading: string;
    screenshot: string;
  }>;
  score: number;
  source: 'project' | 'site';
}

export class HybridSearchService {
  private projectIndex: SearchIndex | null = null;
  private siteIndex: SearchIndex | null = null;
  private pageExtractor: PageExtractor;
  
  constructor() {
    this.pageExtractor = new PageExtractor();
    this.loadIndices();
  }
  
  /**
   * 載入索引
   */
  private async loadIndices(): Promise<void> {
    try {
      // 載入專案索引
      const projectResponse = await fetch('/search-db/project-index.json');
      if (projectResponse.ok) {
        this.projectIndex = await projectResponse.json();
      }
    } catch (error) {
      console.warn('Failed to load project index:', error);
    }
    
    try {
      // 載入網站索引
      const siteResponse = await fetch('/search-db/site-index.json');
      if (siteResponse.ok) {
        this.siteIndex = await siteResponse.json();
      }
    } catch (error) {
      console.warn('Failed to load site index:', error);
    }
  }
  
  /**
   * 搜尋專案頁面
   */
  async searchProject(query: string): Promise<SearchResult[]> {
    if (!this.projectIndex) {
      throw new Error('Project index not loaded');
    }
    
    const results = await this.search(query, this.projectIndex, 'project');
    return this.enrichResults(results);
  }
  
  /**
   * 搜尋網站
   */
  async searchSite(query: string): Promise<SearchResult[]> {
    if (!this.siteIndex) {
      throw new Error('Site index not loaded');
    }
    
    const results = await this.search(query, this.siteIndex, 'site');
    return this.enrichResults(results);
  }
  
  /**
   * 核心搜尋邏輯
   */
  private async search(
    query: string,
    index: SearchIndex,
    source: 'project' | 'site'
  ): Promise<SearchResult[]> {
    // 1. 提取查詢關鍵字
    const keywords = this.extractKeywords(query);
    
    // 2. Bloom Filter 預過濾
    const candidates = this.bloomFilterCheck(keywords, index);
    
    // 3. 倒排索引查詢
    const matches = this.invertedIndexSearch(keywords, index, candidates);
    
    // 4. TF-IDF 排序
    const ranked = this.rankByTFIDF(matches, keywords, index);
    
    // 5. 去重（同一個 URL 只保留一個）
    const deduped = this.deduplicateByUrl(ranked);
    
    // 6. 轉換為結果格式
    return deduped.slice(0, 5).map(match => ({
      url: index.pages[match.id].url,
      title: index.pages[match.id].title,
      content: index.pages[match.id].snippet,
      sections: [],  // 稍後補充
      score: match.score,
      source
    }));
  }
  
  /**
   * 提取關鍵字
   */
  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter(word => word.length > 1);
  }
  
  /**
   * Bloom Filter 檢查
   */
  private bloomFilterCheck(keywords: string[], index: SearchIndex): Set<number> {
    const candidates = new Set<number>();
    
    // 解碼 Bloom Filter
    const bits = this.base64ToUint8Array(index.bloomFilter.bits);
    const { size, hashCount } = index.bloomFilter;
    
    // 檢查每個關鍵字
    keywords.forEach(keyword => {
      let exists = true;
      
      for (let i = 0; i < hashCount; i++) {
        const hash = this.bloomHash(keyword, i) % size;
        const byteIndex = Math.floor(hash / 8);
        const bitIndex = hash % 8;
        
        if (!(bits[byteIndex] & (1 << bitIndex))) {
          exists = false;
          break;
        }
      }
      
      // 如果關鍵字可能存在，添加所有包含它的頁面
      if (exists && index.invertedIndex[keyword]) {
        index.invertedIndex[keyword].forEach(item => {
          candidates.add(item.id);
        });
      }
    });
    
    return candidates;
  }
  
  /**
   * 倒排索引搜尋
   */
  private invertedIndexSearch(
    keywords: string[],
    index: SearchIndex,
    candidates: Set<number>
  ): Array<{ id: number; score: number }> {
    const scores = new Map<number, number>();
    
    keywords.forEach(keyword => {
      const postings = index.invertedIndex[keyword];
      if (!postings) return;
      
      postings.forEach(posting => {
        if (candidates.has(posting.id)) {
          scores.set(posting.id, (scores.get(posting.id) || 0) + posting.score);
        }
      });
    });
    
    return Array.from(scores.entries()).map(([id, score]) => ({ id, score }));
  }
  
  /**
   * TF-IDF 排序
   */
  private rankByTFIDF(
    matches: Array<{ id: number; score: number }>,
    keywords: string[],
    index: SearchIndex
  ): Array<{ id: number; score: number }> {
    return matches
      .map(match => {
        let tfidfScore = 0;
        
        keywords.forEach(keyword => {
          if (index.tfidf[match.id] && index.tfidf[match.id][keyword]) {
            tfidfScore += index.tfidf[match.id][keyword];
          }
        });
        
        return {
          id: match.id,
          score: match.score * 0.3 + tfidfScore * 0.7  // 混合分數
        };
      })
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * URL 去重
   */
  private deduplicateByUrl(
    matches: Array<{ id: number; score: number }>
  ): Array<{ id: number; score: number }> {
    const seen = new Set<string>();
    const result: Array<{ id: number; score: number }> = [];
    
    matches.forEach(match => {
      const url = this.projectIndex?.pages[match.id]?.url || this.siteIndex?.pages[match.id]?.url;
      if (url && !seen.has(url)) {
        seen.add(url);
        result.push(match);
      }
    });
    
    return result;
  }
  
  /**
   * 豐富結果（添加詳細內容和截圖）
   */
  private async enrichResults(results: SearchResult[]): Promise<SearchResult[]> {
    const enriched = await Promise.all(
      results.map(async result => {
        try {
          // 如果是當前頁面，提取詳細內容
          if (result.url === window.location.pathname || result.url === window.location.href) {
            const extracted = await this.pageExtractor.extractContent();
            const screenshots = await this.pageExtractor.captureScreenshots();
            
            return {
              ...result,
              content: extracted.mainContent,
              sections: extracted.sections,
              screenshots: screenshots.sections
            };
          }
          
          return result;
        } catch (error) {
          console.error(`Failed to enrich result: ${result.url}`, error);
          return result;
        }
      })
    );
    
    return enriched;
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
   * Base64 轉 Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  /**
   * 重新載入索引
   */
  async reloadIndices(): Promise<void> {
    await this.loadIndices();
  }
}


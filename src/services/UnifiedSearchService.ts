import { StorageService } from './StorageService';
import { ManualIndexService } from './ManualIndexService';
import { SitemapService } from './SitemapService';
import { ContentExtractor } from './ContentExtractor';
import { Source } from '../types';

/**
 * 統一搜尋服務
 * 整合所有搜尋來源：手動索引、前端頁面、Sitemap、SQL
 */
export class UnifiedSearchService {
  private extractor: ContentExtractor;

  constructor() {
    this.extractor = new ContentExtractor();
  }

  /**
   * 統一搜尋入口
   * 根據 AgentToolConfig 決定搜尋哪些來源
   */
  async search(query: string, limit: number = 5): Promise<Source[]> {
    const toolConfig = StorageService.loadAgentToolConfig();
    if (!toolConfig) {
      console.warn('No tool config found, using default');
      return [];
    }

    const allResults: Array<Source & { priority: number }> = [];

    // 1. 手動索引搜尋
    if (toolConfig.manualIndex.enabled) {
      const manualResults = await this.searchManualIndex(query);
      allResults.push(...manualResults.map(r => ({
        ...r,
        priority: toolConfig.manualIndex.priority
      })));
    }

    // 2. 前端頁面搜尋
    if (toolConfig.frontendPages.enabled) {
      const pageResults = await this.searchFrontendPages(query);
      allResults.push(...pageResults.map(r => ({
        ...r,
        priority: toolConfig.frontendPages.priority
      })));
    }

    // 3. Sitemap 搜尋
    if (toolConfig.sitemap.enabled) {
      const sitemapResults = await this.searchSitemap(query);
      allResults.push(...sitemapResults.map(r => ({
        ...r,
        priority: toolConfig.sitemap.priority
      })));
    }

    // 4. SQL 資料庫搜尋（暫時跳過，需要後端）
    // if (toolConfig.sqlDatabase.enabled) {
    //   const sqlResults = await this.searchSQL(query);
    //   allResults.push(...sqlResults);
    // }

    // 5. 根據 priority 和 score 排序
    const sortedResults = allResults.sort((a, b) => {
      // 先按 priority 排序，再按 score 排序
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return (b.score || 0) - (a.score || 0);
    });

    // 6. 返回 top N 結果
    return sortedResults.slice(0, limit).map(({ priority, ...source }) => source);
  }

  /**
   * 搜尋手動索引（支持BM25 + Vector Search）
   */
  private async searchManualIndex(query: string): Promise<Source[]> {
    try {
      const results = await ManualIndexService.search(query, 5);

      return results.map(({ index, score, breakdown }) => ({
        type: 'manual-index' as const,
        title: index.name,
        snippet: index.content.substring(0, 200),
        content: index.content,
        url: `#manual-index-${index.id}`,
        score,
        metadata: {
          description: index.description,
          createdAt: index.createdAt,
          hasEmbedding: !!index.embedding,
          scoreBreakdown: breakdown
        }
      }));
    } catch (error) {
      console.error('Error searching manual index:', error);
      return [];
    }
  }

  /**
   * 搜尋前端頁面（已索引的頁面）
   */
  private async searchFrontendPages(query: string): Promise<Source[]> {
    try {
      const indexedPages = StorageService.loadIndexedPages();
      if (indexedPages.length === 0) {
        return [];
      }

      const queryKeywords = this.extractor.extractKeywords(query);

      // 計算每個頁面的相似度
      const results = indexedPages.map(page => {
        // 簡單的關鍵字匹配
        const pageText = `${page.title} ${page.snippet}`.toLowerCase();
        const matchCount = queryKeywords.filter(keyword =>
          pageText.includes(keyword.toLowerCase())
        ).length;

        const score = matchCount / queryKeywords.length;

        return {
          page,
          score
        };
      });

      // 過濾並排序
      return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ page, score }) => ({
          type: 'frontend-page' as const,
          title: page.title,
          snippet: page.snippet,
          content: page.snippet,
          url: page.url,
          score,
          metadata: {
            keywords: page.keywords
          }
        }));
    } catch (error) {
      console.error('Error searching frontend pages:', error);
      return [];
    }
  }

  /**
   * 搜尋 Sitemap 頁面
   */
  private async searchSitemap(query: string): Promise<Source[]> {
    try {
      const configs = SitemapService.getAll();
      const allResults: Source[] = [];

      for (const config of configs) {
        // SitemapService.search 的第二個參數應該是 string[]
        const queryKeywords = this.extractor.extractKeywords(query);
        const results = await SitemapService.search(config.id, queryKeywords, 3);

        allResults.push(...results.map(({ page, score }) => ({
          type: 'sitemap' as const,
          title: page.title,
          snippet: page.content.substring(0, 500),
          content: page.content.substring(0, 500),
          url: page.url,
          score,
          metadata: {
            domain: config.domain,
            lastUpdated: config.lastUpdated
          }
        })));
      }

      // 排序並返回 top 5
      return allResults
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5);
    } catch (error) {
      console.error('Error searching sitemap:', error);
      return [];
    }
  }

  /**
   * 格式化搜尋結果為上下文字串
   */
  formatContext(sources: Source[]): string {
    if (sources.length === 0) {
      return '';
    }

    let context = '以下是相關的參考資料：\n\n';

    sources.forEach((source, index) => {
      context += `[${index + 1}] ${source.title}\n`;
      context += `來源：${source.type}\n`;
      context += `內容：${source.content}\n`;
      if (source.url) {
        context += `連結：${source.url}\n`;
      }
      context += '\n';
    });

    return context;
  }

  /**
   * 檢查是否需要搜尋
   */
  shouldSearch(message: string): boolean {
    const searchKeywords = [
      '搜尋', '查詢', '找', '哪裡', '如何', '怎麼', '什麼',
      'search', 'find', 'where', 'how', 'what', 'which',
      '功能', '頁面', '文件', '說明', '介紹', '資訊',
      '有沒有', '可以', '能不能', '是否'
    ];

    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}


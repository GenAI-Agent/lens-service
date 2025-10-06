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
  async search(query: string, limit: number = 8): Promise<Source[]> {
    const allResults: Array<Source & { priority: number }> = [];

    // 1. 手動索引搜尋 (3個結果)
    try {
      const manualResults = await this.searchManualIndex(query, 3);
      allResults.push(...manualResults.map(r => ({
        ...r,
        priority: 1
      })));
    } catch (error) {
      console.log('Manual index search failed:', error);
    }

    // 2. Agent內容搜尋 (3個結果)
    try {
      const agentContentResults = await this.searchAgentContent(query, 3);
      allResults.push(...agentContentResults.map(r => ({
        ...r,
        priority: 2
      })));
    } catch (error) {
      console.log('Agent content search failed:', error);
    }

    // 前端頁面搜尋已移除

    // 4. 根據 priority 和 score 排序
    const sortedResults = allResults.sort((a, b) => {
      // 先按 priority 排序（數字越小優先級越高），再按 score 排序
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return (b.score || 0) - (a.score || 0);
    });

    // 5. 返回結果
    return sortedResults.slice(0, limit).map(({ priority, ...source }) => source);
  }

  /**
   * 搜尋手動索引（支持BM25 + Vector Search）
   */
  private async searchManualIndex(query: string, limit: number = 3): Promise<Source[]> {
    try {
      const results = await ManualIndexService.search(query, limit);

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

  // 前端頁面搜尋功能已移除

  /**
   * 搜尋 Agent 內容頁面
   */
  private async searchAgentContent(query: string, limit: number = 3): Promise<Source[]> {
    try {
      const { AgentContentService } = await import('./AgentContentService');
      const results = await AgentContentService.searchAgentContentPages(query, limit);

      return results.map(result => ({
        type: 'agent-content' as const,
        title: result.title,
        snippet: result.content.substring(0, 500),
        content: result.content,
        url: result.url,
        score: result.score,
        metadata: {
          source: result.source
        }
      }));
    } catch (error) {
      console.error('Error searching agent content:', error);
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


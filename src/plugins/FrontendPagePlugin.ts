import { SearchPlugin } from './SearchPlugin';
import { Source } from '../types';
import { StorageService } from '../services/StorageService';
import { ContentExtractor } from '../services/ContentExtractor';

/**
 * 前端頁面搜尋 Plugin
 */
export class FrontendPagePlugin implements SearchPlugin {
  readonly id = 'frontend-pages';
  readonly name = '前端頁面';
  readonly description = '搜尋當前網站已索引的頁面內容';

  priority: number = 8;
  enabled: boolean = true;

  private extractor: ContentExtractor;

  constructor() {
    this.extractor = new ContentExtractor();
  }

  async initialize(): Promise<void> {
    const pages = StorageService.loadIndexedPages();
    console.log(`📄 Frontend Page Plugin: ${pages.length} pages loaded`);
  }

  async search(query: string, limit: number = 5): Promise<Source[]> {
    try {
      const indexedPages = StorageService.loadIndexedPages();
      if (indexedPages.length === 0) {
        return [];
      }

      const queryKeywords = this.extractor.extractKeywords(query);

      // 計算每個頁面的相似度
      const results = indexedPages.map(page => {
        const pageText = `${page.title} ${page.snippet}`.toLowerCase();
        const matchCount = queryKeywords.filter(keyword =>
          pageText.includes(keyword.toLowerCase())
        ).length;

        const score = matchCount / queryKeywords.length;

        return { page, score };
      });

      // 過濾並排序
      return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ page, score }) => ({
          type: 'frontend-page' as const,
          title: page.title,
          snippet: page.snippet,
          content: page.snippet,
          url: page.url,
          score,
          metadata: {
            keywords: page.keywords,
            pageId: page.id
          }
        }));
    } catch (error) {
      console.error('Error in FrontendPagePlugin.search:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return StorageService.loadIndexedPages().length > 0;
  }

  getConfig(): any {
    return {
      enabled: this.enabled,
      priority: this.priority,
      pageCount: StorageService.loadIndexedPages().length
    };
  }

  updateConfig(config: any): void {
    if (typeof config.enabled === 'boolean') {
      this.enabled = config.enabled;
    }
    if (typeof config.priority === 'number') {
      this.priority = config.priority;
    }
  }

  dispose(): void {
    // 清理資源
  }
}


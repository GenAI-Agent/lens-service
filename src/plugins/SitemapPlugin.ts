import { SearchPlugin } from './SearchPlugin';
import { Source } from '../types';
import { SitemapService } from '../services/SitemapService';
import { ContentExtractor } from '../services/ContentExtractor';

/**
 * Sitemap 搜尋 Plugin
 */
export class SitemapPlugin implements SearchPlugin {
  readonly id = 'sitemap';
  readonly name = 'Sitemap 索引';
  readonly description = '搜尋外部網站的 Sitemap 內容';

  priority: number = 6;
  enabled: boolean = false; // 預設關閉，需要配置 Sitemap 後才啟用

  private extractor: ContentExtractor;

  constructor() {
    this.extractor = new ContentExtractor();
  }

  async initialize(): Promise<void> {
    const configs = SitemapService.getAll();
    console.log(`🗺️ Sitemap Plugin: ${configs.length} sitemaps loaded`);

    // 如果有配置，自動啟用
    if (configs.length > 0) {
      this.enabled = true;
    }
  }

  async search(query: string, limit: number = 5): Promise<Source[]> {
    try {
      const configs = SitemapService.getAll();
      if (configs.length === 0) {
        return [];
      }

      const allResults: Source[] = [];
      const queryKeywords = this.extractor.extractKeywords(query);

      for (const config of configs) {
        try {
          const results = await SitemapService.search(config.id, queryKeywords, 3);

          allResults.push(...results.map(({ page, score }) => ({
            type: 'sitemap' as const,
            title: page.title,
            snippet: page.content.substring(0, 200),
            content: page.content.substring(0, 500),
            url: page.url,
            score,
            metadata: {
              domain: config.domain,
              lastUpdated: config.lastUpdated,
              sitemapId: config.id
            }
          })));
        } catch (error) {
          console.error(`Error searching sitemap ${config.domain}:`, error);
        }
      }

      // 排序並返回 top N
      return allResults
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error in SitemapPlugin.search:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return SitemapService.getAll().length > 0;
  }

  getConfig(): any {
    return {
      enabled: this.enabled,
      priority: this.priority,
      sitemapCount: SitemapService.getAll().length
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


import { SearchPlugin } from './SearchPlugin';
import { Source } from '../types';
import { ManualIndexService } from '../services/ManualIndexService';

/**
 * 手動索引搜尋 Plugin
 */
export class ManualIndexPlugin implements SearchPlugin {
  readonly id = 'manual-index';
  readonly name = '手動索引';
  readonly description = '搜尋管理員手動新增的索引內容';

  priority: number = 10;
  enabled: boolean = true;

  async initialize(): Promise<void> {
    // 檢查是否有索引資料
    const indexes = ManualIndexService.getAll();
    console.log(`📚 Manual Index Plugin: ${indexes.length} indexes loaded`);
  }

  async search(query: string, limit: number = 5): Promise<Source[]> {
    try {
      const results = ManualIndexService.search(query, limit);

      return results.map(({ index, score }) => ({
        type: 'manual-index' as const,
        title: index.name,
        snippet: index.content.substring(0, 200),
        content: index.content,
        url: `#manual-index-${index.id}`,
        score,
        metadata: {
          description: index.description,
          createdAt: index.createdAt,
          indexId: index.id
        }
      }));
    } catch (error) {
      console.error('Error in ManualIndexPlugin.search:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    // 檢查是否有索引資料
    return ManualIndexService.getAll().length > 0;
  }

  getConfig(): any {
    return {
      enabled: this.enabled,
      priority: this.priority,
      indexCount: ManualIndexService.getAll().length
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
    // 清理資源（如果需要）
  }
}


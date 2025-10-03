import { Source } from '../types';

/**
 * 搜尋 Plugin 基礎介面
 * 所有搜尋來源都必須實作這個介面
 */
export interface SearchPlugin {
  /**
   * Plugin 唯一識別碼
   */
  readonly id: string;

  /**
   * Plugin 名稱
   */
  readonly name: string;

  /**
   * Plugin 描述
   */
  readonly description: string;

  /**
   * Plugin 優先級（數字越大優先級越高）
   */
  priority: number;

  /**
   * Plugin 是否啟用
   */
  enabled: boolean;

  /**
   * 初始化 Plugin
   */
  initialize(): Promise<void>;

  /**
   * 搜尋方法
   * @param query 搜尋查詢
   * @param limit 返回結果數量限制
   * @returns 搜尋結果
   */
  search(query: string, limit?: number): Promise<Source[]>;

  /**
   * 檢查 Plugin 是否可用
   */
  isAvailable(): boolean;

  /**
   * 獲取 Plugin 配置
   */
  getConfig(): any;

  /**
   * 更新 Plugin 配置
   */
  updateConfig(config: any): void;

  /**
   * 清理資源
   */
  dispose(): void;
}

/**
 * Plugin 管理器
 */
export class PluginManager {
  private plugins: Map<string, SearchPlugin> = new Map();

  /**
   * 註冊 Plugin
   */
  register(plugin: SearchPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered, replacing...`);
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`✅ Plugin registered: ${plugin.name} (${plugin.id})`);
  }

  /**
   * 取消註冊 Plugin
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.dispose();
      this.plugins.delete(pluginId);
      console.log(`❌ Plugin unregistered: ${plugin.name} (${pluginId})`);
    }
  }

  /**
   * 獲取 Plugin
   */
  getPlugin(pluginId: string): SearchPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 獲取所有 Plugin
   */
  getAllPlugins(): SearchPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 獲取所有啟用的 Plugin
   */
  getEnabledPlugins(): SearchPlugin[] {
    return this.getAllPlugins()
      .filter(plugin => plugin.enabled && plugin.isAvailable())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 初始化所有 Plugin
   */
  async initializeAll(): Promise<void> {
    const plugins = this.getAllPlugins();
    console.log(`🔌 Initializing ${plugins.length} plugins...`);

    await Promise.all(
      plugins.map(async (plugin) => {
        try {
          await plugin.initialize();
          console.log(`✅ Plugin initialized: ${plugin.name}`);
        } catch (error) {
          console.error(`❌ Failed to initialize plugin ${plugin.name}:`, error);
        }
      })
    );
  }

  /**
   * 執行搜尋（所有啟用的 Plugin）
   */
  async search(query: string, limit: number = 5): Promise<Source[]> {
    const enabledPlugins = this.getEnabledPlugins();

    if (enabledPlugins.length === 0) {
      console.warn('No enabled plugins available for search');
      return [];
    }

    console.log(`🔍 Searching with ${enabledPlugins.length} plugins:`, enabledPlugins.map(p => p.name));

    // 並行搜尋所有 Plugin
    const results = await Promise.all(
      enabledPlugins.map(async (plugin) => {
        try {
          const sources = await plugin.search(query, limit);
          return sources.map(source => ({
            ...source,
            metadata: {
              ...source.metadata,
              pluginId: plugin.id,
              pluginName: plugin.name,
              priority: plugin.priority
            }
          }));
        } catch (error) {
          console.error(`Error searching with plugin ${plugin.name}:`, error);
          return [];
        }
      })
    );

    // 合併並排序結果
    const allResults = results.flat();

    // 按 priority 和 score 排序
    allResults.sort((a, b) => {
      const priorityA = a.metadata?.priority || 0;
      const priorityB = b.metadata?.priority || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      return (b.score || 0) - (a.score || 0);
    });

    return allResults.slice(0, limit);
  }

  /**
   * 清理所有 Plugin
   */
  disposeAll(): void {
    this.plugins.forEach(plugin => plugin.dispose());
    this.plugins.clear();
    console.log('🧹 All plugins disposed');
  }
}


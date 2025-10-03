import { SearchPlugin } from './SearchPlugin';
import { Source } from '../types';
import { SQLService } from '../services/SQLService';
import { ContentExtractor } from '../services/ContentExtractor';

/**
 * SQL 資料庫搜尋 Plugin 配置
 */
export interface SQLPluginConfig {
  enabled: boolean;
  priority: number;
  connectionId?: string;  // 使用哪個 SQL 連接
  searchTable?: string;   // 搜尋哪個表
  searchColumns?: string[]; // 搜尋哪些欄位
  titleColumn?: string;   // 標題欄位
  contentColumn?: string; // 內容欄位
  urlColumn?: string;     // URL 欄位
  apiEndpoint?: string;   // 後端 API endpoint（用於執行 SQL 查詢）
}

/**
 * SQL 資料庫搜尋 Plugin
 */
export class SQLPlugin implements SearchPlugin {
  readonly id = 'sql-database';
  readonly name = 'SQL 資料庫';
  readonly description = '搜尋 SQL 資料庫中的內容';

  priority: number = 5;
  enabled: boolean = false; // 預設關閉，需要配置後才能啟用

  private config: SQLPluginConfig;
  private extractor: ContentExtractor;

  constructor(config?: Partial<SQLPluginConfig>) {
    this.config = {
      enabled: false,
      priority: 5,
      searchTable: 'knowledge_base',
      searchColumns: ['title', 'content'],
      titleColumn: 'title',
      contentColumn: 'content',
      urlColumn: 'url',
      ...config
    };

    this.enabled = this.config.enabled;
    this.priority = this.config.priority;
    this.extractor = new ContentExtractor();
  }

  async initialize(): Promise<void> {
    // 檢查配置是否完整
    if (!this.config.connectionId) {
      console.warn('⚠️ SQL Plugin: No connection ID configured');
      this.enabled = false;
      return;
    }

    if (!this.config.apiEndpoint) {
      console.warn('⚠️ SQL Plugin: No API endpoint configured');
      this.enabled = false;
      return;
    }

    // 測試連接
    try {
      const connection = SQLService.getById(this.config.connectionId);
      if (!connection) {
        console.warn(`⚠️ SQL Plugin: Connection ${this.config.connectionId} not found`);
        this.enabled = false;
        return;
      }

      // 測試連接是否可用
      const isConnected = await SQLService.testConnection(
        this.config.connectionId,
        this.config.apiEndpoint
      );

      if (!isConnected) {
        console.warn('⚠️ SQL Plugin: Connection test failed');
        this.enabled = false;
        return;
      }

      console.log('✅ SQL Plugin: Connection test successful');
    } catch (error) {
      console.error('❌ SQL Plugin initialization error:', error);
      this.enabled = false;
    }
  }

  async search(query: string, limit: number = 5): Promise<Source[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      // 提取查詢關鍵字
      const keywords = this.extractor.extractKeywords(query, 5);

      // 構建 SQL 查詢
      const sqlQuery = this.buildSearchQuery(keywords, limit);

      // 執行查詢
      const results = await SQLService.query(
        this.config.connectionId!,
        sqlQuery,
        this.config.apiEndpoint!
      );

      // 轉換為 Source 格式
      return this.convertToSources(results);
    } catch (error) {
      console.error('Error in SQLPlugin.search:', error);
      return [];
    }
  }

  /**
   * 構建搜尋 SQL 查詢
   */
  private buildSearchQuery(keywords: string[], limit: number): string {
    const { searchTable, searchColumns, titleColumn, contentColumn, urlColumn } = this.config;

    // 構建 WHERE 條件
    const conditions = searchColumns!.map(column => {
      return keywords.map(keyword => `${column} LIKE '%${keyword}%'`).join(' OR ');
    }).join(' OR ');

    // 構建完整查詢
    return `
      SELECT 
        ${titleColumn} as title,
        ${contentColumn} as content,
        ${urlColumn} as url
      FROM ${searchTable}
      WHERE ${conditions}
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 轉換查詢結果為 Source 格式
   */
  private convertToSources(results: any[]): Source[] {
    return results.map((row, index) => ({
      type: 'sql' as const,
      title: row.title || `結果 ${index + 1}`,
      snippet: row.content ? row.content.substring(0, 200) : '',
      content: row.content || '',
      url: row.url || '#',
      score: 1.0 - (index * 0.1), // 簡單的分數計算
      metadata: {
        source: 'sql-database',
        connectionId: this.config.connectionId,
        table: this.config.searchTable
      }
    }));
  }

  isAvailable(): boolean {
    return (
      this.enabled &&
      !!this.config.connectionId &&
      !!this.config.apiEndpoint &&
      !!this.config.searchTable
    );
  }

  getConfig(): SQLPluginConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SQLPluginConfig>): void {
    this.config = { ...this.config, ...config };

    if (typeof config.enabled === 'boolean') {
      this.enabled = config.enabled;
    }
    if (typeof config.priority === 'number') {
      this.priority = config.priority;
    }

    // 重新初始化
    this.initialize().catch(error => {
      console.error('Error reinitializing SQL Plugin:', error);
    });
  }

  dispose(): void {
    // 清理資源
    this.enabled = false;
  }
}

/**
 * SQL Plugin 工廠函數
 * 從 localStorage 載入配置並創建 Plugin
 */
export function createSQLPlugin(): SQLPlugin {
  // 從 localStorage 載入配置
  const savedConfig = localStorage.getItem('sm_sql_plugin_config');
  const config = savedConfig ? JSON.parse(savedConfig) : {};

  return new SQLPlugin(config);
}

/**
 * 保存 SQL Plugin 配置到 localStorage
 */
export function saveSQLPluginConfig(config: Partial<SQLPluginConfig>): void {
  const currentConfig = localStorage.getItem('sm_sql_plugin_config');
  const merged = currentConfig
    ? { ...JSON.parse(currentConfig), ...config }
    : config;

  localStorage.setItem('sm_sql_plugin_config', JSON.stringify(merged));
}


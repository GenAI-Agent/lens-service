import { SQLConnection } from '../types';

/**
 * SQL 資料庫連接服務
 * 注意：由於瀏覽器安全限制，實際的 SQL 查詢需要通過後端 API
 * 這裡只管理連接配置，實際查詢需要後端支援
 */
export class SQLService {
  private static readonly STORAGE_KEY = 'sm_sql_connections';
  
  /**
   * 獲取所有 SQL 連接
   */
  static getAll(): SQLConnection[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse SQL connections:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取連接
   */
  static getById(id: string): SQLConnection | null {
    const connections = this.getAll();
    return connections.find(c => c.id === id) || null;
  }
  
  /**
   * 創建新連接
   */
  static create(data: {
    name: string;
    type: 'mysql' | 'postgresql' | 'mssql' | 'sqlite';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    queryTemplate: string;
    resultMapping: {
      titleField: string;
      contentField: string;
      urlField?: string;
    };
  }): SQLConnection {
    const connection: SQLConnection = {
      id: this.generateId(),
      name: data.name,
      type: data.type,
      enabled: true,
      createdAt: new Date().toISOString(),
      config: {
        host: data.host,
        port: data.port,
        database: data.database,
        username: data.username,
        password: data.password
      },
      queryTemplate: data.queryTemplate,
      resultMapping: data.resultMapping
    };
    
    const connections = this.getAll();
    connections.push(connection);
    this.saveAll(connections);
    
    console.log('Created SQL connection:', connection.id);
    
    return connection;
  }
  
  /**
   * 更新連接
   */
  static update(id: string, data: Partial<Omit<SQLConnection, 'id'>>): SQLConnection | null {
    const connections = this.getAll();
    const connection = connections.find(c => c.id === id);
    
    if (!connection) return null;
    
    // 更新欄位
    if (data.name !== undefined) connection.name = data.name;
    if (data.type !== undefined) connection.type = data.type;
    if (data.enabled !== undefined) connection.enabled = data.enabled;
    if (data.config !== undefined) connection.config = { ...connection.config, ...data.config };
    if (data.queryTemplate !== undefined) connection.queryTemplate = data.queryTemplate;
    if (data.resultMapping !== undefined) connection.resultMapping = { ...connection.resultMapping, ...data.resultMapping };
    
    this.saveAll(connections);
    
    console.log('Updated SQL connection:', id);
    
    return connection;
  }
  
  /**
   * 刪除連接
   */
  static delete(id: string): boolean {
    const connections = this.getAll();
    const newConnections = connections.filter(c => c.id !== id);
    
    if (newConnections.length === connections.length) {
      return false;
    }
    
    this.saveAll(newConnections);
    
    console.log('Deleted SQL connection:', id);
    
    return true;
  }
  
  /**
   * 測試連接
   * 注意：需要後端 API 支援
   */
  static async testConnection(id: string, apiEndpoint: string): Promise<boolean> {
    const connection = this.getById(id);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    try {
      const response = await fetch(`${apiEndpoint}/sql/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: connection.type,
          config: connection.config
        })
      });
      
      const result = await response.json();
      return result.success === true;
      
    } catch (e) {
      console.error('Failed to test connection:', e);
      return false;
    }
  }
  
  /**
   * 執行查詢
   * 注意：需要後端 API 支援
   */
  static async query(
    id: string,
    query: string,
    apiEndpoint: string
  ): Promise<Array<{ title: string; content: string; url?: string }>> {
    const connection = this.getById(id);
    if (!connection || !connection.enabled) {
      return [];
    }
    
    try {
      // 替換查詢模板中的 {{query}} 佔位符
      const sql = connection.queryTemplate.replace(/\{\{query\}\}/g, query);
      
      const response = await fetch(`${apiEndpoint}/sql/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: connection.type,
          config: connection.config,
          sql: sql
        })
      });
      
      const result = await response.json();
      
      if (!result.success || !result.rows) {
        throw new Error(result.error || 'Query failed');
      }
      
      // 映射結果
      return result.rows.map((row: any) => ({
        title: row[connection.resultMapping.titleField] || '',
        content: row[connection.resultMapping.contentField] || '',
        url: connection.resultMapping.urlField ? row[connection.resultMapping.urlField] : undefined
      }));
      
    } catch (e) {
      console.error('Failed to execute query:', e);
      return [];
    }
  }
  
  /**
   * 搜尋（通過所有啟用的連接）
   */
  static async search(
    query: string,
    apiEndpoint: string,
    connectionIds?: string[],
    limit: number = 5
  ): Promise<Array<{
    title: string;
    content: string;
    url?: string;
    connectionName: string;
  }>> {
    const connections = this.getAll().filter(c => c.enabled);
    
    // 如果指定了 connectionIds，只搜尋這些連接
    const connectionsToSearch = connectionIds && connectionIds.length > 0
      ? connections.filter(c => connectionIds.includes(c.id))
      : connections;
    
    if (connectionsToSearch.length === 0) return [];
    
    const allResults: Array<{
      title: string;
      content: string;
      url?: string;
      connectionName: string;
    }> = [];
    
    for (const connection of connectionsToSearch) {
      try {
        const results = await this.query(connection.id, query, apiEndpoint);
        
        for (const result of results) {
          allResults.push({
            ...result,
            connectionName: connection.name
          });
        }
        
      } catch (e) {
        console.error(`Failed to search connection ${connection.name}:`, e);
      }
    }
    
    return allResults.slice(0, limit);
  }
  
  /**
   * 獲取連接統計
   */
  static getStats(): {
    total: number;
    enabled: number;
    byType: Record<string, number>;
  } {
    const connections = this.getAll();
    
    const stats = {
      total: connections.length,
      enabled: connections.filter(c => c.enabled).length,
      byType: {} as Record<string, number>
    };
    
    for (const conn of connections) {
      stats.byType[conn.type] = (stats.byType[conn.type] || 0) + 1;
    }
    
    return stats;
  }
  
  private static saveAll(connections: SQLConnection[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connections));
  }
  
  private static generateId(): string {
    return 'sql_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * 匯出連接配置（不包含密碼）
   */
  static exportConfig(): string {
    const connections = this.getAll().map(conn => ({
      ...conn,
      config: {
        ...conn.config,
        password: '***' // 隱藏密碼
      }
    }));
    
    return JSON.stringify(connections, null, 2);
  }
}


/**
 * 數據庫服務類 - 通過代理服務器與PostgreSQL交互
 */
export class DatabaseService {
  private static baseUrl = '/api/lens';

  /**
   * 設置配置（為了兼容性）
   */
  static setConfig(config: { apiEndpoint?: string }): void {
    // Widget 直接使用前端的 API 路由，不需要外部 API endpoint
    this.baseUrl = '/api/lens';
  }

  /**
   * 執行SQL查詢（通過Next.js API Routes）
   */
  static async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Database query failed');
      }

      return result.data;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 系統設定相關方法
   */
  static async getSettings(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch settings');
      }

      return result.data;
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  }

  static async updateSetting(key: string, value: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update setting');
      }

      return result.data;
    } catch (error) {
      console.error('Update setting error:', error);
      throw error;
    }
  }

  /**
   * 管理員用戶相關方法
   */
  static async getAdminUsers(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin-users`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch admin users');
      }

      return result.data;
    } catch (error) {
      console.error('Get admin users error:', error);
      throw error;
    }
  }

  static async createAdminUser(username: string, password: string, email: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/admin-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create admin user');
      }

      return result.data;
    } catch (error) {
      console.error('Create admin user error:', error);
      throw error;
    }
  }

  static async deleteAdminUser(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/admin-users/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete admin user');
      }

      return result.data;
    } catch (error) {
      console.error('Delete admin user error:', error);
      throw error;
    }
  }

  /**
   * 登入驗證
   */
  static async login(username: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      return result.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * 手動索引相關方法
   */
  static async getManualIndexes(): Promise<any[]> {
    const sql = `
      SELECT id, name, description, url, content, embedding, metadata, 
             created_at, updated_at
      FROM manual_indexes 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

  static async createManualIndex(data: {
    name: string;
    description: string;
    url?: string;
    content: string;
  }): Promise<any> {
    const sql = `
      INSERT INTO manual_indexes (name, description, url, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, description, url, content, created_at, updated_at
    `;
    const params = [data.name, data.description, data.url || null, data.content];
    const result = await this.query(sql, params);
    return result[0];
  }

  // 為了兼容性，添加saveManualIndex別名
  static async saveManualIndex(data: any): Promise<any> {
    return this.createManualIndex(data);
  }

  static async updateManualIndex(id: string, data: {
    name: string;
    description: string;
    url?: string;
    content: string;
  }): Promise<any> {
    const sql = `
      UPDATE manual_indexes 
      SET name = $1, description = $2, url = $3, content = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, description, url, content, created_at, updated_at
    `;
    const params = [data.name, data.description, data.url || null, data.content, id];
    const result = await this.query(sql, params);
    return result[0];
  }

  static async deleteManualIndex(id: string): Promise<any> {
    const sql = 'DELETE FROM manual_indexes WHERE id = $1 RETURNING *';
    const result = await this.query(sql, [id]);
    return result[0];
  }

  /**
   * 對話記錄相關方法
   */
  static async getConversations(): Promise<any[]> {
    const sql = `
      SELECT id, user_id, messages, status, created_at, updated_at
      FROM conversations 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

  static async deleteConversation(id: string): Promise<any> {
    const sql = 'DELETE FROM conversations WHERE id = $1 RETURNING *';
    const result = await this.query(sql, [id]);
    return result[0];
  }

  /**
   * 健康檢查
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

/**
 * 數據庫服務類 - 自包含的資料庫服務，使用模擬數據
 * 在真實環境中，這應該連接到實際的資料庫
 */
export class DatabaseService {
  private static dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'lens_service',
    user: 'lens_user',
    password: 'lens123'
  };

  // 模擬資料存儲
  private static mockData = {
    settings: [
      { id: 1, key: 'system_prompt', value: '你是一個專業的客服助理，請友善地回答用戶問題。', created_at: new Date(), updated_at: new Date() },
      { id: 2, key: 'default_reply', value: '抱歉，我無法回答這個問題，請聯繫人工客服。', created_at: new Date(), updated_at: new Date() }
    ],
    admin_users: [
      { id: 1, username: 'admin', password: 'admin123', email: 'admin@lens-service.com', created_at: new Date(), updated_at: new Date() },
      { id: 2, username: 'manager', password: 'manager456', email: 'manager@lens-service.com', created_at: new Date(), updated_at: new Date() }
    ],
    manual_indexes: [
      { id: 1, name: '產品說明', description: '產品相關說明', content: '我們的產品提供 AI 客服功能，可以自動回答用戶問題並提供專業的客戶服務。', created_at: new Date(), updated_at: new Date() }
    ]
  };

  /**
   * 設置資料庫配置
   */
  static setConfig(config: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  }): void {
    this.dbConfig = { ...this.dbConfig, ...config };
    console.log('Database config set:', this.dbConfig);
  }

  /**
   * 執行SQL查詢（使用模擬數據）
   */
  static async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      console.log('Executing SQL:', sql, 'with params:', params);

      // 簡單的 SQL 解析和模擬執行
      const sqlLower = sql.toLowerCase().trim();

      if (sqlLower.includes('select * from settings')) {
        return this.mockData.settings;
      }

      if (sqlLower.includes('select * from admin_users') || sqlLower.includes('select id, username, email')) {
        return this.mockData.admin_users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
      }

      if (sqlLower.includes('select id, username, email from admin_users where username')) {
        const username = params[0];
        const password = params[1];
        const user = this.mockData.admin_users.find(u => u.username === username && u.password === password);
        return user ? [{ id: user.id, username: user.username, email: user.email }] : [];
      }

      if (sqlLower.includes('select * from manual_indexes') || sqlLower.includes('from manual_indexes')) {
        return this.mockData.manual_indexes;
      }

      // 其他查詢返回空結果
      return [];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 系統設定相關方法
   */
  static async getSettings(): Promise<any[]> {
    const sql = 'SELECT * FROM settings ORDER BY id';
    return this.query(sql);
  }

  static async updateSetting(key: string, value: string): Promise<any> {
    const sql = `
      UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *;
      INSERT INTO settings (key, value) SELECT $2, $1 WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = $2) RETURNING *;
    `;
    const result = await this.query(sql, [value, key]);
    return result[0];
  }

  /**
   * 管理員用戶相關方法
   */
  static async getAdminUsers(): Promise<any[]> {
    const sql = 'SELECT id, username, email, created_at, updated_at FROM admin_users ORDER BY id';
    return this.query(sql);
  }

  static async createAdminUser(username: string, password: string, email: string): Promise<any> {
    const sql = `
      INSERT INTO admin_users (username, password, email, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at, updated_at
    `;
    const result = await this.query(sql, [username, password, email]);
    return result[0];
  }

  static async deleteAdminUser(id: string): Promise<any> {
    const sql = 'DELETE FROM admin_users WHERE id = $1 RETURNING id, username, email';
    const result = await this.query(sql, [id]);
    return result[0];
  }

  /**
   * 登入驗證
   */
  static async login(username: string, password: string): Promise<any> {
    const sql = 'SELECT id, username, email FROM admin_users WHERE username = $1 AND password = $2';
    const result = await this.query(sql, [username, password]);

    if (result.length === 0) {
      throw new Error('Invalid username or password');
    }

    return result[0];
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
      const sql = 'SELECT 1 as test';
      await this.query(sql);
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

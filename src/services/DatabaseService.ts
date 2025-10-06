// Database service using API calls to db-server
// This service provides a unified interface for accessing PostgreSQL database

const API_BASE_URL = 'http://localhost:3002';

export class DatabaseService {
  private static initialized = false;

  static async initializePool() {
    if (this.initialized) {
      return;
    }

    console.log('✅ Database service initialized (API mode)');
    this.initialized = true;
  }

  static async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      console.log('🔍 Mock query:', sql, params);
      return [];
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  static async initializeTables(): Promise<void> {
    // No need to initialize tables - they are already in PostgreSQL
    console.log('✅ Tables already initialized in PostgreSQL');
  }

  // Helper method for API calls
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== Settings API ====================

  static async getSettings(): Promise<any> {
    return await this.apiCall('/settings');
  }

  static async getSetting(key: string): Promise<string | null> {
    try {
      const response = await this.apiCall(`/settings/${key}`);
      return response.value;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  }

  static async setSetting(key: string, value: string): Promise<void> {
    await this.apiCall(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  // ==================== Admin Users API ====================

  static async getAdminUsers(): Promise<any[]> {
    return await this.apiCall('/admin-users');
  }

  static async validateAdmin(username: string, password: string): Promise<any | null> {
    try {
      const response = await this.apiCall('/admin-users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return response;
    } catch (error) {
      console.error('Admin validation failed:', error);
      return null;
    }
  }

  static async createAdminUser(username: string, password: string, email: string): Promise<void> {
    await this.apiCall('/admin-users', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
  }

  static async deleteAdminUser(id: string): Promise<void> {
    await this.apiCall(`/admin-users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Manual Indexes API ====================

  static async getManualIndexes(): Promise<any[]> {
    return await this.apiCall('/manual-indexes');
  }

  static async createManualIndex(name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void> {
    const fingerprint = `fp-${Date.now()}`;
    await this.apiCall('/manual-indexes', {
      method: 'POST',
      body: JSON.stringify({
        id: crypto.randomUUID(),
        name,
        description,
        content,
        url: url || '',
        keywords: keywords || [],
        fingerprint,
        embedding: null,
        metadata: {}
      }),
    });
  }

  static async updateManualIndex(id: string, name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void> {
    await this.apiCall(`/manual-indexes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        description,
        content,
        url: url || '',
        keywords: keywords || []
      }),
    });
  }

  static async deleteManualIndex(id: string): Promise<void> {
    await this.apiCall(`/manual-indexes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Conversations API ====================

  static async saveConversation(conversation_id: string, user_id: string, messages: any[]): Promise<void> {
    await this.apiCall('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        user_id,
        conversation_id,
        messages
      }),
    });
    console.log('✅ Conversation saved to database:', conversation_id);
  }

  static async getConversation(conversation_id: string): Promise<any | null> {
    try {
      return await this.apiCall(`/conversations/${conversation_id}`);
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  static async getAllConversations(): Promise<any[]> {
    return await this.apiCall('/conversations');
  }

  static async getConversations(): Promise<any[]> {
    return await this.getAllConversations();
  }

  static async deleteConversation(conversation_id: string): Promise<void> {
    await this.apiCall(`/conversations/${conversation_id}`, {
      method: 'DELETE',
    });
  }
}

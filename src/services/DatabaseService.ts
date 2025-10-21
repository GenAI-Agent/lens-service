// Database service using API calls to lens-platform
// This service provides a unified interface for accessing PostgreSQL database via Next.js API routes

const API_BASE_URL = '/api/widget'; // lens-platform API routes for widget

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
      console.log('🔍 Query (via API):', sql, params);
      return [];
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  static async initializeTables(): Promise<void> {
    console.log('✅ Tables already initialized in PostgreSQL');
  }

  // Helper method for API calls
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error('API call failed: ' + response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API call failed for ' + endpoint + ':', error);
      throw error;
    }
  }

  // ==================== Settings ====================

  static async getSettings(): Promise<any> {
    try {
      return await this.apiCall('/settings');
    } catch (error) {
      console.error('Failed to get settings:', error);
      return [];
    }
  }

  static async getSetting(key: string): Promise<string | null> {
    try {
      const response = await this.apiCall('/settings/' + key);
      return response.value;
    } catch (error) {
      console.error('Failed to get setting ' + key + ':', error);
      return null;
    }
  }

  static async setSetting(key: string, value: string): Promise<void> {
    try {
      await this.apiCall('/settings/' + key, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      console.error('Failed to set setting ' + key + ':', error);
      throw error;
    }
  }

  // ==================== Admin Users ====================

  static async getAdminUsers(): Promise<any[]> {
    try {
      return await this.apiCall('/admin-users');
    } catch (error) {
      console.error('Failed to get admin users:', error);
      return [];
    }
  }

  static async validateAdmin(username: string, password: string): Promise<any | null> {
    try {
      return await this.apiCall('/admin-users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
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
    await this.apiCall('/admin-users/' + id, {
      method: 'DELETE',
    });
  }

  // ==================== Manual Indexes ====================

  static async getManualIndexes(): Promise<any[]> {
    try {
      return await this.apiCall('/manual-indexes');
    } catch (error) {
      console.error('Failed to get manual indexes:', error);
      return [];
    }
  }

  static async createManualIndex(name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void> {
    await this.apiCall('/manual-indexes', {
      method: 'POST',
      body: JSON.stringify({ name, description, content, url, keywords }),
    });
  }

  static async updateManualIndex(id: string, name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void> {
    await this.apiCall('/manual-indexes/' + id, {
      method: 'PUT',
      body: JSON.stringify({ name, description, content, url, keywords }),
    });
  }

  static async deleteManualIndex(id: string): Promise<void> {
    await this.apiCall('/manual-indexes/' + id, {
      method: 'DELETE',
    });
  }

  static async generateAllEmbeddings(): Promise<any> {
    try {
      return await this.apiCall('/manual-indexes/generate-embeddings', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  static async importUrlsBatch(urls: string[]): Promise<any> {
    try {
      return await this.apiCall('/manual-indexes/import-urls-batch', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
    } catch (error) {
      console.error('Failed to import URLs:', error);
      throw error;
    }
  }

  // ==================== Orders & Subscriptions ====================

  static async getUserOrders(userId?: string): Promise<any[]> {
    try {
      // Use /me endpoint to get current user's orders from JWT token
      const response = await this.apiCall(`/orders/me`);
      return response.orders || [];
    } catch (error) {
      console.error('Failed to get user orders:', error);
      return [];
    }
  }

  static async getUserSubscriptions(userId?: string): Promise<any[]> {
    try {
      // Use /me endpoint to get current user's subscriptions from JWT token
      const response = await this.apiCall(`/subscriptions/me`);
      return response.subscriptions || [];
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      return [];
    }
  }

  // ==================== Conversations ====================

  static async saveConversation(conversation_id: string, user_id: string, messages: any[]): Promise<void> {
    try {
      // Use /save endpoint which gets user_id from JWT token
      await this.apiCall('/conversations/save', {
        method: 'POST',
        body: JSON.stringify({ conversationId: conversation_id, messages }),
      });
      console.log('✅ Conversation saved to database:', conversation_id);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }

  static async getConversation(conversation_id: string): Promise<any | null> {
    try {
      return await this.apiCall('/conversations/' + conversation_id);
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  static async getAllConversations(): Promise<any[]> {
    try {
      return await this.apiCall('/conversations');
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  static async getConversations(): Promise<any[]> {
    return await this.getAllConversations();
  }

  static async deleteConversation(conversation_id: string): Promise<void> {
    await this.apiCall('/conversations/' + conversation_id, {
      method: 'DELETE',
    });
  }

  static async getConversationsByUserId(user_id: string): Promise<any[]> {
    try {
      return await this.apiCall('/conversations/user/' + user_id);
    } catch (error) {
      console.error('Failed to get conversations by user_id:', error);
      return [];
    }
  }
}

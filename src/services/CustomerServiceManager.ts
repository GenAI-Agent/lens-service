/**
 * 客服管理服務
 * 用於後台管理客服對話和回覆
 */

import { Conversation, Message } from '../types';

export class CustomerServiceManager {
  /**
   * 獲取所有對話列表
   */
  static async getAllConversations(): Promise<Conversation[]> {
    try {
      const { DatabaseService } = await import('./DatabaseService');
      await DatabaseService.initializePool();
      const conversations = await DatabaseService.getConversations();
      return Array.isArray(conversations) ? conversations : [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(id: string): Promise<Conversation | null> {
    try {
      const { DatabaseService } = await import('./DatabaseService');
      await DatabaseService.initializePool();
      return await DatabaseService.getConversation(id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }

  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(
    conversationId: string,
    content: string,
    agentName: string = '客服'
  ): Promise<boolean> {
    try {
      // 獲取當前登入的管理員 ID
      const adminId = localStorage.getItem('lens_admin_user_id') || 'admin';

      // 調用 API 添加回覆
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          adminId: adminId,
          adminName: agentName,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add reply:', await response.text());
        return false;
      }

      const result = await response.json();
      console.log('✅ Admin reply added:', result);
      return true;
    } catch (error) {
      console.error('Failed to add customer service reply:', error);
      return false;
    }
  }

  /**
   * 刪除對話
   */
  static async deleteConversation(id: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error('Failed to delete conversation:', await response.text());
        return false;
      }

      console.log('✅ Conversation deleted:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  /**
   * 標記對話為已處理
   */
  static async markConversationAsHandled(id: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3000/api/widget/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'handled',
          handledAt: Date.now()
        })
      });

      if (!response.ok) {
        console.error('Failed to mark conversation as handled:', await response.text());
        return false;
      }

      console.log('✅ Conversation marked as handled:', id);
      return true;
    } catch (error) {
      console.error('Failed to mark conversation as handled:', error);
      return false;
    }
  }

  /**
   * 獲取待處理的對話數量
   */
  static async getPendingConversationsCount(): Promise<number> {
    try {
      const conversations = await this.getAllConversations();
      return conversations.filter(conv => conv.status === 'active').length;
    } catch (error) {
      console.error('Failed to get pending conversations count:', error);
      return 0;
    }
  }
}

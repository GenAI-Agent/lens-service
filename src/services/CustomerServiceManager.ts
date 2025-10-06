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
      const response = await fetch('http://localhost:3002/conversations');
      if (!response.ok) {
        return [];
      }
      const conversations = await response.json();
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
      const response = await fetch(`http://localhost:3002/conversations/${id}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
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
      const message: Omit<Message, 'id'> = {
        role: 'assistant',
        content: content,
        timestamp: Date.now(),
        metadata: {
          isCustomerService: true,
          agentName: agentName
        }
      };

      const response = await fetch(`http://localhost:3002/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      return response.ok;
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
      const response = await fetch(`http://localhost:3002/conversations/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
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
      const response = await fetch(`http://localhost:3002/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'handled',
          handledAt: Date.now()
        })
      });
      return response.ok;
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

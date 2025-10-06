import { Conversation, Message } from '../types';

import { UserService } from './UserService';

/**
 * 對話管理服務
 * 管理用戶的對話歷史
 */
export class ConversationService {
  private static readonly CONVERSATIONS_KEY = 'sm_conversations';
  private static readonly CURRENT_CONVERSATION_KEY = 'sm_current_conversation';
  
  /**
   * 獲取當前對話
   * 如果沒有活躍對話，創建新對話
   */
  static async getCurrentConversation(): Promise<Conversation> {
    const currentId = localStorage.getItem(this.CURRENT_CONVERSATION_KEY);

    if (currentId) {
      const conversation = await this.getConversationById(currentId);
      if (conversation && conversation.status === 'active') {
        return conversation;
      }
    }

    // 創建新對話
    return await this.createNewConversation();
  }
  
  /**
   * 創建新對話
   */
  static async createNewConversation(): Promise<Conversation> {
    const userId = UserService.getUserId();
    const conversationId = this.generateConversationId();

    const conversation: Conversation = {
      id: conversationId,
      userId: userId,
      messages: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      status: 'active',
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    };

    // 保存對話
    await this.saveConversation(conversation);

    // 設置為當前對話
    localStorage.setItem(this.CURRENT_CONVERSATION_KEY, conversationId);

    // 增加用戶的對話計數
    UserService.incrementConversationCount();

    console.log('Created new conversation:', conversationId);

    return conversation;
  }
  
  /**
   * 添加訊息到當前對話
   */
  static async addMessage(
    role: 'user' | 'assistant' | 'human-agent',
    content: string,
    imageBase64?: string,
    metadata?: any
  ): Promise<Message> {
    const conversation = await this.getCurrentConversation();

    const message: Message = {
      id: this.generateMessageId(),
      conversationId: conversation.id,
      role: role,
      content: content,
      imageBase64: imageBase64,
      timestamp: Date.now(),
      metadata: metadata
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();

    await this.saveConversation(conversation);

    return message;
  }
  
  /**
   * 獲取當前對話的所有訊息
   */
  static async getMessages(): Promise<Message[]> {
    const conversation = await this.getCurrentConversation();
    return conversation.messages;
  }
  
  /**
   * 關閉當前對話
   */
  static async closeCurrentConversation(): Promise<void> {
    const conversation = await this.getCurrentConversation();
    conversation.status = 'closed';
    await this.saveConversation(conversation);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
  
  /**
   * 獲取所有對話（用於後台）
   */
  static async getAllConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch('http://localhost:3002/conversations');
      if (!response.ok) {
        return [];
      }
      const conversations = await response.json();
      return Array.isArray(conversations) ? conversations : [];
    } catch (e) {
      console.error('Failed to load conversations:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取對話
   */
  static async getConversationById(id: string): Promise<Conversation | null> {
    const conversations = await this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }
  
  /**
   * 根據用戶 ID 獲取對話
   */
  static async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.getAllConversations();
    return conversations.filter(c => c.userId === userId);
  }
  
  /**
   * 保存對話
   */
  private static async saveConversation(conversation: Conversation): Promise<void> {
    // 使用SQL API保存對話
    try {
      const response = await fetch('http://localhost:3002/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversation)
      });

      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }
  
  /**
   * 人工接管對話
   */
  static async takeoverConversation(conversationId: string, agentId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return;

    conversation.status = 'human-takeover';
    conversation.humanAgentId = agentId;
    await this.saveConversation(conversation);
  }
  
  /**
   * 添加人工回覆
   */
  static async addHumanReply(conversationId: string, content: string, agentId: string): Promise<Message> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message: Message = {
      id: this.generateMessageId(),
      conversationId: conversationId,
      role: 'human-agent',
      content: content,
      timestamp: Date.now(),
      metadata: {
        agentId: agentId
      }
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();

    await this.saveConversation(conversation);

    return message;
  }
  
  /**
   * 檢查是否有新訊息（用於輪詢）
   */
  static async hasNewMessages(conversationId: string, lastMessageId: string): Promise<boolean> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return false;

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage && lastMessage.id !== lastMessageId;
  }
  
  /**
   * 獲取新訊息（用於輪詢）
   */
  static async getNewMessages(conversationId: string, lastMessageId: string): Promise<Message[]> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return [];

    const lastIndex = conversation.messages.findIndex(m => m.id === lastMessageId);
    if (lastIndex < 0) return [];

    return conversation.messages.slice(lastIndex + 1);
  }
  
  /**
   * 生成對話 ID
   */
  private static generateConversationId(): string {
    return 'conv_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * 生成訊息 ID
   */
  private static generateMessageId(): string {
    return 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * 清除所有對話（用於測試）
   */
  static clearAll(): void {
    localStorage.removeItem(this.CONVERSATIONS_KEY);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
}


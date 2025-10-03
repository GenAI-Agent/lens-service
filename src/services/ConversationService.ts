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
  static getCurrentConversation(): Conversation {
    const currentId = localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
    
    if (currentId) {
      const conversation = this.getConversationById(currentId);
      if (conversation && conversation.status === 'active') {
        return conversation;
      }
    }
    
    // 創建新對話
    return this.createNewConversation();
  }
  
  /**
   * 創建新對話
   */
  static createNewConversation(): Conversation {
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
    this.saveConversation(conversation);
    
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
  static addMessage(
    role: 'user' | 'assistant' | 'human-agent',
    content: string,
    imageBase64?: string,
    metadata?: any
  ): Message {
    const conversation = this.getCurrentConversation();
    
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
    
    this.saveConversation(conversation);
    
    return message;
  }
  
  /**
   * 獲取當前對話的所有訊息
   */
  static getMessages(): Message[] {
    const conversation = this.getCurrentConversation();
    return conversation.messages;
  }
  
  /**
   * 關閉當前對話
   */
  static closeCurrentConversation(): void {
    const conversation = this.getCurrentConversation();
    conversation.status = 'closed';
    this.saveConversation(conversation);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
  
  /**
   * 獲取所有對話（用於後台）
   */
  static getAllConversations(): Conversation[] {
    const stored = localStorage.getItem(this.CONVERSATIONS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse conversations:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取對話
   */
  static getConversationById(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }
  
  /**
   * 根據用戶 ID 獲取對話
   */
  static getConversationsByUserId(userId: string): Conversation[] {
    const conversations = this.getAllConversations();
    return conversations.filter(c => c.userId === userId);
  }
  
  /**
   * 保存對話
   */
  private static saveConversation(conversation: Conversation): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
  
  /**
   * 人工接管對話
   */
  static takeoverConversation(conversationId: string, agentId: string): void {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    
    conversation.status = 'human-takeover';
    conversation.humanAgentId = agentId;
    this.saveConversation(conversation);
  }
  
  /**
   * 添加人工回覆
   */
  static addHumanReply(conversationId: string, content: string, agentId: string): Message {
    const conversation = this.getConversationById(conversationId);
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
    
    this.saveConversation(conversation);
    
    return message;
  }
  
  /**
   * 檢查是否有新訊息（用於輪詢）
   */
  static hasNewMessages(conversationId: string, lastMessageId: string): boolean {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return false;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage && lastMessage.id !== lastMessageId;
  }
  
  /**
   * 獲取新訊息（用於輪詢）
   */
  static getNewMessages(conversationId: string, lastMessageId: string): Message[] {
    const conversation = this.getConversationById(conversationId);
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


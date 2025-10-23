import { Conversation, Message } from '../types';
/**
 * 對話管理服務
 * 管理用戶的對話歷史
 */
export declare class ConversationService {
    private static readonly CONVERSATIONS_KEY;
    private static readonly CURRENT_CONVERSATION_KEY;
    /**
     * 獲取當前對話
     * 如果沒有活躍對話，創建新對話
     */
    static getCurrentConversation(): Promise<Conversation>;
    /**
     * 創建新對話
     */
    static createNewConversation(): Promise<Conversation>;
    /**
     * 添加訊息到當前對話
     */
    static addMessage(role: 'user' | 'assistant' | 'human-agent', content: string, imageBase64?: string, metadata?: any): Promise<Message>;
    /**
     * 獲取當前對話的所有訊息
     */
    static getMessages(): Promise<Message[]>;
    /**
     * 關閉當前對話
     */
    static closeCurrentConversation(): Promise<void>;
    /**
     * 獲取所有對話（用於後台）
     */
    static getAllConversations(): Promise<Conversation[]>;
    /**
     * 根據 ID 獲取對話
     */
    static getConversationById(id: string): Promise<Conversation | null>;
    /**
     * 根據用戶 ID 獲取對話
     */
    static getConversationsByUserId(userId: string): Promise<Conversation[]>;
    /**
     * 保存對話
     */
    private static saveConversation;
    /**
     * 人工接管對話
     */
    static takeoverConversation(conversationId: string, agentId: string): Promise<void>;
    /**
     * 添加人工回覆
     */
    static addHumanReply(conversationId: string, content: string, agentId: string): Promise<Message>;
    /**
     * 檢查是否有新訊息（用於輪詢）
     */
    static hasNewMessages(conversationId: string, lastMessageId: string): Promise<boolean>;
    /**
     * 獲取新訊息（用於輪詢）
     */
    static getNewMessages(conversationId: string, lastMessageId: string): Promise<Message[]>;
    /**
     * 生成對話 ID
     */
    private static generateConversationId;
    /**
     * 生成訊息 ID
     */
    private static generateMessageId;
    /**
     * 清除所有對話（用於測試）
     */
    static clearAll(): void;
}

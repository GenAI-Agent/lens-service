/**
 * 客服管理服務
 * 用於後台管理客服對話和回覆
 */
import { Conversation } from '../types';
export declare class CustomerServiceManager {
    /**
     * 獲取所有對話列表
     */
    static getAllConversations(): Promise<Conversation[]>;
    /**
     * 根據ID獲取對話詳情
     */
    static getConversationById(id: string): Promise<Conversation | null>;
    /**
     * 添加客服回覆到對話
     */
    static addCustomerServiceReply(conversationId: string, content: string, agentName?: string): Promise<boolean>;
    /**
     * 刪除對話
     */
    static deleteConversation(id: string): Promise<boolean>;
    /**
     * 標記對話為已處理
     */
    static markConversationAsHandled(id: string): Promise<boolean>;
    /**
     * 獲取待處理的對話數量
     */
    static getPendingConversationsCount(): Promise<number>;
}

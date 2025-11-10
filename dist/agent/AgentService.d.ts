import type { ServiceModulerConfig } from '../types';
export interface AgentMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
    metadata?: {
        toolsUsed?: string[];
        pageId?: string;
        [key: string]: any;
    };
}
export interface AgentResponse {
    success: boolean;
    message: string;
    metadata?: {
        toolsUsed?: string[];
        pageId?: string;
        requiresHumanApproval?: boolean;
        suggestedAction?: string;
        [key: string]: any;
    };
    error?: string;
}
export declare class AgentService {
    private model;
    private agent;
    private memory;
    private config;
    private enabledTools;
    constructor(config: ServiceModulerConfig);
    /**
     * 初始化並收集啟用的工具
     */
    private initializeTools;
    /**
     * 載入資料庫 Schema 從 TzAI_web/config/database-schema.json
     */
    private loadDatabaseSchema;
    /**
     * 處理用戶訊息
     */
    processMessage(message: string, userId: string, conversationId?: string, options?: {
        additionalTools?: any[];
        customSystemPrompt?: string;
    }): Promise<AgentResponse>;
    /**
     * 構建系統提示詞（簡潔版）
     */
    private buildSystemPrompt;
    /**
     * 詳細記錄工具調用和結果（包含並行調用檢測）
     */
    private logToolCalls;
    /**
     * 從訊息中提取使用的工具
     */
    private extractToolsUsed;
    /**
     * 從 messages 中提取 AI Page 的 pageId
     */
    private extractPageId;
    /**
     * 構建完整的執行日誌
     */
    private buildExecutionLog;
    /**
     * 取得修剪過的對話歷史（只保留最後 2 次 QA，不含工具調用）
     */
    private getTrimmedConversationHistory;
    /**
     * 取得對話歷史
     */
    getConversationHistory(conversationId: string): Promise<AgentMessage[]>;
    /**
     * 清除對話歷史
     */
    clearConversation(conversationId: string): Promise<void>;
    /**
     * 取得啟用的工具列表
     */
    getEnabledTools(): string[];
}

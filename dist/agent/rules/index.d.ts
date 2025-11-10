/**
 * ========================================
 * Rules Module - 整合規則管理功能
 * ========================================
 *
 * 整合三個服務：
 * 1. RuleParserService: 解析查詢中的 /rule_name 指令
 * 2. RuleStorageService: 使用 localStorage 管理 Rule 配置
 * 3. CustomerServiceManager: 客服對話管理（後台）
 */
import { RuleConfig, SearchToolConfig, ParsedQuery, Conversation, Message } from "../../types";
/**
 * RuleStorageService
 * 使用 localStorage 管理 Rule 和 SearchTool 配置
 */
export declare class RuleStorageService {
    private static readonly STORAGE_KEY;
    /**
     * 獲取所有 Rules
     */
    static getRules(): RuleConfig[];
    /**
     * 根據名稱獲取 Rule
     */
    static getRuleByName(name: string): RuleConfig | null;
    /**
     * 根據 ID 獲取 Rule
     */
    static getRuleById(id: string): RuleConfig | null;
    /**
     * 保存 Rule
     */
    static saveRule(rule: Omit<RuleConfig, "id" | "createdAt" | "updatedAt">): RuleConfig;
    /**
     * 更新 Rule
     */
    static updateRule(id: string, updates: Partial<Omit<RuleConfig, "id" | "createdAt">>): RuleConfig | null;
    /**
     * 刪除 Rule
     */
    static deleteRule(id: string): boolean;
    /**
     * 保存所有 Rules 到 localStorage
     */
    private static saveRules;
    /**
     * 生成唯一 ID
     */
    private static generateId;
}
/**
 * RuleParserService
 * 負責解析 query 中的 rule 指令（例如：/rule_name）
 * 支持在任何位置出現 /rule_name
 */
export declare class RuleParserService {
    private static ruleRegex;
    /**
     * 解析查詢，提取 rule 名稱並獲取對應的配置
     * 支持在查詢中任何位置出現 /rule_name
     */
    static parseQuery(query: string): ParsedQuery;
    /**
     * 獲取所有可用的 rule 名稱（用於自動補全）
     */
    static getAvailableRules(): string[];
    /**
     * 構建包含 rule 配置的系統提示詞
     */
    static buildSystemPrompt(parsedQuery: ParsedQuery, baseSystemPrompt: string): string;
    /**
     * 獲取 rule 對應的溫度參數
     */
    static getTemperature(parsedQuery: ParsedQuery, defaultTemperature?: number): number;
    /**
     * 獲取 rule 對應的最大 token 數
     */
    static getMaxTokens(parsedQuery: ParsedQuery, defaultMaxTokens?: number): number;
    /**
     * 執行 rule 的 searchTools 爬取
     * 自動爬取 rule 配置中的所有 URL
     */
    static executeRuleSearchTools(parsedQuery: ParsedQuery): Promise<string | null>;
}
/**
 * 客服管理服務
 * 用於後台管理客服對話和回覆
 */
export declare class CustomerServiceManager {
    private static baseUrl;
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
     * 標記對話為已讀
     */
    static markConversationAsRead(id: string): Promise<boolean>;
    /**
     * 獲取未讀對話數量
     */
    static getUnreadCount(): Promise<number>;
}
export type { RuleConfig, SearchToolConfig, ParsedQuery, Conversation, Message, };

import { RuleConfig, SearchToolConfig } from '../types';
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
    static saveRule(rule: Omit<RuleConfig, 'id' | 'createdAt' | 'updatedAt'>): RuleConfig;
    /**
     * 更新 Rule
     */
    static updateRule(id: string, updates: Partial<Omit<RuleConfig, 'id' | 'createdAt'>>): RuleConfig | null;
    /**
     * 刪除 Rule
     */
    static deleteRule(id: string): boolean;
    /**
     * 保存所有 Rules 到 localStorage
     */
    private static saveRules;
    /**
     * 為 Rule 添加 SearchTool
     */
    static addSearchTool(ruleId: string, tool: Omit<SearchToolConfig, 'id' | 'ruleId' | 'createdAt' | 'updatedAt'>): SearchToolConfig | null;
    /**
     * 更新 SearchTool
     */
    static updateSearchTool(ruleId: string, toolId: string, updates: Partial<Omit<SearchToolConfig, 'id' | 'ruleId' | 'createdAt'>>): SearchToolConfig | null;
    /**
     * 刪除 SearchTool
     */
    static deleteSearchTool(ruleId: string, toolId: string): boolean;
    /**
     * 生成唯一 ID
     */
    private static generateId;
    /**
     * 清空所有 Rules（僅用於開發/測試）
     */
    static clearAll(): void;
    /**
     * 初始化示例數據（僅在首次使用時）
     */
    static initializeDefaults(): void;
}

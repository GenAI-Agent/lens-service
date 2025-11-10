import { ParsedQuery } from '../types';
/**
 * RuleParserService
 * 負責解析 query 中的 rule 指令（例如：/rule_name）
 * 支持在任何位置出現 /rule_name
 */
export declare class RuleParserService {
    private static ruleRegex;
    constructor();
    /**
     * 解析查詢，提取 rule 名稱並獲取對應的配置
     * 支持在查詢中任何位置出現 /rule_name
     * @param query - 原始查詢字符串
     * @returns ParsedQuery 對象
     */
    static parseQuery(query: string): ParsedQuery;
    /**
     * 獲取所有可用的 rule 名稱（用於自動補全）
     * @returns Rule 名稱數組
     */
    getAvailableRules(): string[];
    /**
     * 構建包含 rule 配置的系統提示詞
     * @param parsedQuery - 解析後的查詢
     * @param baseSystemPrompt - 基礎系統提示詞
     * @returns 增強後的系統提示詞
     */
    buildSystemPrompt(parsedQuery: ParsedQuery, baseSystemPrompt: string): string;
    /**
     * 獲取 rule 對應的溫度參數
     * @param parsedQuery - 解析後的查詢
     * @param defaultTemperature - 默認溫度
     * @returns 溫度值
     */
    getTemperature(parsedQuery: ParsedQuery, defaultTemperature?: number): number;
    /**
     * 獲取 rule 對應的最大 token 數
     * @param parsedQuery - 解析後的查詢
     * @param defaultMaxTokens - 默認最大 token 數
     * @returns 最大 token 數
     */
    getMaxTokens(parsedQuery: ParsedQuery, defaultMaxTokens?: number): number;
    /**
     * 執行 rule 的 searchTools 爬取
     * 自動爬取 rule 配置中的所有 URL
     */
    static executeRuleSearchTools(parsedQuery: ParsedQuery): Promise<string | null>;
}

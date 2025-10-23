import { ParsedQuery, RuleConfig } from '../types';
import { RuleStorageService } from './RuleStorageService';

/**
 * RuleParserService
 * 負責解析 query 中的 rule 指令（例如：/rule_name）
 * 支持在任何位置出現 /rule_name
 */
export class RuleParserService {
  // 匹配任何位置的 /rule_name（前後可以有其他內容）
  private ruleRegex = /\/([a-zA-Z0-9_-]+)/g;

  constructor() {
    // 不再需要 dbService，使用 localStorage
  }

  /**
   * 解析查詢，提取 rule 名稱並獲取對應的配置
   * 支持在查詢中任何位置出現 /rule_name
   * @param query - 原始查詢字符串
   * @returns ParsedQuery 對象
   */
  parseQuery(query: string): ParsedQuery {
    // 重置 regex 的 lastIndex
    this.ruleRegex.lastIndex = 0;

    const matches = Array.from(query.matchAll(this.ruleRegex));

    if (matches.length === 0) {
      // 沒有匹配到 rule，返回原始 query
      return {
        originalQuery: query,
        cleanQuery: query,
      };
    }

    // 取第一個匹配的 rule name
    const firstMatch = matches[0];
    const ruleName = firstMatch[1];

    // 移除所有 /rule_name，保留其他內容
    const cleanQuery = query.replace(this.ruleRegex, '').trim();

    // 從 localStorage 獲取 rule 配置
    const ruleConfig = RuleStorageService.getRuleByName(ruleName);

    return {
      ruleName,
      originalQuery: query,
      cleanQuery,
      ruleConfig: ruleConfig || undefined,
    };
  }

  /**
   * 獲取所有可用的 rule 名稱（用於自動補全）
   * @returns Rule 名稱數組
   */
  getAvailableRules(): string[] {
    const rules = RuleStorageService.getRules();
    return rules
      .filter(rule => rule.isActive)
      .map(rule => rule.name);
  }

  /**
   * 構建包含 rule 配置的系統提示詞
   * @param parsedQuery - 解析後的查詢
   * @param baseSystemPrompt - 基礎系統提示詞
   * @returns 增強後的系統提示詞
   */
  buildSystemPrompt(parsedQuery: ParsedQuery, baseSystemPrompt: string): string {
    if (!parsedQuery.ruleConfig) {
      return baseSystemPrompt;
    }

    const { persona, outputFormat } = parsedQuery.ruleConfig;

    return `${baseSystemPrompt}

## 角色設定 (Persona)
${persona}

## 輸出格式要求 (Output Format)
${outputFormat}`;
  }

  /**
   * 獲取 rule 對應的溫度參數
   * @param parsedQuery - 解析後的查詢
   * @param defaultTemperature - 默認溫度
   * @returns 溫度值
   */
  getTemperature(parsedQuery: ParsedQuery, defaultTemperature: number = 0.7): number {
    return parsedQuery.ruleConfig?.temperature ?? defaultTemperature;
  }

  /**
   * 獲取 rule 對應的最大 token 數
   * @param parsedQuery - 解析後的查詢
   * @param defaultMaxTokens - 默認最大 token 數
   * @returns 最大 token 數
   */
  getMaxTokens(parsedQuery: ParsedQuery, defaultMaxTokens: number = 2000): number {
    return parsedQuery.ruleConfig?.maxTokens ?? defaultMaxTokens;
  }
}

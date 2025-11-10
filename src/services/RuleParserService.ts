import { ParsedQuery, RuleConfig } from '../types';
import { RuleStorageService } from './RuleStorageService';

/**
 * RuleParserService
 * 負責解析 query 中的 rule 指令（例如：/rule_name）
 * 支持在任何位置出現 /rule_name
 */
export class RuleParserService {
  // 匹配任何位置的 /rule_name（前後可以有其他內容）
  // 修正: 只匹配開頭或空白後的 /rule_name，避免匹配 URL 中的路徑
  private static ruleRegex = /(?:^|\s)(\/[a-zA-Z0-9_-]+)/g;

  constructor() {
    // 不再需要 dbService，使用 localStorage
  }

  /**
   * 解析查詢，提取 rule 名稱並獲取對應的配置
   * 支持在查詢中任何位置出現 /rule_name
   * @param query - 原始查詢字符串
   * @returns ParsedQuery 對象
   */
  static parseQuery(query: string): ParsedQuery {
    // 重置 regex 的 lastIndex
    RuleParserService.ruleRegex.lastIndex = 0;

    const matches = Array.from(query.matchAll(RuleParserService.ruleRegex));

    if (matches.length === 0) {
      // 沒有匹配到 rule，返回原始 query
      return {
        originalQuery: query,
        cleanQuery: query,
      };
    }

    // 取第一個匹配的 rule name
    const firstMatch = matches[0];
    // Group 1 contains the /rule_name (e.g., "/book_recommend")
    const ruleNameWithSlash = firstMatch[1];
    // Remove the leading slash to get just the rule name
    const ruleName = ruleNameWithSlash.substring(1);

    // 移除所有 /rule_name，保留其他內容（保留空白）
    const cleanQuery = query.replace(RuleParserService.ruleRegex, ' ').trim();

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

  /**
   * 執行 rule 的 searchTools 爬取
   * 自動爬取 rule 配置中的所有 URL
   */
  static async executeRuleSearchTools(parsedQuery: ParsedQuery): Promise<string | null> {
    if (!parsedQuery.ruleConfig?.searchTools) {
      return null;
    }

    try {
      // 動態導入 web scraper
      const { scrapeUrl } = await import('../agent/tools/web-scraper-helper');

      // 收集所有 active searchTools 的 URLs
      const activeSearchTools = parsedQuery.ruleConfig.searchTools.filter((tool: any) => tool.isActive);
      const allUrls: string[] = [];

      for (const tool of activeSearchTools) {
        if (tool.urls && Array.isArray(tool.urls)) {
          allUrls.push(...tool.urls);
        }
      }

      if (allUrls.length === 0) {
        console.log('[Rule Parser] No URLs to scrape in searchTools');
        return null;
      }

      console.log(`[Rule Parser] Scraping ${allUrls.length} URLs from rule "${parsedQuery.ruleName}"`);

      // 並行爬取所有 URLs
      const results = await Promise.all(
        allUrls.map((url: string) => scrapeUrl(url, 'article'))
      );

      // 合併所有成功的爬取結果
      const successfulResults = results.filter((r: any) => r.success);

      if (successfulResults.length === 0) {
        console.log('[Rule Parser] No successful scrapes');
        return null;
      }

      // 格式化為結構化資訊返回
      let combinedContent = `\n\n## 自動爬取的網頁內容 (來自 Rule: ${parsedQuery.ruleName})\n\n`;

      successfulResults.forEach((result: any, index: number) => {
        combinedContent += `### 頁面 ${index + 1}: ${result.title}\n`;
        combinedContent += `URL: ${result.url}\n`;
        if (result.metadata?.description) {
          combinedContent += `描述: ${result.metadata.description}\n`;
        }
        combinedContent += `\n${result.content}\n\n---\n\n`;
      });

      console.log(`[Rule Parser] Successfully scraped ${successfulResults.length}/${allUrls.length} URLs`);

      return combinedContent;
    } catch (error) {
      console.error('[Rule Parser] Failed to execute searchTools:', error);
      return null;
    }
  }
}

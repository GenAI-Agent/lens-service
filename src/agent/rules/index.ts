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

import {
  RuleConfig,
  SearchToolConfig,
  ParsedQuery,
  Conversation,
  Message,
} from "../../types";

// ========================================
// 1. Rule Storage Service (LocalStorage)
// ========================================

/**
 * RuleStorageService
 * 使用 localStorage 管理 Rule 和 SearchTool 配置
 */
export class RuleStorageService {
  private static readonly STORAGE_KEY = "lens_service_rules";

  /**
   * 獲取所有 Rules
   */
  static getRules(): RuleConfig[] {
    try {
      // Check if localStorage is available (browser only)
      if (typeof localStorage === "undefined") {
        return [];
      }
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as RuleConfig[];
    } catch (error) {
      console.error("Failed to get rules from localStorage:", error);
      return [];
    }
  }

  /**
   * 根據名稱獲取 Rule
   */
  static getRuleByName(name: string): RuleConfig | null {
    const rules = this.getRules();
    return rules.find((rule) => rule.name === name && rule.isActive) || null;
  }

  /**
   * 根據 ID 獲取 Rule
   */
  static getRuleById(id: string): RuleConfig | null {
    const rules = this.getRules();
    return rules.find((rule) => rule.id === id) || null;
  }

  /**
   * 保存 Rule
   */
  static saveRule(
    rule: Omit<RuleConfig, "id" | "createdAt" | "updatedAt">
  ): RuleConfig {
    const rules = this.getRules();
    const newRule: RuleConfig = {
      ...rule,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  }

  /**
   * 更新 Rule
   */
  static updateRule(
    id: string,
    updates: Partial<Omit<RuleConfig, "id" | "createdAt">>
  ): RuleConfig | null {
    const rules = this.getRules();
    const index = rules.findIndex((rule) => rule.id === id);
    if (index === -1) return null;

    rules[index] = {
      ...rules[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveRules(rules);
    return rules[index];
  }

  /**
   * 刪除 Rule
   */
  static deleteRule(id: string): boolean {
    const rules = this.getRules();
    const filteredRules = rules.filter((rule) => rule.id !== id);
    if (filteredRules.length === rules.length) return false;
    this.saveRules(filteredRules);
    return true;
  }

  /**
   * 保存所有 Rules 到 localStorage
   */
  private static saveRules(rules: RuleConfig[]): void {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error("Failed to save rules to localStorage:", error);
    }
  }

  /**
   * 生成唯一 ID
   */
  private static generateId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ========================================
// 2. Rule Parser Service
// ========================================

/**
 * RuleParserService
 * 負責解析 query 中的 rule 指令（例如：/rule_name）
 * 支持在任何位置出現 /rule_name
 */
export class RuleParserService {
  // 匹配任何位置的 /rule_name（前後可以有其他內容）
  // 修正: 只匹配開頭或空白後的 /rule_name，避免匹配 URL 中的路徑
  private static ruleRegex = /(?:^|\s)(\/[a-zA-Z0-9_-]+)/g;

  /**
   * 解析查詢，提取 rule 名稱並獲取對應的配置
   * 支持在查詢中任何位置出現 /rule_name
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
    const cleanQuery = query.replace(RuleParserService.ruleRegex, " ").trim();

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
   */
  static getAvailableRules(): string[] {
    const rules = RuleStorageService.getRules();
    return rules.filter((rule) => rule.isActive).map((rule) => rule.name);
  }

  /**
   * 構建包含 rule 配置的系統提示詞
   */
  static buildSystemPrompt(
    parsedQuery: ParsedQuery,
    baseSystemPrompt: string
  ): string {
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
   */
  static getTemperature(
    parsedQuery: ParsedQuery,
    defaultTemperature: number = 0.7
  ): number {
    return parsedQuery.ruleConfig?.temperature ?? defaultTemperature;
  }

  /**
   * 獲取 rule 對應的最大 token 數
   */
  static getMaxTokens(
    parsedQuery: ParsedQuery,
    defaultMaxTokens: number = 2000
  ): number {
    return parsedQuery.ruleConfig?.maxTokens ?? defaultMaxTokens;
  }

  /**
   * 執行 rule 的 searchTools 爬取
   * 自動爬取 rule 配置中的所有 URL
   */
  static async executeRuleSearchTools(
    parsedQuery: ParsedQuery
  ): Promise<string | null> {
    if (!parsedQuery.ruleConfig?.searchTools) {
      return null;
    }

    try {
      // 動態導入 web scraper
      const { scrapeUrl } = await import("../tools/web-scraper-helper");

      // 收集所有 active searchTools 的 URLs
      const activeSearchTools = parsedQuery.ruleConfig.searchTools.filter(
        (tool) => tool.isActive
      );
      const allUrls: string[] = [];

      for (const tool of activeSearchTools) {
        if (tool.urls && Array.isArray(tool.urls)) {
          allUrls.push(...tool.urls);
        }
      }

      if (allUrls.length === 0) {
        console.log("[Rule Parser] No URLs to scrape in searchTools");
        return null;
      }

      console.log(
        `[Rule Parser] Scraping ${allUrls.length} URLs from rule "${parsedQuery.ruleName}"`
      );

      // 並行爬取所有 URLs
      const results = await Promise.all(
        allUrls.map((url) => scrapeUrl(url, "article"))
      );

      // 合併所有成功的爬取結果
      const successfulResults = results.filter((r) => r.success);

      if (successfulResults.length === 0) {
        console.log("[Rule Parser] No successful scrapes");
        return null;
      }

      // 格式化為結構化資訊返回
      let combinedContent = `\n\n## 自動爬取的網頁內容 (來自 Rule: ${parsedQuery.ruleName})\n\n`;

      successfulResults.forEach((result, index) => {
        combinedContent += `### 頁面 ${index + 1}: ${result.title}\n`;
        combinedContent += `URL: ${result.url}\n`;
        if (result.metadata?.description) {
          combinedContent += `描述: ${result.metadata.description}\n`;
        }
        combinedContent += `\n${result.content}\n\n---\n\n`;
      });

      console.log(
        `[Rule Parser] Successfully scraped ${successfulResults.length}/${allUrls.length} URLs`
      );

      return combinedContent;
    } catch (error) {
      console.error("[Rule Parser] Failed to execute searchTools:", error);
      return null;
    }
  }
}

// ========================================
// 3. Customer Service Manager
// ========================================

/**
 * 客服管理服務
 * 用於後台管理客服對話和回覆
 */
export class CustomerServiceManager {
  private static baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:8080";

  /**
   * 獲取所有對話列表
   */
  static async getAllConversations(): Promise<Conversation[]> {
    try {
      const { DatabaseService } = await import(
        "../../services/DatabaseService"
      );
      await DatabaseService.initializePool();
      const conversations = await DatabaseService.getConversations();
      return Array.isArray(conversations) ? conversations : [];
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  }

  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(id: string): Promise<Conversation | null> {
    try {
      const { DatabaseService } = await import(
        "../../services/DatabaseService"
      );
      await DatabaseService.initializePool();
      return await DatabaseService.getConversation(id);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      return null;
    }
  }

  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(
    conversationId: string,
    content: string,
    agentName: string = "客服"
  ): Promise<boolean> {
    try {
      // 獲取當前登入的管理員 ID
      const adminId = localStorage.getItem("lens_admin_user_id") || "admin";

      // 調用 API 添加回覆
      const response = await fetch(
        `${this.baseUrl}/api/widget/conversations/${conversationId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
            adminId: adminId,
            adminName: agentName,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to add reply:", await response.text());
        return false;
      }

      const result = await response.json();
      console.log("✅ Admin reply added:", result);
      return true;
    } catch (error) {
      console.error("Failed to add customer service reply:", error);
      return false;
    }
  }

  /**
   * 刪除對話
   */
  static async deleteConversation(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/widget/conversations/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        console.error("Failed to delete conversation:", await response.text());
        return false;
      }

      console.log("✅ Conversation deleted:", id);
      return true;
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      return false;
    }
  }

  /**
   * 標記對話為已讀
   */
  static async markConversationAsRead(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/widget/conversations/${id}/read`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        console.error("Failed to mark as read:", await response.text());
        return false;
      }

      console.log("✅ Conversation marked as read:", id);
      return true;
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      return false;
    }
  }

  /**
   * 獲取未讀對話數量
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const conversations = await this.getAllConversations();
      return conversations.filter((c) => !(c as any).isRead).length;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }
}

// ========================================
// Export all
// ========================================

export type {
  RuleConfig,
  SearchToolConfig,
  ParsedQuery,
  Conversation,
  Message,
};

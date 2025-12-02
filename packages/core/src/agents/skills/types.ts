/**
 * Skills Types
 * 基於原始 lens-service 的 RuleConfig 結構
 */

/**
 * SearchTool 配置 - 用於 Skill 的自動爬取功能
 */
export interface SearchToolConfig {
  id: string;
  skillId: string;  // 關聯的 Skill ID
  name: string;
  description?: string;
  urls: string[];   // 要爬取的 URL 列表
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill 配置（對應原始的 RuleConfig）
 */
export interface SkillConfig {
  id: string;
  name: string;           // 用於匹配 /skill_name
  displayName: string;    // 顯示名稱
  description?: string;
  persona: string;        // AI 角色設定
  outputFormat: string;   // 輸出格式指示
  temperature?: number;   // LLM 溫度參數
  maxTokens?: number;     // 最大 token 數
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  searchTools?: SearchToolConfig[];  // 關聯的爬取工具
  tenantId?: string;      // 多租戶支援
}

/**
 * 解析後的查詢
 */
export interface ParsedQuery {
  skillName?: string;       // 解析出的 skill 名稱
  originalQuery: string;    // 原始 query
  cleanQuery: string;       // 移除 /skill_name 後的 query
  skillConfig?: SkillConfig; // 對應的 skill 配置
  hasSkill: boolean;        // 是否包含 skill 指令
}

/**
 * Skill 執行結果
 */
export interface SkillExecutionResult {
  success: boolean;
  skillName?: string;
  scrapedContent?: string;  // 從 searchTools 爬取的內容
  error?: string;
}

/**
 * 創建 Skill 的輸入
 */
export type CreateSkillInput = Omit<SkillConfig, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 更新 Skill 的輸入
 */
export type UpdateSkillInput = Partial<Omit<SkillConfig, 'id' | 'createdAt'>>;

/**
 * 創建 SearchTool 的輸入
 */
export type CreateSearchToolInput = Omit<SearchToolConfig, 'id' | 'skillId' | 'createdAt' | 'updatedAt'>;

/**
 * 更新 SearchTool 的輸入
 */
export type UpdateSearchToolInput = Partial<Omit<SearchToolConfig, 'id' | 'skillId' | 'createdAt'>>;

import { RuleConfig, SearchToolConfig } from '../types';

/**
 * RuleStorageService
 * 使用 localStorage 管理 Rule 和 SearchTool 配置
 */
export class RuleStorageService {
  private static readonly STORAGE_KEY = 'lens_service_rules';

  /**
   * 獲取所有 Rules
   */
  static getRules(): RuleConfig[] {
    try {
      // Check if localStorage is available (browser only)
      if (typeof localStorage === 'undefined') {
        return [];
      }
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as RuleConfig[];
    } catch (error) {
      console.error('Failed to get rules from localStorage:', error);
      return [];
    }
  }

  /**
   * 根據名稱獲取 Rule
   */
  static getRuleByName(name: string): RuleConfig | null {
    const rules = this.getRules();
    return rules.find(rule => rule.name === name && rule.isActive) || null;
  }

  /**
   * 根據 ID 獲取 Rule
   */
  static getRuleById(id: string): RuleConfig | null {
    const rules = this.getRules();
    return rules.find(rule => rule.id === id) || null;
  }

  /**
   * 保存 Rule
   */
  static saveRule(rule: Omit<RuleConfig, 'id' | 'createdAt' | 'updatedAt'>): RuleConfig {
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
  static updateRule(id: string, updates: Partial<Omit<RuleConfig, 'id' | 'createdAt'>>): RuleConfig | null {
    const rules = this.getRules();
    const index = rules.findIndex(rule => rule.id === id);
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
    const filteredRules = rules.filter(rule => rule.id !== id);
    if (filteredRules.length === rules.length) return false;
    this.saveRules(filteredRules);
    return true;
  }

  /**
   * 保存所有 Rules 到 localStorage
   */
  private static saveRules(rules: RuleConfig[]): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules to localStorage:', error);
    }
  }

  /**
   * 為 Rule 添加 SearchTool
   */
  static addSearchTool(ruleId: string, tool: Omit<SearchToolConfig, 'id' | 'ruleId' | 'createdAt' | 'updatedAt'>): SearchToolConfig | null {
    const rule = this.getRuleById(ruleId);
    if (!rule) return null;

    const newTool: SearchToolConfig = {
      ...tool,
      id: this.generateId(),
      ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    rule.searchTools = rule.searchTools || [];
    rule.searchTools.push(newTool);
    rule.updatedAt = new Date();

    this.updateRule(ruleId, { searchTools: rule.searchTools });
    return newTool;
  }

  /**
   * 更新 SearchTool
   */
  static updateSearchTool(ruleId: string, toolId: string, updates: Partial<Omit<SearchToolConfig, 'id' | 'ruleId' | 'createdAt'>>): SearchToolConfig | null {
    const rule = this.getRuleById(ruleId);
    if (!rule || !rule.searchTools) return null;

    const toolIndex = rule.searchTools.findIndex(tool => tool.id === toolId);
    if (toolIndex === -1) return null;

    rule.searchTools[toolIndex] = {
      ...rule.searchTools[toolIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.updateRule(ruleId, { searchTools: rule.searchTools });
    return rule.searchTools[toolIndex];
  }

  /**
   * 刪除 SearchTool
   */
  static deleteSearchTool(ruleId: string, toolId: string): boolean {
    const rule = this.getRuleById(ruleId);
    if (!rule || !rule.searchTools) return false;

    const filteredTools = rule.searchTools.filter(tool => tool.id !== toolId);
    if (filteredTools.length === rule.searchTools.length) return false;

    this.updateRule(ruleId, { searchTools: filteredTools });
    return true;
  }

  /**
   * 生成唯一 ID
   */
  private static generateId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 清空所有 Rules（僅用於開發/測試）
   */
  static clearAll(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 初始化示例數據（僅在首次使用時）
   */
  static initializeDefaults(): void {
    const existingRules = this.getRules();
    if (existingRules.length > 0) return; // 已有數據，不初始化

    // 創建示例 Rule
    const exampleRule = this.saveRule({
      name: 'financial',
      displayName: '財務分析師',
      description: '專業的財務分析助手',
      persona: '你是一位經驗豐富的財務分析師，擅長解讀財務報表、分析市場趨勢和提供投資建議。',
      outputFormat: '請以專業但易懂的方式回答，包含：\n1. 核心要點（bullet points）\n2. 詳細分析\n3. 建議或結論',
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
      searchTools: [],
    });

    console.log('✅ Initialized default rules:', exampleRule);
  }
}

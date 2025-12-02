/**
 * Skills Storage Service
 * 管理 Skill 配置的存儲（支援 localStorage 和資料庫）
 */

import type {
  SkillConfig,
  SearchToolConfig,
  CreateSkillInput,
  UpdateSkillInput,
  CreateSearchToolInput,
  UpdateSearchToolInput,
} from './types';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `skill_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Skill Storage Service
 * 在瀏覽器環境使用 localStorage，在伺服器環境使用記憶體存儲
 */
export class SkillStorageService {
  private static readonly STORAGE_KEY = 'lens_service_skills';
  private static memoryStore: Map<string, SkillConfig[]> = new Map();

  /**
   * 獲取所有 Skills
   */
  static getSkills(tenantId?: string): SkillConfig[] {
    try {
      // 瀏覽器環境
      if (typeof localStorage !== 'undefined') {
        const key = tenantId ? `${this.STORAGE_KEY}_${tenantId}` : this.STORAGE_KEY;
        const data = localStorage.getItem(key);
        if (!data) return [];
        return JSON.parse(data) as SkillConfig[];
      }

      // 伺服器環境（使用記憶體）
      const key = tenantId || 'default';
      return this.memoryStore.get(key) || [];
    } catch (error) {
      console.error('Failed to get skills:', error);
      return [];
    }
  }

  /**
   * 根據名稱獲取 Skill
   */
  static getSkillByName(name: string, tenantId?: string): SkillConfig | null {
    const skills = this.getSkills(tenantId);
    return skills.find(skill => skill.name === name && skill.isActive) || null;
  }

  /**
   * 根據 ID 獲取 Skill
   */
  static getSkillById(id: string, tenantId?: string): SkillConfig | null {
    const skills = this.getSkills(tenantId);
    return skills.find(skill => skill.id === id) || null;
  }

  /**
   * 保存 Skill
   */
  static saveSkill(input: CreateSkillInput, tenantId?: string): SkillConfig {
    const skills = this.getSkills(tenantId);

    const newSkill: SkillConfig = {
      ...input,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId,
    };

    skills.push(newSkill);
    this.saveSkills(skills, tenantId);
    return newSkill;
  }

  /**
   * 更新 Skill
   */
  static updateSkill(
    id: string,
    updates: UpdateSkillInput,
    tenantId?: string
  ): SkillConfig | null {
    const skills = this.getSkills(tenantId);
    const index = skills.findIndex(skill => skill.id === id);
    if (index === -1) return null;

    skills[index] = {
      ...skills[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveSkills(skills, tenantId);
    return skills[index];
  }

  /**
   * 刪除 Skill
   */
  static deleteSkill(id: string, tenantId?: string): boolean {
    const skills = this.getSkills(tenantId);
    const filteredSkills = skills.filter(skill => skill.id !== id);
    if (filteredSkills.length === skills.length) return false;

    this.saveSkills(filteredSkills, tenantId);
    return true;
  }

  /**
   * 保存所有 Skills
   */
  private static saveSkills(skills: SkillConfig[], tenantId?: string): void {
    try {
      // 瀏覽器環境
      if (typeof localStorage !== 'undefined') {
        const key = tenantId ? `${this.STORAGE_KEY}_${tenantId}` : this.STORAGE_KEY;
        localStorage.setItem(key, JSON.stringify(skills));
        return;
      }

      // 伺服器環境
      const key = tenantId || 'default';
      this.memoryStore.set(key, skills);
    } catch (error) {
      console.error('Failed to save skills:', error);
    }
  }

  /**
   * 為 Skill 添加 SearchTool
   */
  static addSearchTool(
    skillId: string,
    input: CreateSearchToolInput,
    tenantId?: string
  ): SearchToolConfig | null {
    const skill = this.getSkillById(skillId, tenantId);
    if (!skill) return null;

    const newTool: SearchToolConfig = {
      ...input,
      id: generateId(),
      skillId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    skill.searchTools = skill.searchTools || [];
    skill.searchTools.push(newTool);

    this.updateSkill(skillId, { searchTools: skill.searchTools }, tenantId);
    return newTool;
  }

  /**
   * 更新 SearchTool
   */
  static updateSearchTool(
    skillId: string,
    toolId: string,
    updates: UpdateSearchToolInput,
    tenantId?: string
  ): SearchToolConfig | null {
    const skill = this.getSkillById(skillId, tenantId);
    if (!skill || !skill.searchTools) return null;

    const toolIndex = skill.searchTools.findIndex(tool => tool.id === toolId);
    if (toolIndex === -1) return null;

    skill.searchTools[toolIndex] = {
      ...skill.searchTools[toolIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.updateSkill(skillId, { searchTools: skill.searchTools }, tenantId);
    return skill.searchTools[toolIndex];
  }

  /**
   * 刪除 SearchTool
   */
  static deleteSearchTool(
    skillId: string,
    toolId: string,
    tenantId?: string
  ): boolean {
    const skill = this.getSkillById(skillId, tenantId);
    if (!skill || !skill.searchTools) return false;

    const filteredTools = skill.searchTools.filter(tool => tool.id !== toolId);
    if (filteredTools.length === skill.searchTools.length) return false;

    this.updateSkill(skillId, { searchTools: filteredTools }, tenantId);
    return true;
  }

  /**
   * 清空所有 Skills（僅用於開發/測試）
   */
  static clearAll(tenantId?: string): void {
    if (typeof localStorage !== 'undefined') {
      const key = tenantId ? `${this.STORAGE_KEY}_${tenantId}` : this.STORAGE_KEY;
      localStorage.removeItem(key);
      return;
    }

    const key = tenantId || 'default';
    this.memoryStore.delete(key);
  }

  /**
   * 初始化範例 Skills
   */
  static initializeDefaults(tenantId?: string): void {
    const existingSkills = this.getSkills(tenantId);
    if (existingSkills.length > 0) return; // 已有資料，不初始化

    // 範例：財務分析師（來自原始 lens-service）
    this.saveSkill({
      name: 'financial',
      displayName: '財務分析師',
      description: '專業的財務分析助手',
      persona: '你是一位經驗豐富的財務分析師，擅長解讀財務報表、分析市場趨勢和提供投資建議。',
      outputFormat: '請以專業但易懂的方式回答，包含：\n1. 核心要點（bullet points）\n2. 詳細分析\n3. 建議或結論',
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
      searchTools: [],
    }, tenantId);

    console.log('✅ Initialized default skills');
  }

  /**
   * 從資料庫同步 Skills（用於伺服器端）
   */
  static async syncFromDatabase(
    dbService: {
      query: (sql: string, params?: unknown[]) => Promise<{ rows: SkillConfig[] }>;
    },
    tenantId?: string
  ): Promise<void> {
    try {
      const result = await dbService.query(
        'SELECT * FROM skills WHERE tenant_id = $1 OR tenant_id IS NULL',
        [tenantId]
      );

      const key = tenantId || 'default';
      this.memoryStore.set(key, result.rows);
      console.log(`✅ Synced ${result.rows.length} skills from database`);
    } catch (error) {
      console.error('Failed to sync skills from database:', error);
    }
  }
}

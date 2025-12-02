/**
 * Context Engineer - Parser
 * 負責解析 query 中的 skill 指令（例如：/skill_name）
 */

import type { SkillConfig, ParsedQuery } from '../skills/types';
import { SkillStorageService } from '../skills/storage';

/**
 * Skill Parser Service
 * 從 query 中解析 /skill_name 指令
 */
export class SkillParser {
  // 匹配 /skill_name（只匹配開頭或空白後的）
  private static skillRegex = /(?:^|\s)(\/[a-zA-Z0-9_-]+)/g;

  /**
   * 解析查詢，提取 skill 名稱並獲取對應的配置
   */
  static parseQuery(query: string, tenantId?: string): ParsedQuery {
    // 重置 regex 的 lastIndex
    this.skillRegex.lastIndex = 0;

    const matches = Array.from(query.matchAll(this.skillRegex));

    if (matches.length === 0) {
      // 沒有匹配到 skill，返回原始 query
      return {
        originalQuery: query,
        cleanQuery: query,
        hasSkill: false,
      };
    }

    // 取第一個匹配的 skill name
    const firstMatch = matches[0];
    const skillNameWithSlash = firstMatch[1];
    const skillName = skillNameWithSlash.substring(1); // 移除前導斜線

    // 移除所有 /skill_name，保留其他內容
    const cleanQuery = query.replace(this.skillRegex, ' ').trim();

    // 從 Storage 獲取 skill 配置
    const skillConfig = SkillStorageService.getSkillByName(skillName, tenantId);

    return {
      skillName,
      originalQuery: query,
      cleanQuery,
      skillConfig: skillConfig || undefined,
      hasSkill: true,
    };
  }

  /**
   * 獲取所有可用的 skill 名稱（用於自動補全）
   */
  static getAvailableSkills(tenantId?: string): string[] {
    const skills = SkillStorageService.getSkills(tenantId);
    return skills
      .filter(skill => skill.isActive)
      .map(skill => skill.name);
  }

  /**
   * 檢查 query 是否包含 skill 指令
   */
  static hasSkillCommand(query: string): boolean {
    this.skillRegex.lastIndex = 0;
    return this.skillRegex.test(query);
  }

  /**
   * 從 query 中提取所有 URL
   */
  static extractUrls(query: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const matches = query.match(urlRegex);
    return matches || [];
  }

  /**
   * 判斷 query 的意圖類型
   */
  static detectIntent(query: string): {
    type: 'question' | 'command' | 'request' | 'unknown';
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();

    // 問句判斷
    const questionPatterns = [
      /^(什麼|怎麼|為什麼|哪|誰|何時|是否|可以|能不能|有沒有)/,
      /\?$/,
      /(嗎|呢|吧)$/,
    ];

    // 命令判斷
    const commandPatterns = [
      /^(請|幫我|幫忙|給我)/,
      /^(查詢|搜尋|找|看看|顯示)/,
    ];

    // 請求判斷
    const requestPatterns = [
      /(推薦|建議|介紹)/,
      /(想要|需要|希望)/,
    ];

    for (const pattern of questionPatterns) {
      if (pattern.test(lowerQuery)) {
        return { type: 'question', confidence: 0.8 };
      }
    }

    for (const pattern of commandPatterns) {
      if (pattern.test(lowerQuery)) {
        return { type: 'command', confidence: 0.8 };
      }
    }

    for (const pattern of requestPatterns) {
      if (pattern.test(lowerQuery)) {
        return { type: 'request', confidence: 0.7 };
      }
    }

    return { type: 'unknown', confidence: 0.5 };
  }
}

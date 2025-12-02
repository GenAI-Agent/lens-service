/**
 * Context Engineer
 * 負責組裝完整的 context 給 Agent 使用
 *
 * 主要功能：
 * 1. 解析 query 中的 skill 指令
 * 2. 管理對話記憶
 * 3. 組裝系統提示詞
 * 4. 執行 skill 的 pre-actions (如爬取網頁)
 */

export * from './prompts';
export * from './parser';
export * from './memory';

import { SkillParser } from './parser';
import { MemoryManager, getMemoryManager } from './memory';
import {
  BASE_SYSTEM_PROMPT,
  buildContextualPrompt,
  SUPERVISOR_PROMPT,
  AGENT_PERSONAS,
} from './prompts';
import type { SkillConfig, ParsedQuery } from '../skills/types';

export interface ContextEngineerOptions {
  tenantId?: string;
  maxMessagesPerSession?: number;
  maxTokensPerContext?: number;
}

export interface EngineeredContext {
  systemPrompt: string;
  userQuery: string;
  conversationHistory: Array<{ role: string; content: string }>;
  parsedQuery: ParsedQuery;
  retrievedContent?: string;
  scrapedContent?: string;
  metadata: Record<string, unknown>;
}

/**
 * Context Engineer
 * 統一管理 context 的組裝
 */
export class ContextEngineer {
  private memoryManager: MemoryManager;
  private tenantId?: string;

  constructor(options?: ContextEngineerOptions) {
    this.tenantId = options?.tenantId;
    this.memoryManager = getMemoryManager({
      maxMessagesPerSession: options?.maxMessagesPerSession,
      maxTokensPerContext: options?.maxTokensPerContext,
    });
  }

  /**
   * 解析並準備完整的 context
   */
  async prepareContext(
    query: string,
    sessionId: string,
    options?: {
      userId?: string;
      retrievedContent?: string;
      scrapedContent?: string;
      additionalContext?: Record<string, unknown>;
    }
  ): Promise<EngineeredContext> {
    // 1. 解析 query 中的 skill
    const parsedQuery = SkillParser.parseQuery(query, this.tenantId);

    // 2. 獲取對話歷史
    const conversation = this.memoryManager.getOrCreateConversation(
      sessionId,
      options?.userId
    );
    const history = this.memoryManager.compressHistory(sessionId);

    // 3. 組裝系統提示詞
    const systemPrompt = buildContextualPrompt({
      basePrompt: BASE_SYSTEM_PROMPT,
      skillConfig: parsedQuery.skillConfig,
      retrievedContext: options?.retrievedContent,
      scrapedContent: options?.scrapedContent,
      memory: history.length > 0
        ? this.memoryManager.getConversationSummary(sessionId)
        : undefined,
    });

    // 4. 記錄用戶訊息
    this.memoryManager.addMessage(sessionId, {
      role: 'user',
      content: query,
    });

    return {
      systemPrompt,
      userQuery: parsedQuery.cleanQuery,
      conversationHistory: history.map(m => ({
        role: m.role,
        content: m.content,
      })),
      parsedQuery,
      retrievedContent: options?.retrievedContent,
      scrapedContent: options?.scrapedContent,
      metadata: {
        sessionId,
        userId: options?.userId,
        hasSkill: parsedQuery.hasSkill,
        skillName: parsedQuery.skillName,
        ...options?.additionalContext,
      },
    };
  }

  /**
   * 記錄 AI 回應
   */
  recordResponse(sessionId: string, response: string): void {
    this.memoryManager.addMessage(sessionId, {
      role: 'assistant',
      content: response,
    });
  }

  /**
   * 獲取 Supervisor 專用 context
   */
  getSupervisorContext(): string {
    return SUPERVISOR_PROMPT;
  }

  /**
   * 獲取特定 Agent 類型的 persona
   */
  getAgentPersona(agentType: keyof typeof AGENT_PERSONAS): string {
    return AGENT_PERSONAS[agentType] || '';
  }

  /**
   * 清除對話
   */
  clearSession(sessionId: string): void {
    this.memoryManager.clearConversation(sessionId);
  }

  /**
   * 設置對話上下文變數
   */
  setSessionContext(sessionId: string, key: string, value: unknown): void {
    this.memoryManager.setContext(sessionId, key, value);
  }

  /**
   * 獲取對話上下文變數
   */
  getSessionContext<T = unknown>(sessionId: string, key: string): T | undefined {
    return this.memoryManager.getContext<T>(sessionId, key);
  }
}

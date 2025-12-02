/**
 * Context Engineer - Memory
 * 管理對話記憶和上下文
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationMemory {
  sessionId: string;
  userId?: string;
  messages: Message[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Memory Manager
 * 管理對話歷史和短期記憶
 */
export class MemoryManager {
  private conversations: Map<string, ConversationMemory> = new Map();
  private maxMessagesPerSession: number;
  private maxTokensPerContext: number;

  constructor(options?: {
    maxMessagesPerSession?: number;
    maxTokensPerContext?: number;
  }) {
    this.maxMessagesPerSession = options?.maxMessagesPerSession ?? 50;
    this.maxTokensPerContext = options?.maxTokensPerContext ?? 4000;
  }

  /**
   * 獲取或創建對話記憶
   */
  getOrCreateConversation(sessionId: string, userId?: string): ConversationMemory {
    let conversation = this.conversations.get(sessionId);

    if (!conversation) {
      conversation = {
        sessionId,
        userId,
        messages: [],
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversations.set(sessionId, conversation);
    }

    return conversation;
  }

  /**
   * 添加訊息到對話
   */
  addMessage(
    sessionId: string,
    message: Omit<Message, 'timestamp'>
  ): void {
    const conversation = this.getOrCreateConversation(sessionId);

    conversation.messages.push({
      ...message,
      timestamp: new Date(),
    });

    // 限制訊息數量
    if (conversation.messages.length > this.maxMessagesPerSession) {
      // 保留 system message 和最近的訊息
      const systemMessages = conversation.messages.filter(m => m.role === 'system');
      const otherMessages = conversation.messages.filter(m => m.role !== 'system');
      const recentMessages = otherMessages.slice(-this.maxMessagesPerSession + systemMessages.length);
      conversation.messages = [...systemMessages, ...recentMessages];
    }

    conversation.updatedAt = new Date();
  }

  /**
   * 獲取對話歷史（格式化為 LLM 輸入）
   */
  getConversationHistory(sessionId: string, limit?: number): Message[] {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return [];

    const messages = conversation.messages;
    if (limit && messages.length > limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * 獲取對話摘要（用於長對話壓縮）
   */
  getConversationSummary(sessionId: string): string {
    const conversation = this.conversations.get(sessionId);
    if (!conversation || conversation.messages.length === 0) {
      return '';
    }

    // 簡單的摘要：最近 N 條訊息的內容
    const recentMessages = conversation.messages.slice(-10);
    const summary = recentMessages
      .map(m => `${m.role === 'user' ? '用戶' : 'AI'}: ${m.content.slice(0, 100)}...`)
      .join('\n');

    return summary;
  }

  /**
   * 設置對話上下文
   */
  setContext(sessionId: string, key: string, value: unknown): void {
    const conversation = this.getOrCreateConversation(sessionId);
    conversation.context[key] = value;
    conversation.updatedAt = new Date();
  }

  /**
   * 獲取對話上下文
   */
  getContext<T = unknown>(sessionId: string, key: string): T | undefined {
    const conversation = this.conversations.get(sessionId);
    return conversation?.context[key] as T | undefined;
  }

  /**
   * 清除對話
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * 清除所有過期對話
   */
  cleanupExpiredConversations(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = new Date();
    for (const [sessionId, conversation] of this.conversations) {
      const age = now.getTime() - conversation.updatedAt.getTime();
      if (age > maxAgeMs) {
        this.conversations.delete(sessionId);
      }
    }
  }

  /**
   * 估算 tokens 數量（簡單估算）
   */
  estimateTokens(text: string): number {
    // 簡單估算：中文約 1.5 字符/token，英文約 4 字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 壓縮對話歷史以符合 token 限制
   */
  compressHistory(sessionId: string): Message[] {
    const messages = this.getConversationHistory(sessionId);
    let totalTokens = 0;
    const result: Message[] = [];

    // 從最新的開始往回加
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const tokens = this.estimateTokens(msg.content);

      if (totalTokens + tokens > this.maxTokensPerContext) {
        break;
      }

      result.unshift(msg);
      totalTokens += tokens;
    }

    return result;
  }
}

// 全局 Memory Manager 實例
let globalMemoryManager: MemoryManager | null = null;

export function getMemoryManager(options?: {
  maxMessagesPerSession?: number;
  maxTokensPerContext?: number;
}): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager(options);
  }
  return globalMemoryManager;
}

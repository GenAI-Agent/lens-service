/**
 * Memory Manager for Supervisor Agent
 *
 * Implements memory stratification:
 * - Long-term: User-visible conversation (saved to DB)
 * - Short-term: Current task execution trace (kept in memory only)
 *
 * This separation prevents token explosion while maintaining context.
 */

import type {
  SupervisorState,
  UserMessage,
  ExecutionStep,
  ChatMessage,
} from '@lens-service/shared/types';

export interface MemoryManagerConfig {
  maxUserVisibleMessages?: number;
  maxExecutionSteps?: number;
  enableTraceSummarization?: boolean;
}

export interface LLMService {
  chat(
    messages: ChatMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<string>;
}

export class MemoryManager {
  private readonly maxUserVisibleMessages: number;
  private readonly maxExecutionSteps: number;
  private readonly enableTraceSummarization: boolean;

  constructor(
    private readonly llm: LLMService,
    config: MemoryManagerConfig = {}
  ) {
    this.maxUserVisibleMessages = config.maxUserVisibleMessages ?? 20;
    this.maxExecutionSteps = config.maxExecutionSteps ?? 10;
    this.enableTraceSummarization = config.enableTraceSummarization ?? true;
  }

  /**
   * Build Decision Prompt for LLM
   *
   * Combines:
   * 1. System prompt (skill or default)
   * 2. User-visible conversation history (long-term)
   * 3. Current user query
   * 4. Execution trace summary (short-term, condensed)
   */
  buildDecisionPrompt(
    state: SupervisorState,
    systemPrompt: string
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // 1. System Prompt
    messages.push({
      role: 'system',
      content: state.currentTask.skillPrompt || systemPrompt,
    });

    // 2. User-Visible Memory (Long-term)
    // Only include recent messages to save tokens
    const recentMessages = state.memory.userVisible.slice(
      -this.maxUserVisibleMessages
    );

    recentMessages.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // 3. Current Query
    messages.push({
      role: 'user',
      content: state.currentTask.userQuery,
    });

    // 4. Execution Trace (Short-term) - Summarized
    if (state.memory.executionTrace.length > 0) {
      const traceSummary = this.summarizeTrace(state.memory.executionTrace);
      messages.push({
        role: 'system',
        content: `[Previous Actions in Current Task]\n${traceSummary}`,
      });
    }

    return messages;
  }

  /**
   * Summarize Execution Trace
   *
   * Condenses tool calling history into a compact format
   * to avoid overwhelming the LLM with details.
   */
  summarizeTrace(trace: ExecutionStep[]): string {
    // Keep only recent steps
    const recentSteps = trace.slice(-this.maxExecutionSteps);

    return recentSteps
      .map((step) => {
        const params = this.compactParams(step.action.params);
        const resultStatus = step.result.success ? '✓' : '✗';
        const resultData = this.compactResult(step.result);

        return `${step.step}. ${step.action.tool}(${params}) → ${resultStatus} ${resultData}`;
      })
      .join('\n');
  }

  /**
   * Compact parameters for display
   */
  private compactParams(params: Record<string, unknown>): string {
    const entries = Object.entries(params);
    if (entries.length === 0) return '';

    const compacted = entries
      .map(([key, value]) => {
        let val = String(value);
        if (val.length > 50) {
          val = val.slice(0, 47) + '...';
        }
        return `${key}=${val}`;
      })
      .join(', ');

    return compacted;
  }

  /**
   * Compact result for display
   */
  private compactResult(result: { data?: unknown; error?: string }): string {
    if (result.error) {
      return `Error: ${result.error.slice(0, 100)}`;
    }
    if (result.data) {
      const dataStr = JSON.stringify(result.data);
      if (dataStr.length > 100) {
        return dataStr.slice(0, 97) + '...';
      }
      return dataStr;
    }
    return '';
  }

  /**
   * Summarize old conversations using LLM
   *
   * TODO: Implement LLM-based conversation summarization
   * to further compress long-term memory.
   */
  async summarizeConversations(
    messages: UserMessage[]
  ): Promise<UserMessage[]> {
    if (!this.enableTraceSummarization || messages.length < 10) {
      return messages;
    }

    // Take first half of messages and summarize them
    const toSummarize = messages.slice(0, Math.floor(messages.length / 2));
    const toKeep = messages.slice(Math.floor(messages.length / 2));

    try {
      const conversationText = toSummarize
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const summary = await this.llm.chat(
        [
          {
            role: 'system',
            content: `你是一個對話摘要助手。將以下對話摘要為簡潔的重點，保留關鍵資訊。`,
          },
          {
            role: 'user',
            content: `請摘要以下對話：\n\n${conversationText}`,
          },
        ],
        {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          maxTokens: 500,
        }
      );

      // Replace old messages with summary
      const summarizedMessage: UserMessage = {
        role: 'assistant',
        content: `[對話摘要]\n${summary}`,
        timestamp: new Date(),
      };

      return [summarizedMessage, ...toKeep];
    } catch (error) {
      console.error('[MemoryManager] Failed to summarize conversations:', error);
      return messages; // Return original on error
    }
  }

  /**
   * Add user message to memory
   */
  addUserMessage(state: SupervisorState, content: string): SupervisorState {
    state.memory.userVisible.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });
    return state;
  }

  /**
   * Add assistant message to memory
   */
  addAssistantMessage(
    state: SupervisorState,
    content: string
  ): SupervisorState {
    state.memory.userVisible.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
    return state;
  }

  /**
   * Clear execution trace (called after task completion)
   */
  clearExecutionTrace(state: SupervisorState): SupervisorState {
    state.memory.executionTrace = [];
    return state;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(state: SupervisorState): {
    userVisibleCount: number;
    executionStepsCount: number;
    estimatedTokens: number;
  } {
    const estimateTokens = (data: unknown) => {
      return Math.ceil(JSON.stringify(data).length / 4);
    };

    return {
      userVisibleCount: state.memory.userVisible.length,
      executionStepsCount: state.memory.executionTrace.length,
      estimatedTokens:
        estimateTokens(state.memory.userVisible) +
        estimateTokens(state.memory.executionTrace),
    };
  }
}

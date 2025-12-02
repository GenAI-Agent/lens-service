/**
 * State Manager for Supervisor Agent
 *
 * Implements:
 * - LangChain State Control
 * - Context Window Management
 * - Token Usage Tracking
 * - Memory Stratification (Long-term vs Short-term)
 * - Context Trimming Strategies
 */

import type {
  SupervisorState,
  Decision,
  ToolResult,
  ExecutionStep,
  UserMessage,
} from '@lens-service/shared/types';

export interface StateManagerConfig {
  maxTokens?: number;
  trimThreshold?: number;  // Percentage (0-1) of maxTokens before trimming
  keepRecentSteps?: number;  // Number of recent execution steps to keep
}

export interface DatabaseService {
  getSessionMemory(sessionId: string): Promise<{
    tenantId: string;
    messages: UserMessage[];
    tokenUsage?: number;
  }>;
  updateSessionMemory(
    sessionId: string,
    data: {
      messages: UserMessage[];
      tokenUsage?: number;
    }
  ): Promise<void>;
}

export class StateManager {
  private readonly maxTokens: number;
  private readonly trimThreshold: number;
  private readonly keepRecentSteps: number;

  constructor(
    private readonly db: DatabaseService,
    config: StateManagerConfig = {}
  ) {
    this.maxTokens = config.maxTokens ?? 8000;
    this.trimThreshold = config.trimThreshold ?? 0.8;
    this.keepRecentSteps = config.keepRecentSteps ?? 5;
  }

  /**
   * Initialize State from database and user query
   */
  async initializeState(
    sessionId: string,
    userId: string,
    userQuery: string,
    skillPrompt?: string
  ): Promise<SupervisorState> {
    // Load session memory from DB (only user-visible messages)
    const sessionMemory = await this.db.getSessionMemory(sessionId);

    return {
      sessionId,
      userId,
      tenantId: sessionMemory.tenantId,
      currentTask: {
        userQuery,
        skillPrompt,
        startedAt: new Date(),
      },
      memory: {
        userVisible: sessionMemory.messages || [],
        executionTrace: [],
      },
      tokenUsage: {
        current: this.estimateTokens(sessionMemory.messages),
        limit: this.maxTokens,
      },
      isDone: false,
    };
  }

  /**
   * Update State after tool execution
   */
  updateState(
    state: SupervisorState,
    decision: Decision,
    result: ToolResult
  ): SupervisorState {
    // 1. Record to Short-term Trace
    const newStep: ExecutionStep = {
      step: state.memory.executionTrace.length + 1,
      action: decision.toolCall!,
      result,
      timestamp: new Date(),
    };

    state.memory.executionTrace.push(newStep);

    // 2. Update Token Count
    const stepTokens = this.estimateTokens([decision.toolCall, result]);
    state.tokenUsage.current += stepTokens;

    // 3. Check if trimming is needed
    const usageRatio = state.tokenUsage.current / state.tokenUsage.limit;
    if (usageRatio > this.trimThreshold) {
      state = this.trimContext(state);
    }

    return state;
  }

  /**
   * Trim Context to avoid Token explosion
   *
   * Strategy:
   * 1. Remove old Execution Trace (only keep recent N steps)
   * 2. Summarize old conversations (TODO: LLM-based summarization)
   * 3. Remove oldest conversations if still over limit
   */
  private trimContext(state: SupervisorState): SupervisorState {
    console.log('[StateManager] Trimming context...');
    const before = state.tokenUsage.current;

    // Strategy 1: Trim Execution Trace (keep only recent steps)
    if (state.memory.executionTrace.length > this.keepRecentSteps) {
      const removed = state.memory.executionTrace.length - this.keepRecentSteps;
      state.memory.executionTrace = state.memory.executionTrace.slice(
        -this.keepRecentSteps
      );
      console.log(`[StateManager] Removed ${removed} old execution steps`);
    }

    // Strategy 2: Summarize old conversations (TODO: LLM summarization)
    // For now, we just remove oldest conversations if needed

    // Strategy 3: Remove oldest conversations if still over limit
    while (
      state.tokenUsage.current > this.maxTokens * 0.7 &&
      state.memory.userVisible.length > 5
    ) {
      // Keep at least 5 recent messages
      const removed = state.memory.userVisible.shift();
      if (removed) {
        const tokens = this.estimateTokens([removed]);
        state.tokenUsage.current -= tokens;
        console.log(
          `[StateManager] Removed oldest message (${tokens} tokens)`
        );
      }
    }

    // Recalculate total tokens
    state.tokenUsage.current = this.estimateTokens([
      state.memory.userVisible,
      state.memory.executionTrace,
    ]);
    state.tokenUsage.lastTrimmedAt = new Date();

    const after = state.tokenUsage.current;
    console.log(`[StateManager] Trimmed: ${before} -> ${after} tokens`);

    return state;
  }

  /**
   * Save to Long-term Memory (only user-visible messages)
   *
   * Important: We do NOT save the execution trace to DB.
   * Only the user query and final response are persisted.
   */
  async saveToLongTermMemory(state: SupervisorState): Promise<void> {
    if (!state.finalResponse) {
      console.warn('[StateManager] No final response to save');
      return;
    }

    // Add user query and final response to long-term memory
    const newMessages: UserMessage[] = [
      {
        role: 'user',
        content: state.currentTask.userQuery,
        timestamp: state.currentTask.startedAt,
      },
      {
        role: 'assistant',
        content: state.finalResponse,
        timestamp: new Date(),
      },
    ];

    const updatedMessages = [...state.memory.userVisible, ...newMessages];

    await this.db.updateSessionMemory(state.sessionId, {
      messages: updatedMessages,
      tokenUsage: this.estimateTokens(updatedMessages),
    });

    console.log(
      `[StateManager] Saved to long-term memory (session: ${state.sessionId})`
    );
  }

  /**
   * Estimate tokens for data
   *
   * Simple heuristic: 1 token ≈ 4 characters
   * TODO: Use tiktoken for accurate counting
   */
  estimateTokens(data: unknown): number {
    const str = JSON.stringify(data);
    return Math.ceil(str.length / 4);
  }

  /**
   * Get current token usage percentage
   */
  getTokenUsagePercentage(state: SupervisorState): number {
    return (state.tokenUsage.current / state.tokenUsage.limit) * 100;
  }

  /**
   * Check if context window is near limit
   */
  isNearLimit(state: SupervisorState): boolean {
    return this.getTokenUsagePercentage(state) > this.trimThreshold * 100;
  }
}

/**
 * Supervisor Agent State Schema
 *
 * This file defines the core state structure for the Supervisor Agent,
 * implementing a continuous decision loop with memory stratification.
 */

export interface SupervisorState {
  // Session Identification
  sessionId: string;
  userId: string;
  tenantId: string;

  // Current Task
  currentTask: {
    userQuery: string;           // Original user question
    skillPrompt?: string;        // If triggered by /skill_name
    startedAt: Date;
  };

  // Memory (Stratified)
  memory: {
    // Long-term: User-visible conversation (saved to DB)
    userVisible: UserMessage[];

    // Short-term: Current task execution trace (not fully saved to DB)
    executionTrace: ExecutionStep[];
  };

  // Context Window Management
  tokenUsage: {
    current: number;
    limit: number;
    lastTrimmedAt?: Date;
  };

  // Decision State
  isDone: boolean;
  finalResponse?: string;
  error?: string;
}

export interface UserMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExecutionStep {
  step: number;
  action: ToolCall;
  result: ToolResult;
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  reasoning?: string;  // Supervisor's thought process
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
  };
}

/**
 * Decision made by Supervisor Agent
 */
export interface Decision {
  action: 'use_tool' | 'respond';
  reasoning?: string;
  toolCall?: ToolCall;
  response?: string;
}

/**
 * Chat Message for LLM Communication
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

/**
 * Supervisor Events for Streaming
 */
export type SupervisorEvent =
  | { type: 'thinking'; content: string }
  | { type: 'tool_call_start'; tool: string; params: Record<string, unknown> }
  | { type: 'tool_call_end'; tool: string; result: ToolResult }
  | { type: 'response_chunk'; content: string }
  | { type: 'response_complete'; content: string }
  | { type: 'error'; error: string };

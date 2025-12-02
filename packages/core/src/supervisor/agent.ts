/**
 * Supervisor Agent - Core Decision Loop
 *
 * Implements a continuous agentic flow where:
 * 1. Supervisor makes decisions based on current state
 * 2. Executes tools as needed
 * 3. Every action returns to supervisor for next decision
 * 4. Streams all events to frontend (tool calls, thinking, responses)
 *
 * Key Features:
 * - Continuous decision loop (not one-time planning)
 * - State control with token management
 * - Memory stratification
 * - Real-time streaming
 */

import type {
  SupervisorState,
  SupervisorEvent,
  Decision,
  ToolCall,
  ToolResult,
  ChatMessage,
} from '@lens-service/shared/types';
import { StateManager } from './state-manager';
import { MemoryManager } from './memory-manager';

export interface SupervisorConfig {
  defaultSystemPrompt: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
}

export interface LLMService {
  chat(
    messages: ChatMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<string>;
  streamChat(
    messages: ChatMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string, void, unknown>;
  chatWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    options?: { model?: string; temperature?: number }
  ): Promise<LLMToolResponse>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMToolResponse {
  action: 'use_tool' | 'respond';
  reasoning?: string;
  toolCall?: {
    tool: string;
    params: Record<string, unknown>;
  };
  response?: string;
}

export interface ToolExecutor {
  execute(toolName: string, params: Record<string, unknown>): Promise<ToolResult>;
  getAvailableTools(): ToolDefinition[];
}

export class SupervisorAgent {
  private readonly stateManager: StateManager;
  private readonly memoryManager: MemoryManager;
  private readonly config: Required<SupervisorConfig>;

  constructor(
    private readonly llm: LLMService,
    private readonly toolExecutor: ToolExecutor,
    stateManager: StateManager,
    memoryManager: MemoryManager,
    config: SupervisorConfig
  ) {
    this.stateManager = stateManager;
    this.memoryManager = memoryManager;
    this.config = {
      defaultSystemPrompt: config.defaultSystemPrompt,
      model: config.model ?? 'gpt-4o',
      temperature: config.temperature ?? 0.7,
      maxIterations: config.maxIterations ?? 10,
    };
  }

  /**
   * Main execution loop with streaming
   *
   * Yields events as the agent progresses through its decision loop.
   */
  async *run(
    sessionId: string,
    userId: string,
    userQuery: string,
    skillPrompt?: string
  ): AsyncGenerator<SupervisorEvent, void, unknown> {
    let state: SupervisorState;
    let iterations = 0;

    try {
      // 1. Initialize State
      state = await this.stateManager.initializeState(
        sessionId,
        userId,
        userQuery,
        skillPrompt
      );

      console.log('[SupervisorAgent] Starting decision loop');
      console.log(`[SupervisorAgent] Session: ${sessionId}, User: ${userId}`);
      console.log(`[SupervisorAgent] Query: ${userQuery}`);

      // 2. Decision Loop
      while (!state.isDone && iterations < this.config.maxIterations) {
        iterations++;
        console.log(`[SupervisorAgent] Iteration ${iterations}`);

        // 2.1 Make Decision
        const decision = await this.decide(state);

        // Stream: Thinking (optional)
        if (decision.reasoning) {
          yield {
            type: 'thinking',
            content: decision.reasoning,
          };
        }

        // 2.2 Execute Tool or Respond
        if (decision.action === 'use_tool' && decision.toolCall) {
          // Stream: Tool Call Start
          yield {
            type: 'tool_call_start',
            tool: decision.toolCall.tool,
            params: decision.toolCall.params,
          };

          // Execute Tool
          const result = await this.executeTool(decision.toolCall);

          // Stream: Tool Call End
          yield {
            type: 'tool_call_end',
            tool: decision.toolCall.tool,
            result,
          };

          // Update State
          state = this.stateManager.updateState(state, decision, result);

        } else if (decision.action === 'respond') {
          // Generate Final Response (Stream)
          let fullResponse = '';

          // If we have a pre-formed response from decision
          if (decision.response) {
            for (const char of decision.response) {
              fullResponse += char;
              yield {
                type: 'response_chunk',
                content: char,
              };
              // Small delay to simulate streaming
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          } else {
            // Stream from LLM
            const responseStream = await this.generateResponse(state);
            for await (const chunk of responseStream) {
              fullResponse += chunk;
              yield {
                type: 'response_chunk',
                content: chunk,
              };
            }
          }

          state.isDone = true;
          state.finalResponse = fullResponse;

          yield {
            type: 'response_complete',
            content: fullResponse,
          };
        }
      }

      if (iterations >= this.config.maxIterations) {
        console.warn('[SupervisorAgent] Max iterations reached');
        state.isDone = true;
        state.finalResponse = '抱歉，我無法完成此任務，已達到最大迭代次數。';
        yield {
          type: 'error',
          error: 'Max iterations reached',
        };
      }

      // 3. Save to Long-term Memory
      await this.stateManager.saveToLongTermMemory(state);

      console.log('[SupervisorAgent] Task completed successfully');

    } catch (error) {
      console.error('[SupervisorAgent] Error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Make a decision based on current state
   */
  private async decide(state: SupervisorState): Promise<Decision> {
    // Build prompt from memory
    const messages = this.memoryManager.buildDecisionPrompt(
      state,
      this.config.defaultSystemPrompt
    );

    // Get available tools
    const tools = this.toolExecutor.getAvailableTools();

    // Call LLM with tools
    const response = await this.llm.chatWithTools(messages, tools, {
      model: this.config.model,
      temperature: this.config.temperature,
    });

    // Parse decision
    if (response.action === 'use_tool' && response.toolCall) {
      return {
        action: 'use_tool',
        reasoning: response.reasoning,
        toolCall: {
          id: this.generateToolCallId(),
          tool: response.toolCall.tool,
          params: response.toolCall.params,
          reasoning: response.reasoning,
        },
      };
    } else {
      return {
        action: 'respond',
        reasoning: response.reasoning,
        response: response.response,
      };
    }
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      console.log(`[SupervisorAgent] Executing tool: ${toolCall.tool}`);
      console.log(`[SupervisorAgent] Params:`, toolCall.params);

      const result = await this.toolExecutor.execute(
        toolCall.tool,
        toolCall.params
      );

      const executionTime = Date.now() - startTime;
      console.log(`[SupervisorAgent] Tool executed in ${executionTime}ms`);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[SupervisorAgent] Tool execution failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executionTime,
        },
      };
    }
  }

  /**
   * Generate final response (streaming)
   */
  private async *generateResponse(
    state: SupervisorState
  ): AsyncGenerator<string, void, unknown> {
    const messages = this.memoryManager.buildDecisionPrompt(
      state,
      this.config.defaultSystemPrompt
    );

    // Add instruction to generate final response
    messages.push({
      role: 'system',
      content: '請根據以上資訊，生成最終回應給用戶。',
    });

    const stream = this.llm.streamChat(messages, {
      model: this.config.model,
      temperature: this.config.temperature,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Generate unique tool call ID
   */
  private generateToolCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

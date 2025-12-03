/**
 * Supervisor Agent
 * Main agent that orchestrates LLM calls, tool execution, and streaming responses
 */

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { SessionContext, StreamEvent, ToolCall } from './config/types';
import { PromptBuilder } from './context-engineer/prompt-builder';
import { MemoryManager } from './context-engineer/memory-manager';
import { PromptLoader } from './context-engineer/prompt-loader';
import { ToolParser } from './utils/tool-parser';
import { SkillParser } from './utils/skill-parser';
import { KnowledgeSearchTool } from './tools/knowledge-search';
import { WebUseTool } from './tools/web-use';

interface AgentConfig {
  openaiApiKey: string;
  model?: string;
  maxTurns?: number;
}

export class SupervisorAgent extends EventEmitter {
  private openai: OpenAI;
  private model: string;
  private maxTurns: number;
  private memoryManager: MemoryManager;
  private promptBuilder: PromptBuilder;
  private promptLoader: PromptLoader;
  private skillParser: SkillParser;
  private knowledgeSearchTool: KnowledgeSearchTool;
  private webUseTool: WebUseTool;
  private abortController: AbortController | null = null;

  constructor(
    private prisma: PrismaClient,
    config: AgentConfig,
    widgetCallback: (action: string, params: any) => Promise<any>
  ) {
    super();

    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.model = config.model || 'gpt-5.1';
    this.maxTurns = config.maxTurns || 10;

    this.memoryManager = new MemoryManager(prisma, config.openaiApiKey);
    this.promptLoader = new PromptLoader(prisma);
    this.promptBuilder = new PromptBuilder(this.memoryManager, this.promptLoader);
    this.skillParser = new SkillParser(prisma);
    this.knowledgeSearchTool = new KnowledgeSearchTool(prisma, config.openaiApiKey);
    this.webUseTool = new WebUseTool(widgetCallback);
  }

  /**
   * Execute agent for a user query
   * Handles multi-turn LLM calls, tool execution, and streaming
   */
  async execute(context: SessionContext, userQuery: string): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Parse skill if present (/skill_name query)
      const skillResult = await this.skillParser.parseSkill(userQuery);
      const finalQuery = skillResult ? skillResult.modifiedQuery : userQuery;

      // Save user message to DB
      await this.memoryManager.saveMessage(context.sessionId, 'user', finalQuery);

      // Multi-turn loop
      let turnCount = 0;
      let isComplete = false;

      while (turnCount < this.maxTurns && !isComplete) {
        if (this.abortController.signal.aborted) {
          this.emit('event', {
            type: 'error',
            error: 'Execution aborted by user',
          } as StreamEvent);
          break;
        }

        turnCount++;

        // Build prompt with all context
        const messages = await this.promptBuilder.buildPrompt(context);

        // Call LLM with streaming
        const { response, toolCalls, hasCompleteTag } = await this.streamLLM(messages);

        // Save assistant response to DB
        await this.memoryManager.saveMessage(context.sessionId, 'assistant', response);

        // Execute tools if any
        if (toolCalls.length > 0) {
          await this.executeTools(toolCalls, context);
        }

        // Check for completion
        if (hasCompleteTag) {
          isComplete = true;
          this.emit('event', { type: 'done' } as StreamEvent);
        }

        // Check if memory compact is needed
        if (await this.memoryManager.shouldCompact(context.sessionId)) {
          await this.memoryManager.compactMemory(context.sessionId);
        }
      }

      if (turnCount >= this.maxTurns) {
        this.emit('event', {
          type: 'error',
          error: 'Max turns reached',
        } as StreamEvent);
      }
    } catch (error) {
      console.error('Agent execution error:', error);
      this.emit('event', {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as StreamEvent);
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Stream LLM response and parse for tool calls
   */
  private async streamLLM(messages: any[]): Promise<{
    response: string;
    toolCalls: ToolCall[];
    hasCompleteTag: boolean;
  }> {
    const toolParser = new ToolParser();
    const chunks: string[] = [];
    const toolCalls: ToolCall[] = [];
    let hasCompleteTag = false;

    const stream = await this.openai.chat.completions.create(
      {
        model: this.model,
        messages: messages as any,
        stream: true,
      },
      { signal: this.abortController?.signal }
    );

    for await (const chunk of stream) {
      if (this.abortController?.signal.aborted) {
        break;
      }

      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        chunks.push(content);

        // Parse for tool calls and text
        const { text, toolCall } = toolParser.addChunk(content);

        if (text) {
          // Check for complete tag
          if (text.includes('<complete/>')) {
            hasCompleteTag = true;
            const cleanText = text.replace('<complete/>', '').trim();
            if (cleanText) {
              this.emit('event', {
                type: 'text',
                content: cleanText,
              } as StreamEvent);
            }
          } else {
            this.emit('event', {
              type: 'text',
              content: text,
            } as StreamEvent);
          }
        }

        if (toolCall) {
          toolCalls.push(toolCall);
          this.emit('event', {
            type: 'tool_call',
            toolCall,
          } as StreamEvent);
        }
      }
    }

    // Flush any remaining content
    const remaining = toolParser.flush();
    if (remaining) {
      chunks.push(remaining);
    }

    const fullResponse = chunks.join('');

    return {
      response: fullResponse,
      toolCalls,
      hasCompleteTag,
    };
  }

  /**
   * Execute all tool calls
   */
  private async executeTools(toolCalls: ToolCall[], context: SessionContext): Promise<void> {
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall);

      // Save tool result to DB
      const resultText = JSON.stringify(result);
      await this.memoryManager.saveMessage(context.sessionId, 'tool', resultText);

      // Emit tool result event
      this.emit('event', {
        type: 'tool_result',
        toolCall,
        toolResult: result,
      } as StreamEvent);
    }
  }

  /**
   * Execute a single tool
   */
  private async executeTool(toolCall: ToolCall): Promise<any> {
    const { name, parameters } = toolCall;

    switch (name) {
      case 'knowledge_search':
        return await this.knowledgeSearchTool.execute(parameters as { query: string; topK?: number });

      case 'web_use':
        return await this.webUseTool.execute(parameters as any);

      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`,
        };
    }
  }

  /**
   * Abort current execution
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if agent is currently executing
   */
  isExecuting(): boolean {
    return this.abortController !== null;
  }
}

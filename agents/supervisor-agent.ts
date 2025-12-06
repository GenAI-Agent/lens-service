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
      console.log('[Supervisor] Skill parsing result:', skillResult ? 'Found skill' : 'No skill');
      if (skillResult) {
        console.log('[Supervisor] Skill prompt:', skillResult.skillPrompt);
        console.log('[Supervisor] Modified query:', skillResult.modifiedQuery);
      }
      const finalQuery = skillResult ? skillResult.modifiedQuery : userQuery;

      // Save user message to DB
      await this.memoryManager.saveMessage(context.sessionId, 'user', finalQuery);

      // Multi-turn loop
      let turnCount = 0;

      while (turnCount < this.maxTurns) {
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
        const { response, toolCalls } = await this.streamLLM(messages, context);

        // Save assistant response to DB
        await this.memoryManager.saveMessage(context.sessionId, 'assistant', response);

        // 檢查 response 是否包含 </complete> - 如果有就直接結束
        if (response.includes('</complete>')) {
          console.log('[Supervisor] 偵測到 </complete>，結束執行');
          this.emit('event', { type: 'done' } as StreamEvent);
          break;
        }

        console.log('[Supervisor] Turn', turnCount, '- toolCalls:', toolCalls.length);

        // Handle tool execution
        if (toolCalls.length > 0) {
          console.log('[Supervisor] Executing', toolCalls.length, 'tool(s)');

          // Execute ALL tools (use Promise.all for parallel execution)
          const results = await Promise.all(
            toolCalls.map(tc => this.executeTool(tc))
          );

          // Save all results to DB and emit events
          for (let i = 0; i < toolCalls.length; i++) {
            const resultText = JSON.stringify({
              tool: toolCalls[i].name,
              result: results[i]
            });
            await this.memoryManager.saveMessage(context.sessionId, 'tool', resultText);

            this.emit('event', {
              type: 'tool_result',
              toolCall: toolCalls[i],
              toolResult: results[i],
            } as StreamEvent);
          }

          // Continue to next LLM turn with all results
          continue;
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
  private async streamLLM(messages: any[], context: SessionContext): Promise<{
    response: string;
    toolCalls: ToolCall[];
  }> {
    const toolParser = new ToolParser();
    const chunks: string[] = [];
    const toolCalls: ToolCall[] = [];

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
        const { text, toolCalls: parsedCalls } = toolParser.addChunk(content);

        if (text) {
          this.emit('event', {
            type: 'text',
            content: text,
          } as StreamEvent);
        }

        // Handle tool calls (can be one or multiple)
        if (parsedCalls && parsedCalls.length > 0) {
          const isMultiple = parsedCalls.length > 1;
          if (isMultiple) {
            console.log('[Supervisor] Detected multiple tool calls:', parsedCalls.length);
          } else {
            console.log('[Supervisor] Detected single tool call');
          }

          for (const call of parsedCalls) {
            toolCalls.push(call);
            this.emit('event', {
              type: 'tool_call',
              toolCall: call,
            } as StreamEvent);
          }
        }
      }
    }

    // Flush any remaining content
    const remaining = toolParser.flush();
    if (remaining) {
      chunks.push(remaining);
    }

    const fullResponse = chunks.join('');

    // Save LLMTrace to DB (exact input/output pair)
    try {
      await this.prisma.lLMTrace.create({
        data: {
          sessionId: context.sessionId,
          userId: context.userId,
          input: messages as any, // Store as JSON array (exact format sent to LLM)
          output: fullResponse, // Store as text string (exact output from LLM)
        } as any,
      });
      console.log('[Supervisor] LLM trace saved');
    } catch (error) {
      console.error('[Supervisor] Failed to save LLM trace:', error);
    }

    return {
      response: fullResponse,
      toolCalls,
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

      // Web interaction tools
      case 'click':
      case 'doubleClick':
      case 'scroll':
      case 'scrollToElement':
      case 'highlight':
      case 'drag':
      case 'deepCrawl':
        return await this.webUseTool.execute({ action: name, ...parameters } as any);

      default:
        return {
          success: false,
          error: `Unknown tool: ${name}. Available tools: knowledge_search, click, doubleClick, scroll, scrollToElement, highlight, drag, deepCrawl`,
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

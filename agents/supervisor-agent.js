"use strict";
/**
 * Supervisor Agent
 * Main agent that orchestrates LLM calls, tool execution, and streaming responses
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorAgent = void 0;
const openai_1 = __importDefault(require("openai"));
const events_1 = require("events");
const prompt_builder_1 = require("./context-engineer/prompt-builder");
const memory_manager_1 = require("./context-engineer/memory-manager");
const prompt_loader_1 = require("./context-engineer/prompt-loader");
const tool_parser_1 = require("./utils/tool-parser");
const skill_parser_1 = require("./utils/skill-parser");
const knowledge_search_1 = require("./tools/knowledge-search");
const web_use_1 = require("./tools/web-use");
class SupervisorAgent extends events_1.EventEmitter {
    constructor(prisma, config, widgetCallback) {
        super();
        this.prisma = prisma;
        this.abortController = null;
        this.openai = new openai_1.default({ apiKey: config.openaiApiKey });
        this.model = config.model || 'gpt-5.1';
        this.maxTurns = config.maxTurns || 10;
        this.memoryManager = new memory_manager_1.MemoryManager(prisma, config.openaiApiKey);
        this.promptLoader = new prompt_loader_1.PromptLoader(prisma);
        this.promptBuilder = new prompt_builder_1.PromptBuilder(this.memoryManager, this.promptLoader);
        this.skillParser = new skill_parser_1.SkillParser(prisma);
        this.knowledgeSearchTool = new knowledge_search_1.KnowledgeSearchTool(prisma, config.openaiApiKey);
        this.webUseTool = new web_use_1.WebUseTool(widgetCallback);
    }
    /**
     * Execute agent for a user query
     * Handles multi-turn LLM calls, tool execution, and streaming
     */
    async execute(context, userQuery) {
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
                    });
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
                    this.emit('event', { type: 'done' });
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
                });
            }
        }
        catch (error) {
            console.error('Agent execution error:', error);
            this.emit('event', {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        finally {
            this.abortController = null;
        }
    }
    /**
     * Stream LLM response and parse for tool calls
     */
    async streamLLM(messages) {
        const toolParser = new tool_parser_1.ToolParser();
        const chunks = [];
        const toolCalls = [];
        let hasCompleteTag = false;
        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: messages,
            stream: true,
        }, { signal: this.abortController?.signal });
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
                            });
                        }
                    }
                    else {
                        this.emit('event', {
                            type: 'text',
                            content: text,
                        });
                    }
                }
                if (toolCall) {
                    toolCalls.push(toolCall);
                    this.emit('event', {
                        type: 'tool_call',
                        toolCall,
                    });
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
    async executeTools(toolCalls, context) {
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
            });
        }
    }
    /**
     * Execute a single tool
     */
    async executeTool(toolCall) {
        const { name, parameters } = toolCall;
        switch (name) {
            case 'knowledge_search':
                return await this.knowledgeSearchTool.execute(parameters);
            case 'web_use':
                return await this.webUseTool.execute(parameters);
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
    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
    /**
     * Check if agent is currently executing
     */
    isExecuting() {
        return this.abortController !== null;
    }
}
exports.SupervisorAgent = SupervisorAgent;

/**
 * Web Agent - LangChain-based Sub-Agent
 * Handles complex web interactions autonomously
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { WebAgentState, type WebAgentStateType, type PageState, type OperationRecord } from './state';
import { createWebAgentTools } from './tools';
import {
  WEB_AGENT_SYSTEM_PROMPT,
  formatPageInfo,
  formatOperationHistory,
} from './prompts';

/**
 * Web Agent configuration
 */
export interface WebAgentConfig {
  openaiApiKey: string;
  model?: string; // Default: gpt-5.1
  temperature?: number;
  maxIterations?: number;
}

/**
 * Web Agent execution params
 */
export interface WebAgentParams {
  task: string;
  pageState?: PageState;
}

/**
 * Web Agent result
 */
export interface WebAgentResult {
  success: boolean;
  message: string;
  data?: any;
  operationHistory: OperationRecord[];
  errors: string[];
}

/**
 * Web Agent - LangChain React Agent for web interactions
 */
export class WebAgent {
  private llm: ChatOpenAI;
  private widgetCallback: (action: string, params: any) => Promise<any>;
  private panelController: any; // Will be injected
  private config: WebAgentConfig;

  constructor(
    config: WebAgentConfig,
    widgetCallback: (action: string, params: any) => Promise<any>,
    panelController?: any
  ) {
    this.config = config;
    this.widgetCallback = widgetCallback;
    this.panelController = panelController;

    // Initialize LLM with gpt-5.1
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openaiApiKey,
      modelName: config.model || 'gpt-5.1',
      temperature: config.temperature || 0.1,
      streaming: false,
    });
  }

  /**
   * Execute web agent task
   */
  async execute(params: WebAgentParams): Promise<WebAgentResult> {
    const { task, pageState } = params;

    console.log('[WebAgent] Starting execution:', task);

    try {
      // Enter web-agent mode (panel becomes transparent)
      if (this.panelController) {
        await this.panelController.enterWebAgentMode();
      }

      // Create tools with widget callback
      const tools = createWebAgentTools(this.widgetCallback);

      // Create React Agent
      const agent = createReactAgent({
        llm: this.llm,
        tools,
        stateSchema: WebAgentState,
        messageModifier: this.createSystemMessage(task, pageState),
      });

      // Initial state
      const initialState: Partial<WebAgentStateType> = {
        task,
        pageState: pageState || null,
        messages: [],
        operationHistory: [],
        completedSteps: [],
        errors: [],
        result: null,
      };

      // Execute agent with max iterations
      const maxIterations = this.config.maxIterations || 15;
      let currentState = initialState;
      let iterationCount = 0;

      // Run agent loop
      const stream = await agent.stream(currentState, {
        recursionLimit: maxIterations,
      });

      for await (const chunk of stream) {
        // Update progress if available
        if (this.panelController && chunk.agent) {
          const messages = chunk.agent.messages || [];
          const lastMessage = messages[messages.length - 1];

          if (lastMessage) {
            const progress = Math.min(((iterationCount + 1) / maxIterations) * 100, 95);
            this.panelController.updateProgress(progress);
          }
        }

        currentState = { ...currentState, ...chunk.agent };
        iterationCount++;
      }

      // Extract final result
      const finalState = currentState as WebAgentStateType;
      const operationHistory = finalState.operationHistory || [];
      const errors = finalState.errors || [];

      // Determine success
      const success = errors.length === 0 || (finalState.result?.success ?? true);

      // Generate summary message
      const summary = this.generateSummary(finalState);

      console.log('[WebAgent] Execution completed:', { success, operations: operationHistory.length, errors: errors.length });

      return {
        success,
        message: summary,
        data: finalState.result?.data,
        operationHistory,
        errors,
      };
    } catch (error) {
      console.error('[WebAgent] Execution failed:', error);
      return {
        success: false,
        message: `Web agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
        operationHistory: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      // Exit web-agent mode (panel becomes normal)
      if (this.panelController) {
        await this.panelController.exitWebAgentMode();
      }
    }
  }

  /**
   * Create system message with context
   */
  private createSystemMessage(task: string, pageState?: PageState | null): SystemMessage {
    const pageInfo = formatPageInfo(pageState);

    const prompt = WEB_AGENT_SYSTEM_PROMPT
      .replace('{task}', task)
      .replace('{pageInfo}', pageInfo)
      .replace('{operationHistory}', 'No operations yet.');

    return new SystemMessage(prompt);
  }

  /**
   * Generate execution summary
   */
  private generateSummary(state: WebAgentStateType): string {
    const completedSteps = state.completedSteps || [];
    const errors = state.errors || [];
    const operationHistory = state.operationHistory || [];

    if (state.result) {
      return state.result.message;
    }

    const parts: string[] = [];

    if (completedSteps.length > 0) {
      parts.push(`Completed ${completedSteps.length} steps`);
    }

    if (operationHistory.length > 0) {
      parts.push(`Performed ${operationHistory.length} operations`);
    }

    if (errors.length > 0) {
      parts.push(`Encountered ${errors.length} errors`);
    }

    return parts.length > 0
      ? parts.join('. ') + '.'
      : 'Task execution completed.';
  }
}

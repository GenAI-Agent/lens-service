/**
 * Web Agent Tool
 * Wrapper tool for Supervisor Agent to call Web Agent Sub-Agent
 */

import { WebAgent, type WebAgentConfig, type WebAgentParams } from '../web-agent/agent';
import { ToolResult } from '../config/types';
import { PageState } from '../web-agent/state';

interface WebAgentToolParams {
  task: string;
  pageState?: PageState;
}

type WidgetCallback = (action: string, params: any) => Promise<any>;

/**
 * Web Agent Tool for Supervisor
 */
export class WebAgentTool {
  private webAgent: WebAgent;

  constructor(
    config: WebAgentConfig,
    widgetCallback: WidgetCallback,
    panelController?: any
  ) {
    this.webAgent = new WebAgent(config, widgetCallback, panelController);
  }

  /**
   * Execute web agent task
   */
  async execute(params: WebAgentToolParams): Promise<ToolResult> {
    try {
      const { task, pageState } = params;

      console.log('[WebAgentTool] Executing task:', task);

      // Execute web agent
      const result = await this.webAgent.execute({ task, pageState });

      if (result.success) {
        return {
          success: true,
          result: {
            message: result.message,
            operations: result.operationHistory.length,
            data: result.data,
          },
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      console.error('[WebAgentTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

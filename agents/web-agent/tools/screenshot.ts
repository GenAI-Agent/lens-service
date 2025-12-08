/**
 * Screenshot Tool
 * Takes a screenshot of the current page
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create screenshot tool
 */
export function createScreenshotTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'screenshot',
    description: 'Take a screenshot of the current viewport. Returns a data URL of the screenshot.',
    schema: z.object({
      reason: z.string().optional().describe('Reason for taking screenshot'),
    }),
    func: async ({ reason }) => {
      console.log(`[WebAgent] Taking screenshot${reason ? ` (${reason})` : ''}`);

      try {
        const result = await widgetCallback('screenshot', {});

        if (result?.success && result?.screenshot) {
          return `Screenshot captured successfully (${result.screenshot.length} bytes)`;
        } else {
          return `Failed to capture screenshot: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error capturing screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

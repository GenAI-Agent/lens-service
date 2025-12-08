/**
 * Click Tool
 * Clicks on elements in the web page
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create click tool
 */
export function createClickTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'click',
    description: 'Click on an element in the web page. Use the selector from the actionable elements list.',
    schema: z.object({
      selector: z.string().describe('CSS selector of the element to click (e.g., "[data-lens-id=\\"el-0\\"]")'),
      reason: z.string().optional().describe('Reason for clicking this element'),
    }),
    func: async ({ selector, reason }) => {
      console.log(`[WebAgent] Clicking element: ${selector}${reason ? ` (${reason})` : ''}`);

      try {
        const result = await widgetCallback('click', { selector });

        if (result?.success) {
          return `Successfully clicked on element: ${selector}`;
        } else {
          return `Failed to click element: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error clicking element: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

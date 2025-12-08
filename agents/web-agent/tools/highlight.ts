/**
 * Highlight Tool
 * Highlights elements on the page with visual effects
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create highlight tool
 */
export function createHighlightTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'highlight',
    description: 'Highlight an element on the page with a visual effect to show the user what you are focusing on.',
    schema: z.object({
      selector: z.string().describe('CSS selector of the element to highlight'),
      duration: z.number().optional().describe('Duration in milliseconds (default: 2000)'),
      style: z
        .enum(['highlighter', 'glow', 'circle'])
        .optional()
        .describe('Highlight style: highlighter (text), glow (div), circle (button). Auto-detected if not specified.'),
    }),
    func: async ({ selector, duration, style }) => {
      console.log(`[WebAgent] Highlighting element: ${selector} with style ${style || 'auto'}`);

      try {
        const result = await widgetCallback('highlight', { selector, duration, style });

        if (result?.success) {
          return `Successfully highlighted element: ${selector}`;
        } else {
          return `Failed to highlight element: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error highlighting element: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

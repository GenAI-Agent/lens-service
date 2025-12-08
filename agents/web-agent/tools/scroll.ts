/**
 * Scroll Tool
 * Scrolls the page in various directions
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create scroll tool
 */
export function createScrollTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'scroll',
    description: 'Scroll the page in a specified direction or to a specific position.',
    schema: z.object({
      direction: z
        .enum(['up', 'down', 'top', 'bottom'])
        .describe('Direction to scroll: up, down, top (to top of page), bottom (to bottom of page)'),
      distance: z.number().optional().describe('Distance in pixels for up/down scrolling (default: 300)'),
    }),
    func: async ({ direction, distance }) => {
      console.log(`[WebAgent] Scrolling ${direction}${distance ? ` by ${distance}px` : ''}`);

      try {
        const result = await widgetCallback('scroll', { direction, distance });

        if (result?.success) {
          return `Successfully scrolled ${direction}`;
        } else {
          return `Failed to scroll: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error scrolling: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

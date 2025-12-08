/**
 * Type Tool
 * Types text into input fields
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create type tool
 */
export function createTypeTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'type',
    description: 'Type text into an input field or textarea. The element must be focused first.',
    schema: z.object({
      selector: z.string().describe('CSS selector of the input element'),
      text: z.string().describe('Text to type into the field'),
      clear: z.boolean().optional().describe('Clear existing text before typing (default: true)'),
    }),
    func: async ({ selector, text, clear = true }) => {
      console.log(`[WebAgent] Typing into element: ${selector}, text: "${text.substring(0, 50)}..."`);

      try {
        const result = await widgetCallback('type', { selector, text, clear });

        if (result?.success) {
          return `Successfully typed text into ${selector}`;
        } else {
          return `Failed to type text: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error typing text: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

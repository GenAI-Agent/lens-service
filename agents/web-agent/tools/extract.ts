/**
 * Extract Tool
 * Extracts text content from elements
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create extract tool
 */
export function createExtractTool(widgetCallback: (action: string, params: any) => Promise<any>) {
  return new DynamicStructuredTool({
    name: 'extract',
    description: 'Extract text content from one or more elements matching a CSS selector.',
    schema: z.object({
      selector: z.string().describe('CSS selector to find elements'),
      attribute: z
        .string()
        .optional()
        .describe('Optional attribute to extract (e.g., "href", "value"). If not specified, extracts text content.'),
      all: z.boolean().optional().describe('Extract from all matching elements (default: false, first only)'),
    }),
    func: async ({ selector, attribute, all = false }) => {
      console.log(`[WebAgent] Extracting from ${selector}${attribute ? ` (attribute: ${attribute})` : ''}`);

      try {
        const result = await widgetCallback('extract', { selector, attribute, all });

        if (result?.success) {
          const data = result.data;
          if (Array.isArray(data)) {
            return `Extracted ${data.length} items: ${JSON.stringify(data.slice(0, 10))}${data.length > 10 ? '...' : ''}`;
          } else {
            return `Extracted: ${data}`;
          }
        } else {
          return `Failed to extract: ${result?.error || 'Unknown error'}`;
        }
      } catch (error) {
        return `Error extracting: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });
}

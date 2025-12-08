/**
 * Wait Tool
 * Waits for a specified duration
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Create wait tool
 */
export function createWaitTool() {
  return new DynamicStructuredTool({
    name: 'wait',
    description: 'Wait for a specified duration in milliseconds. Useful for waiting for dynamic content to load.',
    schema: z.object({
      duration: z.number().describe('Duration to wait in milliseconds (max: 5000)'),
      reason: z.string().optional().describe('Reason for waiting'),
    }),
    func: async ({ duration, reason }) => {
      const waitTime = Math.min(duration, 5000); // Max 5 seconds
      console.log(`[WebAgent] Waiting ${waitTime}ms${reason ? ` (${reason})` : ''}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`Waited ${waitTime}ms`);
        }, waitTime);
      });
    },
  });
}

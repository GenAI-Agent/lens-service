/**
 * Prompt Loader
 * Loads site-wide prompts from database
 */

import { PrismaClient } from '@prisma/client';

export class PromptLoader {
  constructor(private prisma: PrismaClient) {}

  /**
   * Load site-wide prompts
   * Returns all active global prompts concatenated
   */
  async loadSitePrompts(): Promise<string | null> {
    const prompts = await this.prisma.sitePrompt.findMany({
      where: {
        isGlobal: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (prompts.length === 0) {
      return null;
    }

    return prompts.map((p: any) => p.prompt).join('\n\n');
  }

  /**
   * Load navigation history summary for a session
   * Note: navigationHistory table removed from schema, this is now a no-op
   */
  async loadNavigationHistory(sessionId: string, limit: number = 5): Promise<string | null> {
    // Navigation history tracking removed from schema
    return null;
  }

  /**
   * Save navigation entry
   * Note: navigationHistory table removed from schema, this is now a no-op
   */
  async saveNavigation(sessionId: string, url: string, summary?: string): Promise<void> {
    // Navigation history tracking removed from schema
    // This is a no-op for backwards compatibility
  }
}

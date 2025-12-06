/**
 * Prompt Loader
 * Loads site-wide and URL-specific prompts from database
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
   * Load URL-specific prompt matching the current URL
   * Uses pattern matching (supports wildcards)
   */
  async loadUrlPrompt(currentUrl: string): Promise<string | null> {
    // If currentUrl is not provided or invalid, return null
    if (!currentUrl || currentUrl === 'undefined') {
      return null;
    }

    try {
      const url = new URL(currentUrl);
      const pathname = url.pathname;

      const urlPrompts = await this.prisma.urlPathPrompt.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          priority: 'desc', // Higher priority first
        },
      });

      // Find first matching pattern
      for (const prompt of urlPrompts) {
        if (this.matchesPattern(pathname, prompt.urlPattern)) {
          return prompt.prompt;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to parse URL or load URL prompts:', error);
      return null;
    }
  }

  /**
   * Match pathname against pattern
   * Supports wildcards: /products/* matches /products/123
   */
  private matchesPattern(pathname: string, pattern: string): boolean {
    // Exact match
    if (pathname === pattern) {
      return true;
    }

    // Wildcard match
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      );
      return regex.test(pathname);
    }

    return false;
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

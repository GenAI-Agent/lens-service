/**
 * AI Page Generate Tool
 * Generates visual product/content recommendation pages
 */

import { PrismaClient } from '@prisma/client';
import { ToolResult } from '../config/types';

export interface AIPageItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  price?: string;
  url?: string;
  [key: string]: any; // Allow additional fields
}

export interface AIPageParams {
  title: string;
  template: 'neon-gradient' | 'magazine' | 'social-feed' | 'comic-pop' | 'love-letter';
  items: AIPageItem[];
  bannerPrompt?: string; // Optional custom banner prompt
}

export class AIPageTool {
  constructor(
    private prisma: PrismaClient,
    private baseUrl: string = 'http://localhost:3002'
  ) {}

  /**
   * Generate AI Page
   */
  async execute(params: AIPageParams): Promise<ToolResult> {
    try {
      const { title, template, items, bannerPrompt } = params;

      console.log(`[AIPageTool] Generating page: ${title} with template: ${template}`);

      // Validate items
      if (!items || items.length === 0) {
        return {
          success: false,
          error: 'At least one item is required',
        };
      }

      if (items.length > 20) {
        return {
          success: false,
          error: 'Maximum 20 items allowed per page',
        };
      }

      // Generate unique page ID
      const pageId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Optional: Generate banner image (placeholder for now)
      // TODO: Integrate with Flux API for banner generation
      const bannerUrl = null; // Will be implemented later

      // Save to database with 30 minute expiry
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await this.prisma.aIPage.create({
        data: {
          pageId,
          title,
          template,
          items: items as any, // Store as JSONB
          bannerUrl,
          expiresAt,
        },
      });

      const pageUrl = `${this.baseUrl}/ai-pages/${pageId}`;

      console.log(`[AIPageTool] Page generated successfully: ${pageUrl}`);

      return {
        success: true,
        result: {
          pageId,
          pageUrl,
          title,
          itemCount: items.length,
          expiresAt: expiresAt.toISOString(),
          message: `✅ AI Page generated: "${title}"\n🔗 URL: ${pageUrl}\n⏰ Expires in 30 minutes`,
        },
      };
    } catch (error) {
      console.error('[AIPageTool] Generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get AI Page by ID
   */
  async getPage(pageId: string) {
    try {
      const page = await this.prisma.aIPage.findUnique({
        where: { pageId },
      });

      if (!page) {
        return null;
      }

      // Check if expired
      if (page.expiresAt < new Date()) {
        // Delete expired page
        await this.prisma.aIPage.delete({
          where: { pageId },
        });
        return null;
      }

      return page;
    } catch (error) {
      console.error('[AIPageTool] Failed to get page:', error);
      return null;
    }
  }

  /**
   * Cleanup expired pages (run periodically)
   */
  async cleanupExpiredPages() {
    try {
      const result = await this.prisma.aIPage.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`[AIPageTool] Cleaned up ${result.count} expired pages`);
      return result.count;
    } catch (error) {
      console.error('[AIPageTool] Cleanup failed:', error);
      return 0;
    }
  }
}

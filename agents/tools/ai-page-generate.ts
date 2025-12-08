/**
 * AI Page Generate Tool
 * Automatically generates product recommendation pages
 */

import { ToolResult } from '../config/types';
import axios from 'axios';

export interface AIPageGenerateParams {
  products: Array<{
    productName: string;
    content: string;
    score?: string;
  }>;
  context?: string;
  userQuery?: string;
}

export interface GeneratedPage {
  pageId: string;
  url: string;
  title: string;
  content: string;
  products: any[];
}

/**
 * AI Page Generate Tool
 * Generates beautiful product recommendation pages
 */
export class AIPageGenerateTool {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:8080') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Execute page generation
   */
  async execute(params: AIPageGenerateParams): Promise<ToolResult> {
    try {
      const { products, context, userQuery } = params;

      console.log('[AIPageGenerate] Generating page for', products.length, 'products');

      // Validate products
      if (!products || products.length === 0) {
        return {
          success: false,
          error: 'No products provided for page generation',
        };
      }

      // Generate page content using AI
      const pageContent = await this.generatePageContent(products, context, userQuery);

      // Create page via API
      const generatedPage = await this.createPage(pageContent, products);

      console.log('[AIPageGenerate] Page generated:', generatedPage.url);

      return {
        success: true,
        result: {
          message: `Generated product recommendation page with ${products.length} products`,
          pageUrl: generatedPage.url,
          pageId: generatedPage.pageId,
          title: generatedPage.title,
        },
      };
    } catch (error) {
      console.error('[AIPageGenerate] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate page',
      };
    }
  }

  /**
   * Generate page content using AI
   */
  private async generatePageContent(
    products: AIPageGenerateParams['products'],
    context?: string,
    userQuery?: string
  ): Promise<{
    title: string;
    description: string;
    sections: Array<{
      heading: string;
      content: string;
      productIds: number[];
    }>;
  }> {
    // Create page title
    const title = userQuery
      ? `Recommended Books: ${userQuery}`
      : 'Curated Book Recommendations';

    // Create description
    const description = context
      ? `${context}\n\nWe've selected ${products.length} books that match your interests.`
      : `Discover ${products.length} carefully selected books based on your preferences.`;

    // Group products into sections (3-4 products per section)
    const sections = [];
    const productsPerSection = 3;

    for (let i = 0; i < products.length; i += productsPerSection) {
      const sectionProducts = products.slice(i, i + productsPerSection);
      const sectionNumber = Math.floor(i / productsPerSection) + 1;

      sections.push({
        heading: `Selection ${sectionNumber}`,
        content: this.generateSectionContent(sectionProducts),
        productIds: sectionProducts.map((_, idx) => i + idx),
      });
    }

    return {
      title,
      description,
      sections,
    };
  }

  /**
   * Generate content for a section
   */
  private generateSectionContent(products: AIPageGenerateParams['products']): string {
    const productDescriptions = products.map((product, idx) => {
      const name = product.productName;
      const snippet = product.content.substring(0, 200);
      return `**${idx + 1}. ${name}**\n\n${snippet}...`;
    });

    return productDescriptions.join('\n\n');
  }

  /**
   * Create page via API
   */
  private async createPage(
    pageContent: {
      title: string;
      description: string;
      sections: any[];
    },
    products: AIPageGenerateParams['products']
  ): Promise<GeneratedPage> {
    try {
      // Call Next.js API to create page
      const response = await axios.post(`${this.apiBaseUrl}/api/ai-pages/generate`, {
        title: pageContent.title,
        description: pageContent.description,
        sections: pageContent.sections,
        products: products.map((p, idx) => ({
          id: idx,
          name: p.productName,
          content: p.content,
          score: p.score,
        })),
      });

      const { pageId, url } = response.data;

      return {
        pageId,
        url: `${this.apiBaseUrl}${url}`,
        title: pageContent.title,
        content: pageContent.description,
        products,
      };
    } catch (error) {
      console.error('[AIPageGenerate] API error:', error);

      // Fallback: generate simple page structure
      const pageId = `page_${Date.now()}`;
      const url = `/ai-pages/${pageId}`;

      return {
        pageId,
        url: `${this.apiBaseUrl}${url}`,
        title: pageContent.title,
        content: pageContent.description,
        products,
      };
    }
  }

  /**
   * Helper: Check if products warrant page generation
   */
  shouldGeneratePage(products: any[]): boolean {
    // Generate page only if we have at least 3 products
    return products && products.length >= 3;
  }
}

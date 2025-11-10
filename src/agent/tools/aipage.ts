/**
 * AI Page Generation Tools
 * 包含 AI 頁面生成相關的所有工具和服務
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageGenerationService } from '../../services/ImageGenerationService';

// ==================== AI Page Storage Service ====================
interface AIPageData {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

// 本地儲存目錄
let aipagesOutputDir = '';

export async function saveAIPage(pageId: string, title: string, content: string): Promise<void> {
  const now = new Date();

  // 確保輸出目錄存在
  try {
    await fs.mkdir(aipagesOutputDir, { recursive: true });
  } catch (error) {
    console.error('[AI Page] Failed to create output directory:', error);
    throw error;
  }

  // 儲存為 HTML 檔案
  const filePath = path.join(aipagesOutputDir, `${pageId}.html`);

  try {
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[AI Page] Saved page ${pageId} to file: ${filePath}`);
  } catch (error) {
    console.error('[AI Page] Failed to save page file:', error);
    throw error;
  }

  // 同時儲存 metadata JSON
  const metadataPath = path.join(aipagesOutputDir, `${pageId}.json`);
  const metadata = {
    id: pageId,
    title,
    createdAt: now.toISOString(),
  };

  try {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[AI Page] Saved metadata for ${pageId}`);
  } catch (error) {
    console.error('[AI Page] Failed to save metadata:', error);
    // metadata 失敗不影響主要功能
  }
}

export async function getAIPage(pageId: string): Promise<AIPageData | null> {
  const filePath = path.join(aipagesOutputDir, `${pageId}.html`);
  const metadataPath = path.join(aipagesOutputDir, `${pageId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // 嘗試讀取 metadata
    let metadata = {
      id: pageId,
      title: 'AI Page',
      createdAt: new Date().toISOString(),
    };

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      // metadata 不存在不影響主要功能
    }

    return {
      id: metadata.id,
      title: metadata.title,
      content,
      createdAt: new Date(metadata.createdAt),
    };
  } catch (error) {
    console.error(`[AI Page] Failed to read page ${pageId}:`, error);
    return null;
  }
}

export async function listAIPages(): Promise<AIPageData[]> {
  try {
    const files = await fs.readdir(aipagesOutputDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    const pages: AIPageData[] = [];

    for (const file of htmlFiles) {
      const pageId = file.replace('.html', '');
      const page = await getAIPage(pageId);
      if (page) {
        pages.push(page);
      }
    }

    return pages;
  } catch (error) {
    console.error('[AI Page] Failed to list pages:', error);
    return [];
  }
}

// ==================== Template Management ====================
let templateCache: { [key: string]: string } = {};
let templatesDir = '';
let imageGenerationService: ImageGenerationService | null = null;

export function initAIPageTools(config: { templatesDir?: string; fluxApiUrl?: string; aipagesOutputDir?: string } = {}) {
  templatesDir = config.templatesDir || path.join(process.cwd(), '../TzAI_web/public/aipage-templates');
  aipagesOutputDir = config.aipagesOutputDir || path.join(process.cwd(), '../TzAI_web/public/aipages');

  // 初始化圖片生成服務
  const fluxApiUrl = config.fluxApiUrl || process.env.FLUX_API_URL || 'https://flux.ask-lens.ai/api/v1';
  imageGenerationService = new ImageGenerationService(fluxApiUrl);

  console.log('[AI Page Tools] Initialized with templates dir:', templatesDir);
  console.log('[AI Page Tools] Output directory for AI pages:', aipagesOutputDir);
  console.log('[AI Page Tools] Image generation API:', fluxApiUrl);
}

async function loadTemplate(templateName: string): Promise<string> {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const templatePath = path.join(templatesDir, `${templateName}.html`);

  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    templateCache[templateName] = template;
    return template;
  } catch (error) {
    console.error(`[AI Page] Failed to load template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
}

async function listTemplates(): Promise<string[]> {
  try {
    const files = await fs.readdir(templatesDir);
    return files
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace('.html', ''));
  } catch (error) {
    console.error('[AI Page] Failed to list templates:', error);
    return [];
  }
}

// ==================== AI Page Generation Tool ====================
export const generateAIPageTool = new DynamicStructuredTool({
  name: "generate_ai_page",
  description: `Generates a visual AI page (30-minute expiry) to display book recommendations and product information.

**CRITICAL - When to use this tool:**
You MUST use this tool for:
- Book introductions and recommendations
- Product showcases and catalogs
- User searches for products/books
- Any complex information presentation
- Multi-item displays that benefit from visual formatting

This is NOT optional for book recommendations - always generate an AI page alongside your text response to provide customers with an engaging visual experience that encourages purchases.

**Available Templates:**
- neon-gradient-style: Dark neon with glassmorphism cards
- magazine-style: Magazine layout with large featured images
- social-feed-style: Social media feed style
- comic-pop-style: Vibrant comic book style

Workflow: Fetch book data (search_popular_books or scrape_web) → Generate AI page → Include page URL in response.`,

  schema: z.object({
    title: z.string().describe("Page title that describes the collection. Example: 'Top Psychology Books for 2024'"),
    template: z.enum(['neon-gradient-style', 'magazine-style', 'social-feed-style', 'comic-pop-style'])
      .describe("Template to use. Choose based on mood: neon-gradient-style for modern/tech, magazine-style for elegant, social-feed-style for casual, comic-pop-style for fun/energetic"),
    books: z.array(z.object({
      book_id: z.string().describe("Unique book identifier"),
      title: z.string().describe("Book title"),
      author: z.string().describe("Author name"),
      price: z.string().describe("Price string (e.g., 'NT$ 350')"),
      description: z.string().optional().describe("Brief description or why it's recommended"),
      rating: z.string().optional().describe("Rating if available"),
      imageUrl: z.string().describe("Cover image URL"),
    })).describe("Array of 5-10 books to display. Each book should have complete information for best visual presentation."),
  }),

  func: async ({ title, template, books }) => {
    try {
      console.log(`[AI Page] Generating page: ${title} with template: ${template}`);

      // ==================== 主題圖片/Banner 生成 ====================
      // 為整個 AI Page 生成主題插圖或 banner
      let bannerImageUrl = null;
      if (imageGenerationService) {
        try {
          console.log(`[AI Page] Generating theme banner for: ${title}`);

          // 生成主題 banner 提示詞
          const bannerPrompt = `Elegant banner illustration for "${title}", modern minimalist design, professional book recommendation theme, warm colors, sophisticated typography, high quality digital art`;

          const result = await imageGenerationService.generateImage({
            prompt: bannerPrompt,
            width: 1536,
            height: 512,
            steps: 20,
            filenamePrefix: `aipage_banner/${Date.now()}`,
          });

          if (result.success && result.images && result.images.length > 0) {
            bannerImageUrl = result.images[0].url;
            console.log(`[AI Page] Banner generated successfully: ${bannerImageUrl}`);
          }
        } catch (imageError) {
          console.error('[AI Page] Banner generation failed, continuing without banner:', imageError);
          // 繼續生成頁面，不因 banner 失敗而中斷
        }
      }

      // 載入模板
      const templateHtml = await loadTemplate(template);

      // 生成內容 HTML
      let contentHtml = '';

      if (template === 'neon-gradient-style') {
        contentHtml = generateNeonContent(title, books, bannerImageUrl);
      } else if (template === 'magazine-style') {
        contentHtml = generateMagazineContent(title, books, bannerImageUrl);
      } else if (template === 'social-feed-style') {
        contentHtml = generateSocialContent(title, books, bannerImageUrl);
      } else if (template === 'comic-pop-style') {
        contentHtml = generateComicContent(title, books, bannerImageUrl);
      }

      // 替換模板中的占位符
      const finalHtml = templateHtml
        .replace('{{TITLE}}', title)
        .replace('{{CONTENT}}', contentHtml);

      // 生成唯一 ID
      const pageId = `aipage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 保存頁面
      await saveAIPage(pageId, title, finalHtml);

      // 從環境變數獲取 BASE_URL，如果沒有則使用預設值
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const pageUrl = `${baseUrl}/api/ai-page/${pageId}`;

      return JSON.stringify({
        success: true,
        pageId,
        title,
        url: pageUrl,
        message: `✅ 已生成 AI 頁面：${title}\n📄 頁面 ID: ${pageId}\n🔗 訪問連結: ${pageUrl}`,
      });
    } catch (error: any) {
      console.error('[AI Page] Generation failed:', error);
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ==================== Content Generators ====================
function generateNeonContent(title: string, books: any[], bannerImageUrl: string | null): string {
  const bannerHtml = bannerImageUrl ? `
    <div class="banner-container" style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden;">
      <img src="${bannerImageUrl}" alt="${title}" style="width: 100%; height: auto; display: block;">
    </div>
  ` : '';

  const heroHtml = `
    <div class="neon-hero">
      <h1>${title}</h1>
      <p class="neon-subtitle">精選書籍推薦</p>
    </div>
  `;

  const cardsHtml = books.map((book, index) => `
    <div class="glass-card">
      <div class="card-rank">${index + 1}</div>
      <div class="card-image-wrapper">
        <div class="card-image-bg"></div>
        <img src="${book.imageUrl}" alt="${book.title}">
      </div>
      <h3 class="card-title">${book.title}</h3>
      <p class="card-author">${book.author}</p>
      ${book.description ? `<p class="card-desc">${book.description}</p>` : ''}
      <div class="card-price-section">
        <div class="price-neon">${book.price}</div>
      </div>
      <button class="btn-neon">立即購買</button>
    </div>
  `).join('');

  return `${bannerHtml}${heroHtml}<div class="cards-container">${cardsHtml}</div>`;
}

function generateMagazineContent(title: string, books: any[], bannerImageUrl: string | null): string {
  const bannerHtml = bannerImageUrl ? `
    <div class="banner-container" style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden;">
      <img src="${bannerImageUrl}" alt="${title}" style="width: 100%; height: auto; display: block;">
    </div>
  ` : '';

  // 取第一本作為 featured
  const featured = books[0];
  const others = books.slice(1, 5);

  const featuredHtml = featured ? `
    <div class="book-featured">
      <div class="book-image">
        <img src="${featured.imageUrl}" alt="${featured.title}">
      </div>
      <div class="book-content">
        <span class="book-category">精選推薦</span>
        <h2 class="book-title-big">${featured.title}</h2>
        <p class="book-author">${featured.author}</p>
        ${featured.description ? `<p class="book-desc">${featured.description}</p>` : ''}
        <div class="book-meta-row">
          <div class="rating">
            <span class="stars">⭐⭐⭐⭐⭐</span>
          </div>
          <div>
            <span class="price-big">${featured.price}</span>
          </div>
        </div>
        <button class="btn-buy-big">立即購買</button>
      </div>
    </div>
  ` : '';

  const othersHtml = others.map(book => `
    <div class="book-small">
      <img src="${book.imageUrl}" alt="${book.title}">
      <h3 class="book-title-small">${book.title}</h3>
      <p class="book-author-small">${book.author}</p>
      <div class="price-row">
        <span class="price-small">${book.price}</span>
        <button class="btn-buy-small">購買</button>
      </div>
    </div>
  `).join('');

  return `
    ${bannerHtml}
    <div class="mag-header">
      <div class="mag-title">
        <h1>${title}</h1>
        <p class="mag-subtitle">編輯精選</p>
      </div>
    </div>
    <div class="mag-grid">
      ${featuredHtml}
      ${othersHtml}
    </div>
  `;
}

function generateSocialContent(title: string, books: any[], bannerImageUrl: string | null): string {
  const bannerHtml = bannerImageUrl ? `
    <div class="banner-container" style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden;">
      <img src="${bannerImageUrl}" alt="${title}" style="width: 100%; height: auto; display: block;">
    </div>
  ` : '';

  const postsHtml = books.map(book => `
    <div class="post-card">
      <div class="post-header">
        <div class="user-info">
          <div class="avatar">📚</div>
          <div>
            <p class="username">Taaze 讀冊</p>
            <p class="post-time">剛剛</p>
          </div>
        </div>
      </div>
      <div class="post-image">
        <img src="${book.imageUrl}" alt="${book.title}">
      </div>
      <div class="post-content">
        <div class="post-actions">
          <span>❤️ 999</span>
          <span>💬 88</span>
          <span>📤</span>
        </div>
        <h3 class="post-title">${book.title}</h3>
        <p class="post-author">作者：${book.author}</p>
        ${book.description ? `<p class="post-desc">${book.description}</p>` : ''}
        <div class="post-price">${book.price}</div>
      </div>
    </div>
  `).join('');

  return `
    ${bannerHtml}
    <div class="social-header">
      <h1>${title}</h1>
    </div>
    <div class="social-feed">
      ${postsHtml}
    </div>
  `;
}

function generateComicContent(title: string, books: any[], bannerImageUrl: string | null): string {
  const bannerHtml = bannerImageUrl ? `
    <div class="banner-container" style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden;">
      <img src="${bannerImageUrl}" alt="${title}" style="width: 100%; height: auto; display: block;">
    </div>
  ` : '';

  const featured = books[0];
  const others = books.slice(1, 5);

  const featuredHtml = featured ? `
    <div class="featured-panel">
      <div class="featured-image-wrapper">
        <img src="${featured.imageUrl}" alt="${featured.title}">
      </div>
      <div class="featured-content">
        <span class="badge-new">NEW!</span>
        <h2 class="featured-title">${featured.title}</h2>
        <p class="featured-author">${featured.author}</p>
        ${featured.description ? `<p class="featured-desc">${featured.description}</p>` : ''}
        <div class="featured-meta">
          <div class="featured-price">${featured.price}</div>
          <div class="featured-rating">
            <span class="stars-big">⭐⭐⭐⭐⭐</span>
          </div>
        </div>
        <button class="btn-comic">立即購買</button>
      </div>
    </div>
  ` : '';

  const othersHtml = others.map(book => `
    <div class="book-card-comic">
      <img src="${book.imageUrl}" alt="${book.title}">
      <h3 class="book-title-comic">${book.title}</h3>
      <p class="book-author-comic">${book.author}</p>
      <div class="book-footer-comic">
        <span class="price-comic">${book.price}</span>
        <button class="btn-small-comic">購買</button>
      </div>
    </div>
  `).join('');

  return `
    ${bannerHtml}
    <div class="comic-header">
      <h1>💥 ${title}</h1>
      <p class="comic-subtitle">超強推薦！</p>
      <div class="explosion explosion-1">HOT</div>
      <div class="explosion explosion-2">NEW</div>
    </div>
    <div class="container">
      ${featuredHtml}
      <div class="books-grid">
        ${othersHtml}
      </div>
    </div>
  `;
}

// ==================== Export ====================
export const aipageTools = [
  generateAIPageTool,
];

export { getAIPage as getAIPageContent };

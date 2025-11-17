/**
 * AI Page Generation Tools
 * 包含 AI 頁面生成相關的所有工具和服務
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ImageGenerationService } from "../../services/ImageGenerationService";

// ==================== Configuration ====================
const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";

// ==================== Database Storage Service (via API) ====================
/**
 * 將 AI 頁面資料儲存到資料庫 (透過 API)
 */
export async function saveAIPageToDB(
  pageId: string,
  title: string,
  template: string,
  books: any[],
  bannerImageUrl: string | null
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/widget/agenticPage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_id: pageId,
        title: title,
        template: template,
        books: books,
        banner_image_url: bannerImageUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[AI Page] Saved page ${pageId} to database via API:`, result);
  } catch (error) {
    console.error("[AI Page] Failed to save page to database:", error);
    throw error;
  }
}

/**
 * 從資料庫讀取 AI 頁面資料 (透過 API)
 */
export async function getAIPageFromDB(pageId: string) {
  try {
    const response = await fetch(
      `${baseUrl}/api/widget/agenticPage/${pageId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[AI Page] Page ${pageId} not found in database`);
        return null;
      }
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const page = await response.json();
    console.log(`[AI Page] Retrieved page ${pageId} from database via API`);
    return page;
  } catch (error) {
    console.error(
      `[AI Page] Failed to read page ${pageId} from database:`,
      error
    );
    return null;
  }
}

// ==================== Template Management ====================
let imageGenerationService: ImageGenerationService | null = null;

export function initAIPageTools(
  config: {
    templatesDir?: string;
    fluxApiUrl?: string;
    aipagesOutputDir?: string;
  } = {}
) {
  // 初始化圖片生成服務
  const fluxApiUrl =
    config.fluxApiUrl ||
    process.env.FLUX_API_URL ||
    "https://flux.ask-lens.ai/api/v1";
  imageGenerationService = new ImageGenerationService(fluxApiUrl);

  console.log("[AI Page Tools] Image generation API:", fluxApiUrl);
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
- love-letter-style: Romantic/sweet

Workflow: Fetch book data (search_popular_books or scrape_web) → Generate AI page → Include page URL in response.`,

  schema: z.object({
    title: z
      .string()
      .describe(
        "Page title that describes the collection. Example: 'Top Psychology Books for 2024'"
      ),
    template: z
      .enum([
        "neon-gradient-style",
        "magazine-style",
        "social-feed-style",
        "comic-pop-style",
        "love-letter-style",
      ])
      .describe(
        "Template to use. Choose based on mood: neon-gradient-style for modern/tech, magazine-style for elegant, social-feed-style for casual, comic-pop-style for fun/energetic, love-letter-style for romantic/sweet"
      ),
    books: z
      .array(
        z.object({
          book_id: z.string().describe("Unique book identifier"),
          title: z.string().describe("Book title"),
          author: z.string().describe("Author name"),
          price: z.string().describe("Price string (e.g., 'NT$ 350')"),
          description: z
            .string()
            .optional()
            .describe("Brief description or why it's recommended"),
          rating: z.string().optional().describe("Rating if available"),
          imageUrl: z.string().describe("Cover image URL"),
        })
      )
      .describe(
        "Array of 5-10 books to display. Each book should have complete information for best visual presentation."
      ),
  }),

  func: async ({ title, template, books }) => {
    try {
      console.log(
        `[AI Page] Generating page: ${title} with template: ${template}`
      );

      // ==================== 主題圖片/Banner 生成 ====================
      // 為整個 AI Page 生成主題插圖或 banner
      let bannerImageUrl = null;
      if (imageGenerationService) {
        try {
          console.log(`[AI Page] Generating theme banner for: ${title}`);

          // 生成主題 banner 提示詞
          // const bannerPrompt = `Elegant banner illustration for "${title}", modern minimalist design, professional book recommendation theme, warm colors, sophisticated typography, high quality digital art`;

          const result = await imageGenerationService.generateImage({
            prompt: title,
            width: 1536,
            height: 512,
            filenamePrefix: `aipage_banner/${Date.now()}`,
          });

          if (result.success && result.s3_urls && result.s3_urls.length > 0) {
            bannerImageUrl = result.s3_urls[0];
            console.log(
              `[AI Page] Banner generated successfully: ${bannerImageUrl}`
            );
          }
        } catch (imageError) {
          console.error(
            "[AI Page] Banner generation failed, continuing without banner:",
            imageError
          );
          // 繼續生成頁面，不因 banner 失敗而中斷
        }
      }

      // 生成唯一 ID
      const pageId = `aipage-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 保存頁面到資料庫
      await saveAIPageToDB(pageId, title, template, books, bannerImageUrl);

      // 從環境變數獲取 BASE_URL，如果沒有則使用預設值
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";
      const pageUrl = `${baseUrl}/agenticPages/${pageId}`;

      return JSON.stringify({
        success: true,
        pageId,
        title,
        url: pageUrl,
        message: `✅ 已生成 AI 頁面：${title}\n📄 頁面 ID: ${pageId}\n🔗 訪問連結: ${pageUrl}`,
      });
    } catch (error: any) {
      console.error("[AI Page] Generation failed:", error);
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ==================== Export ====================
export const aipageTools = [generateAIPageTool];

export { getAIPageFromDB as getAIPageContent };

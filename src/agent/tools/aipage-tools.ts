import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from "../../types";

// API 配置
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : typeof window !== "undefined"
  ? window.location.origin
  : "http://localhost:8080";

// 搜尋索引相關
let searchIndexService: any = null;
let embeddingService: any = null;

// Export all template functions for AI to use
// Templates removed

let currentConfig: ServiceModulerConfig | null = null;

// 儲存生成的 AI Page（內存儲存 + JSON 檔案持久化，永久保存）
const aiPageStore = new Map<
  string,
  {
    content: string;
    createdAt: number;
  }
>();

/**
 * 初始化搜尋索引服務（延遲載入）
 */
async function initSearchIndexing() {
  if (!searchIndexService && process.env.DATABASE_URL) {
    try {
      const { SearchIndexService } = await import(
        "../../services/SearchIndexService"
      );
      const { EmbeddingService } = await import(
        "../../services/EmbeddingService"
      );

      // 初始化 Embedding 服務
      embeddingService = new EmbeddingService({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
        apiKey: process.env.AZURE_OPENAI_API_KEY || "",
        deployment: "text-embedding-3-small",
        dimensions: 1536,
      });

      // 初始化搜尋索引服務
      searchIndexService = new SearchIndexService(
        process.env.DATABASE_URL,
        embeddingService
      );

      console.log("[AI Page] ✅ Search indexing initialized");
    } catch (error) {
      console.error(
        "[AI Page] ⚠️  Failed to initialize search indexing:",
        error
      );
      // 不阻止 AI Page 功能，索引是可選的
    }
  }
}

/**
 * 索引 AI Page 到搜尋系統
 */
async function indexAIPage(
  pageId: string,
  title: string,
  htmlContent: string
): Promise<void> {
  // 確保搜尋索引已初始化
  await initSearchIndexing();

  if (!searchIndexService) {
    console.log("[AI Page] Search indexing not available, skipping");
    return;
  }

  // 從 HTML 中提取純文本（簡單的 HTML 標籤移除）
  const textContent = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 移除 script
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // 移除 style
    .replace(/<[^>]+>/g, " ") // 移除所有 HTML 標籤
    .replace(/\s+/g, " ") // 合併多個空格
    .trim()
    .substring(0, 5000); // 限制長度

  await searchIndexService.indexDocument({
    contentId: pageId,
    contentType: "ai_page",
    title,
    content: textContent,
    summary: textContent.substring(0, 200),
    url: `/agenticPages/${pageId}`,
    tags: ["ai-generated"],
    category: "dynamic-content",
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  });

  console.log(`[AI Page] ✅ Indexed: ${pageId}`);
}

export function initAIPageTools(config: ServiceModulerConfig) {
  currentConfig = config;

  // 初始化搜尋索引（異步，不阻塞）
  initSearchIndexing().catch((err) => {
    console.error("[AI Page] Failed to init search indexing:", err);
  });
}

/**
 * 生成唯一的 Page ID
 */
function generatePageId(): string {
  return `ai-page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Tool: 管理 AI Page（生成）
 *
 * AI Page 用於在對話過程中生成精美的視覺化內容，增強用戶體驗。
 * 使用場景：書籍推薦列表、搜尋結果展示、訂單詳情、資料比較表格等。
 *
 * 這不是獨立功能，而是輔助對話的增強工具。
 */
export const manageAIPageTool = new DynamicStructuredTool({
  name: "manage_ai_page",
  description: `管理 AI Page - 用於在對話中創建精美的視覺化內容頁面。

**AI Page 定位**：
- 並非獨立應用，而是增強對話體驗的輔助工具
- 用於展示複雜資訊（如書籍列表、比較表格、訂單詳情等）
- 提供比純文字更好的視覺呈現

**使用場景**：
- 書籍推薦：生成精美的書籍卡片列表
- 搜尋結果：展示多個商品的比較表格
- 訂單資訊：格式化顯示訂單詳情
- 資料分析：圖表和統計資訊展示

**頁面會永久保存並自動索引到搜尋系統**`,
  schema: z.object({
    // 創建/更新時需要
    title: z.string().optional().describe("頁面標題（創建時必填）"),
    htmlContent: z
      .string()
      .optional()
      .describe("頁面 HTML 內容，只需要 body 部分（創建/更新時必填）"),
  }),
  func: async ({ title, htmlContent }) => {
    if (!currentConfig?.agent?.enableAIPageGeneration) {
      return JSON.stringify({
        success: false,
        message: "AI Page 生成功能未啟用",
      });
    }

    if (!title || !htmlContent) {
      return JSON.stringify({
        success: false,
        message: "創建頁面需要提供 title 和 htmlContent",
      });
    }

    const newPageId = generatePageId();

    const pageData = {
      content: htmlContent,
      createdAt: Date.now(),
    };

    // 儲存到記憶體
    aiPageStore.set(newPageId, pageData);

    // 🔍 搜尋索引：自動索引到搜尋系統
    try {
      await indexAIPage(newPageId, title, htmlContent);
    } catch (error) {
      console.error("[AI Page] Failed to index page:", error);
      // 不阻止 AI Page 生成，即使索引失敗
    }

    return JSON.stringify({
      success: true,
      pageId: newPageId,
      url: `/agenticPages/${newPageId}`,
      message: `AI Page 已生成並永久儲存`,
      createdAt: new Date(pageData.createdAt).toLocaleString("zh-TW"),
    });
  },
});

// ==================== 新版本（透過 API） ====================
/**
 * 取得 AI Page 內容（透過 API）
 */
export async function getAIPageContent(pageId: string): Promise<any | null> {
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
        console.error(`[AI Page] Page ${pageId} not found`);
        return null;
      }
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const page = await response.json();
    console.log(`[AI Page] Retrieved page ${pageId} from API`);
    return page;
  } catch (error) {
    console.error("[AI Page] Failed to get page from API:", error);
    return null;
  }
}

/**
 * 列出所有 AI Page（透過 API）
 */
export async function listAIPages(): Promise<
  Array<{ pageId: string; createdAt: string }>
> {
  try {
    const response = await fetch(`${baseUrl}/api/widget/agenticPage`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const pages = await response.json();
    console.log(`[AI Page] Retrieved ${pages.length} pages from API`);

    // 轉換格式以符合原本的介面
    return pages.map((page: any) => ({
      pageId: page.page_id,
      createdAt: page.created_at,
    }));
  } catch (error) {
    console.error("[AI Page] Failed to list pages from API:", error);
    return [];
  }
}

export const aipageTools = [manageAIPageTool];

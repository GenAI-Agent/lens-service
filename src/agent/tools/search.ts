import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from "../../types";

/**
 * ========================================
 * Search Tools - 整合搜尋功能
 * ========================================
 *
 * 包含：
 * 1. 客服資料庫搜尋工具 (search_customer_service_data) - 搜尋 manual_indexes
 * 2. 商品搜尋工具 (search_products) - 搜尋 search_index (靜態頁面、AI Pages、商品等)
 * 3. 內容詳情工具 (get_content_detail) - 獲取完整內容
 *
 * 整合服務：
 * - SearchIndexService: 管理 search_index 表
 * - ManualIndexService: 管理 manual_indexes 表
 * - HybridSearchService: 混合搜尋（BM25 + 向量）
 * - EmbeddingService: 向量嵌入
 */

let currentConfig: ServiceModulerConfig | null = null;
let searchIndexService: any = null;
let embeddingService: any = null;

/**
 * 初始化搜尋服務（延遲載入）
 */
async function initSearchService() {
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

      console.log("[Search Tools] ✅ Search service initialized");
    } catch (error) {
      console.error(
        "[Search Tools] ⚠️  Failed to initialize search service:",
        error
      );
      throw error;
    }
  }

  return searchIndexService;
}

export function initSearchTools(config: ServiceModulerConfig) {
  currentConfig = config;

  // 預先初始化搜尋服務（異步，不阻塞）
  if (config.agent?.enableInternalSearch) {
    initSearchService().catch((err) => {
      console.error("[Search Tools] Failed to init search service:", err);
    });
  }
}

// ========================================
// 1. 客服資料庫搜尋工具 (Manual Index)
// ========================================

/**
 * Tool: 搜尋客服資料庫 (Manual Index)
 *
 * 這是主要的客服知識庫搜尋工具，應該優先使用
 * 使用向量搜尋 + BM25 的混合搜尋系統
 */
export const searchCustomerServiceDataTool = new DynamicStructuredTool({
  name: "search_customer_service_data",
  description: `⚠️ CRITICAL: Searches the Lens customer service knowledge base for company policies, order processes, FAQs, and service documentation.

**MANDATORY USAGE RULES:**
Use this tool when users ask about:
1. **Definitions and concepts** - Order status definitions, shipping terms, payment terms
2. **Policies and procedures** - Return policies, refund policies, privacy policies
3. **Process explanations** - How order processing works, how shipping works
4. **FAQs and support** - Common questions about services
5. **General service inquiries** - Questions about how things work

**Examples:**
- "What is the return policy?" → USE THIS TOOL
- "什麼是 Lens" (order status definitions) → USE THIS TOOL FIRST before querying database
- "How does shipping work?" → USE THIS TOOL

⚠️ IMPORTANT: When user asks about **definitions** (定義) or **explanations** (說明), ALWAYS search this knowledge base FIRST, even if they also mention querying the database.

This is your primary source for customer service information. Do NOT use this for product searches.`,

  schema: z.object({
    query: z.string().describe("The search query in natural language"),
    limit: z
      .number()
      .optional()
      .default(3)
      .describe("Maximum number of results to return (default: 3)"),
    minScore: z
      .number()
      .optional()
      .default(0.15)
      .describe("Minimum relevance score threshold (default: 0.15, range 0-1)"),
  }),

  func: async ({ query, limit = 3, minScore = 0.15 }) => {
    try {
      console.log(
        `[Customer Service Data Tool] 搜尋客服資料庫: query="${query}", limit=${limit}`
      );

      // 調用 Lens 的搜尋 API
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL
        ? process.env.NEXT_PUBLIC_BASE_URL
        : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:8080";

      const response = await fetch(
        `${apiUrl}/api/widget/manual-indexes/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit,
            minScore,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API 返回錯誤: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.results || data.results.length === 0) {
        return JSON.stringify({
          success: false,
          message: `客服資料庫中未找到與「${query}」相關的內容`,
          results: [],
          count: 0,
        });
      }

      // 格式化結果
      const formattedResults = data.results.map((r: any) => ({
        name: r.name,
        description: r.description,
        content: r.content.substring(0, 1000), // 限制內容長度
        url: r.url,
        type: r.type,
        relevanceScore: r.hybrid_score,
      }));

      console.log(
        `✅ [Customer Service Data Tool] 找到 ${formattedResults.length} 筆結果`
      );

      return JSON.stringify({
        success: true,
        query,
        count: formattedResults.length,
        results: formattedResults,
        message: `在客服資料庫中找到 ${formattedResults.length} 筆與「${query}」相關的內容`,
      });
    } catch (error: any) {
      console.error("[Customer Service Data Tool] 搜尋失敗:", error);

      return JSON.stringify({
        success: false,
        message: `搜尋客服資料庫時發生錯誤：${error.message}`,
        error: error.message,
        results: [],
      });
    }
  },
});

// ========================================
// 2. 商品搜尋工具 (Search Index)
// ========================================

/**
 * Tool: 搜尋商品 (靜態頁面、AI Pages、商品等)
 */
export const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: `Searches for products, books, and catalog items in the indexed product database.

Use this tool when users search for or ask about:
- Books by topic or keywords (e.g., "psychology books", "business books", "悲傷的書")
- Product recommendations and suggestions
- Specific product features or availability
- Book authors, titles, or subjects
- Previously generated AI pages showcasing products

**Multi-Query Support**: You can pass multiple search keywords to improve search accuracy.
For example, if user asks "推薦心理學和商業相關的暢銷書", pass keywords: ["心理學", "商業", "暢銷書"]

**Category Filtering is DISABLED**: Searches across all categories without filtering.

Results are ranked using hybrid search (BM25 + Vector) with RRF fusion, plus:
- Recency boost: Newer books get up to 10% score boost
- Discount boost: Higher discounts get up to 5% score boost

Example: User asks "心理學書籍" → Use this tool with keywords: ["心理學"]`,

  schema: z.object({
    keywords: z
      .array(z.string())
      .describe(
        "Array of search keywords. Multiple keywords will be combined using RRF. Example: ['心理學', '商業'] or ['暢銷書']"
      ),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Maximum results to return (default: 20)"),
  }),

  func: async ({ keywords, limit = 20 }) => {
    try {
      // 初始化搜尋服務
      const service = await initSearchService();

      if (!service) {
        return JSON.stringify({
          success: false,
          message: "內部搜尋服務未啟用或配置不正確",
          results: [],
        });
      }

      // 使用新的 searchProducts 方法 (不使用分類過濾)
      const results = await service.searchProducts(keywords, {
        categories: null,
        limit,
      });

      // 格式化結果
      const formattedResults = results.map((result: any) => ({
        contentId: result.content_id,
        title: result.title,
        contentType: result.content_type,
        summary:
          result.summary ||
          (result.content ? result.content.substring(0, 200) : ""),
        url: result.url,
        tags: result.tags,
        category: result.category,
        metadata: result.metadata,
        score: result.score ? result.score.toFixed(3) : "0",
        relevanceExplanation: result.relevanceExplanation,
      }));

      console.log(
        `[Product Search Tool] Found ${
          results.length
        } results for keywords: ${keywords.join(", ")}`
      );

      return JSON.stringify({
        success: true,
        keywords,
        totalResults: results.length,
        results: formattedResults,
        message: `找到 ${results.length} 個相關商品`,
      });
    } catch (error) {
      console.error("[Product Search Tool] Search failed:", error);
      return JSON.stringify({
        success: false,
        message: `商品搜尋失敗：${
          error instanceof Error ? error.message : "未知錯誤"
        }`,
        results: [],
      });
    }
  },
});

// ========================================
// 3. 取得內容詳情工具
// ========================================

/**
 * Tool: 取得特定內容的完整資訊
 */
export const getContentDetailTool = new DynamicStructuredTool({
  name: "get_content_detail",
  description: `Retrieves the full content and details for a specific indexed item by its ID.

Use this tool after search_products returns results and you need the complete content to answer the user's question.

Example workflow: search_products finds relevant items → use their contentId with this tool to get full details.`,

  schema: z.object({
    contentId: z
      .string()
      .describe("The unique content ID obtained from search results"),
  }),

  func: async ({ contentId }) => {
    try {
      // 初始化搜尋服務
      const service = await initSearchService();

      if (!service) {
        return JSON.stringify({
          success: false,
          message: "搜尋服務未啟用",
        });
      }

      // 使用 content_id 作為查詢，exact match
      const result = await service.pool.query(
        "SELECT * FROM search_index WHERE content_id = $1",
        [contentId]
      );

      if (result.rows.length === 0) {
        return JSON.stringify({
          success: false,
          message: "找不到指定的內容",
        });
      }

      const content = result.rows[0];

      return JSON.stringify({
        success: true,
        content: {
          id: content.content_id,
          type: content.content_type,
          title: content.title,
          content: content.content, // 完整內容
          summary: content.summary,
          url: content.url,
          tags: content.tags,
          category: content.category,
          metadata: content.metadata,
        },
      });
    } catch (error) {
      console.error(
        "[Content Detail Tool] Failed to get content detail:",
        error
      );
      return JSON.stringify({
        success: false,
        message: `取得內容失敗：${
          error instanceof Error ? error.message : "未知錯誤"
        }`,
      });
    }
  },
});

// ========================================
// 6. 關鍵字搜尋工具 (純BM25，搜尋書名、作者、出版社)
// ========================================

/**
 * 判斷關鍵字匹配類型
 */
function determineMatchType(row: any, keyword: string): string {
  const title = row.title?.toLowerCase() || "";
  const author = row.metadata?.author?.toLowerCase() || "";
  const publisher = row.metadata?.publisher?.toLowerCase() || "";
  const kw = keyword.toLowerCase();

  const matches: string[] = [];
  if (title.includes(kw)) matches.push("書名");
  if (author.includes(kw)) matches.push("作者");
  if (publisher.includes(kw)) matches.push("出版社");

  return matches.length > 0 ? `匹配: ${matches.join(", ")}` : "相關匹配";
}

// ========================================
// Export all tools
// ========================================

export const searchTools = [
  searchCustomerServiceDataTool, // 客服資料庫搜尋 (manual_indexes)
  searchProductsTool, // 商品搜尋 (search_index)
  getContentDetailTool, // 取得完整內容
  // searchBestsellersTool, // 暢銷書搜尋
  // search79DiscountBooksTool, // 79折書籍搜尋
  // keywordSearchBooksTool, // 關鍵字搜尋 (BM25)
];

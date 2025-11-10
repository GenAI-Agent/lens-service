import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Manual Index 搜尋工具
 *
 * 使用向量搜尋 + BM25 的混合搜尋系統
 * 從 TzAI_web 的 manual_indexes 資料表中搜尋相關內容
 */

/**
 * Tool: 搜尋 Manual Index 內容
 *
 * 這是主要的知識庫搜尋工具，應該優先使用
 */
export const searchManualIndexTool = new DynamicStructuredTool({
  name: "search_knowledge_base",
  description: `搜尋知識庫中的內容。這是你的主要資訊來源，應該優先使用。

適用場景：
- 用戶詢問任何問題時，首先使用此工具搜尋知識庫
- 查詢公司政策、產品資訊、常見問題
- 搜尋客服相關文檔和說明
- 查找任何已建立的知識內容

**重要**：除非用戶明確要求爬取特定網址，否則應該優先使用此工具，而非 scrape_url。

範例：
- "訂單狀態有哪些？" → 使用此工具搜尋知識庫
- "退貨流程是什麼？" → 使用此工具搜尋知識庫
- "配送方式有哪些？" → 使用此工具搜尋知識庫`,
  schema: z.object({
    query: z.string().describe("搜尋查詢詞"),
    limit: z.number().optional().default(3).describe("返回結果數量（預設3）"),
    minScore: z.number().optional().default(0.15).describe("最低相關度分數（預設0.15）"),
  }),
  func: async ({ query, limit = 3, minScore = 0.15 }) => {
    try {
      console.log(`[Manual Index Tool] 搜尋知識庫: query="${query}", limit=${limit}`);

      // 調用 TzAI_web 的搜尋 API
      const apiUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:8080';

      const response = await fetch(`${apiUrl}/api/widget/manual-indexes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          minScore,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 返回錯誤: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.results || data.results.length === 0) {
        return JSON.stringify({
          success: false,
          message: `知識庫中未找到與「${query}」相關的內容`,
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

      console.log(`✅ [Manual Index Tool] 找到 ${formattedResults.length} 筆結果`);

      return JSON.stringify({
        success: true,
        query,
        count: formattedResults.length,
        results: formattedResults,
        message: `在知識庫中找到 ${formattedResults.length} 筆與「${query}」相關的內容`,
      });

    } catch (error: any) {
      console.error('[Manual Index Tool] 搜尋失敗:', error);

      return JSON.stringify({
        success: false,
        message: `搜尋知識庫時發生錯誤：${error.message}`,
        error: error.message,
        results: [],
      });
    }
  },
});

export const manualIndexTools = [
  searchManualIndexTool,
];

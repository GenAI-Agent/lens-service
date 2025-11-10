import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import type { ServiceModulerConfig } from '../../types';

let currentConfig: ServiceModulerConfig | null = null;
let searchIndexService: any = null;
let embeddingService: any = null;

/**
 * 初始化搜尋服務（延遲載入）
 */
async function initSearchService() {
  if (!searchIndexService && process.env.DATABASE_URL) {
    try {
      const { SearchIndexService } = await import('../../services/SearchIndexService');
      const { EmbeddingService } = await import('../../services/EmbeddingService');

      // 初始化 Embedding 服務
      embeddingService = new EmbeddingService({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        deployment: 'text-embedding-3-small',
        dimensions: 1536,
      });

      // 初始化搜尋索引服務
      searchIndexService = new SearchIndexService(
        process.env.DATABASE_URL,
        embeddingService
      );

      console.log('[Search Tools] ✅ Search service initialized');
    } catch (error) {
      console.error('[Search Tools] ⚠️  Failed to initialize search service:', error);
      throw error;
    }
  }

  return searchIndexService;
}

export function initSearchTools(config: ServiceModulerConfig) {
  currentConfig = config;

  // 預先初始化搜尋服務（異步，不阻塞）
  if (config.agent?.enableManualIndexSearch) {
    initSearchService().catch(err => {
      console.error('[Search Tools] Failed to init search service:', err);
    });
  }
}

/**
 * Tool: 搜尋內部內容 (頁面、AI Page、商品等)
 */
export const searchInternalContentTool = new DynamicStructuredTool({
  name: "search_internal_content",
  description: `搜尋網站內部索引的內容，包括靜態頁面、AI 生成頁面、商品資料等。

使用時機：
- 當用戶詢問網站本身的功能、資訊、服務時
- 需要查找之前生成的 AI Pages
- 查詢網站內已有的內容或資料

注意：
- 使用混合搜尋（關鍵字 + 語意）會返回最相關的結果
- 結果包含標題、內容摘要、URL 等資訊
- 可以限定搜尋的內容類型

範例查詢：
- "如何寄賣二手書"（搜尋網站說明頁面）
- "之前生成的書籍推薦頁面"（搜尋 AI Pages）`,

  schema: z.object({
    query: z.string().describe("搜尋查詢（使用自然語言描述要找什麼）"),
    contentTypes: z.array(z.enum(['static_page', 'ai_page', 'product', 'article'])).optional()
      .describe("限定內容類型（可選）。例如：['ai_page'] 只搜尋 AI 生成的頁面"),
    limit: z.number().optional().default(10)
      .describe("返回結果數量（預設 10，最多 20）"),
    mode: z.enum(['keyword', 'semantic', 'hybrid']).optional().default('hybrid')
      .describe("搜尋模式：keyword=關鍵字匹配, semantic=語意搜尋, hybrid=混合（推薦）"),
  }),

  func: async ({ query, contentTypes, limit = 10, mode = 'hybrid' }) => {
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

      // 執行搜尋
      const results = await service.search(query, {
        mode,
        contentTypes: contentTypes || [],
        limit: Math.min(limit, 20), // 最多 20 個結果
      });

      // 確保 results 是陣列
      const resultsArray = Array.isArray(results) ? results : [];

      // 格式化結果
      const formattedResults = resultsArray.map((result: any) => ({
        contentId: result.contentId,
        title: result.title,
        contentType: result.contentType,
        summary: result.summary || (result.content ? result.content.substring(0, 200) : ''),
        url: result.url,
        tags: result.tags,
        category: result.category,
        score: result.score ? result.score.toFixed(3) : '0',
        bm25Score: result.bm25Score ? result.bm25Score.toFixed(3) : undefined,
        vectorScore: result.vectorScore ? result.vectorScore.toFixed(3) : undefined,
      }));

      console.log(`[Search Tools] Found ${resultsArray.length} results for query: "${query}"`);

      return JSON.stringify({
        success: true,
        query,
        mode,
        totalResults: resultsArray.length,
        results: formattedResults,
        message: `找到 ${resultsArray.length} 個相關結果`,
      });
    } catch (error) {
      console.error('[Search Tools] Search failed:', error);
      return JSON.stringify({
        success: false,
        message: `搜尋失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
        results: [],
      });
    }
  },
});

/**
 * Tool: 取得特定內容的完整資訊
 */
export const getContentDetailTool = new DynamicStructuredTool({
  name: "get_content_detail",
  description: `取得特定內容的完整資訊（用於搜尋後進一步查看內容）。

使用時機：
- search_internal_content 找到相關結果後，需要查看完整內容
- 需要詳細資訊來回答用戶問題`,

  schema: z.object({
    contentId: z.string().describe("內容 ID（從搜尋結果中取得）"),
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
        'SELECT * FROM search_index WHERE content_id = $1',
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
      console.error('[Search Tools] Failed to get content detail:', error);
      return JSON.stringify({
        success: false,
        message: `取得內容失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      });
    }
  },
});

export const searchTools = [
  searchInternalContentTool, // 內部內容搜尋（統一使用這個 tool）
  getContentDetailTool, // 取得完整內容
];

/**
 * LangChain Tools
 * 定義 Agent 可用的工具
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { scrapeUrl, scrapeUrls } from './web-scraper';

/**
 * 網頁爬取工具
 */
export const scrapeWebTool = new DynamicStructuredTool({
  name: 'scrape_web',
  description: `爬取網頁內容。支援單個或多個 URL（最多 5 個）。

使用時機：
- 用戶提供了 URL 並想了解內容
- 需要從外部網站獲取即時資訊
- 用戶要求爬取特定網站

範例：
- "請幫我爬取 https://example.com"
- "這個網頁在說什麼 https://..."`,
  schema: z.object({
    urls: z
      .union([z.string(), z.array(z.string()).max(5)])
      .describe('要爬取的 URL，可以是單個字串或最多 5 個 URL 的陣列'),
    extractMode: z
      .enum(['article', 'full'])
      .optional()
      .default('article')
      .describe('提取模式：article 只提取主要內容，full 提取整頁'),
  }),
  func: async ({ urls, extractMode = 'article' }) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];

    if (urlArray.length === 1) {
      const result = await scrapeUrl(urlArray[0], extractMode);
      return JSON.stringify(result);
    }

    const result = await scrapeUrls(urlArray, extractMode);
    return JSON.stringify(result);
  },
});

/**
 * 知識庫搜尋工具（需要注入 retriever）
 */
export function createSearchKnowledgeTool(
  searchFn: (query: string, limit?: number) => Promise<Array<{ content: string; score: number }>>
) {
  return new DynamicStructuredTool({
    name: 'search_knowledge_base',
    description: `搜尋知識庫，用於回答客戶問題。

使用時機：
- 用戶詢問產品相關問題
- 需要查找政策、FAQ、使用說明等
- 回答客服相關問題`,
    schema: z.object({
      query: z.string().describe('搜尋查詢'),
      limit: z.number().optional().default(5).describe('返回結果數量'),
    }),
    func: async ({ query, limit = 5 }) => {
      const results = await searchFn(query, limit);
      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      });
    },
  });
}

/**
 * 訂單查詢工具（需要注入 database service）
 */
export function createOrderQueryTool(
  queryFn: (orderId: string, userId: string) => Promise<unknown>
) {
  return new DynamicStructuredTool({
    name: 'get_order_status',
    description: `查詢訂單狀態和物流資訊。

使用時機：
- 用戶詢問訂單狀態
- 需要查詢物流追蹤
- 查詢訂單詳情`,
    schema: z.object({
      orderId: z.string().describe('訂單編號'),
      userId: z.string().describe('用戶 ID'),
    }),
    func: async ({ orderId, userId }) => {
      const result = await queryFn(orderId, userId);
      return JSON.stringify(result);
    },
  });
}

/**
 * 商品搜尋工具（需要注入 recommender）
 */
export function createProductSearchTool(
  searchFn: (query: string, options?: { limit?: number; category?: string }) => Promise<unknown>
) {
  return new DynamicStructuredTool({
    name: 'search_products',
    description: `搜尋商品。

使用時機：
- 用戶詢問商品資訊
- 需要推薦相關商品
- 比較不同商品`,
    schema: z.object({
      query: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().default(10).describe('返回結果數量'),
      category: z.string().optional().describe('商品分類篩選'),
    }),
    func: async ({ query, limit = 10, category }) => {
      const result = await searchFn(query, { limit, category });
      return JSON.stringify(result);
    },
  });
}

/**
 * 頁面生成工具（需要注入 page generator）
 */
export function createGeneratePageTool(
  generateFn: (options: {
    title: string;
    pageType: string;
    theme?: string;
    blocks: unknown[];
  }) => Promise<{ url: string; html: string }>
) {
  return new DynamicStructuredTool({
    name: 'generate_ai_page',
    description: `生成 AI 頁面（商品頁、比較頁、活動頁等）。

使用時機：
- 需要為用戶生成客製化頁面
- 展示商品推薦結果
- 建立比較頁面`,
    schema: z.object({
      title: z.string().describe('頁面標題'),
      pageType: z
        .enum(['product', 'comparison', 'collection', 'content'])
        .describe('頁面類型'),
      theme: z
        .enum(['minimal', 'modern', 'bold', 'elegant'])
        .optional()
        .default('modern')
        .describe('頁面主題風格'),
      blocks: z.array(z.unknown()).describe('頁面區塊內容'),
    }),
    func: async ({ title, pageType, theme = 'modern', blocks }) => {
      const result = await generateFn({ title, pageType, theme, blocks });
      return JSON.stringify(result);
    },
  });
}

/**
 * 獲取所有基礎工具
 */
export function getBaseTools() {
  return [scrapeWebTool];
}

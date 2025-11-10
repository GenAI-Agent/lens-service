import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

// 搜尋索引相關
let searchIndexService: any = null;
let embeddingService: any = null;

// Export all template functions for AI to use
// Templates removed

let currentConfig: ServiceModulerConfig | null = null;

// 儲存生成的 AI Page（內存儲存 + JSON 檔案持久化，永久保存）
const aiPageStore = new Map<string, {
  content: string;
  createdAt: number;
}>();

// AI Page 儲存路徑
const AI_PAGE_STORAGE_DIR = path.join(process.cwd(), '.ai-pages');
const AI_PAGE_INDEX_FILE = path.join(AI_PAGE_STORAGE_DIR, 'index.json');

/**
 * 初始化 AI Page 儲存目錄
 */
function initAIPageStorage() {
  try {
    if (!fs.existsSync(AI_PAGE_STORAGE_DIR)) {
      fs.mkdirSync(AI_PAGE_STORAGE_DIR, { recursive: true });
      console.log('[AI Page] Created storage directory:', AI_PAGE_STORAGE_DIR);
    }
  } catch (error) {
    console.error('[AI Page] Failed to create storage directory:', error);
  }
}

/**
 * 載入所有已儲存的 AI Pages
 */
function loadAIPagesFromDisk() {
  try {
    if (fs.existsSync(AI_PAGE_INDEX_FILE)) {
      const indexData = fs.readFileSync(AI_PAGE_INDEX_FILE, 'utf-8');
      const pages = JSON.parse(indexData);

      // 載入到 Map 中（永久保存，不檢查過期）
      for (const [pageId, pageInfo] of Object.entries(pages)) {
        const pageData = pageInfo as { content: string; createdAt: number };
        aiPageStore.set(pageId, pageData);
      }

      console.log(`[AI Page] Loaded ${aiPageStore.size} pages from disk (permanent storage)`);
    }
  } catch (error) {
    console.error('[AI Page] Failed to load pages from disk:', error);
  }
}

/**
 * 儲存 AI Page 到磁碟
 */
function saveAIPageToDisk(pageId: string, pageData: { content: string; createdAt: number }) {
  try {
    // 讀取現有 index
    let pages: Record<string, any> = {};
    if (fs.existsSync(AI_PAGE_INDEX_FILE)) {
      const indexData = fs.readFileSync(AI_PAGE_INDEX_FILE, 'utf-8');
      pages = JSON.parse(indexData);
    }

    // 更新 page
    pages[pageId] = pageData;

    // 寫回 index
    fs.writeFileSync(AI_PAGE_INDEX_FILE, JSON.stringify(pages, null, 2), 'utf-8');

    console.log(`[AI Page] Saved page ${pageId} to disk (permanent)`);
  } catch (error) {
    console.error('[AI Page] Failed to save page to disk:', error);
  }
}

/**
 * 從磁碟刪除 AI Page
 */
function deleteAIPageFromDisk(pageId: string) {
  try {
    if (fs.existsSync(AI_PAGE_INDEX_FILE)) {
      const indexData = fs.readFileSync(AI_PAGE_INDEX_FILE, 'utf-8');
      const pages = JSON.parse(indexData);

      delete pages[pageId];

      fs.writeFileSync(AI_PAGE_INDEX_FILE, JSON.stringify(pages, null, 2), 'utf-8');

      console.log(`[AI Page] Deleted page ${pageId} from disk`);
    }
  } catch (error) {
    console.error('[AI Page] Failed to delete page from disk:', error);
  }
}

/**
 * 初始化搜尋索引服務（延遲載入）
 */
async function initSearchIndexing() {
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

      console.log('[AI Page] ✅ Search indexing initialized');
    } catch (error) {
      console.error('[AI Page] ⚠️  Failed to initialize search indexing:', error);
      // 不阻止 AI Page 功能，索引是可選的
    }
  }
}

/**
 * 索引 AI Page 到搜尋系統
 */
async function indexAIPage(pageId: string, title: string, htmlContent: string): Promise<void> {
  // 確保搜尋索引已初始化
  await initSearchIndexing();

  if (!searchIndexService) {
    console.log('[AI Page] Search indexing not available, skipping');
    return;
  }

  // 從 HTML 中提取純文本（簡單的 HTML 標籤移除）
  const textContent = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // 移除 style
    .replace(/<[^>]+>/g, ' ')                                          // 移除所有 HTML 標籤
    .replace(/\s+/g, ' ')                                              // 合併多個空格
    .trim()
    .substring(0, 5000); // 限制長度

  await searchIndexService.indexDocument({
    contentId: pageId,
    contentType: 'ai_page',
    title,
    content: textContent,
    summary: textContent.substring(0, 200),
    url: `/api/ai-page/${pageId}`,
    tags: ['ai-generated'],
    category: 'dynamic-content',
    metadata: {
      generatedAt: new Date().toISOString(),
    },
  });

  console.log(`[AI Page] ✅ Indexed: ${pageId}`);
}

export function initAIPageTools(config: ServiceModulerConfig) {
  currentConfig = config;

  // 初始化儲存目錄並載入已存在的 pages
  initAIPageStorage();
  loadAIPagesFromDisk();

  // 初始化搜尋索引（異步，不阻塞）
  initSearchIndexing().catch(err => {
    console.error('[AI Page] Failed to init search indexing:', err);
  });
}

/**
 * 生成唯一的 Page ID
 */
function generatePageId(): string {
  return `ai-page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}


/**
 * 包裝 HTML 內容（添加基礎樣式和安全設定）
 */
function wrapHTMLContent(content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; font-src 'self' data: https:;">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-bottom: 0.5em;
      color: #2c3e50;
    }
    p {
      margin-bottom: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5em;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f9f9f9;
    }
    ul, ol {
      margin-bottom: 1em;
      padding-left: 2em;
    }
    li {
      margin-bottom: 0.5em;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
    }
    pre {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    .section {
      margin-bottom: 2em;
    }
    .highlight {
      background-color: #fff3cd;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .note {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 12px;
      margin-bottom: 1em;
    }
    .warning {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 12px;
      margin-bottom: 1em;
    }
  </style>
</head>
<body>
  ${content}
  <footer style="margin-top: 3em; padding-top: 1em; border-top: 1px solid #ddd; color: #888; font-size: 0.9em;">
    <p>此頁面由 AI Agent 自動生成 | 生成時間: ${new Date().toLocaleString('zh-TW')}</p>
  </footer>
</body>
</html>`;
}

/**
 * Tool: 管理 AI Page（生成、更新、刪除）
 *
 * AI Page 用於在對話過程中生成精美的視覺化內容，增強用戶體驗。
 * 使用場景：書籍推薦列表、搜尋結果展示、訂單詳情、資料比較表格等。
 *
 * 這不是獨立功能，而是輔助對話的增強工具。
 */
export const manageAIPageTool = new DynamicStructuredTool({
  name: "manage_ai_page",
  description: `管理 AI Page - 用於在對話中創建、更新或刪除精美的視覺化內容頁面。

**AI Page 定位**：
- 並非獨立應用，而是增強對話體驗的輔助工具
- 用於展示複雜資訊（如書籍列表、比較表格、訂單詳情等）
- 提供比純文字更好的視覺呈現

**使用場景**：
- 書籍推薦：生成精美的書籍卡片列表
- 搜尋結果：展示多個商品的比較表格
- 訂單資訊：格式化顯示訂單詳情
- 資料分析：圖表和統計資訊展示

**操作類型**：
- action: "create" - 創建新頁面（必填：title, htmlContent）
- action: "update" - 更新現有頁面（必填：pageId, htmlContent）
- action: "delete" - 刪除頁面（必填：pageId）

**頁面會永久保存並自動索引到搜尋系統**`,
  schema: z.object({
    action: z.enum(['create', 'update', 'delete']).describe("操作類型"),

    // 創建/更新時需要
    title: z.string().optional().describe("頁面標題（創建時必填）"),
    htmlContent: z.string().optional().describe("頁面 HTML 內容，只需要 body 部分（創建/更新時必填）"),

    // 更新/刪除時需要
    pageId: z.string().optional().describe("頁面 ID（更新/刪除時必填）"),
  }),
  func: async ({ action, title, htmlContent, pageId }) => {
    if (!currentConfig?.agent?.enableAIPageGeneration) {
      return JSON.stringify({
        success: false,
        message: "AI Page 生成功能未啟用",
      });
    }

    // 創建新頁面
    if (action === 'create') {
      if (!title || !htmlContent) {
        return JSON.stringify({
          success: false,
          message: "創建頁面需要提供 title 和 htmlContent",
        });
      }

      const newPageId = generatePageId();
      const wrappedContent = wrapHTMLContent(htmlContent);

      const pageData = {
        content: wrappedContent,
        createdAt: Date.now(),
      };

      // 儲存到記憶體
      aiPageStore.set(newPageId, pageData);

      // 持久化到磁碟
      saveAIPageToDisk(newPageId, pageData);

      // 🔍 搜尋索引：自動索引到搜尋系統
      try {
        await indexAIPage(newPageId, title, wrappedContent);
      } catch (error) {
        console.error('[AI Page] Failed to index page:', error);
        // 不阻止 AI Page 生成，即使索引失敗
      }

      return JSON.stringify({
        success: true,
        action: 'create',
        pageId: newPageId,
        url: `/api/ai-page/${newPageId}`,
        message: `AI Page 已生成並永久儲存`,
        createdAt: new Date(pageData.createdAt).toLocaleString('zh-TW'),
      });
    }

    // 更新頁面
    if (action === 'update') {
      if (!pageId || !htmlContent) {
        return JSON.stringify({
          success: false,
          message: "更新頁面需要提供 pageId 和 htmlContent",
        });
      }

      const page = aiPageStore.get(pageId);
      if (!page) {
        return JSON.stringify({
          success: false,
          message: "找不到指定的 AI Page",
        });
      }

      const wrappedContent = wrapHTMLContent(htmlContent);
      page.content = wrappedContent;

      // 持久化更新到磁碟
      saveAIPageToDisk(pageId, page);

      return JSON.stringify({
        success: true,
        action: 'update',
        pageId,
        url: `/api/ai-page/${pageId}`,
        message: "AI Page 已更新並儲存",
      });
    }

    // 刪除頁面
    if (action === 'delete') {
      if (!pageId) {
        return JSON.stringify({
          success: false,
          message: "刪除頁面需要提供 pageId",
        });
      }

      const deleted = aiPageStore.delete(pageId);

      // 從磁碟刪除
      if (deleted) {
        deleteAIPageFromDisk(pageId);
      }

      return JSON.stringify({
        success: deleted,
        action: 'delete',
        message: deleted ? "AI Page 已刪除（包含磁碟）" : "找不到指定的 AI Page",
      });
    }

    return JSON.stringify({
      success: false,
      message: "無效的操作類型",
    });
  },
});

/**
 * 取得 AI Page 內容（供前端使用）
 */
export function getAIPageContent(pageId: string): string | null {
  // 從 public/aipages/ 目錄讀取 HTML 檔案
  try {
    const aipagesDir = path.join(process.cwd(), '../TzAI_web/public/aipages');
    const filePath = path.join(aipagesDir, `${pageId}.html`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`[AI Page] Loaded page ${pageId} from ${filePath}`);
      return content;
    } else {
      console.error(`[AI Page] File not found: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error('[AI Page] Failed to load page from disk:', error);
    return null;
  }
}

/**
 * 列出所有 AI Page（供前端使用）
 */
export function listAIPages(): Array<{ pageId: string; createdAt: number }> {
  return Array.from(aiPageStore.entries()).map(([pageId, page]) => ({
    pageId,
    createdAt: page.createdAt,
  }));
}

export const aipageTools = [
  manageAIPageTool,
];

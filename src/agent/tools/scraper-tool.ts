import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 單個 URL 爬取實現（內部函數）
 */
async function scrapeUrl(url: string, extractMode: 'article' | 'full' = 'article') {
  try {
    console.log(`🔍 [Scraper Tool] Fetching URL: ${url}`);

    // 發送 HTTP 請求
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000, // 15秒超時
      maxRedirects: 5,
    });

    // 使用 Cheerio 解析 HTML
    const $ = cheerio.load(response.data);

    // 移除不需要的元素
    $('script, style, nav, header, footer, .advertisement, .ads').remove();

    // 提取標題
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim() || '無標題';
    }

    // 根據模式提取內容
    let content = '';

    if (extractMode === 'article') {
      // 嘗試多個選擇器來找到主要內容
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.main-content',
        '#content',
        '[role="main"]',
        '.post-content',
        '.entry-content',
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) { // 確保找到實質內容
            console.log(`✅ [Scraper Tool] Found content with selector: ${selector}`);
            break;
          }
        }
      }

      // 如果沒找到，使用 body
      if (!content || content.length < 100) {
        content = $('body').text().trim();
      }
    } else {
      // 完整模式：提取整個 body
      content = $('body').text().trim();
    }

    // 清理內容：移除多餘的空白和換行
    content = content
      .replace(/\s+/g, ' ')  // 多個空白替換為單個空白
      .replace(/\n\s*\n/g, '\n') // 多個換行替換為單個換行
      .trim();

    // 限制內容長度（避免超過 LLM token 限制）
    const maxLength = 8000; // 約 2000 tokens
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...\n\n[內容過長，已截斷]';
    }

    // 提取 meta 資訊（如果有）
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

    // 提取所有 h1-h3 標題（用於結構化資訊）
    const headings: string[] = [];
    $('h1, h2, h3').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 200) {
        headings.push(text);
      }
    });

    console.log(`✅ [Scraper Tool] Successfully scraped: ${title} (${content.length} chars)`);

    return {
      success: true,
      url,
      title,
      content,
      metadata: {
        description: metaDescription,
        keywords: metaKeywords,
        headings: headings.slice(0, 10), // 最多10個標題
        contentLength: content.length,
        extractMode,
      },
      message: `成功爬取網頁「${title}」`,
    };

  } catch (error: any) {
    console.error('❌ [Scraper Tool] Error:', error.message);

    // 處理不同類型的錯誤
    let errorMessage = '爬取網頁時發生錯誤';

    if (error.code === 'ENOTFOUND') {
      errorMessage = '無法連接到該網址，請檢查網址是否正確';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      errorMessage = '連接超時，請稍後再試';
    } else if (error.response) {
      errorMessage = `網頁返回錯誤：HTTP ${error.response.status}`;
    } else {
      errorMessage = error.message || '未知錯誤';
    }

    return {
      success: false,
      url,
      error: errorMessage,
      message: `無法爬取網頁：${errorMessage}`,
    };
  }
}

/**
 * Tool: 爬取網頁內容（單個或多個）
 *
 * 整合單個和批次爬取功能
 */
export const scrapeWebTool = new DynamicStructuredTool({
  name: "scrape_web",
  description: `爬取網頁內容，提取文字資訊。支援單個或多個 URL。

**適用場景**：
- 從特定網頁獲取最新資訊
- 爬取書籍詳情頁面
- 爬取推薦書單或活動頁面
- 獲取常見問題文檔內容
- 整合多個來源的資訊

**參數說明**：
- urls: 可以是單個 URL 字串或 URL 陣列（最多5個）
- extractMode: "article" 只提取主要內容，"full" 提取完整頁面

**範例**：
- 單個 URL: { urls: "https://www.example.com" }
- 多個 URLs: { urls: ["https://url1.com", "https://url2.com"] }`,
  schema: z.object({
    urls: z.union([
      z.string(),
      z.array(z.string()).max(5)
    ]).describe("要爬取的網頁 URL（單個字串或陣列，最多5個）"),
    extractMode: z.enum(['article', 'full']).optional().default('article')
      .describe("提取模式：article=主要內容區域，full=完整頁面"),
  }),
  func: async ({ urls, extractMode = 'article' }) => {
    try {
      // 統一處理成陣列
      const urlArray = Array.isArray(urls) ? urls : [urls];

      console.log(`🔍 [Scraper Tool] Fetching ${urlArray.length} URL(s)...`);

      // 批次爬取所有 URLs
      const results = await Promise.all(
        urlArray.map(url => scrapeUrl(url, extractMode))
      );

      // 如果只有一個 URL，直接返回結果
      if (urlArray.length === 1) {
        return JSON.stringify(results[0]);
      }

      // 多個 URLs，返回批次結果
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      console.log(`✅ [Scraper Tool] Completed: ${successCount} success, ${failedCount} failed`);

      return JSON.stringify({
        success: true,
        mode: 'batch',
        totalUrls: urlArray.length,
        successCount,
        failedCount,
        results,
        message: `批次爬取完成：${successCount}/${urlArray.length} 個網頁成功`,
      });

    } catch (error: any) {
      console.error('❌ [Scraper Tool] Error:', error);

      return JSON.stringify({
        success: false,
        error: error.message,
        message: `爬取網頁時發生錯誤：${error.message}`,
      });
    }
  },
});

export const scraperTools = [
  scrapeWebTool,
];

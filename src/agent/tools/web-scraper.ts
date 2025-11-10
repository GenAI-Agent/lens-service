import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import { scrapeUrl } from "./web-scraper-helper";

/**
 * ========================================
 * Web Scraper Tools - 整合網頁爬取功能
 * ========================================
 *
 * 包含：
 * 1. 通用網頁爬取工具 (scrape_web)
 * 2. Taaze 熱門書籍爬取工具 (search_popular_books)
 */

// ========================================
// 1. 通用網頁爬取工具
// ========================================

/**
 * Tool: 爬取網頁內容（單個或多個）
 */
export const scrapeWebTool = new DynamicStructuredTool({
  name: "scrape_web",
  description: `⚠️ CRITICAL: Fetches and extracts text content from web pages. Supports single or multiple URLs (max 5).

**MANDATORY USAGE RULES:**
1. MUST use this tool when user provides ANY URL starting with http:// or https://
2. MUST use this tool when user asks to "scrape" or "fetch" a specific website
3. MUST use this tool to get real-time content from external websites

**Examples of when to use:**
- User: "scrape https://example.com" → USE THIS TOOL with URL: "https://example.com"
- User: "請幫我爬取 https://www.taaze.tw" → USE THIS TOOL
- User: "告訴我 https://example.com 在說什麼" → USE THIS TOOL first to get content

**DO NOT use for:**
- General questions without specific URLs
- Information already in knowledge base

⚠️ IMPORTANT: Any URL starting with http:// or https:// is a COMPLETE and VALID URL. DO NOT reject URLs like "https://example.com" as incomplete.`,
  schema: z.object({
    urls: z.union([
      z.string(),
      z.array(z.string()).max(5)
    ]).describe("URL(s) to scrape. Can be a single URL string or an array of URLs (max 5). Must be complete URLs starting with http:// or https://"),
    extractMode: z.enum(['article', 'full']).optional().default('article')
      .describe("Extraction mode: 'article' extracts main content area only, 'full' extracts entire page"),
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

// ========================================
// 2. Taaze 熱門書籍爬取工具
// ========================================

// 熱門書籍頁面 URLs（從 rules 配置和 Taaze 網站實際結構）
const POPULAR_BOOK_URLS = [
  'https://www.taaze.tw/static_act/best_seller/index.htm',  // 暢銷排行
  'https://www.taaze.tw/static_act/editors_picks/202511/index.htm',  // 編輯精選
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=01',  // 文學小說
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=02',  // 商業理財
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=03',  // 藝術設計
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=04',  // 人文社科
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=05',  // 心理勵志
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=06',  // 醫療保健
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=07',  // 生活風格
  'https://www.taaze.tw/rwd_listViewB.html?t=01&k=00&d=00&l=00&a=08',  // 旅遊
];

interface BookInfo {
  book_id: string;
  title: string;
  author: string;
  price: string;
  category: string;
  imageUrl: string;
}

/**
 * 從 HTML 中提取書籍資訊（精簡版）
 */
function extractBookInfo(html: string, category: string): BookInfo[] {
  const $ = cheerio.load(html);
  const books: BookInfo[] = [];

  try {
    // Taaze 使用 <a> 標籤包裹書籍，class 為 link-block-14/15/16/19 等
    $('a[href*="/products/"]').each((index, element) => {
      if (index >= 10) return false; // 只抓前10本

      const $link = $(element);

      // 提取書籍ID（從連結中）
      const href = $link.attr('href') || '';
      const bookIdMatch = href.match(/products\/(\d+)\.html/);
      const book_id = bookIdMatch ? bookIdMatch[1] : '';

      if (!book_id) return;

      // 提取標題（多種可能的 class）
      let title = $link.find('.paragraph-16, .paragraph-105, .paragraph-106').first().text().trim();
      if (!title) {
        title = $link.find('h3').first().text().trim();
      }
      if (!title) return; // 沒有標題就跳過

      // 提取作者（固定在 .paragraph-17）
      let author = $link.find('.paragraph-17').first().text().trim();
      // 移除 "作者 : " 或 "作者／" 前綴
      author = author.replace(/^作者\s*[:：／]\s*/, '').trim();

      // 提取價格（在 .text-span-12 或 .text-span-37）
      let price = $link.find('.text-span-12, .text-span-37').first().text().trim();
      // 如果沒找到，嘗試 .text-block-11, .text-block-12, .text-block-13
      if (!price) {
        price = $link.find('.text-block-11, .text-block-12, .text-block-13').first().text().trim();
      }
      price = price.replace(/\s+\$\d+$/, '').trim(); // 移除原價部分

      // 生成圖片URL
      const imageUrl = `https://media.taaze.tw/showThumbnail.html?sc=${book_id}&height=400&width=310`;

      books.push({
        book_id,
        title,
        author: author || '未知作者',
        price: price || 'NT$ -',
        category,
        imageUrl,
      });
    });

    console.log(`[Popular Books Tool] Extracted ${books.length} books from ${category}`);
  } catch (error) {
    console.error('[Popular Books Tool] Failed to parse HTML:', error);
  }

  return books;
}

/**
 * 爬取單個頁面
 */
async function fetchPopularBooksFromPage(url: string): Promise<BookInfo[]> {
  try {
    console.log(`[Popular Books Tool] Fetching: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000, // 10秒超時
    });

    // 從URL中提取分類名稱
    const categoryMatch = url.match(/\/([a-zA-Z0-9]+)\.html$/);
    const category = categoryMatch ? categoryMatch[1] : 'unknown';

    const books = extractBookInfo(response.data, category);
    console.log(`[Popular Books Tool] Extracted ${books.length} books from ${category}`);

    return books;
  } catch (error: any) {
    console.error(`[Popular Books Tool] Failed to fetch ${url}:`, error.message);
    return [];
  }
}

/**
 * Tool: 搜尋熱門書籍
 */
export const searchPopularBooksTool = new DynamicStructuredTool({
  name: "search_popular_books",
  description: `Fetches current bestselling and popular books from multiple categories.

Use this tool when users ask for:
- Popular or bestselling books
- Book recommendations
- Trending titles

Returns structured book data including book_id, title, author, price, category, and cover image URL.

Note: Fetches up to 10 books per category across multiple categories (literature, business, arts, psychology, etc). Results are ready for use with generate_ai_page tool.`,
  schema: z.object({
    limit: z.number().optional().default(50).describe("Maximum number of books to return (default: 50)"),
  }),
  func: async ({ limit = 50 }) => {
    try {
      console.log('[Popular Books Tool] 開始搜尋熱門書籍');

      // 平行爬取所有頁面（限制在10個頁面以內）
      const pagesToFetch = POPULAR_BOOK_URLS.slice(0, Math.min(10, POPULAR_BOOK_URLS.length));

      const results = await Promise.all(
        pagesToFetch.map(url => fetchPopularBooksFromPage(url))
      );

      // 合併所有結果
      const allBooks = results.flat();

      // 限制數量
      const limitedBooks = allBooks.slice(0, Math.min(limit, allBooks.length));

      console.log(`[Popular Books Tool] ✅ 成功抓取 ${limitedBooks.length} 本熱門書籍`);

      return JSON.stringify({
        success: true,
        totalBooks: limitedBooks.length,
        books: limitedBooks,
        message: `成功抓取 ${limitedBooks.length} 本熱門書籍`,
      });
    } catch (error: any) {
      console.error('[Popular Books Tool] Error:', error);
      return JSON.stringify({
        success: false,
        error: error.message,
        books: [],
      });
    }
  },
});

// ========================================
// Export all tools
// ========================================

export const webScraperTools = [
  scrapeWebTool,
  searchPopularBooksTool,
];

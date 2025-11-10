import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 熱門書籍搜尋工具
 * 專門用於爬取 Taaze 熱門書籍頁面，只抓取書籍基本資訊（book_id, title, author, price）
 * 避免抓取過多無關資訊造成 token limit 爆掉
 */

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
 * 根據實際 Taaze HTML 結構調整選擇器
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
    let category = 'unknown';
    if (url.includes('best_seller')) {
      category = '暢銷排行';
    } else if (url.includes('editors_picks')) {
      category = '編輯精選';
    } else if (url.includes('a=01')) {
      category = '文學小說';
    } else if (url.includes('a=02')) {
      category = '商業理財';
    } else if (url.includes('a=03')) {
      category = '藝術設計';
    } else if (url.includes('a=04')) {
      category = '人文社科';
    } else if (url.includes('a=05')) {
      category = '心理勵志';
    } else if (url.includes('a=06')) {
      category = '醫療保健';
    } else if (url.includes('a=07')) {
      category = '生活風格';
    } else if (url.includes('a=08')) {
      category = '旅遊';
    }

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
  description: `搜尋當前熱門暢銷書籍。

**用途**：
- 當用戶詢問熱門書籍、暢銷書、推薦書籍時使用
- 快速獲取各類別的熱門書籍清單

**回傳資料**：
- book_id: 書籍ID（用於生成圖片URL）
- title: 書名
- author: 作者
- price: 價格
- category: 分類
- imageUrl: 封面圖片URL

**重要**：
- 只抓取必要的書籍資訊，避免 token 浪費
- 每個分類最多10本書
- 總共約100本熱門書籍`,
  schema: z.object({
    limit: z.number().optional().default(50).describe("限制返回的書籍數量（預設50）"),
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

export const popularBooksTools = [
  searchPopularBooksTool,
];

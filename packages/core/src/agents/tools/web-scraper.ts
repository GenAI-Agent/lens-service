/**
 * Web Scraper Tools
 * 網頁爬取功能（基於原始 lens-service 實作）
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapeResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  error?: string;
  message: string;
  metadata?: {
    description?: string;
    keywords?: string;
    headings?: string[];
    contentLength?: number;
    extractMode?: string;
  };
}

/**
 * 爬取單個 URL
 */
export async function scrapeUrl(
  url: string,
  extractMode: 'article' | 'full' = 'article'
): Promise<ScrapeResult> {
  try {
    console.log(`🔍 [Scraper] Fetching URL: ${url}`);

    // 發送 HTTP 請求
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000, // 15秒超時
      maxRedirects: 5,
    });

    // 使用 Cheerio 解析 HTML
    const $ = cheerio.load(response.data);

    // 移除不需要的元素
    $('script, style, nav, header, footer, .advertisement, .ads, noscript').remove();

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
        '.article-content',
        '.story-content',
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) {
            console.log(`✅ [Scraper] Found content with selector: ${selector}`);
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
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // 限制內容長度（避免超過 LLM token 限制）
    const maxLength = 8000;
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...\n\n[內容過長，已截斷]';
    }

    // 提取 meta 資訊
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

    // 提取所有 h1-h3 標題
    const headings: string[] = [];
    $('h1, h2, h3').each((_i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 200) {
        headings.push(text);
      }
    });

    console.log(`✅ [Scraper] Successfully scraped: ${title} (${content.length} chars)`);

    return {
      success: true,
      url,
      title,
      content,
      metadata: {
        description: metaDescription,
        keywords: metaKeywords,
        headings: headings.slice(0, 10),
        contentLength: content.length,
        extractMode,
      },
      message: `成功爬取網頁「${title}」`,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; response?: { status: number }; message?: string };
    console.error('❌ [Scraper] Error:', err.message);

    let errorMessage = '爬取網頁時發生錯誤';

    if (err.code === 'ENOTFOUND') {
      errorMessage = '無法連接到該網址，請檢查網址是否正確';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      errorMessage = '連接超時，請稍後再試';
    } else if (err.response) {
      errorMessage = `網頁返回錯誤：HTTP ${err.response.status}`;
    } else {
      errorMessage = err.message || '未知錯誤';
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
 * 批次爬取多個 URLs
 */
export async function scrapeUrls(
  urls: string[],
  extractMode: 'article' | 'full' = 'article',
  concurrency: number = 3
): Promise<{
  success: boolean;
  totalUrls: number;
  successCount: number;
  failedCount: number;
  results: ScrapeResult[];
  message: string;
}> {
  console.log(`🔍 [Scraper] Batch scraping ${urls.length} URLs...`);

  // 限制並發數
  const results: ScrapeResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => scrapeUrl(url, extractMode))
    );
    results.push(...batchResults);
  }

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.length - successCount;

  console.log(`✅ [Scraper] Completed: ${successCount} success, ${failedCount} failed`);

  return {
    success: successCount > 0,
    totalUrls: urls.length,
    successCount,
    failedCount,
    results,
    message: `批次爬取完成：${successCount}/${urls.length} 個網頁成功`,
  };
}

/**
 * 從 HTML 提取結構化資料
 */
export function extractStructuredData(
  html: string,
  selectors: Record<string, string>
): Record<string, string | string[]> {
  const $ = cheerio.load(html);
  const result: Record<string, string | string[]> = {};

  for (const [key, selector] of Object.entries(selectors)) {
    const elements = $(selector);
    if (elements.length === 1) {
      result[key] = elements.text().trim();
    } else if (elements.length > 1) {
      result[key] = elements
        .map((_i, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
    }
  }

  return result;
}

import axios from "axios";
import * as cheerio from "cheerio";

/**
 * ========================================
 * Web Scraper Helper - 網頁爬取核心函數
 * ========================================
 *
 * 這個文件包含核心的網頁爬取函數，可以被其他模塊導入使用
 * （例如 RuleParserService 自動爬取 URLs）
 */

/**
 * 單個 URL 爬取實現
 */
export async function scrapeUrl(url: string, extractMode: 'article' | 'full' = 'article') {
  try {
    console.log(`🔍 [Scraper Helper] Fetching URL: ${url}`);

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
            console.log(`✅ [Scraper Helper] Found content with selector: ${selector}`);
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

    console.log(`✅ [Scraper Helper] Successfully scraped: ${title} (${content.length} chars)`);

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
    console.error('❌ [Scraper Helper] Error:', error.message);

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

import { ContentExtractor } from './ContentExtractor';
import { OpenAIService } from './OpenAIService';

/**
 * 高級Sitemap服務
 * 支持動態內容爬取和用戶上下文感知
 */
export class AdvancedSitemapService {
  private static openAIService: OpenAIService | null = null;

  /**
   * 設置OpenAI服務實例
   */
  static setOpenAIService(service: OpenAIService): void {
    this.openAIService = service;
  }

  /**
   * 爬取sitemap並處理動態內容
   */
  static async crawlSitemap(config: {
    id: string;
    name: string;
    domain: string;
    sitemap_url: string;
    userContexts?: Array<{
      user_type: string;
      auth_token?: string;
      cookies?: string;
      headers?: Record<string, string>;
    }>;
  }): Promise<{
    success: boolean;
    totalPages: number;
    processedPages: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let totalPages = 0;
    let processedPages = 0;

    try {
      // 1. 獲取sitemap內容
      const sitemapUrls = await this.fetchSitemapUrls(config.sitemap_url);
      totalPages = sitemapUrls.length;

      console.log(`Found ${totalPages} URLs in sitemap: ${config.sitemap_url}`);

      // 2. 批量處理URL（避免過載）
      const batchSize = 5;
      for (let i = 0; i < sitemapUrls.length; i += batchSize) {
        const batch = sitemapUrls.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (url) => {
          try {
            await this.processUrl(config, url);
            processedPages++;
          } catch (error) {
            console.error(`Failed to process URL ${url}:`, error);
            errors.push(`${url}: ${error instanceof Error ? error.message : '未知錯誤'}`);
          }
        }));

        // 添加延遲避免過載
        if (i + batchSize < sitemapUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 3. 更新sitemap配置狀態
      await this.updateSitemapStatus(config.id, {
        crawl_status: 'completed',
        total_pages: totalPages,
        indexed_pages: processedPages,
        last_crawled_at: new Date().toISOString()
      });

      return {
        success: true,
        totalPages,
        processedPages,
        errors
      };

    } catch (error) {
      console.error('Sitemap crawl failed:', error);
      
      await this.updateSitemapStatus(config.id, {
        crawl_status: 'failed',
        total_pages: totalPages,
        indexed_pages: processedPages
      });

      return {
        success: false,
        totalPages,
        processedPages,
        errors: [error instanceof Error ? error.message : '未知錯誤']
      };
    }
  }

  /**
   * 獲取sitemap中的所有URL
   */
  private static async fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // 解析XML獲取URL
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // 檢查是否是sitemap index
      const sitemapElements = xmlDoc.getElementsByTagName('sitemap');
      if (sitemapElements.length > 0) {
        // 這是sitemap index，需要遞歸獲取子sitemap
        const allUrls: string[] = [];
        for (let i = 0; i < sitemapElements.length; i++) {
          const locElement = sitemapElements[i].getElementsByTagName('loc')[0];
          if (locElement) {
            const subSitemapUrls = await this.fetchSitemapUrls(locElement.textContent || '');
            allUrls.push(...subSitemapUrls);
          }
        }
        return allUrls;
      }

      // 這是普通sitemap，獲取URL
      const urlElements = xmlDoc.getElementsByTagName('url');
      const urls: string[] = [];
      
      for (let i = 0; i < urlElements.length; i++) {
        const locElement = urlElements[i].getElementsByTagName('loc')[0];
        if (locElement && locElement.textContent) {
          urls.push(locElement.textContent);
        }
      }

      return urls;
    } catch (error) {
      console.error('Failed to fetch sitemap URLs:', error);
      throw error;
    }
  }

  /**
   * 處理單個URL（支持動態內容）
   */
  private static async processUrl(config: any, url: string): Promise<void> {
    try {
      // 1. 基本頁面爬取
      const basicContent = await this.fetchBasicContent(url);
      
      // 2. 如果有用戶上下文，進行動態內容爬取
      const dynamicContents: Array<{
        user_type: string;
        content: string;
      }> = [];

      if (config.userContexts && config.userContexts.length > 0) {
        for (const userContext of config.userContexts) {
          try {
            const dynamicContent = await this.fetchDynamicContent(url, userContext);
            dynamicContents.push({
              user_type: userContext.user_type,
              content: dynamicContent
            });
          } catch (error) {
            console.warn(`Failed to fetch dynamic content for ${userContext.user_type}:`, error);
          }
        }
      }

      // 3. 提取內容和生成embedding
      const extractor = new ContentExtractor();
      const keywords = extractor.extractKeywords(basicContent.content);
      const fingerprint = extractor.generateFingerprint(basicContent.content);
      
      let embedding: number[] | undefined;
      if (this.openAIService) {
        try {
          const textForEmbedding = `${basicContent.title} ${basicContent.meta_description} ${basicContent.content}`;
          embedding = await this.openAIService.generateEmbedding(textForEmbedding);
        } catch (error) {
          console.warn('Failed to generate embedding:', error);
        }
      }

      // 4. 保存到資料庫
      await this.savePage({
        sitemap_config_id: config.id,
        url: url,
        title: basicContent.title,
        content: basicContent.content,
        meta_description: basicContent.meta_description,
        keywords: JSON.stringify(keywords),
        embedding: embedding ? JSON.stringify(embedding) : null,
        fingerprint: fingerprint.join(','),
        user_context: dynamicContents.length > 0 ? JSON.stringify(dynamicContents) : null,
        crawl_status: 'success'
      });

      console.log(`✅ Processed: ${url}`);
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error);
      
      // 保存錯誤狀態
      await this.savePage({
        sitemap_config_id: config.id,
        url: url,
        crawl_status: 'failed',
        error_message: error instanceof Error ? error.message : '未知錯誤'
      });
      
      throw error;
    }
  }

  /**
   * 獲取基本頁面內容（靜態）
   */
  private static async fetchBasicContent(url: string): Promise<{
    title: string;
    content: string;
    meta_description: string;
  }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 提取標題
    const title = doc.querySelector('title')?.textContent || '';
    
    // 提取meta description
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // 提取主要內容（移除script、style等）
    const scripts = doc.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());
    
    const content = doc.body?.textContent?.replace(/\s+/g, ' ').trim() || '';

    return {
      title: title.trim(),
      content: content.substring(0, 5000), // 限制長度
      meta_description: metaDesc.trim()
    };
  }

  /**
   * 獲取動態內容（需要認證或特定用戶上下文）
   */
  private static async fetchDynamicContent(url: string, userContext: {
    user_type: string;
    auth_token?: string;
    cookies?: string;
    headers?: Record<string, string>;
  }): Promise<string> {
    // 構建請求頭
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...userContext.headers
    };

    if (userContext.auth_token) {
      headers['Authorization'] = `Bearer ${userContext.auth_token}`;
    }

    if (userContext.cookies) {
      headers['Cookie'] = userContext.cookies;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 移除不需要的元素
    const scripts = doc.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());
    
    return doc.body?.textContent?.replace(/\s+/g, ' ').trim().substring(0, 3000) || '';
  }

  /**
   * 保存頁面到資料庫
   */
  private static async savePage(data: any): Promise<void> {
    const response = await fetch('http://localhost:3001/api/sitemap-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to save page: ${response.statusText}`);
    }
  }

  /**
   * 更新sitemap狀態
   */
  private static async updateSitemapStatus(id: string, data: any): Promise<void> {
    const response = await fetch(`http://localhost:3001/api/sitemap-configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update sitemap status: ${response.statusText}`);
    }
  }
}

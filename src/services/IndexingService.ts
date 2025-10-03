import { OpenAIService } from './OpenAIService';
import { StorageService } from './StorageService';
import { IndexedPage, ServiceModulerConfig } from '../types';

/**
 * 內容索引服務
 * 爬取網站內容並生成索引
 */
export class IndexingService {
  private openAI: OpenAIService;
  private siteConfig: ServiceModulerConfig['siteConfig'];
  
  constructor(
    openAI: OpenAIService,
    siteConfig?: ServiceModulerConfig['siteConfig']
  ) {
    this.openAI = openAI;
    this.siteConfig = siteConfig;
  }
  
  /**
   * 開始索引網站
   * @param mode 'local' = 索引本地專案所有頁面, 'domain' = 爬取指定域名
   */
  async indexSite(
    startUrl: string,
    mode: 'local' | 'domain' = 'domain',
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    console.log('Starting site indexing from:', startUrl, 'mode:', mode);

    let urls: string[];

    if (mode === 'local') {
      // 本地模式：自動發現當前專案的所有頁面
      urls = await this.discoverLocalPages();
    } else {
      // 域名模式：爬取指定域名
      urls = await this.discoverPages(startUrl);
    }

    console.log(`Found ${urls.length} pages to index`);

    // 2. 爬取並索引每個頁面
    const indexedPages: IndexedPage[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        const page = await this.indexPage(url);
        if (page) {
          indexedPages.push(page);
        }

        if (onProgress) {
          onProgress(i + 1, urls.length);
        }
      } catch (error) {
        console.error(`Failed to index ${url}:`, error);
      }

      // 避免請求過快
      await this.sleep(500);
    }

    // 3. 保存到本地存儲
    StorageService.saveIndexedPages(indexedPages);
    console.log(`Indexing complete. Indexed ${indexedPages.length} pages.`);
  }

  /**
   * 發現本地專案的所有頁面
   * 通過分析當前頁面的所有內部連結
   */
  private async discoverLocalPages(): Promise<string[]> {
    const discovered: Set<string> = new Set();
    const origin = window.location.origin;

    // 1. 添加當前頁面
    discovered.add(window.location.href);

    // 2. 提取所有內部連結
    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      try {
        const url = new URL(href);
        // 只添加同源的連結
        if (url.origin === origin) {
          discovered.add(href);
        }
      } catch (e) {
        // 忽略無效 URL
      }
    });

    // 3. 如果是 Next.js，嘗試從導航中提取更多頁面
    const navLinks = document.querySelectorAll('nav a[href], header a[href]');
    navLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      try {
        const url = new URL(href);
        if (url.origin === origin) {
          discovered.add(href);
        }
      } catch (e) {
        // 忽略
      }
    });

    console.log('Discovered local pages:', Array.from(discovered));
    return Array.from(discovered);
  }
  
  /**
   * 發現網站的所有頁面
   */
  private async discoverPages(startUrl: string): Promise<string[]> {
    const discovered: Set<string> = new Set();
    const toVisit: string[] = [startUrl];
    const visited: Set<string> = new Set();
    
    const baseUrl = new URL(startUrl);
    const baseDomain = baseUrl.hostname;
    
    while (toVisit.length > 0 && discovered.size < 100) { // 限制最多 100 頁
      const url = toVisit.shift()!;
      
      if (visited.has(url)) continue;
      visited.add(url);
      
      // 檢查是否應該爬取此 URL
      if (!this.shouldCrawl(url)) continue;
      
      discovered.add(url);
      
      try {
        // 獲取頁面內容
        const html = await this.fetchPage(url);
        
        // 提取連結
        const links = this.extractLinks(html, url);
        
        // 添加同域名的連結到待訪問列表
        links.forEach(link => {
          try {
            const linkUrl = new URL(link);
            if (this.isSameDomain(linkUrl.hostname, baseDomain)) {
              toVisit.push(link);
            }
          } catch (e) {
            // 忽略無效的 URL
          }
        });
      } catch (error) {
        console.error(`Failed to discover from ${url}:`, error);
      }
    }
    
    return Array.from(discovered);
  }
  
  /**
   * 索引單個頁面
   */
  private async indexPage(url: string): Promise<IndexedPage | null> {
    try {
      // 1. 獲取頁面內容
      const html = await this.fetchPage(url);
      
      // 2. 提取文字內容
      const { title, content } = this.extractContent(html);
      
      if (!content || content.length < 50) {
        return null; // 內容太少，跳過
      }
      
      // 3. 分塊
      const chunks = this.chunkText(content, 500);
      
      // 4. 生成 embeddings
      const embeddings = await this.openAI.generateEmbeddings(chunks);

      return {
        url,
        title,
        snippet: content.substring(0, 200),
        keywords: [],
        fingerprint: [],
        lastIndexed: Date.now(),
        chunks,
        embeddings
      } as any;
    } catch (error) {
      console.error(`Failed to index page ${url}:`, error);
      return null;
    }
  }
  
  /**
   * 獲取頁面內容
   */
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  }
  
  /**
   * 提取頁面內容
   */
  private extractContent(html: string): { title: string; content: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 提取標題
    const title = doc.querySelector('title')?.textContent || '';
    
    // 移除 script 和 style 標籤
    doc.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
    
    // 提取文字內容
    const content = doc.body?.textContent || '';
    
    // 清理空白
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .trim();
    
    return { title, content: cleanContent };
  }
  
  /**
   * 提取連結
   */
  private extractLinks(html: string, baseUrl: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: string[] = [];
    
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.push(absoluteUrl);
        } catch (e) {
          // 忽略無效的 URL
        }
      }
    });
    
    return links;
  }
  
  /**
   * 文字分塊
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  /**
   * 檢查是否應該爬取此 URL
   */
  private shouldCrawl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // 檢查域名（使用 remoteDomains）
      if (this.siteConfig?.remoteDomains) {
        const matchesDomain = this.siteConfig.remoteDomains.some(domainConfig =>
          urlObj.hostname.includes(domainConfig.domain)
        );
        if (!matchesDomain) return false;
      }
      
      // 檢查路徑
      if (this.siteConfig?.excludePaths) {
        const isExcluded = this.siteConfig.excludePaths.some(path =>
          urlObj.pathname.startsWith(path)
        );
        if (isExcluded) return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * 檢查是否為同域名
   */
  private isSameDomain(hostname1: string, hostname2: string): boolean {
    // 提取主域名（例如：ask-lens.ai）
    const getDomain = (hostname: string) => {
      const parts = hostname.split('.');
      return parts.slice(-2).join('.');
    };
    
    return getDomain(hostname1) === getDomain(hostname2);
  }
  
  /**
   * 延遲
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


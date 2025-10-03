import { SitemapConfig, SitemapPage } from '../types';
import { ContentExtractor } from './ContentExtractor';

/**
 * Sitemap 索引服務
 * 爬取外部網站的 sitemap 並建立索引
 */
export class SitemapService {
  private static readonly STORAGE_KEY = 'sm_sitemap_configs';
  private static updateTimers: Map<string, number> = new Map();
  
  /**
   * 獲取所有 Sitemap 配置
   */
  static getAll(): SitemapConfig[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse sitemap configs:', e);
      return [];
    }
  }
  
  /**
   * 根據 ID 獲取配置
   */
  static getById(id: string): SitemapConfig | null {
    const configs = this.getAll();
    return configs.find(c => c.id === id) || null;
  }
  
  /**
   * 創建新的 Sitemap 配置
   */
  static async create(data: {
    domain: string;
    sitemapUrl: string;
    autoUpdate?: boolean;
    updateInterval?: number;
  }): Promise<SitemapConfig> {
    const config: SitemapConfig = {
      id: this.generateId(),
      domain: data.domain,
      sitemapUrl: data.sitemapUrl,
      enabled: true,
      autoUpdate: data.autoUpdate || false,
      updateInterval: data.updateInterval || 60, // 默認 60 分鐘
      lastUpdated: 0,
      pages: []
    };
    
    const configs = this.getAll();
    configs.push(config);
    this.saveAll(configs);
    
    console.log('Created sitemap config:', config.id);
    
    // 立即爬取一次
    await this.crawl(config.id);
    
    // 如果啟用自動更新，設置定時器
    if (config.autoUpdate) {
      this.startAutoUpdate(config.id);
    }
    
    return config;
  }
  
  /**
   * 更新配置
   */
  static update(id: string, data: {
    domain?: string;
    sitemapUrl?: string;
    enabled?: boolean;
    autoUpdate?: boolean;
    updateInterval?: number;
  }): SitemapConfig | null {
    const configs = this.getAll();
    const config = configs.find(c => c.id === id);
    
    if (!config) return null;
    
    // 更新欄位
    if (data.domain !== undefined) config.domain = data.domain;
    if (data.sitemapUrl !== undefined) config.sitemapUrl = data.sitemapUrl;
    if (data.enabled !== undefined) config.enabled = data.enabled;
    if (data.autoUpdate !== undefined) config.autoUpdate = data.autoUpdate;
    if (data.updateInterval !== undefined) config.updateInterval = data.updateInterval;
    
    this.saveAll(configs);
    
    // 更新定時器
    if (config.autoUpdate) {
      this.startAutoUpdate(id);
    } else {
      this.stopAutoUpdate(id);
    }
    
    console.log('Updated sitemap config:', id);
    
    return config;
  }
  
  /**
   * 刪除配置
   */
  static delete(id: string): boolean {
    const configs = this.getAll();
    const newConfigs = configs.filter(c => c.id !== id);
    
    if (newConfigs.length === configs.length) {
      return false;
    }
    
    this.saveAll(newConfigs);
    this.stopAutoUpdate(id);
    
    console.log('Deleted sitemap config:', id);
    
    return true;
  }
  
  /**
   * 爬取 Sitemap
   */
  static async crawl(id: string): Promise<void> {
    const config = this.getById(id);
    if (!config) {
      throw new Error('Sitemap config not found');
    }
    
    console.log('Crawling sitemap:', config.sitemapUrl);
    
    try {
      // 獲取 sitemap XML
      const response = await fetch(config.sitemapUrl);
      const xml = await response.text();
      
      // 解析 sitemap
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const urls = Array.from(doc.querySelectorAll('url loc')).map(loc => loc.textContent || '');
      
      console.log(`Found ${urls.length} URLs in sitemap`);
      
      // 爬取每個頁面（限制數量避免太慢）
      const maxPages = 50;
      const urlsToCrawl = urls.slice(0, maxPages);
      
      const pages: SitemapPage[] = [];
      
      for (const url of urlsToCrawl) {
        try {
          const page = await this.crawlPage(url);
          if (page) {
            pages.push(page);
          }
        } catch (e) {
          console.error(`Failed to crawl ${url}:`, e);
        }
      }
      
      // 更新配置
      config.pages = pages;
      config.lastUpdated = Date.now();
      
      const configs = this.getAll();
      const index = configs.findIndex(c => c.id === id);
      if (index >= 0) {
        configs[index] = config;
        this.saveAll(configs);
      }
      
      console.log(`Crawled ${pages.length} pages successfully`);
      
    } catch (e) {
      console.error('Failed to crawl sitemap:', e);
      throw e;
    }
  }
  
  /**
   * 爬取單個頁面
   */
  private static async crawlPage(url: string): Promise<SitemapPage | null> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // 提取標題
      const title = doc.querySelector('title')?.textContent || url;
      
      // 提取內容
      const extractor = new ContentExtractor();
      const content = extractor.extractText(doc.body);
      
      // 生成關鍵字和 fingerprint
      const keywords = extractor.extractKeywords(content);
      const fingerprint = extractor.generateFingerprint(content);
      
      return {
        url: url,
        title: title,
        content: content.substring(0, 5000), // 限制長度
        keywords: keywords,
        fingerprint: fingerprint,
        lastCrawled: Date.now()
      };
      
    } catch (e) {
      console.error(`Failed to crawl page ${url}:`, e);
      return null;
    }
  }
  
  /**
   * 搜尋 Sitemap 頁面
   */
  static search(query: string, domains?: string[], limit: number = 5): Array<{
    page: SitemapPage;
    domain: string;
    score: number;
  }> {
    const configs = this.getAll().filter(c => c.enabled);
    
    // 如果指定了 domains，只搜尋這些 domain
    const configsToSearch = domains && domains.length > 0
      ? configs.filter(c => domains.includes(c.domain))
      : configs;
    
    if (configsToSearch.length === 0) return [];
    
    const extractor = new ContentExtractor();
    const queryKeywords = extractor.extractKeywords(query);
    const queryFingerprint = extractor.generateFingerprint(query);
    
    const results: Array<{ page: SitemapPage; domain: string; score: number }> = [];
    
    for (const config of configsToSearch) {
      for (const page of config.pages) {
        const score = this.calculateSimilarity(
          queryKeywords,
          queryFingerprint,
          page.keywords,
          page.fingerprint
        );
        
        if (score > 0) {
          results.push({ page, domain: config.domain, score });
        }
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * 計算相似度
   */
  private static calculateSimilarity(
    queryKeywords: string[],
    queryFingerprint: number[],
    pageKeywords: string[],
    pageFingerprint: number[]
  ): number {
    const keywordScore = this.calculateKeywordScore(queryKeywords, pageKeywords);
    const fingerprintScore = this.calculateFingerprintScore(queryFingerprint, pageFingerprint);
    return keywordScore * 0.5 + fingerprintScore * 0.5;
  }
  
  private static calculateKeywordScore(query: string[], page: string[]): number {
    if (query.length === 0 || page.length === 0) return 0;
    const matches = query.filter(k => page.includes(k)).length;
    return matches / Math.max(query.length, page.length);
  }
  
  private static calculateFingerprintScore(fp1: number[], fp2: number[]): number {
    if (fp1.length === 0 || fp2.length === 0) return 0;
    let intersection = 0;
    let union = 0;
    for (let i = 0; i < Math.max(fp1.length, fp2.length); i++) {
      const a = fp1[i] || 0;
      const b = fp2[i] || 0;
      if (a === 1 && b === 1) intersection++;
      if (a === 1 || b === 1) union++;
    }
    return union > 0 ? intersection / union : 0;
  }
  
  /**
   * 啟動自動更新
   */
  private static startAutoUpdate(id: string): void {
    this.stopAutoUpdate(id); // 先停止舊的
    
    const config = this.getById(id);
    if (!config || !config.autoUpdate) return;
    
    const intervalMs = config.updateInterval * 60 * 1000;
    
    const timer = window.setInterval(() => {
      console.log(`Auto-updating sitemap: ${id}`);
      this.crawl(id).catch(e => console.error('Auto-update failed:', e));
    }, intervalMs);
    
    this.updateTimers.set(id, timer);
  }
  
  /**
   * 停止自動更新
   */
  private static stopAutoUpdate(id: string): void {
    const timer = this.updateTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(id);
    }
  }
  
  /**
   * 初始化所有自動更新
   */
  static initAutoUpdates(): void {
    const configs = this.getAll().filter(c => c.enabled && c.autoUpdate);
    for (const config of configs) {
      this.startAutoUpdate(config.id);
    }
    console.log(`Initialized ${configs.length} auto-update timers`);
  }
  
  private static saveAll(configs: SitemapConfig[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
  }
  
  private static generateId(): string {
    return 'sitemap_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  static clearAll(): void {
    // 停止所有定時器
    this.updateTimers.forEach((timer) => clearInterval(timer));
    this.updateTimers.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}


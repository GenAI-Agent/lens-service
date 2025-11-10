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
export declare function scrapeUrl(url: string, extractMode?: 'article' | 'full'): Promise<{
    success: boolean;
    url: string;
    title: string;
    content: string;
    metadata: {
        description: string;
        keywords: string;
        headings: string[];
        contentLength: number;
        extractMode: "article" | "full";
    };
    message: string;
    error?: undefined;
} | {
    success: boolean;
    url: string;
    error: string;
    message: string;
    title?: undefined;
    content?: undefined;
    metadata?: undefined;
}>;

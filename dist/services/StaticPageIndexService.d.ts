/**
 * StaticPageIndexService - 靜態頁面索引服務
 *
 * 功能：
 * - 索引 Next.js 靜態頁面
 * - 從檔案系統掃描頁面路由
 * - 提取頁面標題和內容
 * - 支援自訂頁面資訊
 */
import { SearchIndexService } from './SearchIndexService';
export interface StaticPageInfo {
    route: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    priority?: number;
}
export declare class StaticPageIndexService {
    private pool;
    private searchIndexService;
    constructor(databaseUrl: string, searchIndexService: SearchIndexService);
    /**
     * 索引所有靜態頁面
     */
    indexAllStaticPages(): Promise<void>;
    /**
     * 索引單個靜態頁面
     */
    indexStaticPage(pageInfo: StaticPageInfo): Promise<void>;
    /**
     * 轉換靜態頁面為 SearchDocument
     */
    private convertToSearchDocument;
    /**
     * 刪除靜態頁面索引
     */
    deleteStaticPageIndex(route: string): Promise<void>;
    /**
     * 關閉連線
     */
    close(): Promise<void>;
}

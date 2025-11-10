/**
 * AIPageIndexService - AI Page 索引服務
 *
 * 功能：
 * - 當 Agent 生成 AI Page 時，自動索引
 * - 從 .ai-pages/index.json 讀取 AI Page 資料
 * - 提取標題、內容、摘要
 * - 生成適當的標籤和分類
 */
import { SearchIndexService } from './SearchIndexService';
export interface AIPageData {
    pageId: string;
    content: string;
    createdAt: number;
}
export declare class AIPageIndexService {
    private pool;
    private searchIndexService;
    private aiPagesDir;
    private aiPagesIndexFile;
    constructor(databaseUrl: string, searchIndexService: SearchIndexService);
    /**
     * 索引單個 AI Page (通常在生成時呼叫)
     */
    indexAIPage(pageData: AIPageData): Promise<void>;
    /**
     * 從 JSON 檔案載入所有 AI Pages
     */
    private loadAIPagesFromDisk;
    /**
     * 批次索引所有 AI Pages
     */
    indexAllAIPages(): Promise<void>;
    /**
     * 轉換 AI Page 為 SearchDocument
     */
    private convertToSearchDocument;
    /**
     * 從文本中提取關鍵字作為標籤
     */
    private extractTags;
    /**
     * 推測頁面分類
     */
    private inferCategory;
    /**
     * 刪除 AI Page 索引
     */
    deleteAIPageIndex(pageId: string): Promise<void>;
    /**
     * 關閉連線
     */
    close(): Promise<void>;
}

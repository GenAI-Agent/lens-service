/**
 * SearchIndexService - 全站搜尋索引服務
 *
 * 功能：
 * - 索引內容到 search_index 表 (商品、AI Pages、靜態頁面)
 * - 執行混合搜尋 (BM25 + Vector + RRF)
 * - 支援 Faceted Search (分面搜尋)
 * - 記錄搜尋分析日誌
 *
 * 技術：
 * - PostgreSQL + pgvector
 * - BM25 全文搜尋 (使用 tsvector)
 * - 向量語意搜尋 (使用 OpenAI embeddings)
 * - RRF (Reciprocal Rank Fusion) 混合排序
 */
import { EmbeddingService } from './EmbeddingService';
export interface SearchDocument {
    contentId: string;
    contentType: 'product' | 'ai_page' | 'static_page' | 'event_page';
    title: string;
    content: string;
    summary?: string;
    url: string;
    tags?: string[];
    category?: string;
    metadata?: Record<string, any>;
}
export interface SearchResult {
    id: string;
    contentId: string;
    contentType: string;
    title: string;
    content: string;
    summary?: string;
    url: string;
    tags: string[];
    category?: string;
    metadata?: Record<string, any>;
    score: number;
    bm25Score?: number;
    vectorScore?: number;
    rank?: number;
    relevanceExplanation?: string;
}
export interface SearchOptions {
    mode?: 'keyword' | 'semantic' | 'hybrid';
    contentTypes?: string[];
    categories?: string[];
    tags?: string[];
    limit?: number;
    offset?: number;
    minScore?: number;
    computeFacets?: boolean;
}
export interface FacetResult {
    field: string;
    values: Array<{
        value: string;
        count: number;
    }>;
}
export interface SearchResponse {
    results: SearchResult[];
    facets?: FacetResult[];
    total: number;
    searchMode: string;
    took: number;
}
export declare class SearchIndexService {
    private pool;
    private embeddingService;
    constructor(databaseUrl: string, embeddingService: EmbeddingService);
    /**
     * 索引單個文檔
     */
    indexDocument(doc: SearchDocument): Promise<void>;
    /**
     * 批次索引多個文檔
     */
    indexDocuments(docs: SearchDocument[]): Promise<void>;
    /**
     * 刪除索引項目
     */
    deleteDocument(contentId: string): Promise<void>;
    /**
     * 統一搜尋入口
     */
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * BM25 關鍵字搜尋
     */
    keywordSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * 向量語意搜尋
     */
    semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * 混合搜尋 (Hybrid: BM25 + Vector with RRF)
     *
     * RRF (Reciprocal Rank Fusion) 公式：
     * RRF_score = Σ(1 / (k + rank_i))
     *
     * 其中 k 是常數 (通常 = 60)，rank_i 是該結果在第 i 個排名列表中的位置
     */
    hybridSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * 商品搜尋 - 支援多查詢詞 + 時間/折扣加分
     *
     * @param queries 查詢詞陣列,每個查詢詞都會進行 BM25 + Vector 搜尋
     * @param options 搜尋選項
     */
    searchProducts(queries: string[], options?: {
        categories?: string[] | null;
        limit?: number;
        offset?: number;
    }): Promise<SearchResult[]>;
    /**
     * 計算分面統計
     */
    computeFacets(query: string, options?: SearchOptions): Promise<FacetResult[]>;
    /**
     * 準備 tsquery 查詢字串
     */
    private prepareQuery;
    /**
     * 記錄搜尋分析日誌
     */
    logSearchAnalytics(data: {
        query: string;
        searchMode: string;
        resultsCount: number;
        userId?: string;
        agentId?: string;
        searchDurationMs: number;
    }): Promise<void>;
    /**
     * 關閉資料庫連線
     */
    close(): Promise<void>;
}

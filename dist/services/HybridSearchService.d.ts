export interface SearchResult {
    id: string;
    name: string;
    content: string;
    url?: string;
    type: string;
    file_type?: string;
    status?: string;
    vector_score: number;
    bm25_score: number;
    rrf_score: number;
    hybrid_score: number;
}
export interface SearchOptions {
    query: string;
    limit?: number;
    type?: 'manual' | 'url';
    minScore?: number;
}
/**
 * Hybrid Search Service
 * 使用 Vector Search + BM25 進行混合搜尋
 */
export declare class HybridSearchService {
    /**
     * Generate embedding using Azure OpenAI
     */
    private static generateEmbedding;
    /**
     * Perform hybrid search (Vector + BM25)
     */
    static search(options: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search only in manual indexes
     */
    static searchManual(query: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Search only in URL knowledge base
     */
    static searchURL(query: string, limit?: number): Promise<SearchResult[]>;
}

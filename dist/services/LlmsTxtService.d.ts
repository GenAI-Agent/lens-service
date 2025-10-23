/**
 * LLMs.txt 服務
 * 負責抓取和處理 llms.txt 內容
 */
export declare class LlmsTxtService {
    private static cache;
    private static readonly CACHE_DURATION;
    private static readonly CHUNK_SIZE;
    private static readonly CHUNK_OVERLAP;
    /**
     * 獲取並處理 llms.txt 內容
     */
    static getLlmsTxtChunks(): Promise<string[]>;
    /**
     * 將文本切分成 chunks（帶重疊）
     */
    private static splitIntoChunks;
    /**
     * 提取中文字符和英文單詞作為關鍵字
     */
    private static extractKeywords;
    /**
     * 計算 BM25 分數
     */
    private static calculateBM25Score;
    /**
     * 搜索相關的 chunks（使用 BM25 算法）
     */
    static searchChunks(query: string): Promise<Array<{
        chunk: string;
        context: string;
        score: number;
    }>>;
    /**
     * 清除緩存
     */
    static clearCache(): void;
}

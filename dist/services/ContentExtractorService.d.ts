/**
 * ContentExtractorService
 * 智能網頁內容提取和結構化切 Chunk 服務
 */
interface ExtractedContent {
    title: string;
    description: string;
    keywords: string[];
    content: string;
    metadata: {
        url: string;
        fileType: string;
        author?: string;
        publishDate?: string;
        [key: string]: any;
    };
}
interface ContentChunk {
    name: string;
    description: string;
    content: string;
    metadata: {
        chunk: number;
        totalChunks: number;
        headingPath: string[];
        originalUrl: string;
        fileType: string;
    };
}
export declare class ContentExtractorService {
    private readonly MAX_CHUNK_SIZE;
    private readonly MIN_CHUNK_SIZE;
    /**
     * 從 URL 提取內容
     */
    extractFromUrl(url: string): Promise<ExtractedContent>;
    /**
     * 檢測文件類型
     */
    private detectFileType;
    /**
     * 從 HTML 提取內容（使用 Cheerio）
     */
    private extractFromHTML;
    /**
     * 從 PDF 提取內容
     */
    private extractFromPDF;
    /**
     * 從純文本提取內容
     */
    private extractFromText;
    /**
     * 清理文本
     */
    private cleanText;
    /**
     * 結構化切 Chunk
     */
    chunkContent(extracted: ExtractedContent): Promise<ContentChunk[]>;
    /**
     * 解析文檔結構
     */
    private parseDocumentStructure;
    /**
     * 檢測是否像標題
     */
    private isLikelyHeading;
    /**
     * 檢測標題層級
     */
    private detectHeadingLevel;
    /**
     * 按結構切分（改進版：確保每個 chunk 都包含完整的標題層級）
     */
    private splitByStructure;
}
export {};

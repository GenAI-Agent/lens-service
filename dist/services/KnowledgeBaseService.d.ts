export interface KnowledgeFile {
    id: string;
    name: string;
    file_type: string;
    url?: string;
    status: 'pending' | 'processing' | 'active' | 'error' | 'invalid';
    created_at: Date;
    updated_at: Date;
    last_check?: Date;
    metadata?: any;
}
/**
 * Knowledge Base Service
 * 處理 URL 知識庫管理，支持文本切塊和 Hybrid Search
 */
export declare class KnowledgeBaseService {
    private static readonly CHUNK_SIZE;
    private static readonly CHUNK_OVERLAP;
    private static generateFingerprint;
    private static detectFileType;
    private static splitIntoChunks;
    private static generateEmbedding;
    private static fetchURLContent;
    private static processURL;
    static addUrl(url: string, fileType?: string, name?: string): Promise<KnowledgeFile>;
    static getFiles(): Promise<KnowledgeFile[]>;
    static deleteFile(id: string): Promise<void>;
    static removeInvalidUrls(): Promise<number>;
    static refreshFile(id: string): Promise<void>;
    static batchAddUrls(urls: string[]): Promise<KnowledgeFile[]>;
    static parseBatchImportText(text: string): string[];
    static refreshAll(): Promise<void>;
    static getFileTypeText(fileType: string): string;
    static getStatusText(status: string): string;
    static formatTime(date: Date): string;
}

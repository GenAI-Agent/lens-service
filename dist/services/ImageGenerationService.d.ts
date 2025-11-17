/**
 * ImageGenerationService
 * 負責與 Flux AI 圖片生成 API 進行交互
 * 基於 API_INTEGRATION_GUIDE.md 實現
 */
export interface ImageGenerationOptions {
    prompt: string;
    width?: number;
    height?: number;
    filenamePrefix?: string;
}
export interface ImageGenerationResult {
    success: boolean;
    promptId: string;
    status: string;
    images?: Array<{
        filename: string;
        subfolder: string;
        type: string;
        url: string;
    }>;
    s3_urls?: Array<string>;
    optimized_prompt?: string;
    error?: string;
}
export declare class ImageGenerationService {
    private baseUrl;
    private timeout;
    constructor(baseUrl?: string, timeout?: number);
    /**
     * 生成書籍封面圖片的優化提示詞
     */
    createBookCoverPrompt(bookTitle: string, author?: string, description?: string): string;
    /**
     * 生成圖片
     */
    generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
    /**
     * 檢查系統狀態
     */
    checkSystemStatus(): Promise<boolean>;
}

/**
 * Rotating ChatOpenAI
 *
 * 擴展 ChatOpenAI 來支援 API key 輪詢，避免 rate limit 問題
 */
import { ChatOpenAI } from "@langchain/openai";
export declare class RotatingChatOpenAI extends ChatOpenAI {
    private rotationService;
    private currentConfig;
    constructor(options?: any);
    /**
     * 重寫 invoke 方法來實現 API key 輪詢
     */
    invoke(input: any, options?: any): Promise<any>;
    /**
     * 更新 ChatOpenAI 的配置
     */
    private updateConfiguration;
    /**
     * 獲取當前的輪詢狀態
     */
    getRotationStatus(): {
        index: number;
        failures: number;
        available: boolean;
        lastUsed: number;
    }[];
    /**
     * 重置輪詢服務的失敗計數
     */
    resetRotation(): void;
}

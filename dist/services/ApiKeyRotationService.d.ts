/**
 * API Key Rotation Service
 *
 * 管理多個 Azure OpenAI API keys 的輪詢使用，避免單一 key 達到 rate limit
 */
export interface AzureOpenAIConfig {
    endpoint: string;
    apiKey: string;
    deployment?: string;
    apiVersion?: string;
}
export declare class ApiKeyRotationService {
    private configs;
    private currentIndex;
    private failureCounts;
    private lastUsedTime;
    private readonly MAX_FAILURES;
    private readonly COOLDOWN_MS;
    constructor();
    /**
     * 從環境變數載入所有可用的 API configurations
     */
    private loadConfigs;
    /**
     * 檢查指定的 config index 是否可用
     */
    private isConfigAvailable;
    /**
     * 獲取下一個可用的 API configuration
     * 使用 round-robin 策略輪詢
     */
    getNextConfig(): AzureOpenAIConfig | null;
    /**
     * 報告某個 config 的請求失敗（通常是 rate limit 或其他錯誤）
     */
    reportFailure(config: AzureOpenAIConfig): void;
    /**
     * 報告某個 config 的請求成功
     */
    reportSuccess(config: AzureOpenAIConfig): void;
    /**
     * 獲取所有 configs 的狀態
     */
    getStatus(): Array<{
        index: number;
        failures: number;
        available: boolean;
        lastUsed: number;
    }>;
    /**
     * 重置所有失敗計數
     */
    reset(): void;
    /**
     * 獲取可用的 config 數量
     */
    getAvailableCount(): number;
    /**
     * 獲取總 config 數量
     */
    getTotalCount(): number;
}
export declare function getApiKeyRotationService(): ApiKeyRotationService;

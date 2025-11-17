import { ServiceModulerConfig } from "./types";
/**
 * Lens Service - 可嵌入的 AI 客服 Widget
 *
 * 使用方式：
 *
 * <script src="lens-service.js"></script>
 * <script>
 *   LensService.init({
 *     azureOpenAI: {
 *       endpoint: 'https://your-resource.openai.azure.com/',
 *       apiKey: 'your-api-key',
 *       deployment: 'gpt-4.1'
 *     }
 *   });
 *
 *   // 綁定到按鈕
 *   document.getElementById('help-button').addEventListener('click', () => {
 *     LensService.open();
 *   });
 * </script>
 */
declare class LensServiceWidget {
    private config?;
    private panel?;
    private conversationState?;
    private initialized;
    private adminPanel?;
    private floatingIcon?;
    /**
     * Load rules from SQL database
     * Note: Rule loading is currently disabled. The system operates without predefined rules.
     * If you need to enable rules, start the db-server on port 3002 and uncomment the implementation.
     */
    private loadRulesFromSQL;
    /**
     * 初始化 Widget
     */
    init(config: ServiceModulerConfig): Promise<void>;
    /**
     * 打開面板
     */
    open(): void;
    /**
     * 關閉面板
     */
    close(): void;
    /**
     * 發送訊息
     */
    sendMessage(message: string, imageBase64?: string): Promise<void>;
    /**
     * 處理文字訊息（新架構：統一透過後端 API）
     */
    private processTextMessage;
    /**
     * 處理圖片訊息
     */
    private processImageMessage;
    /**
     * Call Azure OpenAI Vision API
     * Note: Vision API is currently not implemented. Future implementation should use backend API.
     */
    private callAzureOpenAIVision;
    /**
     * 發送 Telegram 通知
     */
    private sendTelegramNotification;
    /**
     * 保存對話記錄到資料庫
     */
    private saveConversationToDatabase;
    /**
     * Set rule (currently disabled)
     * Note: Rule functionality is not implemented in this version
     */
    setRule(ruleId: string): void;
    /**
     * 打開管理後台
     */
    private openAdminPanel;
    /**
     * Index site (not implemented)
     * Note: Site indexing functionality has been removed. Use backend API for indexing.
     */
    indexSite(startUrl?: string, mode?: "local" | "domain", onProgress?: (current: number, total: number) => void): Promise<void>;
    /**
     * Search current page content (not implemented)
     * Note: This functionality has been removed.
     */
    searchCurrentPage(query: string): Array<{
        text: string;
        context: string;
    }>;
    /**
     * Get current page content (not implemented)
     * Note: This functionality has been removed.
     */
    getCurrentPageContent(): {
        title: string;
        url: string;
        content: string;
        headings: Array<{
            level: number;
            text: string;
        }>;
        links: Array<{
            text: string;
            href: string;
        }>;
    };
    /**
     * 清除對話
     */
    clearConversation(): void;
    /**
     * 打開管理後台
     */
    openAdmin(): Promise<void>;
    /**
     * 銷毀 Widget
     */
    destroy(): void;
    /**
     * 處理發送訊息
     */
    private handleSendMessage;
    /**
     * 處理選擇規則
     */
    private handleSelectRule;
    /**
     * 處理打開
     */
    private handleOpen;
    /**
     * 處理關閉
     */
    private handleClose;
    /**
     * 載入對話狀態
     */
    private loadConversationState;
    /**
     * Save conversation state
     * Note: Local storage saving is disabled. Conversations are saved to database via saveConversationToDatabase()
     */
    private saveConversationState;
    /**
     * 檢查是否在管理後台頁面
     */
    private isAdminPage;
    /**
     * 創建浮動圖標
     */
    private createFloatingIcon;
    /**
     * 移除浮動圖標
     */
    private removeFloatingIcon;
    /**
     * 生成 Session ID
     */
    private generateSessionId;
    /**
     * 設置對話 ID（用於載入歷史對話）
     */
    setConversationId(conversationId: string): void;
}
declare const LensService: LensServiceWidget;
export { ContentExtractorService } from "./services/ContentExtractorService";
export { DatabaseService } from "./services/DatabaseService";
export { ManualIndexService } from "./services/ManualIndexService";
export { ConversationService } from "./services/ConversationService";
export { UserService } from "./services/UserService";
export default LensService;

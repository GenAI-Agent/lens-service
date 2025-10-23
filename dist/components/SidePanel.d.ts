import { Message, Rule } from '../types';
/**
 * 側邊欄面板組件
 * 從右側滑入，將原頁面推到左邊 2/3
 */
export declare class SidePanel {
    private container;
    private overlay;
    private panel;
    private isOpen;
    private width;
    private position;
    private capturedImage;
    private capturedText;
    private onSendMessage?;
    private onSelectRule?;
    private onClose?;
    private onOpen?;
    constructor(width?: string, position?: 'left' | 'right');
    /**
     * 注入 Markdown 樣式
     */
    private injectMarkdownStyles;
    /**
     * 創建容器
     */
    private createContainer;
    /**
     * 創建遮罩層
     */
    private createOverlay;
    /**
     * 創建面板
     */
    private createPanel;
    /**
     * 綁定事件
     */
    private bindEvents;
    /**
     * 處理發送訊息
     */
    private handleSend;
    /**
     * 顯示視圖
     */
    private showView;
    /**
     * 添加訊息
     */
    addMessage(message: Message): void;
    /**
     * 顯示搜尋動畫
     */
    showSearchingAnimation(): HTMLDivElement;
    /**
     * 移除搜尋動畫
     */
    removeSearchingAnimation(): void;
    /**
     * 開始流式回覆
     */
    startStreamingMessage(): HTMLDivElement;
    /**
     * 追加流式內容
     */
    appendStreamingContent(text: string): Promise<void>;
    /**
     * 完成流式回覆
     */
    finishStreamingMessage(sources?: any[]): Promise<void>;
    /**
     * 顯示歡迎畫面
     */
    showWelcomeScreen(): void;
    /**
     * 移除歡迎畫面
     */
    removeWelcomeScreen(): void;
    /**
     * 設置規則列表 (已移除規則功能)
     */
    setRules(rules: Rule[], currentRuleId?: string): void;
    /**
     * 清除訊息
     */
    clearMessages(showWelcome?: boolean): void;
    /**
     * 顯示歷史記錄
     */
    showHistory(): Promise<void>;
    /**
     * 顯示歷史記錄視圖
     */
    private showHistoryView;
    /**
     * 載入指定對話
     */
    private loadConversation;
    /**
     * 打開面板
     */
    open(): void;
    /**
     * 關閉面板
     */
    close(): void;
    /**
     * 檢查面板是否打開
     */
    isPanelOpen(): boolean;
    /**
     * 推動頁面內容
     */
    private pushPageContent;
    /**
     * 恢復頁面內容
     */
    private restorePageContent;
    /**
     * 設置捕獲的圖片
     */
    setCapturedImage(imageBase64: string, text: string): void;
    /**
     * 清除捕獲的圖片
     */
    clearCapturedImage(): void;
    /**
     * 將截圖設置到輸入框
     */
    setScreenshotInInput(base64Image: string): void;
    /**
     * 設置回調函數
     */
    setCallbacks(callbacks: {
        onSendMessage?: (message: string, imageBase64?: string, imageContext?: string) => void;
        onSelectRule?: (ruleId: string) => void;
        onClose?: () => void;
        onOpen?: () => void;
    }): void;
    /**
     * 銷毀
     */
    destroy(): void;
}

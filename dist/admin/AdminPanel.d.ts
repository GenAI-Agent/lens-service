/**
 * 管理後台面板
 * 完全重構版本 - 支援索引管理、客服記錄、Agent 設定等
 */
export declare class AdminPanel {
    private container;
    private isOpen;
    private isAuthenticated;
    private currentPage;
    constructor();
    /**
     * 初始化
     */
    private init;
    /**
     * 攔截 History API
     */
    private interceptHistory;
    /**
     * 處理路由變化
     */
    private handleRouteChange;
    /**
     * 打開後台
     */
    open(): Promise<void>;
    /**
     * 關閉後台
     */
    close(): void;
    /**
     * 檢查 IP 白名單
     */
    private checkIPWhitelist;
    /**
     * 獲取 IP 白名單
     */
    private getIPWhitelist;
    /**
     * 保存 IP 白名單
     */
    private saveIPWhitelist;
    /**
     * 渲染登入頁面
     * 修復：確保輸入框可以正常輸入
     */
    private renderLoginUI;
    /**
     * 顯示編輯對話框
     */
    private showEditDialog;
    /**
     * 顯示自定義確認對話框
     */
    private showConfirmDialog;
    /**
     * 顯示自定義提示對話框
     */
    private showAlertDialog;
    /**
     * 更新導航高亮
     */
    private updateNavHighlight;
    /**
     * 綁定事件
     */
    private bindEvents;
    /**
     * 渲染管理後台 UI
     */
    private renderAdminUI;
    /**
     * 渲染導航項目（無 icon）
     */
    private renderNavItem;
    /**
     * 渲染頁面內容
     */
    private renderPageContent;
    /**
     * 更新頁面內容（async helper）
     */
    private updatePageContent;
    /**
     * 綁定內容區域的事件
     */
    private bindContentEvents;
    /**
     * 綁定手動索引相關事件
     */
    private bindManualIndexEvents;
    /**
     * 綁定客服對話相關事件
     */
    private bindCustomerServiceEvents;
    /**
     * 綁定管理員相關事件
     */
    private bindAdminUserEvents;
    /**
     * 綁定系統設定相關事件
     */
    private bindSystemSettingsEvents;
    /**
     * 渲染儀表板
     */
    private renderDashboard;
    /**
     * 渲染統計卡片
     */
    private renderStatCard;
    /**
     * 渲染手動索引頁面
     */
    private renderManualIndex;
    /**
     * 渲染 Sitemap 索引頁面
     */
    private renderSitemap;
    /**
     * 渲染 SQL 資料庫頁面
     */
    private renderSQL;
    /**
     * 載入 SQL Plugin 配置
     */
    private loadSQLPluginConfig;
    /**
     * 渲染 Agent & API 設定頁面（合併）
     */
    private renderAgentAndAPI;
    /**
     * 檢查是否有 Telegram 配置
     */
    private hasTelegramConfig;
    /**
     * 獲取 Telegram 啟用狀態
     */
    private getTelegramEnabled;
    /**
     * 設置 Telegram 啟用狀態
     */
    private setTelegramEnabled;
    /**
     * 顯示編輯索引模態框
     */
    private showEditIndexModal;
    /**
     * 顯示新增索引模態框
     */
    private showAddIndexModal;
    /**
     * 顯示導入 URL 模態框
     */
    private showImportUrlModal;
    /**
     * 顯示刪除確認對話框
     */
    private showDeleteConfirmDialog;
    /**
     * 渲染客服對話頁面
     */
    private renderConversations;
    /**
     * 渲染管理員用戶頁面 (已棄用 - AdminUserManager 已移除)
     */
    private renderAdminUsers;
    /**
     * 渲染系統設定頁面
     */
    private renderSystemSettings;
    /**
     * 顯示新增管理員模態框
     */
    private showAddAdminUserModal;
    /**
     * 顯示對話詳情模態框
     */
    private showConversationModal;
    /**
     * 渲染知識庫管理頁面
     */
    private renderKnowledgeBase;
    /**
     * 顯示新增 URL 對話框
     */
    showAddUrlDialog(): Promise<void>;
    /**
     * 顯示批次匯入對話框
     */
    showBatchImportDialog(): Promise<void>;
    /**
     * 更新單一知識檔案
     */
    refreshKnowledgeFile(id: string): Promise<void>;
    /**
     * 刪除知識檔案
     */
    deleteKnowledgeFile(id: string): Promise<void>;
    /**
     * 全部更新
     */
    refreshAllKnowledge(): Promise<void>;
    /**
     * 刪除所有失效的檔案
     */
    removeInvalidKnowledge(): Promise<void>;
    /**
     * Toggle index content visibility
     */
    toggleIndexContent(id: string): void;
    /**
     * Toggle URL group visibility
     */
    toggleUrlGroup(url: string): void;
    /**
     * 顯示新增單個 URL 模態框
     */
    private showAddSingleUrlModal;
    /**
     * 顯示重新命名模態框
     */
    private showRenameIndexModal;
    /**
     * 重新生成 embedding
     */
    private regenerateEmbedding;
    /**
     * 重新爬取 URL（單個項目）
     */
    private recrawlUrl;
    /**
     * 重新爬取 URL（URL 層級 - 刷新整個 URL）
     */
    private recrawlUrlByUrl;
    /**
     * 刪除 URL 及其下所有項目
     */
    private deleteUrlAndAllItems;
    /**
     * 顯示編輯對話框（完整編輯：名稱、描述、URL、內容）
     */
    private showEditContentDialog;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
}

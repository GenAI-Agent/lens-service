import { SidePanel } from './SidePanel';
/**
 * 可調整寬度的側邊欄面板
 * 擴展 SidePanel，增加拖拉調整寬度功能
 */
export declare class ResizablePanel extends SidePanel {
    private resizeHandle;
    private isDragging;
    private startX;
    private startWidth;
    private minWidth;
    private maxWidthPercent;
    private currentWidth;
    private panelPosition;
    private aiPageButton;
    private hasAIPage;
    constructor(initialWidth?: number, // 改用 px 而不是 %
    position?: 'left' | 'right');
    /**
     * 創建拖拉 handle
     */
    private createResizeHandle;
    /**
     * 創建 AI Page 按鈕
     */
    private createAIPageButton;
    /**
     * 開始拖拉
     */
    private onResizeStart;
    /**
     * 拖拉中
     */
    private onResizeMove;
    /**
     * 結束拖拉
     */
    private onResizeEnd;
    /**
     * 更新面板寬度
     */
    private updatePanelWidth;
    /**
     * 顯示 AI Page 按鈕
     */
    showAIPageButton(): void;
    /**
     * 隱藏 AI Page 按鈕
     */
    hideAIPageButton(): void;
    /**
     * 切換 AI Page 顯示
     * AI Page overlay 已移除，此功能已停用
     */
    private toggleAIPage;
    /**
     * 取得 panel 元素（提供給子類別使用）
     */
    protected getPanel(): HTMLDivElement;
    /**
     * 取得當前寬度
     */
    getCurrentWidth(): number;
    /**
     * 設定寬度
     */
    setWidth(width: number): void;
    /**
     * 覆寫 open 方法以支援新的寬度系統
     */
    open(): void;
    /**
     * 銷毀時清理事件監聽
     */
    destroy(): void;
}

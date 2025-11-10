import { SidePanel } from './SidePanel';
import { Message, Rule } from '../types';

/**
 * 可調整寬度的側邊欄面板
 * 擴展 SidePanel，增加拖拉調整寬度功能
 */
export class ResizablePanel extends SidePanel {
  private resizeHandle: HTMLDivElement | null = null;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;
  private minWidth: number = 300; // 最小寬度 300px
  private maxWidthPercent: number = 75; // 最大寬度 75%
  private currentWidth: number = 500; // 預設寬度 500px
  private panelPosition: 'left' | 'right' = 'right'; // 儲存位置
  private aiPageButton: HTMLButtonElement | null = null;
  private hasAIPage: boolean = false;

  constructor(
    initialWidth: number = 500, // 改用 px 而不是 %
    position: 'left' | 'right' = 'right'
  ) {
    // 呼叫父類別建構函數，傳入臨時寬度（後面會被覆蓋）
    super('500px', position);
    this.panelPosition = position;
    this.currentWidth = initialWidth;
    this.createResizeHandle();
    this.updatePanelWidth(initialWidth);
    this.createAIPageButton();
  }

  /**
   * 創建拖拉 handle
   */
  private createResizeHandle(): void {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.id = 'sm-resize-handle';
    this.resizeHandle.style.cssText = `
      position: absolute;
      top: 0;
      ${this.panelPosition === 'right' ? 'left: 0;' : 'right: 0;'}
      width: 4px;
      height: 100%;
      background: transparent;
      cursor: ew-resize;
      z-index: 10;
      transition: background 0.2s;
    `;

    // Hover 效果
    this.resizeHandle.addEventListener('mouseenter', () => {
      if (this.resizeHandle) {
        this.resizeHandle.style.background = '#6366f1';
      }
    });

    this.resizeHandle.addEventListener('mouseleave', () => {
      if (this.resizeHandle && !this.isDragging) {
        this.resizeHandle.style.background = 'transparent';
      }
    });

    // 拖拉事件
    this.resizeHandle.addEventListener('mousedown', this.onResizeStart.bind(this));

    // 添加到 panel
    const panel = this.getPanel();
    if (panel) {
      panel.appendChild(this.resizeHandle);
    }
  }

  /**
   * 創建 AI Page 按鈕
   */
  private createAIPageButton(): void {
    const panel = this.getPanel();
    if (!panel) return;

    // 找到按鈕容器
    const buttonContainer = panel.querySelector('#sm-view-container > div') as HTMLElement;
    if (!buttonContainer) return;

    // 創建 AI Page 按鈕
    this.aiPageButton = document.createElement('button');
    this.aiPageButton.id = 'sm-aipage-btn';
    this.aiPageButton.style.cssText = `
      background: white;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    `;
    this.aiPageButton.title = 'AI Page';
    this.aiPageButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    `;

    // 添加 hover 效果
    this.aiPageButton.addEventListener('mouseenter', () => {
      if (this.aiPageButton) {
        this.aiPageButton.style.background = '#f3f4f6';
        this.aiPageButton.style.borderColor = '#6366f1';
        this.aiPageButton.style.color = '#6366f1';
        this.aiPageButton.style.transform = 'scale(1.05)';
      }
    });

    this.aiPageButton.addEventListener('mouseleave', () => {
      if (this.aiPageButton) {
        this.aiPageButton.style.background = 'white';
        this.aiPageButton.style.borderColor = '#e5e7eb';
        this.aiPageButton.style.color = '#6b7280';
        this.aiPageButton.style.transform = 'scale(1)';
      }
    });

    // 綁定點擊事件
    this.aiPageButton.addEventListener('click', () => {
      console.log('🔥 AI Page button clicked');
      this.toggleAIPage();
    });

    // 插入到按鈕容器的第一個位置
    buttonContainer.insertBefore(this.aiPageButton, buttonContainer.firstChild);
  }

  /**
   * 開始拖拉
   */
  private onResizeStart(e: MouseEvent): void {
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startWidth = this.currentWidth;

    // 添加全域事件監聽
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);

    // 改變游標
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    // 顯示 handle
    if (this.resizeHandle) {
      this.resizeHandle.style.background = '#6366f1';
    }
  }

  /**
   * 拖拉中
   */
  private onResizeMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = this.panelPosition === 'right'
      ? this.startX - e.clientX  // 右側面板：向左拖拉增加寬度
      : e.clientX - this.startX; // 左側面板：向右拖拉增加寬度

    const newWidth = this.startWidth + deltaX;

    // 限制寬度範圍
    const maxWidth = window.innerWidth * (this.maxWidthPercent / 100);
    const clampedWidth = Math.max(this.minWidth, Math.min(newWidth, maxWidth));

    this.updatePanelWidth(clampedWidth);
  };

  /**
   * 結束拖拉
   */
  private onResizeEnd = (): void => {
    if (!this.isDragging) return;

    this.isDragging = false;

    // 移除全域事件監聽
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);

    // 恢復游標
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // 隱藏 handle
    if (this.resizeHandle) {
      this.resizeHandle.style.background = 'transparent';
    }
  };

  /**
   * 更新面板寬度
   */
  private updatePanelWidth(width: number): void {
    this.currentWidth = width;
    const panel = this.getPanel();
    if (panel) {
      panel.style.width = `${width}px`;
    }
  }

  /**
   * 顯示 AI Page 按鈕
   */
  showAIPageButton(): void {
    if (this.aiPageButton) {
      this.aiPageButton.style.display = 'flex';
      this.hasAIPage = true;
    }
  }

  /**
   * 隱藏 AI Page 按鈕
   */
  hideAIPageButton(): void {
    if (this.aiPageButton) {
      this.aiPageButton.style.display = 'none';
      this.hasAIPage = false;
    }
  }

  /**
   * 切換 AI Page 顯示
   * AI Page overlay 已移除，此功能已停用
   */
  private toggleAIPage(): void {
    console.log('⚠️ toggleAIPage called but AI Page overlay has been removed');
    // AI Page 功能已改為直接在新視窗開啟，不再使用 overlay
  }

  /**
   * 取得 panel 元素（提供給子類別使用）
   */
  protected getPanel(): HTMLDivElement {
    // 使用反射存取私有屬性（TypeScript 編譯後會保留）
    return (this as any).panel;
  }

  /**
   * 取得當前寬度
   */
  getCurrentWidth(): number {
    return this.currentWidth;
  }

  /**
   * 設定寬度
   */
  setWidth(width: number): void {
    const maxWidth = window.innerWidth * (this.maxWidthPercent / 100);
    const clampedWidth = Math.max(this.minWidth, Math.min(width, maxWidth));
    this.updatePanelWidth(clampedWidth);
  }

  /**
   * 覆寫 open 方法以支援新的寬度系統
   */
  open(): void {
    super.open();
    // 確保寬度正確
    this.updatePanelWidth(this.currentWidth);
  }

  /**
   * 銷毀時清理事件監聽
   */
  destroy(): void {
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
    super.destroy();
  }
}

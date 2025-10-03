/**
 * 元素捕獲服務
 * 支援 Ctrl+Click 截圖和文字提取
 * 注意：此功能已禁用，保留代碼以備將來使用
 */
export class CaptureService {
  private isEnabled: boolean = false;
  private onCapture?: (imageBase64: string, text: string, element: HTMLElement) => void;
  
  /**
   * 啟用捕獲模式
   */
  enable(onCapture: (imageBase64: string, text: string, element: HTMLElement) => void): void {
    this.isEnabled = true;
    this.onCapture = onCapture;
    
    // 添加全局事件監聽
    document.addEventListener('click', this.handleClick, true);
    
    // 添加視覺提示樣式
    this.addHoverStyles();
    
    console.log('Capture mode enabled. Press Ctrl+Click to capture elements.');
  }
  
  /**
   * 禁用捕獲模式
   */
  disable(): void {
    this.isEnabled = false;
    document.removeEventListener('click', this.handleClick, true);
    this.removeHoverStyles();
    
    console.log('Capture mode disabled.');
  }
  
  /**
   * 處理點擊事件
   */
  private handleClick = async (event: MouseEvent): Promise<void> => {
    // 只處理 Ctrl+Click
    if (!event.ctrlKey || !this.isEnabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const element = event.target as HTMLElement;

    // 跳過 Widget 自己的元素
    if (element.closest('#sm-container, .sm-container')) {
      return;
    }

    try {
      // 1. 截圖
      const imageBase64 = await this.captureElement(element);

      // 2. 提取文字
      const text = this.extractText(element);

      // 3. 回調
      if (this.onCapture) {
        this.onCapture(imageBase64, text, element);
      }

      // 4. 視覺反饋
      this.showCaptureEffect(element);
    } catch (error) {
      console.error('Failed to capture element:', error);
    }
  };
  
  /**
   * 截圖元素
   * 注意：需要 html2canvas 庫，目前已移除以減少依賴
   */
  private async captureElement(element: HTMLElement): Promise<string> {
    // 簡化版本：返回空白圖片
    // 如果需要截圖功能，請安裝 html2canvas: npm install html2canvas
    console.warn('Screenshot feature is disabled. Install html2canvas to enable it.');
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
  
  /**
   * 提取元素文字
   */
  private extractText(element: HTMLElement): string {
    // 移除 script 和 style
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    
    // 提取文字
    const text = clone.textContent || '';
    
    // 清理空白
    return text.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * 添加懸停樣式
   */
  private addHoverStyles(): void {
    const style = document.createElement('style');
    style.id = 'sm-capture-styles';
    style.textContent = `
      body.sm-capture-mode * {
        cursor: crosshair !important;
      }
      
      body.sm-capture-mode *:hover {
        outline: 2px solid #6366f1 !important;
        outline-offset: 2px !important;
        background-color: rgba(99, 102, 241, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('sm-capture-mode');
  }
  
  /**
   * 移除懸停樣式
   */
  private removeHoverStyles(): void {
    const style = document.getElementById('sm-capture-styles');
    if (style) {
      style.remove();
    }
    document.body.classList.remove('sm-capture-mode');
  }
  
  /**
   * 顯示捕獲效果
   */
  private showCaptureEffect(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(99, 102, 241, 0.3);
      border: 2px solid #6366f1;
      pointer-events: none;
      z-index: 999999;
      animation: sm-capture-flash 0.5s ease-out;
    `;
    
    // 添加動畫
    const keyframes = `
      @keyframes sm-capture-flash {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.1); }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.remove();
      style.remove();
    }, 500);
  }
}

/**
 * 當前頁面內容提取服務
 */
export class PageContentService {
  /**
   * 提取當前頁面的所有文字內容
   */
  static extractCurrentPageContent(): {
    title: string;
    url: string;
    content: string;
    headings: Array<{ level: number; text: string }>;
    links: Array<{ text: string; href: string }>;
  } {
    // 標題
    const title = document.title;
    
    // URL
    const url = window.location.href;
    
    // 移除不需要的元素
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, nav, footer, header, .sm-container').forEach(el => el.remove());
    
    // 提取文字
    const content = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
    
    // 提取標題
    const headings: Array<{ level: number; text: string }> = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent?.trim() || '';
      if (text) {
        headings.push({ level, text });
      }
    });
    
    // 提取連結
    const links: Array<{ text: string; href: string }> = [];
    document.querySelectorAll('a[href]').forEach(link => {
      const text = link.textContent?.trim() || '';
      const href = (link as HTMLAnchorElement).href;
      if (text && href) {
        links.push({ text, href });
      }
    });
    
    return {
      title,
      url,
      content,
      headings,
      links
    };
  }
  
  /**
   * 搜尋當前頁面內容
   */
  static searchInCurrentPage(query: string): Array<{
    text: string;
    context: string;
    element: HTMLElement;
  }> {
    const results: Array<{ text: string; context: string; element: HTMLElement }> = [];
    const queryLower = query.toLowerCase();
    
    // 遍歷所有文字節點
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳過 script, style 和 widget
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style') {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (parent.closest('.sm-container')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const textLower = text.toLowerCase();
      
      if (textLower.includes(queryLower)) {
        const element = node.parentElement!;
        
        // 提取上下文（前後 50 個字符）
        const index = textLower.indexOf(queryLower);
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);
        const context = text.substring(start, end);
        
        results.push({
          text: text.trim(),
          context: '...' + context + '...',
          element
        });
      }
    }
    
    return results;
  }
}


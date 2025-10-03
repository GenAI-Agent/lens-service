/**
 * 頁面截圖服務
 * 處理長頁面的多張截圖
 */

import html2canvas from 'html2canvas';

export interface Screenshot {
  dataUrl: string;
  section: string;
  index: number;
}

export class PageScreenshotService {
  private maxScreenshotHeight = 2000;  // 每張截圖最大高度
  
  /**
   * 截取整個頁面（可能多張）
   */
  async captureFullPage(): Promise<Screenshot[]> {
    const body = document.body;
    const html = document.documentElement;
    
    const pageHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    const screenshots: Screenshot[] = [];

    // 計算需要幾張截圖
    const numScreenshots = Math.ceil(pageHeight / this.maxScreenshotHeight);
    
    for (let i = 0; i < numScreenshots; i++) {
      const scrollY = i * this.maxScreenshotHeight;
      
      // 滾動到對應位置
      window.scrollTo(0, scrollY);
      
      // 等待渲染
      await this.wait(300);
      
      // 截圖
      const canvas = await html2canvas(document.body, {
        y: scrollY,
        height: Math.min(this.maxScreenshotHeight, pageHeight - scrollY),
        windowHeight: this.maxScreenshotHeight,
        scrollY: -scrollY,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      screenshots.push({
        dataUrl: canvas.toDataURL('image/jpeg', 0.8),
        section: this.getSectionName(scrollY),
        index: i
      });
    }
    
    // 滾動回頂部
    window.scrollTo(0, 0);
    
    return screenshots;
  }
  
  /**
   * 截取主要內容區域
   */
  async captureMainContent(): Promise<Screenshot[]> {
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content'
    ];
    
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        return await this.captureElement(element);
      }
    }
    
    // 如果找不到主要內容，截取整個頁面
    return await this.captureFullPage();
  }
  
  /**
   * 截取特定元素（可能多張）
   */
  async captureElement(element: HTMLElement): Promise<Screenshot[]> {
    const elementHeight = element.scrollHeight;
    const screenshots: Screenshot[] = [];
    
    if (elementHeight <= this.maxScreenshotHeight) {
      // 單張截圖
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      screenshots.push({
        dataUrl: canvas.toDataURL('image/jpeg', 0.8),
        section: 'main',
        index: 0
      });
    } else {
      // 多張截圖
      const numScreenshots = Math.ceil(elementHeight / this.maxScreenshotHeight);
      
      for (let i = 0; i < numScreenshots; i++) {
        const y = i * this.maxScreenshotHeight;
        const height = Math.min(this.maxScreenshotHeight, elementHeight - y);
        
        const canvas = await html2canvas(element, {
          y: y,
          height: height,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        screenshots.push({
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          section: `part-${i + 1}`,
          index: i
        });
      }
    }
    
    return screenshots;
  }
  
  /**
   * 獲取當前滾動位置的章節名稱
   */
  private getSectionName(scrollY: number): string {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    
    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i] as HTMLElement;
      const headingY = heading.offsetTop;
      
      if (scrollY >= headingY) {
        return heading.textContent?.trim() || `section-${i}`;
      }
    }
    
    return 'top';
  }
  
  /**
   * 等待
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


/**
 * 網頁內容提取器
 * 提取重要內容並去除雜訊
 */

export interface ExtractedContent {
  title: string;
  mainContent: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  metadata: {
    description?: string;
    keywords?: string[];
  };
}

export interface PageScreenshots {
  fullPage: string;  // base64
  sections: Array<{
    heading: string;
    screenshot: string;  // base64
  }>;
}

export class PageExtractor {
  /**
   * 提取頁面主要內容（去除雜訊）
   */
  async extractContent(): Promise<ExtractedContent> {
    // 1. 提取標題
    const title = this.extractTitle();
    
    // 2. 提取主要內容區域
    const mainContent = this.extractMainContent();
    
    // 3. 提取結構化章節
    const sections = this.extractSections();
    
    // 4. 提取元數據
    const metadata = this.extractMetadata();
    
    return {
      title,
      mainContent,
      sections,
      metadata
    };
  }
  
  /**
   * 截取頁面截圖
   */
  async captureScreenshots(): Promise<PageScreenshots> {
    const html2canvas = (await import('html2canvas')).default;
    
    // 1. 全頁截圖
    const fullPage = await this.captureFullPage(html2canvas);
    
    // 2. 重要區域截圖
    const sections = await this.captureSections(html2canvas);
    
    return {
      fullPage,
      sections
    };
  }
  
  /**
   * 提取標題
   */
  private extractTitle(): string {
    // 優先順序：h1 > title > og:title
    const h1 = document.querySelector('h1');
    if (h1?.textContent?.trim()) {
      return h1.textContent.trim();
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      return ogTitle.getAttribute('content') || '';
    }
    
    return document.title;
  }
  
  /**
   * 提取主要內容（去除導航、側邊欄、頁尾等雜訊）
   */
  private extractMainContent(): string {
    // 常見的主要內容選擇器
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.article-content'
    ];
    
    // 嘗試找到主要內容區域
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanText(element.textContent || '');
      }
    }
    
    // 如果找不到，使用啟發式方法
    return this.extractByHeuristic();
  }
  
  /**
   * 啟發式提取（找到文字最多的區域）
   */
  private extractByHeuristic(): string {
    const candidates: Array<{ element: Element; score: number }> = [];
    
    // 排除的標籤
    const excludeTags = new Set(['SCRIPT', 'STYLE', 'NAV', 'HEADER', 'FOOTER', 'ASIDE']);
    
    // 遍歷所有元素
    document.querySelectorAll('div, section, article').forEach(element => {
      if (excludeTags.has(element.tagName)) return;
      
      // 計算分數
      const text = element.textContent || '';
      const textLength = text.trim().length;
      
      // 排除太短的
      if (textLength < 100) return;
      
      // 計算段落數量
      const paragraphs = element.querySelectorAll('p').length;
      
      // 分數 = 文字長度 + 段落數量 * 100
      const score = textLength + paragraphs * 100;
      
      candidates.push({ element, score });
    });
    
    // 排序並取最高分
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      return this.cleanText(candidates[0].element.textContent || '');
    }
    
    // 最後手段：body
    return this.cleanText(document.body.textContent || '');
  }
  
  /**
   * 提取結構化章節
   */
  private extractSections(): Array<{ heading: string; content: string }> {
    const sections: Array<{ heading: string; content: string }> = [];
    
    // 找到所有標題
    const headings = document.querySelectorAll('h2, h3');
    
    headings.forEach((heading, index) => {
      const headingText = heading.textContent?.trim() || '';
      if (!headingText) return;
      
      // 找到這個標題和下一個標題之間的內容
      const content = this.getContentBetweenHeadings(heading, headings[index + 1]);
      
      if (content.trim().length > 50) {
        sections.push({
          heading: headingText,
          content: this.cleanText(content)
        });
      }
    });
    
    return sections;
  }
  
  /**
   * 獲取兩個標題之間的內容
   */
  private getContentBetweenHeadings(start: Element, end?: Element): string {
    let content = '';
    let current = start.nextElementSibling;
    
    while (current && current !== end) {
      // 排除標題
      if (!current.tagName.match(/^H[1-6]$/)) {
        content += current.textContent + '\n';
      }
      current = current.nextElementSibling;
    }
    
    return content;
  }
  
  /**
   * 提取元數據
   */
  private extractMetadata(): { description?: string; keywords?: string[] } {
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined;
    
    const keywordsContent = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    const keywords = keywordsContent ? keywordsContent.split(',').map(k => k.trim()) : undefined;
    
    return { description, keywords };
  }
  
  /**
   * 清理文字（移除多餘空白、換行）
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // 多個空白變一個
      .replace(/\n+/g, '\n')  // 多個換行變一個
      .trim();
  }
  
  /**
   * 截取全頁
   */
  private async captureFullPage(html2canvas: any): Promise<string> {
    try {
      // 找到主要內容區域
      const mainElement = document.querySelector('main, article, .main-content, .content') || document.body;
      
      const canvas = await html2canvas(mainElement, {
        backgroundColor: '#ffffff',
        scale: 1,  // 降低解析度以減小文件大小
        logging: false,
        useCORS: true,
        windowHeight: mainElement.scrollHeight
      });
      
      return canvas.toDataURL('image/jpeg', 0.7);  // JPEG 壓縮
    } catch (error) {
      console.error('Failed to capture full page:', error);
      return '';
    }
  }
  
  /**
   * 截取重要區域
   */
  private async captureSections(html2canvas: any): Promise<Array<{ heading: string; screenshot: string }>> {
    const sections: Array<{ heading: string; screenshot: string }> = [];
    
    // 找到所有 h2 標題
    const headings = document.querySelectorAll('h2');
    
    // 最多截取 5 個區域
    const limit = Math.min(5, headings.length);
    
    for (let i = 0; i < limit; i++) {
      const heading = headings[i];
      const headingText = heading.textContent?.trim() || '';
      
      if (!headingText) continue;
      
      try {
        // 找到這個標題的父容器
        const container = heading.closest('section, article, div') || heading.parentElement;
        
        if (!container) continue;
        
        const canvas = await html2canvas(container, {
          backgroundColor: '#ffffff',
          scale: 1,
          logging: false,
          useCORS: true
        });
        
        sections.push({
          heading: headingText,
          screenshot: canvas.toDataURL('image/jpeg', 0.7)
        });
      } catch (error) {
        console.error(`Failed to capture section: ${headingText}`, error);
      }
    }
    
    return sections;
  }
}


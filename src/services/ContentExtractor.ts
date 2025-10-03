/**
 * 網頁內容提取器
 * 去除雜訊，提取重要內容
 */

export interface ExtractedContent {
  title: string;
  mainContent: string;
  sections: Array<{
    heading: string;
    content: string;
    relevance: number;
  }>;
  images: Array<{
    src: string;
    alt: string;
    context: string;
  }>;
  metadata: {
    description?: string;
    keywords?: string[];
  };
}

export class ContentExtractor {
  /**
   * 提取頁面主要內容
   */
  extract(doc: Document = document): ExtractedContent {
    return {
      title: this.extractTitle(doc),
      mainContent: this.extractMainContent(doc),
      sections: this.extractSections(doc),
      images: this.extractImages(doc),
      metadata: this.extractMetadata(doc)
    };
  }
  
  /**
   * 提取標題
   */
  private extractTitle(doc: Document): string {
    // 優先順序：og:title > title > h1
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) return ogTitle;
    
    const title = doc.querySelector('title')?.textContent;
    if (title) return title;
    
    const h1 = doc.querySelector('h1')?.textContent;
    return h1 || 'Untitled';
  }
  
  /**
   * 提取主要內容（去除雜訊）
   */
  private extractMainContent(doc: Document): string {
    // 移除不需要的元素
    const clone = doc.cloneNode(true) as Document;
    this.removeNoise(clone);
    
    // 尋找主要內容區域
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];
    
    for (const selector of mainSelectors) {
      const main = clone.querySelector(selector);
      if (main && main.textContent && main.textContent.length > 100) {
        return this.cleanText(main.textContent);
      }
    }
    
    // 如果找不到，使用 body
    const body = clone.querySelector('body');
    return body ? this.cleanText(body.textContent || '') : '';
  }
  
  /**
   * 移除雜訊元素
   */
  private removeNoise(doc: Document): void {
    const noiseSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.sidebar',
      '.advertisement',
      '.ad',
      '.cookie-banner',
      '.popup',
      '.modal',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]'
    ];
    
    noiseSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });
  }
  
  /**
   * 提取章節
   */
  private extractSections(doc: Document): Array<{ heading: string; content: string; relevance: number }> {
    const sections: Array<{ heading: string; content: string; relevance: number }> = [];
    
    // 找到所有標題
    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    
    headings.forEach((heading) => {
      const headingText = this.cleanText(heading.textContent || '');
      if (!headingText) return;
      
      // 找到這個標題後面的內容（直到下一個標題）
      let content = '';
      let currentElement = heading.nextElementSibling;
      
      while (currentElement && !currentElement.matches('h1, h2, h3, h4')) {
        const text = currentElement.textContent || '';
        if (text.trim()) {
          content += text + ' ';
        }
        currentElement = currentElement.nextElementSibling;
      }
      
      if (content.trim()) {
        sections.push({
          heading: headingText,
          content: this.cleanText(content),
          relevance: this.calculateRelevance(heading, content)
        });
      }
    });
    
    // 按相關性排序
    return sections.sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * 計算章節相關性
   */
  private calculateRelevance(heading: Element, content: string): number {
    let score = 0;
    
    // 標題層級（h1 > h2 > h3）
    const tagName = heading.tagName.toLowerCase();
    if (tagName === 'h1') score += 3;
    else if (tagName === 'h2') score += 2;
    else if (tagName === 'h3') score += 1;
    
    // 內容長度
    const contentLength = content.length;
    if (contentLength > 500) score += 3;
    else if (contentLength > 200) score += 2;
    else if (contentLength > 50) score += 1;
    
    // 是否在主要內容區域
    const isInMain = heading.closest('main, article, [role="main"]');
    if (isInMain) score += 2;
    
    return score;
  }
  
  /**
   * 提取圖片
   */
  private extractImages(doc: Document): Array<{ src: string; alt: string; context: string }> {
    const images: Array<{ src: string; alt: string; context: string }> = [];
    
    doc.querySelectorAll('img').forEach(img => {
      const src = img.src;
      const alt = img.alt || '';
      
      // 跳過小圖片（可能是 icon）
      if (img.width < 50 || img.height < 50) return;
      
      // 跳過廣告圖片
      if (src.includes('ad') || src.includes('banner')) return;
      
      // 獲取圖片上下文
      const context = this.getImageContext(img);
      
      images.push({ src, alt, context });
    });
    
    return images;
  }
  
  /**
   * 獲取圖片上下文
   */
  private getImageContext(img: HTMLImageElement): string {
    // 查找圖片的 caption
    const figure = img.closest('figure');
    if (figure) {
      const caption = figure.querySelector('figcaption');
      if (caption) return this.cleanText(caption.textContent || '');
    }
    
    // 查找附近的文字
    const parent = img.parentElement;
    if (parent) {
      const text = parent.textContent || '';
      return this.cleanText(text.substring(0, 200));
    }
    
    return '';
  }
  
  /**
   * 提取元數據
   */
  private extractMetadata(doc: Document): { description?: string; keywords?: string[] } {
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       undefined;

    const keywordsContent = doc.querySelector('meta[name="keywords"]')?.getAttribute('content');
    const keywords = keywordsContent ? keywordsContent.split(',').map(k => k.trim()) : undefined;

    return { description, keywords };
  }
  
  /**
   * 清理文字
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // 多個空白變一個
      .replace(/\n+/g, '\n')  // 多個換行變一個
      .trim();
  }
  
  /**
   * 搜尋相關內容片段
   */
  searchRelevantSections(query: string, maxSections: number = 5): Array<{ heading: string; content: string; score: number }> {
    const content = this.extract();
    const queryKeywords = query.toLowerCase().split(/\s+/);
    
    // 計算每個章節的相關性分數
    const scoredSections = content.sections.map(section => {
      let score = section.relevance;
      
      // 標題匹配
      const headingLower = section.heading.toLowerCase();
      queryKeywords.forEach(keyword => {
        if (headingLower.includes(keyword)) {
          score += 5;
        }
      });
      
      // 內容匹配
      const contentLower = section.content.toLowerCase();
      queryKeywords.forEach(keyword => {
        const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2;
      });
      
      return {
        heading: section.heading,
        content: section.content,
        score
      };
    });
    
    // 排序並返回前 N 個
    return scoredSections
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSections);
  }

  /**
   * 提取純文字內容
   */
  extractText(element: HTMLElement): string {
    // 移除 script 和 style 標籤
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    return clone.textContent || '';
  }

  /**
   * 提取關鍵字
   */
  extractKeywords(text: string, maxKeywords: number = 20): string[] {
    // 簡單的關鍵字提取：分詞 + 去除停用詞 + 計算頻率
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留中英文和數字
      .split(/\s+/)
      .filter(word => word.length > 1); // 過濾單字元

    // 計算詞頻
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // 排序並返回 top N
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 生成 Fingerprint（SimHash）
   */
  generateFingerprint(text: string, bits: number = 64): number[] {
    const keywords = this.extractKeywords(text, 50);

    // 簡化版 SimHash
    const fingerprint = new Array(bits).fill(0);

    for (const keyword of keywords) {
      const hash = this.simpleHash(keyword, bits);

      for (let i = 0; i < bits; i++) {
        if (hash[i] === 1) {
          fingerprint[i]++;
        } else {
          fingerprint[i]--;
        }
      }
    }

    // 轉換為 0/1
    return fingerprint.map(v => v > 0 ? 1 : 0);
  }

  /**
   * 簡單的 hash 函數
   */
  private simpleHash(str: string, bits: number): number[] {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    const result = new Array(bits).fill(0);
    for (let i = 0; i < bits; i++) {
      result[i] = (hash >> i) & 1;
    }

    return result;
  }
}


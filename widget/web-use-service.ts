/**
 * Web Use Service
 * Client-side service for DOM manipulation, screenshot, and markdown conversion
 * Runs in the browser (widget side)
 */

import TurndownService from 'turndown';
import html2canvas from 'html2canvas';

export interface PageState {
  url: string;
  title: string;
  markdown: string;
  screenshot: string;
  actionableElements: ActionableElement[];
  timestamp: Date;
}

export interface ActionableElement {
  id: string;
  type: 'button' | 'input' | 'link' | 'select' | 'textarea';
  selector: string;
  text?: string;
  placeholder?: string;
  description: string;
}

export class WebUseService {
  private turndownService: TurndownService;
  private elementIdCounter = 0;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  /**
   * Analyze current page: DOM to Markdown + Screenshot + Actionable Elements
   */
  async analyzePage(): Promise<PageState> {
    const url = window.location.href;
    const title = document.title;
    const markdown = await this.domToMarkdown();
    const screenshot = await this.takeScreenshot();
    const actionableElements = this.extractActionableElements();

    return {
      url,
      title,
      markdown,
      screenshot,
      actionableElements,
      timestamp: new Date(),
    };
  }

  /**
   * Convert DOM to Markdown using Turndown
   */
  private async domToMarkdown(): Promise<string> {
    try {
      const bodyClone = document.body.cloneNode(true) as HTMLElement;

      // Remove script and style tags
      const scripts = bodyClone.querySelectorAll('script, style, noscript');
      scripts.forEach((el) => el.remove());

      // Remove hidden elements
      const hidden = bodyClone.querySelectorAll('[hidden], [style*="display: none"]');
      hidden.forEach((el) => el.remove());

      const html = bodyClone.innerHTML;
      const markdown = this.turndownService.turndown(html);

      return markdown;
    } catch (error) {
      console.error('Failed to convert DOM to markdown:', error);
      return 'Failed to convert page to markdown';
    }
  }

  /**
   * Take screenshot of current viewport only (not full page)
   */
  private async takeScreenshot(): Promise<string> {
    try {
      // Create a container for viewport-only capture
      const viewportElement = document.createElement('div');
      viewportElement.style.position = 'fixed';
      viewportElement.style.top = '0';
      viewportElement.style.left = '0';
      viewportElement.style.width = `${window.innerWidth}px`;
      viewportElement.style.height = `${window.innerHeight}px`;
      viewportElement.style.pointerEvents = 'none';
      viewportElement.style.zIndex = '-9999';

      // Clone visible viewport content
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      viewportElement.appendChild(bodyClone);
      document.body.appendChild(viewportElement);

      const canvas = await html2canvas(viewportElement, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Clean up
      document.body.removeChild(viewportElement);

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return '';
    }
  }

  /**
   * Extract actionable elements (buttons, inputs, links)
   */
  private extractActionableElements(): ActionableElement[] {
    const elements: ActionableElement[] = [];

    // Find all interactive elements
    const selectors = [
      'button:not([hidden]):not([disabled])',
      'a[href]:not([hidden])',
      'input:not([hidden]):not([disabled])',
      'textarea:not([hidden]):not([disabled])',
      'select:not([hidden]):not([disabled])',
      '[role="button"]:not([hidden])',
    ];

    const interactiveElements = document.querySelectorAll(selectors.join(','));

    interactiveElements.forEach((el) => {
      if (!this.isVisible(el as HTMLElement)) {
        return;
      }

      const element = this.createActionableElement(el as HTMLElement);
      if (element) {
        elements.push(element);
      }
    });

    return elements.slice(0, 50); // Limit to 50 elements
  }

  /**
   * Create actionable element descriptor
   */
  private createActionableElement(el: HTMLElement): ActionableElement | null {
    const id = `el-${this.elementIdCounter++}`;
    el.setAttribute('data-lens-id', id);

    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 100) || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const placeholder = (el as HTMLInputElement).placeholder || '';

    let type: ActionableElement['type'];
    let description: string;

    if (tagName === 'button' || el.getAttribute('role') === 'button') {
      type = 'button';
      description = `button "${text || ariaLabel}"`;
    } else if (tagName === 'a') {
      type = 'link';
      const href = (el as HTMLAnchorElement).href;
      description = `link "${text}" (${href})`;
    } else if (tagName === 'input') {
      type = 'input';
      const inputType = (el as HTMLInputElement).type;
      description = `input type="${inputType}" placeholder="${placeholder}"`;
    } else if (tagName === 'textarea') {
      type = 'textarea';
      description = `textarea placeholder="${placeholder}"`;
    } else if (tagName === 'select') {
      type = 'select';
      description = `select "${text || ariaLabel}"`;
    } else {
      return null;
    }

    return {
      id,
      type,
      selector: `[data-lens-id="${id}"]`,
      text: text || undefined,
      placeholder: placeholder || undefined,
      description,
    };
  }

  /**
   * Check if element is visible
   */
  private isVisible(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  /**
   * Click on element
   */
  async click(selector: string): Promise<{ success: boolean; error?: string }> {
    try {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) {
        return { success: false, error: 'Element not found' };
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(300);

      el.click();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Scroll page
   */
  async scroll(params: {
    direction?: 'up' | 'down' | 'top' | 'bottom';
    distance?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { direction = 'down', distance = 300 } = params;

      if (direction === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (direction === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else if (direction === 'up') {
        window.scrollBy({ top: -distance, behavior: 'smooth' });
      } else if (direction === 'down') {
        window.scrollBy({ top: distance, behavior: 'smooth' });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Highlight element with visual effect
   */
  async highlight(params: {
    selector: string;
    duration?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { selector, duration = 2000 } = params;
      const el = document.querySelector(selector) as HTMLElement;

      if (!el) {
        return { success: false, error: 'Element not found' };
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(300);

      const originalOutline = el.style.outline;
      const originalBackground = el.style.backgroundColor;

      el.style.outline = '3px solid #ff0000';
      el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';

      setTimeout(() => {
        el.style.outline = originalOutline;
        el.style.backgroundColor = originalBackground;
      }, duration);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Double-click on element
   */
  async doubleClick(selector: string): Promise<{ success: boolean; error?: string }> {
    try {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) {
        return { success: false, error: 'Element not found' };
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(300);

      // Trigger double click event
      const event = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      el.dispatchEvent(event);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Scroll to specific element
   */
  async scrollToElement(selector: string): Promise<{ success: boolean; error?: string }> {
    try {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) {
        return { success: false, error: 'Element not found' };
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Drag element to target
   */
  async drag(params: {
    selector: string;
    targetSelector: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { selector, targetSelector } = params;
      const sourceEl = document.querySelector(selector) as HTMLElement;
      const targetEl = document.querySelector(targetSelector) as HTMLElement;

      if (!sourceEl) {
        return { success: false, error: 'Source element not found' };
      }
      if (!targetEl) {
        return { success: false, error: 'Target element not found' };
      }

      // Scroll to source element
      sourceEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(300);

      // Create drag events
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });

      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer,
      });

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer,
      });

      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer,
      });

      // Dispatch events
      sourceEl.dispatchEvent(dragStartEvent);
      await this.sleep(100);

      targetEl.dispatchEvent(dragOverEvent);
      await this.sleep(100);

      targetEl.dispatchEvent(dropEvent);
      await this.sleep(100);

      sourceEl.dispatchEvent(dragEndEvent);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Deep crawl current page and subpages (2 levels deep)
   * Returns: { success, pagesCount, summary, pages }
   */
  async deepCrawl(params: {
    maxDepth?: number;
    urlFilter?: string;
  }): Promise<{
    success: boolean;
    pagesCount?: number;
    summary?: string;
    pages?: Array<{ url: string; title: string; description: string }>;
    error?: string;
  }> {
    try {
      const { maxDepth = 2, urlFilter } = params;
      const visitedUrls = new Set<string>();
      const pages: Array<{ url: string; title: string; description: string }> = [];

      const currentUrl = window.location.href;
      const baseUrl = new URL(currentUrl).origin;

      // Helper function to extract links from a page
      const extractLinks = (doc: Document): string[] => {
        const links: string[] = [];
        const anchors = doc.querySelectorAll('a[href]');

        anchors.forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          try {
            const url = new URL(href, baseUrl);
            // Only include same-origin links
            if (url.origin === baseUrl) {
              const fullUrl = url.href;
              // Apply URL filter if specified
              if (!urlFilter || fullUrl.includes(urlFilter)) {
                links.push(fullUrl);
              }
            }
          } catch (error) {
            // Invalid URL, skip
          }
        });

        return Array.from(new Set(links)); // Deduplicate
      };

      // Helper function to extract page info
      const extractPageInfo = (url: string, doc: Document) => {
        const title = doc.title || 'Untitled';

        // Extract meta description or first paragraph
        const metaDesc = doc.querySelector('meta[name="description"]');
        let description = metaDesc?.getAttribute('content') || '';

        if (!description) {
          const firstParagraph = doc.querySelector('p');
          description = firstParagraph?.textContent?.trim().substring(0, 200) || '';
        }

        return { url, title, description };
      };

      // BFS crawl
      const queue: Array<{ url: string; depth: number }> = [{ url: currentUrl, depth: 0 }];

      while (queue.length > 0) {
        const { url, depth } = queue.shift()!;

        if (visitedUrls.has(url) || depth >= maxDepth) {
          continue;
        }

        visitedUrls.add(url);

        try {
          // Fetch page content
          const response = await fetch(url);
          const html = await response.text();

          // Parse HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extract page info
          const pageInfo = extractPageInfo(url, doc);
          pages.push(pageInfo);

          // Extract links for next level
          if (depth < maxDepth - 1) {
            const links = extractLinks(doc);
            links.forEach((link) => {
              if (!visitedUrls.has(link)) {
                queue.push({ url: link, depth: depth + 1 });
              }
            });
          }
        } catch (error) {
          console.error(`Failed to crawl ${url}:`, error);
          // Continue with other pages
        }

        // Limit total pages to prevent overload
        if (pages.length >= 50) {
          break;
        }
      }

      // Generate summary (this will be sent to LLM on server side)
      const summary = `Crawled ${pages.length} pages from ${baseUrl}. Pages include: ${pages.map(p => p.title).join(', ')}`;

      return {
        success: true,
        pagesCount: pages.length,
        summary,
        pages,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

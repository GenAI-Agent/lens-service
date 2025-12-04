/**
 * Puppeteer Page Loader
 * Loads web pages using Puppeteer, captures screenshot and extracts DOM
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import TurndownService from 'turndown';

export interface PageState {
  url: string;
  title: string;
  markdown: string;
  screenshot: string; // base64 data URL
  actionableElements: ActionableElement[];
}

export interface ActionableElement {
  selector: string;
  description: string;
}

export class PuppeteerLoader {
  private browser: Browser | null = null;
  private currentPage: Page | null = null;
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  /**
   * Initialize browser (lazy initialization)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('[PuppeteerLoader] Launching browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      console.log('[PuppeteerLoader] Browser launched');
    }
    return this.browser;
  }

  /**
   * Load a page and extract all information
   */
  async loadPage(url: string, timeout: number = 30000): Promise<PageState> {
    const browser = await this.getBrowser();

    // Close previous page if exists
    if (this.currentPage) {
      await this.currentPage.close();
    }

    // Create new page and keep it open
    this.currentPage = await browser.newPage();
    const page = this.currentPage;

    try {
      console.log('[PuppeteerLoader] Loading page:', url);

      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      // Wait a bit for dynamic content
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get title
      const title = await page.title();
      console.log('[PuppeteerLoader] Page title:', title);

      // Take screenshot (viewport only, as base64)
      const screenshotBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        encoding: 'binary',
      }) as Buffer;
      const screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;
      console.log('[PuppeteerLoader] Screenshot captured, size:', screenshotBuffer.length);

      // Extract HTML and convert to markdown
      const html = await page.content();
      const bodyHtml = await page.evaluate(`(() => {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll('script, style, noscript, iframe').forEach(el => el.remove());
        return clone.innerHTML;
      })()`);

      const markdown = this.turndownService.turndown(bodyHtml);
      console.log('[PuppeteerLoader] Markdown extracted, length:', markdown.length);

      // Extract actionable elements
      const actionableElements = await this.extractActionableElements(page);
      console.log('[PuppeteerLoader] Found', actionableElements.length, 'actionable elements');

      return {
        url,
        title,
        markdown: markdown.substring(0, 10000), // Limit to 10k chars
        screenshot,
        actionableElements: actionableElements.slice(0, 50), // Limit to 50 elements
      };
    } catch (error) {
      console.error('[PuppeteerLoader] Error loading page:', error);
      // Don't close page on error, keep it for retry
      throw error;
    }
    // Note: Page is kept open for web actions
  }

  /**
   * Extract actionable elements from page
   */
  private async extractActionableElements(page: Page): Promise<ActionableElement[]> {
    return (await page.evaluate(`(() => {
      const elements = [];
      const selectors = [
        'button:not([hidden]):not([disabled])',
        'a[href]:not([hidden])',
        'input:not([hidden]):not([disabled])',
        'textarea:not([hidden]):not([disabled])',
        'select:not([hidden]):not([disabled])',
        '[role="button"]:not([hidden])',
      ];

      const interactiveElements = document.querySelectorAll(selectors.join(','));

      interactiveElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          opacity > 0;

        if (!isVisible) return;

        const tagName = el.tagName.toLowerCase();
        const id = el.id ? ('#' + el.id) : '';
        const classes = el.className ? ('.' + Array.from(el.classList).join('.')) : '';
        const selector = id || classes || (tagName + ':nth-of-type(' + (index + 1) + ')');

        const text = el.textContent?.trim().substring(0, 50) || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const placeholder = el.placeholder || '';

        let description = '';
        if (tagName === 'button' || el.getAttribute('role') === 'button') {
          description = 'button "' + (text || ariaLabel) + '"';
        } else if (tagName === 'a') {
          description = 'link "' + text + '" (' + el.href + ')';
        } else if (tagName === 'input') {
          description = 'input type="' + el.type + '" placeholder="' + placeholder + '"';
        } else if (tagName === 'textarea') {
          description = 'textarea placeholder="' + placeholder + '"';
        } else if (tagName === 'select') {
          description = 'select "' + (text || ariaLabel) + '"';
        }

        if (description) {
          elements.push({ selector, description });
        }
      });

      return elements;
    })()`) as ActionableElement[]);
  }

  /**
   * Execute web action on current page
   */
  async executeWebAction(action: string, params: any): Promise<any> {
    if (!this.currentPage) {
      return {
        success: false,
        error: 'No page loaded. Please load a page first.',
      };
    }

    const page = this.currentPage;

    try {
      console.log('[PuppeteerLoader] Executing web action:', action, params);

      switch (action) {
        case 'click': {
          if (!params.selector) {
            return { success: false, error: 'selector is required for click action' };
          }
          await page.click(params.selector);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for action to complete
          return {
            success: true,
            message: `Clicked on element: ${params.selector}`,
          };
        }

        case 'scroll': {
          const direction = params.direction || 'down';
          const distance = params.distance || 300;

          if (direction === 'top') {
            await page.evaluate('window.scrollTo(0, 0)');
          } else if (direction === 'bottom') {
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
          } else if (direction === 'up') {
            await page.evaluate(`window.scrollBy(0, -${distance})`);
          } else if (direction === 'down') {
            await page.evaluate(`window.scrollBy(0, ${distance})`);
          }

          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            success: true,
            message: `Scrolled ${direction}`,
          };
        }

        case 'highlight': {
          if (!params.selector) {
            return { success: false, error: 'selector is required for highlight action' };
          }
          const duration = params.duration || 2000;

          await page.evaluate(`(() => {
            const element = document.querySelector('${params.selector.replace(/'/g, "\\'")}');
            if (!element) return;

            const originalOutline = element.style.outline;
            const originalBackground = element.style.backgroundColor;

            element.style.outline = '3px solid #ff0000';
            element.style.backgroundColor = '#ffff0080';

            setTimeout(() => {
              element.style.outline = originalOutline;
              element.style.backgroundColor = originalBackground;
            }, ${duration});
          })()`);

          return {
            success: true,
            message: `Highlighted element: ${params.selector}`,
          };
        }

        case 'drag': {
          if (!params.selector || !params.targetSelector) {
            return {
              success: false,
              error: 'selector and targetSelector are required for drag action',
            };
          }

          // Get bounding boxes
          const sourceBox = await page.$eval(params.selector, el => {
            const rect = el.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          });

          const targetBox = await page.$eval(params.targetSelector, el => {
            const rect = el.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          });

          // Perform drag
          await page.mouse.move(sourceBox.x, sourceBox.y);
          await page.mouse.down();
          await page.mouse.move(targetBox.x, targetBox.y, { steps: 10 });
          await page.mouse.up();

          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            success: true,
            message: `Dragged element ${params.selector} to ${params.targetSelector}`,
          };
        }

        case 'doubleClick': {
          if (!params.selector) {
            return { success: false, error: 'selector is required for doubleClick action' };
          }
          await page.click(params.selector, { clickCount: 2 });
          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            success: true,
            message: `Double-clicked on element: ${params.selector}`,
          };
        }

        case 'scrollToElement': {
          if (!params.selector) {
            return { success: false, error: 'selector is required for scrollToElement action' };
          }

          await page.evaluate(`(() => {
            const element = document.querySelector('${params.selector.replace(/'/g, "\\'")}');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          })()`);

          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            success: true,
            message: `Scrolled to element: ${params.selector}`,
          };
        }

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('[PuppeteerLoader] Error executing web action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('[PuppeteerLoader] Closing browser');
      await this.browser.close();
      this.browser = null;
    }
  }
}

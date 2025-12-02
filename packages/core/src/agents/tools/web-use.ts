/**
 * Web Use Tools
 * 使用 Puppeteer 進行真實的瀏覽器操作和 DOM 控制
 */

import type { Browser, Page } from 'puppeteer';

export interface WebUseSession {
  id: string;
  browser: Browser;
  page: Page;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface ClickResult {
  success: boolean;
  selector: string;
  message: string;
}

export interface TypeResult {
  success: boolean;
  selector: string;
  text: string;
  message: string;
}

export interface ScreenshotResult {
  success: boolean;
  base64?: string;
  message: string;
}

export interface ExtractResult {
  success: boolean;
  data: Record<string, unknown>;
  message: string;
}

/**
 * Web Use Controller
 * 控制真實瀏覽器進行網頁操作
 */
export class WebUseController {
  private sessions: Map<string, WebUseSession> = new Map();
  private puppeteer: typeof import('puppeteer') | null = null;

  /**
   * 初始化 Puppeteer（延遲載入）
   */
  private async initPuppeteer() {
    if (!this.puppeteer) {
      try {
        this.puppeteer = await import('puppeteer');
      } catch (error) {
        throw new Error(
          'Puppeteer is not installed. Please run: npm install puppeteer'
        );
      }
    }
    return this.puppeteer;
  }

  /**
   * 創建新的瀏覽器會話
   */
  async createSession(sessionId?: string): Promise<string> {
    const puppeteer = await this.initPuppeteer();

    const browser = await puppeteer.launch({
      headless: true, // 使用新的 headless 模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 設置視窗大小
    await page.setViewport({ width: 1280, height: 800 });

    // 設置 User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const id = sessionId || `session_${Date.now()}`;
    const session: WebUseSession = {
      id,
      browser,
      page,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sessions.set(id, session);
    console.log(`[WebUse] Created session: ${id}`);

    return id;
  }

  /**
   * 獲取會話
   */
  private getSession(sessionId: string): WebUseSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.lastAccessedAt = new Date();
    return session;
  }

  /**
   * 導航到 URL
   */
  async navigate(sessionId: string, url: string): Promise<{ success: boolean; url: string; title: string }> {
    const session = this.getSession(sessionId);

    console.log(`[WebUse] Navigating to: ${url}`);
    await session.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const title = await session.page.title();

    return {
      success: true,
      url,
      title,
    };
  }

  /**
   * 點擊元素
   */
  async click(sessionId: string, selector: string): Promise<ClickResult> {
    const session = this.getSession(sessionId);

    try {
      console.log(`[WebUse] Clicking: ${selector}`);
      await session.page.waitForSelector(selector, { timeout: 5000 });
      await session.page.click(selector);

      return {
        success: true,
        selector,
        message: `成功點擊元素: ${selector}`,
      };
    } catch (error) {
      return {
        success: false,
        selector,
        message: `無法點擊元素: ${selector}`,
      };
    }
  }

  /**
   * 輸入文字
   */
  async type(
    sessionId: string,
    selector: string,
    text: string,
    options?: { delay?: number; clearFirst?: boolean }
  ): Promise<TypeResult> {
    const session = this.getSession(sessionId);

    try {
      console.log(`[WebUse] Typing into: ${selector}`);
      await session.page.waitForSelector(selector, { timeout: 5000 });

      if (options?.clearFirst) {
        await session.page.click(selector, { clickCount: 3 });
        await session.page.keyboard.press('Backspace');
      }

      await session.page.type(selector, text, { delay: options?.delay || 50 });

      return {
        success: true,
        selector,
        text,
        message: `成功輸入文字到: ${selector}`,
      };
    } catch (error) {
      return {
        success: false,
        selector,
        text,
        message: `無法輸入文字到: ${selector}`,
      };
    }
  }

  /**
   * 擷取螢幕截圖
   */
  async screenshot(
    sessionId: string,
    options?: { fullPage?: boolean; selector?: string }
  ): Promise<ScreenshotResult> {
    const session = this.getSession(sessionId);

    try {
      let buffer: Buffer;

      if (options?.selector) {
        const element = await session.page.$(options.selector);
        if (!element) {
          return {
            success: false,
            message: `找不到元素: ${options.selector}`,
          };
        }
        buffer = await element.screenshot() as Buffer;
      } else {
        buffer = await session.page.screenshot({
          fullPage: options?.fullPage || false,
        }) as Buffer;
      }

      return {
        success: true,
        base64: buffer.toString('base64'),
        message: '成功擷取螢幕截圖',
      };
    } catch (error) {
      return {
        success: false,
        message: '無法擷取螢幕截圖',
      };
    }
  }

  /**
   * 提取頁面資料
   */
  async extract(
    sessionId: string,
    selectors: Record<string, string>
  ): Promise<ExtractResult> {
    const session = this.getSession(sessionId);

    try {
      const data: Record<string, unknown> = {};

      for (const [key, selector] of Object.entries(selectors)) {
        const elements = await session.page.$$(selector);

        if (elements.length === 0) {
          data[key] = null;
        } else if (elements.length === 1) {
          data[key] = await session.page.$eval(selector, el => el.textContent?.trim());
        } else {
          data[key] = await session.page.$$eval(selector, els =>
            els.map(el => el.textContent?.trim())
          );
        }
      }

      return {
        success: true,
        data,
        message: '成功提取資料',
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        message: '無法提取資料',
      };
    }
  }

  /**
   * 等待元素出現
   */
  async waitFor(
    sessionId: string,
    selector: string,
    timeout: number = 10000
  ): Promise<{ success: boolean; message: string }> {
    const session = this.getSession(sessionId);

    try {
      await session.page.waitForSelector(selector, { timeout });
      return {
        success: true,
        message: `元素已出現: ${selector}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `等待元素超時: ${selector}`,
      };
    }
  }

  /**
   * 執行 JavaScript
   */
  async evaluate<T>(
    sessionId: string,
    script: string
  ): Promise<{ success: boolean; result?: T; message: string }> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.page.evaluate(script) as T;
      return {
        success: true,
        result,
        message: '成功執行腳本',
      };
    } catch (error) {
      return {
        success: false,
        message: `執行腳本失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 獲取頁面 HTML
   */
  async getHtml(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    return await session.page.content();
  }

  /**
   * 獲取當前 URL
   */
  async getCurrentUrl(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    return session.page.url();
  }

  /**
   * 關閉會話
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      this.sessions.delete(sessionId);
      console.log(`[WebUse] Closed session: ${sessionId}`);
    }
  }

  /**
   * 關閉所有會話
   */
  async closeAllSessions(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.closeSession(sessionId);
    }
  }

  /**
   * 清理過期會話
   */
  async cleanupExpiredSessions(maxAgeMs: number = 30 * 60 * 1000): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      const age = now.getTime() - session.lastAccessedAt.getTime();
      if (age > maxAgeMs) {
        await this.closeSession(sessionId);
      }
    }
  }
}

// 全局 Controller 實例
let globalController: WebUseController | null = null;

export function getWebUseController(): WebUseController {
  if (!globalController) {
    globalController = new WebUseController();
  }
  return globalController;
}

/**
 * Web Use Tool
 * Handles web interactions (analyze, click, scroll, highlight)
 * Communicates with widget via callback
 */

import { ToolResult, PageState } from '../config/types';

interface WebUseParams {
  action: 'click' | 'scroll' | 'highlight' | 'drag' | 'doubleClick' | 'scrollToElement' | 'deepCrawl' | 'navigate';
  selector?: string;
  direction?: 'up' | 'down' | 'top' | 'bottom';
  distance?: number;
  // For drag action
  targetSelector?: string;
  // For deepCrawl action
  maxDepth?: number;
  urlFilter?: string;
  // For navigate action
  url?: string;
}

type WidgetCallback = (action: string, params: any) => Promise<any>;

export class WebUseTool {
  constructor(private widgetCallback: WidgetCallback) {}

  /**
   * Execute web use action
   */
  async execute(params: WebUseParams): Promise<ToolResult> {
    try {
      const { action } = params;

      switch (action) {
        case 'click':
          if (!params.selector) {
            return {
              success: false,
              error: 'selector is required for click action',
            };
          }
          return await this.click(params.selector);

        case 'scroll':
          return await this.scroll(params.direction, params.distance);

        case 'highlight':
          if (!params.selector) {
            return {
              success: false,
              error: 'selector is required for highlight action',
            };
          }
          return await this.highlight(params.selector);

        case 'drag':
          if (!params.selector || !params.targetSelector) {
            return {
              success: false,
              error: 'selector and targetSelector are required for drag action',
            };
          }
          return await this.drag(params.selector, params.targetSelector);

        case 'doubleClick':
          if (!params.selector) {
            return {
              success: false,
              error: 'selector is required for doubleClick action',
            };
          }
          return await this.doubleClick(params.selector);

        case 'scrollToElement':
          if (!params.selector) {
            return {
              success: false,
              error: 'selector is required for scrollToElement action',
            };
          }
          return await this.scrollToElement(params.selector);

        case 'deepCrawl': {
          // Enforce max depth limit of 3
          const maxDepth = Math.min(params.maxDepth || 2, 3);
          return await this.deepCrawl(maxDepth, params.urlFilter);
        }

        case 'navigate':
          if (!params.url) {
            return {
              success: false,
              error: 'url is required for navigate action',
            };
          }
          return await this.navigate(params.url);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('Web use tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Click on element
   */
  private async click(selector: string): Promise<ToolResult> {
    console.log('[WebUseTool] click - calling widgetCallback with selector:', selector);
    const result = await this.widgetCallback('click', { selector });
    console.log('[WebUseTool] click - widgetCallback result:', result);

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Clicked on element: ${selector}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to click element',
    };
  }

  /**
   * Scroll page
   */
  private async scroll(
    direction?: 'up' | 'down' | 'top' | 'bottom',
    distance?: number
  ): Promise<ToolResult> {
    const result = await this.widgetCallback('scroll', {
      direction: direction || 'down',
      distance: distance || 300,
    });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Scrolled ${direction || 'down'}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to scroll',
    };
  }

  /**
   * Highlight element
   */
  private async highlight(selector: string): Promise<ToolResult> {
    const result = await this.widgetCallback('highlight', {
      selector,
      duration: 2000,
    });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Highlighted element: ${selector}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to highlight element',
    };
  }

  /**
   * Drag element to target
   */
  private async drag(selector: string, targetSelector: string): Promise<ToolResult> {
    const result = await this.widgetCallback('drag', {
      selector,
      targetSelector,
    });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Dragged element ${selector} to ${targetSelector}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to drag element',
    };
  }

  /**
   * Double click on element
   */
  private async doubleClick(selector: string): Promise<ToolResult> {
    const result = await this.widgetCallback('doubleClick', { selector });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Double-clicked on element: ${selector}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to double-click element',
    };
  }

  /**
   * Scroll to specific element
   */
  private async scrollToElement(selector: string): Promise<ToolResult> {
    const result = await this.widgetCallback('scrollToElement', { selector });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Scrolled to element: ${selector}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to scroll to element',
    };
  }

  /**
   * Deep crawl current page and subpages
   * Goes 2 levels deep, extracts links, crawls them, and summarizes with LLM
   */
  private async deepCrawl(maxDepth: number = 2, urlFilter?: string): Promise<ToolResult> {
    const result = await this.widgetCallback('deepCrawl', {
      maxDepth,
      urlFilter,
    });

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Deep crawl completed. Found ${result.pagesCount} pages.`,
          summary: result.summary, // LLM summary to avoid token overflow
          pages: result.pages, // Basic info (url, title, description)
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to perform deep crawl',
    };
  }

  /**
   * Navigate to a URL
   */
  private async navigate(url: string): Promise<ToolResult> {
    console.log('[WebUseTool] navigate - calling widgetCallback with url:', url);
    const result = await this.widgetCallback('navigate', { url });
    console.log('[WebUseTool] navigate - widgetCallback result:', result);

    if (result?.success) {
      return {
        success: true,
        result: {
          message: `Navigated to: ${url}`,
        },
      };
    }

    return {
      success: false,
      error: result?.error || 'Failed to navigate to URL',
    };
  }
}

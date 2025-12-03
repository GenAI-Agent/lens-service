"use strict";
/**
 * Web Use Tool
 * Handles web interactions (analyze, click, scroll, highlight)
 * Communicates with widget via callback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebUseTool = void 0;
class WebUseTool {
    constructor(widgetCallback) {
        this.widgetCallback = widgetCallback;
    }
    /**
     * Execute web use action
     */
    async execute(params) {
        try {
            const { action } = params;
            switch (action) {
                case 'analyze':
                    return await this.analyze();
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
                case 'deepCrawl':
                    return await this.deepCrawl(params.maxDepth || 2, params.urlFilter);
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    };
            }
        }
        catch (error) {
            console.error('Web use tool error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Analyze current page (DOM to markdown + screenshot)
     */
    async analyze() {
        const result = await this.widgetCallback('analyze', {});
        if (!result) {
            return {
                success: false,
                error: 'Failed to analyze page',
            };
        }
        return {
            success: true,
            result: {
                message: 'Page analyzed successfully',
                pageState: result,
            },
        };
    }
    /**
     * Click on element
     */
    async click(selector) {
        const result = await this.widgetCallback('click', { selector });
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
    async scroll(direction, distance) {
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
    async highlight(selector) {
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
    async drag(selector, targetSelector) {
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
    async doubleClick(selector) {
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
    async scrollToElement(selector) {
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
    async deepCrawl(maxDepth = 2, urlFilter) {
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
}
exports.WebUseTool = WebUseTool;

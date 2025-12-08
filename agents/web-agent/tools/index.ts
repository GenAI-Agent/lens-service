/**
 * Web Agent Tools Index
 * Exports all tools and creates tool array
 */

export { createClickTool } from './click';
export { createTypeTool } from './type';
export { createScrollTool } from './scroll';
export { createHighlightTool } from './highlight';
export { createExtractTool } from './extract';
export { createWaitTool } from './wait';
export { createScreenshotTool } from './screenshot';

/**
 * Create all web agent tools
 */
export function createWebAgentTools(widgetCallback: (action: string, params: any) => Promise<any>) {
  const { createClickTool } = require('./click');
  const { createTypeTool } = require('./type');
  const { createScrollTool } = require('./scroll');
  const { createHighlightTool } = require('./highlight');
  const { createExtractTool } = require('./extract');
  const { createWaitTool } = require('./wait');
  const { createScreenshotTool } = require('./screenshot');

  return [
    createClickTool(widgetCallback),
    createTypeTool(widgetCallback),
    createScrollTool(widgetCallback),
    createHighlightTool(widgetCallback),
    createExtractTool(widgetCallback),
    createWaitTool(),
    createScreenshotTool(widgetCallback),
  ];
}

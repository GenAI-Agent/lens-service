/**
 * Lens Service v3 - Tool Types
 */

import { z } from 'zod';

// ============================================================================
// Base Tool Types
// ============================================================================

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  category: ToolCategory;
  schema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}

export type ToolCategory =
  | 'rag'
  | 'sql'
  | 'page'
  | 'recommendation'
  | 'web'
  | 'notification'
  | 'utility';

export interface ToolExecutionContext {
  userId: string;
  sessionId: string;
  agentType: string;
  conversationHistory?: unknown[];
  additionalContext?: Record<string, unknown>;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

// ============================================================================
// RAG Tool Types
// ============================================================================

export interface SearchKnowledgeBaseInput {
  query: string;
  topK?: number;
  contentTypes?: string[];
  minScore?: number;
}

export interface SearchKnowledgeBaseOutput {
  results: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
    url?: string;
  }>;
  totalFound: number;
}

// ============================================================================
// SQL Tool Types
// ============================================================================

export interface ExecuteSQLInput {
  intent: string;
  tables: string[];
  conditions?: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
}

export interface ExecuteSQLOutput {
  success: boolean;
  data: Record<string, unknown>[];
  rowCount: number;
  query?: string;  // For debugging
}

export interface UpdateRecordInput {
  tableName: string;
  recordId: string;
  updates: Record<string, unknown>;
}

export interface UpdateRecordOutput {
  success: boolean;
  updatedRecord?: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// Page Generation Tool Types
// ============================================================================

export interface GeneratePageInput {
  title: string;
  blocks: PageBlock[];
  theme?: 'light' | 'dark' | 'colorful';
  metadata?: Record<string, unknown>;
}

export interface PageBlock {
  type: PageBlockType;
  props: Record<string, unknown>;
}

export type PageBlockType =
  | 'hero'
  | 'product-grid'
  | 'product-card'
  | 'testimonial'
  | 'cta'
  | 'text'
  | 'image'
  | 'video'
  | 'comparison-table'
  | 'faq'
  | 'footer';

export interface GeneratePageOutput {
  success: boolean;
  pageId: string;
  pageUrl: string;
  previewHtml?: string;
}

// ============================================================================
// Recommendation Tool Types
// ============================================================================

export interface SemanticSearchInput {
  query: string;
  limit?: number;
  filters?: {
    category?: string;
    priceRange?: { min?: number; max?: number };
    inStock?: boolean;
  };
}

export interface SemanticSearchOutput {
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    score: number;
  }>;
}

export interface FindSimilarItemsInput {
  productId: string;
  limit?: number;
  useCoRetrieval?: boolean;
}

export interface FindSimilarItemsOutput {
  similarProducts: Array<{
    id: string;
    name: string;
    similarity: number;
    reason?: string;
  }>;
}

export interface RecordFeedbackInput {
  queryContext: string;
  shownProducts: string[];
  clickedProducts: string[];
  purchasedProducts?: string[];
}

export interface RecordFeedbackOutput {
  success: boolean;
  message: string;
}

// ============================================================================
// Web Use Tool Types
// ============================================================================

export interface QueryElementsInput {
  selector: string;
  filterVisible?: boolean;
  filterInteractive?: boolean;
  maxResults?: number;
}

export interface ElementInfo {
  id: string;
  tagName: string;
  textContent: string;
  attributes: Record<string, string>;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  isInteractive: boolean;
}

export interface QueryElementsOutput {
  elements: ElementInfo[];
  count: number;
}

export interface ClickElementInput {
  target: string | { elementId: string };
  waitAfterClick?: number;
}

export interface ClickElementOutput {
  success: boolean;
  clickedElement?: ElementInfo;
  error?: string;
}

export interface InputTextInput {
  target: string | { elementId: string };
  text: string;
  clearFirst?: boolean;
}

export interface InputTextOutput {
  success: boolean;
  error?: string;
}

export interface GetPageSummaryInput {
  includeText?: boolean;
  maxElements?: number;
}

export interface PageSummary {
  url: string;
  title: string;
  interactiveElements: ElementInfo[];
  formFields: ElementInfo[];
  visibleText?: string;
}

// ============================================================================
// Notification Tool Types
// ============================================================================

export interface SendNotificationInput {
  channel: 'telegram' | 'email';
  notifyType: 'customer_service' | 'logistics' | 'error' | 'custom';
  message: string;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface SendNotificationOutput {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Scraper Tool Types
// ============================================================================

export interface ScrapeUrlInput {
  url: string;
  format?: 'article' | 'full' | 'summary';
  timeout?: number;
}

export interface ScrapeUrlOutput {
  success: boolean;
  title: string;
  content: string;
  url: string;
  metadata?: {
    description?: string;
    author?: string;
    publishedDate?: string;
  };
  error?: string;
}

// ============================================================================
// Browser Use Toolkit Types (V2 Architecture)
// ============================================================================

/**
 * Element Locator for Smart Selector
 * Supports multiple location strategies with fallback
 */
export interface ElementLocator {
  id?: string;
  xpath?: string;
  cssSelector?: string;
  textContent?: string;
  ariaLabel?: string;
  position?: { x: number; y: number };
}

/**
 * Action Result from Browser Use atomic operations
 */
export interface BrowserActionResult {
  success: boolean;
  element?: {
    tag: string;
    text?: string;
  };
  error?: string;
  metadata?: {
    executionTime: number;
    screenshot?: string;
  };
}

/**
 * Page Analysis Result from Web Analysis Tool (Crawl4AI style)
 */
export interface PageAnalysis {
  url: string;
  title: string;
  markdownContent: string;
  actionableElements: ActionableElement[];
  navigationPaths: NavigationPath[];
  cachedAt: Date;
}

export interface ActionableElement {
  id: string;
  type: 'button' | 'link' | 'input' | 'select' | 'other';
  description: string;
  locator: ElementLocator;
  action: string; // e.g., "點擊此按鈕可進入訂單頁面"
}

export interface NavigationPath {
  goal: string;         // e.g., "查詢訂單"
  steps: string[];      // e.g., ["點擊「我的帳戶」", "點擊「訂單記錄」"]
  confidence: number;   // 0-1
}

// Atomic Browser Actions Input/Output Types

export interface BrowserClickInput {
  locator: ElementLocator;
  waitAfter?: number;
}

export interface BrowserTypeInput {
  locator: ElementLocator;
  text: string;
  clearFirst?: boolean;
}

export interface BrowserSelectInput {
  locator: ElementLocator;
  option: string;
}

export interface BrowserScrollInput {
  direction: 'up' | 'down';
  amount?: number;
}

export interface BrowserNavigateInput {
  url: string;
}

export interface BrowserWaitInput {
  locator: ElementLocator;
  timeout?: number;
}

export interface BrowserExtractTextInput {
  locator: ElementLocator;
}

export interface BrowserExtractAttributeInput {
  locator: ElementLocator;
  attribute: string;
}

export interface BrowserScreenshotInput {
  locator?: ElementLocator;
}

// ============================================================================
// Search Tool Types (with Internal LLM Processing)
// ============================================================================

export interface RawSearchResult {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  score?: number;
}

export interface HybridSearchOptions {
  query: string;
  tableName: string;
  limit?: number;
  weights?: {
    bm25: number;
    contentVector: number;
  };
}

export interface KnowledgeSearchInput {
  query: string;
}

export interface KnowledgeSearchOutput {
  summary: string;  // LLM-processed summary, not raw data
  sources?: string[];  // Optional source references
}

/**
 * Lens Service v3 - Skill Types
 */

import type { AgentType } from './agent';

// ============================================================================
// Skill Definition Types
// ============================================================================

export interface SkillDefinition {
  id: string;
  name: string;                      // /skill_name trigger
  displayName: string;
  description: string;

  // Prompt Configuration
  persona: string;
  systemPrompt: string;
  outputFormat: string;

  // LLM Configuration Override
  temperature: number;
  maxTokens: number;

  // Allowed Agents and Tools (scope restriction)
  allowedAgents: AgentType[];
  allowedTools: string[];

  // Pre-execution Actions
  preActions: PreAction[];

  // Post-execution Actions
  postActions: PostAction[];

  // State
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Pre-Action Types
// ============================================================================

export type PreActionType = 'scrape_urls' | 'search_database' | 'call_api' | 'load_context';

export interface PreAction {
  type: PreActionType;
  config: PreActionConfig;
}

export interface ScrapeUrlsConfig {
  urls: string[];
  format: 'article' | 'full' | 'summary';
  timeout?: number;
  maxContentLength?: number;
}

export interface SearchDatabaseConfig {
  table: string;
  query: string;
  limit: number;
  filters?: Record<string, unknown>;
}

export interface CallApiConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface LoadContextConfig {
  contextType: 'user_history' | 'recent_orders' | 'preferences';
  limit?: number;
}

export type PreActionConfig =
  | ScrapeUrlsConfig
  | SearchDatabaseConfig
  | CallApiConfig
  | LoadContextConfig;

// ============================================================================
// Post-Action Types
// ============================================================================

export type PostActionType = 'auto_generate_page' | 'send_notification' | 'save_to_database' | 'trigger_webhook';

export interface PostAction {
  type: PostActionType;
  config: PostActionConfig;
  condition?: PostActionCondition;
}

export interface AutoGeneratePageConfig {
  trigger: string;
  template: 'product-grid' | 'article' | 'comparison' | 'custom';
  dataSource: string;
}

export interface SendNotificationConfig {
  channel: 'telegram' | 'email' | 'webhook';
  template: string;
  recipients?: string[];
}

export interface SaveToDatabaseConfig {
  table: string;
  dataMapping: Record<string, string>;
}

export interface TriggerWebhookConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  payloadTemplate: string;
}

export type PostActionConfig =
  | AutoGeneratePageConfig
  | SendNotificationConfig
  | SaveToDatabaseConfig
  | TriggerWebhookConfig;

export interface PostActionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'exists' | 'greater_than' | 'less_than';
  value: unknown;
}

// ============================================================================
// Skill Execution Types
// ============================================================================

export interface SkillExecutionContext {
  skill: SkillDefinition;
  userMessage: string;
  userId: string;
  sessionId: string;
  preActionResults: PreActionResult[];
}

export interface PreActionResult {
  actionType: PreActionType;
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export interface SkillExecutionResult {
  success: boolean;
  message: string;
  skillId: string;
  preActionResults: PreActionResult[];
  postActionResults: PostActionResult[];
  agentOutput?: unknown;
  durationMs: number;
}

export interface PostActionResult {
  actionType: PostActionType;
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================================================
// Skill Registry Types
// ============================================================================

export interface SkillRegistryEntry {
  skill: SkillDefinition;
  loadedAt: Date;
  usageCount: number;
  lastUsedAt?: Date;
}

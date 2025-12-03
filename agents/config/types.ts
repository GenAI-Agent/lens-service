/**
 * Core type definitions for Lens Service v3 Agent
 */

export interface PageState {
  url: string;
  title: string;
  markdown: string;
  screenshot: string; // base64 data URL
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

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  currentUrl: string;
  currentPage: PageState | null;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface StreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: string;
}

export interface Skill {
  name: string;
  prompt: string;
}

export interface CompactedMemory {
  summary: string;
  fromId: number;
  toId: number;
  messageCount: number;
}

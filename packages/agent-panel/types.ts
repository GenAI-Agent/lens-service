/**
 * Type definitions for Agent Panel
 */

export interface ToolCall {
  name: string;
  parameters: any;
}

export interface ToolResult {
  toolCall: ToolCall;
  result: any;
  status?: 'pending' | 'completed';
}

export type PanelMode = 'agent' | 'human-support';

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  lastMessage: string;
  messageCount: number;
}

export interface AgentPanelConfig {
  apiUrl: string;
  userId: string;
  onClose?: () => void;
}

export interface Message {
  role: string;
  content: string;
  tools?: ToolResult[];
}

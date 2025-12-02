/**
 * Memory and Session types
 */

export interface SessionMemory {
  sessionId: string;
  tenantId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  context?: Record<string, unknown>;
  activePlan?: unknown;
  isTemp: boolean;
  tokenUsage: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface AgentExecutionState {
  id: string;
  sessionId: string;
  taskId: string;
  supervisorState: unknown; // SupervisorState serialized
  isActive: boolean;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageAnalysisCache {
  id: string;
  tenantId: string;
  url: string;
  title?: string;
  markdownContent?: string;
  actionableElements?: unknown;
  navigationPaths?: unknown;
  cachedAt: Date;
  expiresAt?: Date;
}

/**
 * Lens Service v3 - Agent Types
 */

// ============================================================================
// Agent Base Types
// ============================================================================

export type AgentType =
  | 'supervisor'
  | 'customerService'
  | 'order'
  | 'pageGenerator'
  | 'recommender'
  | 'webUse';

export interface AgentInput {
  message: string;
  userId: string;
  sessionId: string;
  context?: Record<string, unknown>;
  conversationHistory?: Message[];
}

export interface AgentOutput {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  sources?: RetrievalSource[];
  toolsUsed?: string[];
  pageId?: string;
  needsHumanReply?: boolean;
  error?: string;
}

// ============================================================================
// Supervisor State Types
// ============================================================================

export interface SupervisorState {
  // Input
  userMessage: string;
  userId: string;
  sessionId: string;

  // Execution State
  currentStep: number;
  maxSteps: number;
  detectedSkill: string | null;

  // Agent/Tool Call Records
  agentCalls: AgentCallRecord[];
  toolCalls: ToolCallRecord[];

  // Collected Data
  collectedData: Record<string, unknown>;

  // Decision State
  canAnswer: boolean;
  needsMoreInfo: boolean;
  nextAgents: AgentType[];
  nextTools: string[];

  // Output
  finalResponse: string | null;
}

export interface AgentCallRecord {
  agentName: AgentType | `skill:${string}`;
  input: unknown;
  output: AgentOutput;
  success: boolean;
  timestamp: number;
  durationMs: number;
}

export interface ToolCallRecord {
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  timestamp: number;
  durationMs: number;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolMessage extends Message {
  role: 'tool';
  toolName: string;
  toolCallId: string;
  result: unknown;
}

// ============================================================================
// Intent Analysis Types
// ============================================================================

export interface IntentAnalysisResult {
  primaryIntent: string;
  confidence: number;
  suggestedAgents: AgentType[];
  entities: ExtractedEntity[];
  requiresAuth: boolean;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

// ============================================================================
// Task Planning Types
// ============================================================================

export interface TaskPlan {
  agents: AgentType[];
  tools: string[];
  reasoning: string;
  parallelizable: boolean;
}

// ============================================================================
// Evaluation Types
// ============================================================================

export interface EvaluationResult {
  canAnswer: boolean;
  needsMoreInfo: boolean;
  suggestedAgents: AgentType[];
  suggestedTools: string[];
  reasoning: string;
  confidence: number;
}

// ============================================================================
// Retrieval Source Types
// ============================================================================

export interface RetrievalSource {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  sourceType: 'knowledge_base' | 'product' | 'ai_page' | 'web';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Supervisor Response Types
// ============================================================================

export interface SupervisorResponse {
  success: boolean;
  message: string;
  skillUsed?: string;
  agentsInvoked: AgentCallRecord[];
  toolsUsed: string[];
  sources?: RetrievalSource[];
  pageGenerated?: {
    pageId: string;
    pageUrl: string;
  };
  metadata: {
    sessionId: string;
    userId: string;
    totalSteps: number;
    totalDurationMs: number;
    executionLog: ExecutionLogEntry[];
  };
}

export interface ExecutionLogEntry {
  step: number;
  type: 'intent_analysis' | 'skill_detection' | 'task_planning' | 'agent_call' | 'tool_call' | 'evaluation' | 'response_generation';
  description: string;
  timestamp: number;
  data?: unknown;
}

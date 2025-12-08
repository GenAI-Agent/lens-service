/**
 * Web Agent State Definition
 * LangChain State for Web Agent Sub-Agent
 */

import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

/**
 * Page state captured from current page
 */
export interface PageState {
  url: string;
  title: string;
  markdown: string;
  screenshot: string;
  actionableElements: Array<{
    id: string;
    type: 'button' | 'input' | 'link' | 'select' | 'textarea';
    selector: string;
    text?: string;
    placeholder?: string;
    description: string;
  }>;
  timestamp: Date;
}

/**
 * Operation history entry
 */
export interface OperationRecord {
  operation: string;
  params: any;
  result: any;
  timestamp: Date;
}

/**
 * Web Agent State Annotation
 * Using LangChain's Annotation.Root for state management
 */
export const WebAgentState = Annotation.Root({
  /**
   * Current task description
   */
  task: Annotation<string>,

  /**
   * Message history (for LangChain agent)
   */
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  /**
   * Operation history (accumulate all operations)
   */
  operationHistory: Annotation<OperationRecord[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  /**
   * Current page state
   */
  pageState: Annotation<PageState | null>({
    value: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /**
   * Completed steps (for tracking progress)
   */
  completedSteps: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  /**
   * Errors encountered
   */
  errors: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  /**
   * Final result (set when task is complete)
   */
  result: Annotation<{
    success: boolean;
    message: string;
    data?: any;
  } | null>({
    value: (prev, next) => next ?? prev,
    default: () => null,
  }),
});

/**
 * Type of the state (for TypeScript)
 */
export type WebAgentStateType = typeof WebAgentState.State;

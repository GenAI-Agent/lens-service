/**
 * Trace Logger
 * Logs all LLM calls to database for debugging and monitoring
 */

import { PrismaClient } from '@prisma/client';
import { Message } from '../config/types';

const prisma = new PrismaClient();

export interface LLMTraceInput {
  sessionId?: string;
  userId?: string;
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMTraceOutput {
  response?: any; // Full OpenAI API response
  completion?: string;
  toolCalls?: any[];
  inputTokens?: number; // From response.usage.prompt_tokens
  outputTokens?: number; // From response.usage.completion_tokens
  totalTokens?: number; // From response.usage.total_tokens
  error?: string;
  status: 'success' | 'error' | 'timeout';
}

export class TraceLogger {
  /**
   * Create a new trace entry
   * Returns the trace ID for later updating
   */
  async createTrace(input: LLMTraceInput): Promise<string> {
    const trace = await prisma.lLMTrace.create({
      data: {
        sessionId: input.sessionId || 'unknown',
        userId: input.userId || 'unknown',
        input: input.messages as any,
        output: '', // Will be updated later
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      },
    });

    return trace.id;
  }

  /**
   * Update trace with output
   */
  async updateTrace(traceId: string, output: LLMTraceOutput): Promise<void> {
    // Calculate cost from token usage
    const cost =
      output.inputTokens && output.outputTokens
        ? this.estimateCost(output.inputTokens, output.outputTokens)
        : null;

    await prisma.lLMTrace.update({
      where: { id: traceId },
      data: {
        output: output.completion || JSON.stringify(output.response) || '',
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
        totalTokens: output.totalTokens,
        cost,
        status: output.status,
        error: output.error,
      },
    });
  }

  /**
   * Estimate cost based on token usage
   * OpenAI GPT-5.1 pricing (as of 2024)
   */
  private estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4 pricing: $0.01 per 1K input tokens, $0.03 per 1K output tokens
    const INPUT_COST_PER_1K = 0.01;
    const OUTPUT_COST_PER_1K = 0.03;

    const inputCost = (inputTokens / 1_000) * INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1_000) * OUTPUT_COST_PER_1K;

    return inputCost + outputCost;
  }

  /**
   * Get all traces with filters
   */
  async getTraces(filters?: {
    sessionId?: string;
    userId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.sessionId) where.sessionId = filters.sessionId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return prisma.lLMTrace.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });
  }

  /**
   * Get a single trace by ID
   */
  async getTrace(traceId: string) {
    return prisma.lLMTrace.findUnique({
      where: { id: traceId },
    });
  }

  /**
   * Get trace statistics
   */
  async getStats(filters?: { dateFrom?: Date; dateTo?: Date }) {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const totalTraces = await prisma.lLMTrace.count({ where });
    const successCount = await prisma.lLMTrace.count({
      where: { ...where, status: 'success' },
    });
    const errorCount = await prisma.lLMTrace.count({
      where: { ...where, status: 'error' },
    });

    // Calculate total cost
    const costAgg = await prisma.lLMTrace.aggregate({
      where,
      _sum: {
        cost: true,
        totalTokens: true,
      },
    });

    const successRate = totalTraces > 0 ? (successCount / totalTraces) * 100 : 0;
    const totalCost = costAgg._sum.cost || 0;
    const totalTokens = costAgg._sum.totalTokens || 0;

    return {
      totalTraces,
      successCount,
      errorCount,
      successRate,
      totalCost,
      totalTokens,
    };
  }
}

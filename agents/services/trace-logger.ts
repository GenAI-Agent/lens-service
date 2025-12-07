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
}

export interface LLMTraceOutput {
  completion?: string;
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
      },
    });

    return trace.id;
  }

  /**
   * Update trace with output
   */
  async updateTrace(traceId: string, output: LLMTraceOutput): Promise<void> {
    await prisma.lLMTrace.update({
      where: { id: traceId },
      data: {
        output: output.completion || '',
        status: output.status,
        error: output.error,
      },
    });
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

    const successRate = totalTraces > 0 ? (successCount / totalTraces) * 100 : 0;

    return {
      totalTraces,
      successCount,
      errorCount,
      successRate,
    };
  }

  /**
   * Delete a trace by ID
   */
  async deleteTrace(traceId: string): Promise<void> {
    await prisma.lLMTrace.delete({
      where: { id: traceId },
    });
  }
}

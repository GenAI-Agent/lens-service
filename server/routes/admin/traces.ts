/**
 * Admin Routes - LLM Traces
 * View and analyze LLM call logs
 */

import { Router, Request, Response } from 'express';
import { TraceLogger } from '../../../agents/services/trace-logger';

const router = Router();
const traceLogger = new TraceLogger();

/**
 * GET /api/admin/traces
 * Get all traces with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, status, dateFrom, dateTo, limit, offset } = req.query;

    const traces = await traceLogger.getTraces({
      sessionId: sessionId as string | undefined,
      userId: userId as string | undefined,
      status: status as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(traces);
  } catch (error) {
    console.error('Get traces error:', error);
    res.status(500).json({ error: 'Failed to get traces' });
  }
});

/**
 * GET /api/admin/traces/stats
 * Get trace statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await traceLogger.getStats({
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json(stats);
  } catch (error) {
    console.error('Get trace stats error:', error);
    res.status(500).json({ error: 'Failed to get trace stats' });
  }
});

/**
 * GET /api/admin/traces/:id
 * Get a single trace by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trace = await traceLogger.getTrace(id);

    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }

    res.json(trace);
  } catch (error) {
    console.error('Get trace error:', error);
    res.status(500).json({ error: 'Failed to get trace' });
  }
});

export default router;

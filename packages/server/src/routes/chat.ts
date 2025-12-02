/**
 * Lens Service v3 - Chat Routes
 *
 * API routes for chat/conversation endpoints.
 */

import { Router, type Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { SupervisorAgent } from '@lens-service/core';
import { generateId } from '@lens-service/shared';

export interface ChatRouterDependencies {
  supervisorAgent: SupervisorAgent;
}

export function createChatRouter(deps: ChatRouterDependencies) {
  const router = Router();
  const { supervisorAgent } = deps;

  /**
   * POST /chat
   * Send a message and get a response
   */
  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const userId = req.userId || 'anonymous';
    const sessionId = conversationId || req.sessionId || generateId('session');

    try {
      console.log(`[Chat] Processing message from user ${userId}`);
      console.log(`[Chat] Message: ${message.substring(0, 100)}...`);

      const response = await supervisorAgent.processMessage(
        message,
        userId,
        sessionId
      );

      return res.json({
        success: response.success,
        message: response.message,
        conversationId: sessionId,
        metadata: {
          agentCallCount: response.metadata.agentCalls.length,
          steps: response.metadata.steps,
          durationMs: response.metadata.durationMs,
          pageId: response.metadata.pageId,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Chat] Error:', errorMsg);

      return res.status(500).json({
        success: false,
        error: 'Failed to process message',
      });
    }
  });

  /**
   * POST /chat/stream
   * Stream a response (Server-Sent Events)
   */
  router.post('/stream', async (req: AuthenticatedRequest, res: Response) => {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const userId = req.userId || 'anonymous';
    const sessionId = conversationId || req.sessionId || generateId('session');

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      // Send start event
      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: sessionId })}\n\n`);

      // Process message (TODO: implement actual streaming)
      const response = await supervisorAgent.processMessage(
        message,
        userId,
        sessionId
      );

      // Send response
      res.write(`data: ${JSON.stringify({
        type: 'message',
        content: response.message,
        metadata: {
          steps: response.metadata.steps,
          durationMs: response.metadata.durationMs,
          pageId: response.metadata.pageId,
        },
      })}\n\n`);

      // Send end event
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
      res.end();
    }
  });

  return router;
}

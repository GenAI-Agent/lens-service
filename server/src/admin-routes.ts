/**
 * Admin API Routes
 * CRUD operations for admin dashboard
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import tracesRouter from '../routes/admin/traces';
import { PuppeteerLoader } from './puppeteer-loader';

export function createAdminRouter(prisma: PrismaClient, openaiApiKey: string) {
  const router = Router();
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const puppeteerLoader = new PuppeteerLoader();

  // Site Prompts
  router.get('/site-prompts', async (req, res) => {
    const prompts = await prisma.sitePrompt.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(prompts);
  });

  router.get('/site-prompts/:id', async (req, res) => {
    const prompt = await prisma.sitePrompt.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    res.json(prompt);
  });

  router.post('/site-prompts', async (req, res) => {
    const prompt = await prisma.sitePrompt.create({ data: req.body });
    res.json(prompt);
  });

  router.put('/site-prompts/:id', async (req, res) => {
    const prompt = await prisma.sitePrompt.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(prompt);
  });

  router.delete('/site-prompts/:id', async (req, res) => {
    await prisma.sitePrompt.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  });

  // URL Prompts
  router.get('/url-prompts', async (req, res) => {
    const prompts = await prisma.urlPathPrompt.findMany({ orderBy: { priority: 'desc' } });
    res.json(prompts);
  });

  router.get('/url-prompts/:id', async (req, res) => {
    const prompt = await prisma.urlPathPrompt.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    res.json(prompt);
  });

  router.post('/url-prompts', async (req, res) => {
    const prompt = await prisma.urlPathPrompt.create({ data: req.body });
    res.json(prompt);
  });

  router.put('/url-prompts/:id', async (req, res) => {
    const prompt = await prisma.urlPathPrompt.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(prompt);
  });

  router.delete('/url-prompts/:id', async (req, res) => {
    await prisma.urlPathPrompt.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  });

  // Skills
  router.get('/skills', async (req, res) => {
    const skills = await prisma.skill.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(skills);
  });

  router.get('/skills/:id', async (req, res) => {
    const skill = await prisma.skill.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    res.json(skill);
  });

  router.post('/skills', async (req, res) => {
    const skill = await prisma.skill.create({ data: req.body });
    res.json(skill);
  });

  router.put('/skills/:id', async (req, res) => {
    const skill = await prisma.skill.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(skill);
  });

  router.delete('/skills/:id', async (req, res) => {
    await prisma.skill.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  });

  // Knowledge Base
  router.get('/knowledge-base', async (req, res) => {
    const items = await prisma.knowledgeBase.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  });

  router.get('/knowledge-base/:id', async (req, res) => {
    const item = await prisma.knowledgeBase.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    res.json(item);
  });

  router.post('/knowledge-base', async (req, res) => {
    // Generate embedding for description
    let embedding = null;
    if (req.body.description) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: req.body.description,
        });
        embedding = JSON.stringify(response.data[0].embedding);
      } catch (error) {
        console.error('Failed to generate embedding:', error);
      }
    }

    const item = await prisma.knowledgeBase.create({
      data: {
        ...req.body,
        embedding,
      },
    });
    res.json(item);
  });

  router.put('/knowledge-base/:id', async (req, res) => {
    // Regenerate embedding if description changed
    let embedding = undefined;
    if (req.body.description) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: req.body.description,
        });
        embedding = JSON.stringify(response.data[0].embedding);
      } catch (error) {
        console.error('Failed to generate embedding:', error);
      }
    }

    const item = await prisma.knowledgeBase.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        ...(embedding !== undefined && { embedding }),
      },
    });
    res.json(item);
  });

  router.delete('/knowledge-base/:id', async (req, res) => {
    await prisma.knowledgeBase.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  });

  // Sessions
  router.get('/sessions', async (req, res) => {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
    res.json(sessions);
  });

  router.get('/sessions/user/:userId', async (req, res) => {
    const sessions = await prisma.session.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
    res.json(sessions);
  });

  router.get('/sessions/:sessionId/messages', async (req, res) => {
    const messages = await prisma.message.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { timestamp: 'asc' },
    });
    res.json(messages);
  });

  router.post('/sessions/:sessionId/reply', async (req, res) => {
    const { content } = req.body;
    const message = await prisma.message.create({
      data: {
        sessionId: req.params.sessionId,
        role: 'assistant',
        content,
      },
    });
    res.json(message);
  });

  // LLM Traces
  router.use('/traces', tracesRouter);

  // Test Agent - Reset session (clear messages)
  router.post('/test-agent/reset-session', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      console.log('[Admin API] Resetting session for userId:', userId);

      // Delete all sessions and messages for this user
      await prisma.session.deleteMany({
        where: { userId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[Admin API] Failed to reset session:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to reset session',
      });
    }
  });

  // Test Agent - Load URL with Puppeteer
  router.post('/test-agent/load-url', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      console.log('[Admin API] Loading URL with Puppeteer:', url);

      // Load page with Puppeteer
      const pageState = await puppeteerLoader.loadPage(url, 30000);

      res.json(pageState);
    } catch (error) {
      console.error('[Admin API] Failed to load URL:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to load URL',
      });
    }
  });

  // Test Agent - Execute web action with Puppeteer
  router.post('/test-agent/web-action', async (req, res) => {
    try {
      const { action, params } = req.body;

      if (!action) {
        res.status(400).json({ error: 'Action is required' });
        return;
      }

      console.log('[Admin API] Executing web action:', action, params);

      // Execute web action with Puppeteer
      const result = await puppeteerLoader.executeWebAction(action, params || {});

      res.json(result);
    } catch (error) {
      console.error('[Admin API] Failed to execute web action:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute web action',
      });
    }
  });

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    await puppeteerLoader.close();
  });
  process.on('SIGTERM', async () => {
    await puppeteerLoader.close();
  });

  return router;
}

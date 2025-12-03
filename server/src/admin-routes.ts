/**
 * Admin API Routes
 * CRUD operations for admin dashboard
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

export function createAdminRouter(prisma: PrismaClient, openaiApiKey: string) {
  const router = Router();
  const openai = new OpenAI({ apiKey: openaiApiKey });

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

  return router;
}

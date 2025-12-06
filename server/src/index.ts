/**
 * Lens Service Server
 * Express server with SSE streaming and Supervisor Agent integration
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { SupervisorAgent } from '../../agents/supervisor-agent';
import { SessionContext, StreamEvent } from '../../agents/config/types';
import { createAdminRouter } from './admin-routes';
import { TelegramService } from './telegram-service';

// Load .env from root directory
// __dirname will be dist/server/src, so we need to go up 4 levels to reach root
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const app = express();
const prisma = new PrismaClient();
const telegramService = new TelegramService();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files for Widget (CDN endpoint)
// __dirname is dist/server/src, so go up to root: ../../../../
app.use('/widget', express.static(path.join(__dirname, '../../../../widget/dist')));

// Serve static files for Admin Dashboard
app.use('/admin', express.static(path.join(__dirname, '../../../../admin/dist')));

// Serve widget_icon.svg at root level
app.get('/widget_icon.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../packages/agent-panel/widget_icon.svg'));
});

// Serve logo-mark-dark.svg at root level
app.get('/logo-mark-dark.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../packages/agent-panel/logo-mark-dark.svg'));
});

// Serve flag SVG files
app.get('/flags/tw.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../packages/agent-panel/Flag_of_the_Republic_of_China.svg'));
});

app.get('/flags/us.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../packages/agent-panel/Flag_of_the_United_States.svg'));
});

// Admin API routes
app.use('/api/admin', createAdminRouter(prisma, process.env.OPENAI_API_KEY!));

interface ChatRequest {
  sessionId?: string;
  userId: string;
  message: string;
  currentUrl: string;
  currentPage?: any;
}

/**
 * POST /api/chat
 * Main chat endpoint with SSE streaming
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChatRequest;

    const { userId, message, currentUrl, currentPage } = body;

    if (!userId || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Get or create session
    const session = await getOrCreateSession(userId);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-Id', session.id);

    // Create context
    const context: SessionContext = {
      sessionId: session.id,
      userId,
      currentUrl,
      currentPage: currentPage || null,
    };

    // Widget callback for web use actions
    const widgetCallback = async (action: string, params: any) => {
      // For Test Agent (userId: test-admin-user), execute via Puppeteer
      if (userId === 'test-admin-user') {
        try {
          const response = await fetch(`http://localhost:${port}/api/admin/test-agent/web-action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, params }),
          });

          const result = await response.json();
          return result;
        } catch (error) {
          console.error('Failed to execute web action via Puppeteer:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to execute web action',
          };
        }
      }

      // For normal widget mode, send action request to widget via SSE
      sendSSE(res, {
        type: 'widget_action',
        action,
        params,
      });

      // In real implementation, wait for widget response
      // For now, return success
      return { success: true };
    };

    // Create agent
    const agent = new SupervisorAgent(
      prisma,
      {
        openaiApiKey: process.env.OPENAI_API_KEY!,
        model: process.env.LLM_MODEL || 'gpt-5.1',
      },
      widgetCallback
    );

    // Handle agent events
    agent.on('event', (event: StreamEvent) => {
      sendSSE(res, event);

      if (event.type === 'done' || event.type === 'error') {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    // Handle user abort
    req.on('close', () => {
      if (agent.isExecuting()) {
        agent.abort();
      }
    });

    // Execute agent
    await agent.execute(context, message);
  } catch (error) {
    console.error('Chat endpoint error:', error);

    sendSSE(res, {
      type: 'error',
      error: error instanceof Error ? error.message : 'Internal server error',
    } as StreamEvent);

    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * Helper: Send SSE message
 */
function sendSSE(res: Response, data: any): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Helper: Get or create session
 */
async function getOrCreateSession(userId: string) {
  let session = await prisma.session.findFirst({
    where: {
      userId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!session) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    session = await prisma.session.create({
      data: {
        userId,
        expiresAt,
        isActive: true,
      },
    });
  }

  return session;
}

/**
 * SPA fallback for Admin Dashboard
 * Serve index.html for all /admin/* routes that don't match static files
 */
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../admin/dist/index.html'));
});

/**
 * GET /api/sessions/:userId
 * Get all sessions for a user
 */
app.get('/api/sessions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      include: {
        messages: {
          take: 1,
          orderBy: {
            timestamp: 'asc',
          },
          where: {
            role: 'user',
          },
        },
      },
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastMessage: session.messages[0]?.content || 'New conversation',
      messageCount: 0, // Will be populated if needed
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/sessions/create
 * Create a new session for a user
 */
app.post('/api/sessions/create', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await prisma.session.create({
      data: {
        userId,
        expiresAt,
        isActive: true,
      },
    });

    res.json({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/sessions/:sessionId/messages
 * Get all messages for a session
 */
app.get('/api/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        sessionId,
        archived: false,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId/messages
 * Clear all messages for a session
 */
app.delete('/api/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Archive all messages in this session
    await prisma.message.updateMany({
      where: {
        sessionId,
        archived: false,
      },
      data: {
        archived: true,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Clear messages error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/human-support
 * Send message to human support via Telegram
 */
app.post('/api/human-support', async (req: Request, res: Response) => {
  try {
    const { userId, category, recipient, message, sessionId } = req.body;

    if (!userId || !category || !recipient || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
      return;
    }

    const result = await telegramService.sendHumanSupportMessage({
      userId,
      category,
      recipient,
      message,
      timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      sessionId,
    });

    res.json(result);
  } catch (error) {
    console.error('Human support endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/contact-form-fields
 * Get available form fields (public API)
 */
app.get('/api/contact-form-fields', async (req: Request, res: Response) => {
  try {
    const fields = await prisma.contactFormField.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(fields);
  } catch (error) {
    console.error('Get form fields error:', error);
    res.status(500).json({ error: 'Failed to get form fields' });
  }
});

/**
 * GET /api/contact-form-settings
 * Get form settings (public API)
 */
app.get('/api/contact-form-settings', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.contactFormSettings.findFirst({
      where: { tenantId: 'default', isActive: true },
    });
    res.json(settings);
  } catch (error) {
    console.error('Get form settings error:', error);
    res.status(500).json({ error: 'Failed to get form settings' });
  }
});

/**
 * POST /api/contact-submit
 * Submit contact form with attachments
 */
app.post('/api/contact-submit', async (req: Request, res: Response) => {
  try {
    const { formData, attachments } = req.body;

    if (!formData || !formData.userId) {
      res.status(400).json({ error: 'Missing required data' });
      return;
    }

    // Get settings for message template
    const settings = await prisma.contactFormSettings.findFirst({
      where: { tenantId: 'default', isActive: true },
    });

    if (!settings) {
      res.status(500).json({ error: 'Form settings not found' });
      return;
    }

    // Store submission
    const submission = await prisma.contactFormSubmission.create({
      data: {
        userId: formData.userId,
        sessionId: formData.sessionId || null,
        formData: formData,
        attachments: attachments || [],
        telegramSent: false,
      },
    });

    // Auto-generate message from all form data
    const messageLanguage = settings.messageLanguage || 'zh-TW';
    const fieldLabels: Record<string, Record<string, string>> = {
      name: { 'zh-TW': '姓名', 'en-US': 'Name' },
      email: { 'zh-TW': '電子郵件', 'en-US': 'Email' },
      phone: { 'zh-TW': '電話', 'en-US': 'Phone' },
      problemType: { 'zh-TW': '問題類型', 'en-US': 'Problem Type' },
      message: { 'zh-TW': '訊息內容', 'en-US': 'Message' },
    };

    let messageParts: string[] = [
      messageLanguage === 'zh-TW' ? '📋 新的客服表單提交' : '📋 New Contact Form Submission',
      '',
    ];

    // Add all form fields
    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'userId' && key !== 'sessionId' && value) {
        const label = fieldLabels[key]?.[messageLanguage] || key;
        messageParts.push(`${label}: ${value}`);
      }
    }

    // Add attachments info
    if (attachments && attachments.length > 0) {
      messageParts.push('');
      messageParts.push(messageLanguage === 'zh-TW' ? '📎 附件:' : '📎 Attachments:');
      attachments.forEach((att: any) => {
        messageParts.push(`  • ${att.name} (${(att.size / 1024).toFixed(1)}KB)`);
      });
    }

    const message = messageParts.join('\n');

    // Send to Telegram
    try {
      const telegramResult = await telegramService.sendHumanSupportMessage(
        {
          userId: formData.userId,
          category: formData.problemType || 'contact',
          recipient: formData.email || formData.name,
          message: message,
          timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          sessionId: formData.sessionId,
        },
        attachments // Pass attachments to Telegram service
      );

      // Update submission status
      await prisma.contactFormSubmission.update({
        where: { id: submission.id },
        data: {
          telegramSent: telegramResult.success,
          telegramError: telegramResult.success ? null : telegramResult.error,
        },
      });

      res.json({ success: true, submissionId: submission.id });
    } catch (telegramError) {
      console.error('Telegram send error:', telegramError);

      await prisma.contactFormSubmission.update({
        where: { id: submission.id },
        data: {
          telegramSent: false,
          telegramError: telegramError instanceof Error ? telegramError.message : 'Unknown error',
        },
      });

      // Still return success since we stored the submission
      res.json({
        success: true,
        submissionId: submission.id,
        warning: 'Form submitted but Telegram notification failed',
      });
    }
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to submit form',
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Start server
 */
app.listen(port, () => {
  console.log('\n🚀 Lens Service v3 Started!\n');
  console.log(`✅ Server: http://localhost:${port}`);
  console.log(`✅ Admin Dashboard: http://localhost:${port}/admin`);
  console.log(`✅ Widget CDN: http://localhost:${port}/widget/lens-widget.js`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Chat API: http://localhost:${port}/api/chat`);
  console.log('\n📝 Next steps:');
  console.log('1. Open Admin Dashboard to configure prompts and knowledge base');
  console.log('2. Embed widget in your website with the CDN URL above\n');
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

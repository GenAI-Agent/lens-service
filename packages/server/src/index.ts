/**
 * Lens Service v3 - Server
 *
 * Express server that exposes the Lens Service API.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import {
  LLMService,
  DatabaseService,
  EmbeddingService,
  SchemaRegistry,
  RetrievalPipeline,
  SupervisorAgent,
  CustomerServiceAgent,
  OrderAgent,
  PageGeneratorAgent,
  RecommenderAgent,
  SkillRegistry,
  SkillExecutor,
  createNotificationToolsFromEnv,
  DEFAULT_SCHEMAS,
} from '@lens-service/core';
import type { AgentType } from '@lens-service/shared';

import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { createChatRouter } from './routes/chat';
import { createPagesRouter } from './routes/pages';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting Lens Service v3...');

  // Initialize services
  console.log('📦 Initializing services...');

  const llmService = LLMService.fromEnv();
  const databaseService = DatabaseService.fromEnv();
  const embeddingService = EmbeddingService.fromEnv();

  // Initialize database
  await databaseService.initialize();
  console.log('✅ Database connected');

  // Initialize schema registry
  const schemaRegistry = new SchemaRegistry();
  DEFAULT_SCHEMAS.forEach(schema => schemaRegistry.registerTable(schema));
  console.log('✅ Schema registry initialized');

  // Initialize retrieval pipeline
  const retrievalPipeline = RetrievalPipeline.fromEnv(databaseService, embeddingService);
  await retrievalPipeline.initializeCoRetrievalTables();
  retrievalPipeline.startCoRetrievalUpdates();
  console.log('✅ Retrieval pipeline initialized');

  // Initialize skill registry
  const skillRegistry = new SkillRegistry({
    skillsPath: process.env.SKILLS_PATH,
    autoLoad: !!process.env.SKILLS_PATH,
  });
  console.log('✅ Skill registry initialized');

  // Initialize agents
  console.log('🤖 Initializing agents...');

  const agents = new Map<AgentType, any>();

  const customerServiceAgent = new CustomerServiceAgent({
    llmService,
    retrievalPipeline,
    knowledgeBaseTable: 'manual_indexes',
  });
  agents.set('customer_service', customerServiceAgent);

  const orderAgent = new OrderAgent({
    llmService,
    databaseService,
    schemaRegistry,
  });
  agents.set('order', orderAgent);

  const pageGeneratorAgent = new PageGeneratorAgent({
    llmService,
    databaseService,
    pageBaseUrl: process.env.PAGE_BASE_URL || '/api/pages',
  });
  agents.set('page_generator', pageGeneratorAgent);

  const recommenderAgent = new RecommenderAgent({
    llmService,
    retrievalPipeline,
    databaseService,
    productTable: 'products',
  });
  agents.set('recommender', recommenderAgent);

  console.log('✅ Agents initialized');

  // Initialize supervisor
  const supervisorAgent = new SupervisorAgent({
    llmService,
    agents,
    skills: new Map(skillRegistry.getAllSkills().map(s => [s.name, s])),
  });
  console.log('✅ Supervisor agent initialized');

  // Initialize skill executor
  const skillExecutor = new SkillExecutor({
    llmService,
    databaseService,
    agents,
  });
  console.log('✅ Skill executor initialized');

  // Create Express app
  const app = express();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for AI pages
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
    message: { success: false, error: 'Too many requests' },
  });
  app.use('/api/', limiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
    });
  });

  // API Routes
  const jwtSecret = process.env.JWT_SECRET || 'development-secret';

  // Chat routes (authenticated)
  app.use('/api/chat', authMiddleware(jwtSecret), createChatRouter({
    supervisorAgent,
  }));

  // Pages routes (optional auth)
  app.use('/api/pages', optionalAuthMiddleware(jwtSecret), createPagesRouter({
    databaseService,
  }));

  // Widget embed endpoint (no auth required)
  app.get('/widget.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
// Lens Service v3 Widget
(function() {
  const WIDGET_URL = '${process.env.WIDGET_URL || 'http://localhost:3001'}';

  window.LensWidget = {
    init: function(config) {
      const iframe = document.createElement('iframe');
      iframe.src = WIDGET_URL + '/widget?token=' + encodeURIComponent(config.token || '');
      iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:9999;';
      document.body.appendChild(iframe);
      return iframe;
    }
  };
})();
    `.trim());
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, () => {
    console.log(`
🎉 Lens Service v3 is running!

📍 Server: http://localhost:${port}
📍 Health: http://localhost:${port}/health
📍 API:    http://localhost:${port}/api

🤖 Registered Agents:
${Array.from(agents.keys()).map(t => `   - ${t}`).join('\n')}

📚 Registered Skills:
${skillRegistry.getSkillNames().map(n => `   - /${n}`).join('\n') || '   (none loaded)'}
    `);
  });
}

main().catch(console.error);

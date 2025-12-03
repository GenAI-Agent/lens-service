# Lens Service v3 - Complete Development Plan

**Version**: 3.0.0
**Last Updated**: 2025-12-02
**Status**: Implementation Phase

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Deployment Models](#deployment-models)
4. [Core Components](#core-components)
5. [Agentic Flow](#agentic-flow)
6. [Tools System](#tools-system)
7. [Memory Management](#memory-management)
8. [Admin Dashboard](#admin-dashboard)
9. [Integration Guide](#integration-guide)
10. [Development Roadmap](#development-roadmap)

---

## Project Overview

### What is Lens Service v3?

Lens Service v3 是一個**可嵌入式的 AI Customer Service Widget**,提供:

- 🤖 **Agentic AI** - Supervisor Agent 智能決策
- 🌐 **Web Use** - 直接操作網站 DOM (非 Playwright)
- 💾 **Memory Management** - 智能 Memory Compact
- 🎯 **Knowledge Search** - Customer Service QA 搜尋
- 📊 **Admin Dashboard** - 完整的後台管理與測試

### Key Features

✅ **一行引用即可使用** - 企業客戶只需一行 script
✅ **Widget-based** - 嵌入式,非獨立瀏覽器
✅ **Multi-modal** - 支援文字 + 截圖
✅ **Database Agnostic** - 使用客戶自己的 PostgreSQL
✅ **Self-hostable** - 完全可自架

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Customer's Website                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Lens Widget (Embedded)                              │ │
│  │  ┌──────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │   Chat UI    │  │   WebUseService (DOM API)           │ │ │
│  │  │              │  │   • html2canvas (screenshot)        │ │ │
│  │  │   User Input │  │   • turndown (HTML→Markdown)        │ │ │
│  │  │   Messages   │  │   • DOM manipulation                │ │ │
│  │  └──────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST /api/chat (SSE)
                           │ + userId (required!)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Server (packages/server)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Endpoint (唯一的 API!)                                 │ │
│  │  POST /api/chat                                             │ │
│  │  • Server-Sent Events (SSE)                                │ │
│  │  • Streaming Response                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Supervisor Agent (Decision Loop)                          │ │
│  │  ├─ Skill Parser                                           │ │
│  │  ├─ Decision Maker                                         │ │
│  │  └─ Tool Executor                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Context Engineer                                           │ │
│  │  ├─ StateManager (Session + User State)                    │ │
│  │  ├─ MemoryManager (DB-based, Memory Compact)              │ │
│  │  └─ PromptBuilder (System + Site + URL + Page + Messages) │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tools (Zod Validation)                                     │ │
│  │  ├─ knowledge_search (QA搜尋)                              │ │
│  │  ├─ web_analysis (頁面分析 + Screenshot)                   │ │
│  │  ├─ web_click (DOM點擊)                                    │ │
│  │  ├─ web_type (DOM輸入)                                     │ │
│  │  ├─ web_scroll (頁面滾動)                                  │ │
│  │  └─ web_highlight (視覺標註)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma Client
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Customer's PostgreSQL Database                           │
│  ┌────────────┬────────────┬────────────┬───────────────────┐  │
│  │  tenants   │  sessions  │  messages  │  site_prompts     │  │
│  │            │  + userId! │  (compact) │  url_path_prompts │  │
│  │            │            │            │  documents (QA)   │  │
│  └────────────┴────────────┴────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         Admin Dashboard (packages/admin)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Developer Test Mode (開發者測試)                          │  │
│  │  ┌─────────┬──────────────────────┬────────────────────┐ │  │
│  │  │ Prompt  │   iframe             │  Agent Panel       │ │  │
│  │  │ Inspector│  (Real Website)      │  (Chat + Stream)   │ │  │
│  │  └─────────┴──────────────────────┴────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Management UI (管理介面)                                  │  │
│  │  ├─ Prompts Management (Site + URL)                       │  │
│  │  └─ Knowledge Base (QA CRUD)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Models

### Model 1: Lens Service 自己的測試環境 (Development/Demo)

**用途**: 開發、測試、Demo

```
lens-service-v3/
├── Widget (前端 React)
├── Server (Express.js + Prisma)
├── Admin Dashboard (React + Vite)
└── PostgreSQL (Docker) ← 僅供測試!
```

**啟動方式**:
```bash
# 1. 啟動 PostgreSQL
docker-compose up -d

# 2. Database Migration
yarn prisma db push

# 3. 啟動 Dev Server
yarn dev
```

**訪問**:
- Widget: http://localhost:3001
- Server: http://localhost:3002
- Admin: http://localhost:5173

---

### Model 2: 企業客戶使用 (Production)

**用途**: 正式環境部署

#### 客戶需要準備:

1. **自己的 PostgreSQL Database**
2. **自己的 Server 環境** (Node.js >= 18)
3. **自己的網站** (嵌入 Widget)

#### 安裝步驟:

```bash
# Step 1: 安裝 Package
npm install @lens-service/widget @lens-service/server @lens-service/core

# Step 2: 配置環境變數
cp .env.example .env
```

**`.env` 配置**:
```env
# 客戶自己的 Database!
DATABASE_URL="postgresql://customer_user:password@customer_host:5432/customer_db"

# LLM API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Server Port
PORT=3002
```

```bash
# Step 3: Database Migration (在客戶的 DB 上執行)
npx prisma migrate deploy
```

**這會在客戶的 Database 創建**:
- `tenants` 表
- `sessions` 表 (含 `user_id`)
- `messages` 表
- `site_prompts` 表
- `url_path_prompts` 表
- `documents` 表 (Knowledge Base)
- `document_embeddings` 表

```bash
# Step 4: 啟動 Server
npm run start
```

#### 前端整合 (一行引用):

```html
<!-- 客戶網站的 HTML -->
<!DOCTYPE html>
<html>
<head>
  <title>Customer Website</title>
</head>
<body>
  <h1>Welcome to Our Site</h1>

  <!-- 引入 Lens Widget (一行!) -->
  <script src="https://cdn.example.com/lens-widget.umd.js"></script>
  <script>
    // 初始化 Widget
    LensWidget.init({
      apiUrl: 'http://localhost:3002',  // 客戶自己的 Server
      apiKey: 'customer-api-key-123',   // Tenant API Key
      userId: 'user-12345',              // 重要! 客戶的 User ID
      tenantId: 'tenant-uuid',           // Tenant UUID
    });
  </script>
</body>
</html>
```

#### Admin Dashboard 部署:

```bash
# 客戶可以選擇部署 Admin Dashboard
npm run build:admin

# 部署到任意路徑
https://customer-site.com/admin/lens-dashboard
```

---

## Core Components

### 1. Widget (packages/widget)

**技術棧**: React 18 + TypeScript + Vite

**核心文件**:
```
packages/widget/
├── src/
│   ├── Widget.tsx                 # 主組件
│   ├── web-use/
│   │   └── web-use-service.ts     # WebUseService (DOM 操作)
│   └── index.ts                   # Entry point
└── vite.config.ts                 # Library mode
```

**Widget 功能**:
- Chat UI (對話介面)
- Message Display (訊息顯示)
- SSE Streaming (串流接收)
- WebUseService 整合

**WebUseService (Widget 端)**:
```typescript
class WebUseService {
  // 分析當前頁面 (Screenshot + Markdown)
  async analyzePage(): Promise<PageAnalysis> {
    const screenshot = await this.takeScreenshot();  // html2canvas
    const markdown = await this.domToMarkdown();     // turndown
    return { url, title, markdown, screenshot, actionableElements };
  }

  // DOM 操作
  async click(locator: ElementLocator): Promise<void>
  async type(locator: ElementLocator, text: string): Promise<void>
  async scroll(target: 'up' | 'down' | ElementLocator): Promise<void>

  // 視覺回饋
  async highlight(locator: ElementLocator): Promise<void>
}
```

---

### 2. Server (packages/server)

**技術棧**: Express.js + Prisma + LangChain

**核心文件**:
```
packages/server/
├── src/
│   ├── index.ts                   # Express Server
│   ├── routes/
│   │   └── chat.ts                # POST /api/chat (SSE)
│   ├── supervisor/
│   │   └── agent.ts               # Supervisor Agent
│   ├── context-engineer/
│   │   ├── state-manager.ts       # State管理 (Session + User)
│   │   ├── memory-manager.ts      # Memory Compact
│   │   └── prompt-builder.ts      # Prompt組裝
│   └── tools/
│       ├── knowledge-search.ts    # QA搜尋
│       └── web-*.ts               # Web Use Tools
└── package.json
```

**唯一的 API Endpoint**:
```typescript
// POST /api/chat
interface ChatRequest {
  sessionId: string;
  userId: string;      // 重要! 客戶的 User ID
  tenantId: string;    // Tenant UUID
  message: string;
  currentUrl: string;  // 當前頁面 URL
  pageState?: {        // 可選: 當前頁面狀態
    screenshot: string;  // base64
    markdown: string;
  };
}

// Response: Server-Sent Events
// 格式:
data: {"type":"tool_call_start","tool":"web_analysis"}
data: {"type":"response_chunk","content":"正在"}
data: {"type":"response_complete","content":"完整回覆"}
data: [DONE]
```

---

### 3. Core (packages/core)

**核心邏輯層** - 被 Server 使用

**Context Engineer**:

#### 3.1 StateManager
```typescript
class StateManager {
  async getOrCreateSession(userId: string, tenantId: string): Promise<Session> {
    // 從 Prisma 查詢或創建 Session
    const session = await prisma.session.findFirst({
      where: { userId, tenantId, isActive: true }
    });

    if (!session) {
      return await prisma.session.create({
        data: {
          userId,        // 重要!
          tenantId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });
    }

    return session;
  }
}
```

#### 3.2 MemoryManager (DB-based Memory Compact)

**核心概念**: Messages 存在 DB,不在 State!

```typescript
class MemoryManager {
  // 取得 Active Messages (未被 compact 的)
  async getActiveMessages(sessionId: string): Promise<Message[]> {
    return await prisma.message.findMany({
      where: {
        sessionId,
        archived: false,  // 只取未 archive 的
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  // Memory Compact (當 tokens > 8000)
  async compactMemory(sessionId: string): Promise<void> {
    const messages = await this.getActiveMessages(sessionId);

    if (messages.length < 15) return; // 太少不需要 compact

    // 1. 取前 N 條訊息
    const toCompact = messages.slice(0, -10); // 保留最近 10 條

    // 2. 用 LLM 生成摘要
    const summary = await this.generateSummary(toCompact);

    // 3. Archive 舊訊息
    await prisma.message.updateMany({
      where: { id: { in: toCompact.map(m => m.id) } },
      data: { archived: true },
    });

    // 4. 創建 Compact Message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'system',
        content: summary,
        isCompacted: true,
        compactedFromId: toCompact[0].id,
        compactedToId: toCompact[toCompact.length - 1].id,
      },
    });
  }

  // 儲存新訊息
  async saveMessage(sessionId: string, role: string, content: string): Promise<void> {
    await prisma.message.create({
      data: { sessionId, role, content }
    });
  }
}
```

**Memory Compact 效果**:
```
Before:
Messages: 25 條
Tokens: 8500

After Compact:
Active Messages: 11 條 (10 recent + 1 summary)
Archived Messages: 14 條
Tokens: 2000 (節省 76%!)
```

#### 3.3 PromptBuilder (Fixed Input Pattern)

**核心概念**: Page State 永遠在 `messages[1]`,不存 DB!

```typescript
class PromptBuilder {
  async buildPrompt(
    sessionId: string,
    tenantId: string,
    currentUrl: string,
    currentPage: PageState | null,  // 當前頁面 (ephemeral!)
    userQuery: string
  ): Promise<ChatMessage[]> {

    const messages: ChatMessage[] = [];

    // 1. System Prompt (固定)
    messages.push({
      role: 'system',
      content: this.getSystemPrompt(),
    });

    // 2. Fixed Input: Current Page State (messages[1])
    //    ⚠️ 永遠在這個位置,不存 DB!
    if (currentPage) {
      messages.push({
        role: 'system',
        content: [
          {
            type: 'text',
            text: this.buildPageStateText(currentPage),
          },
          {
            type: 'image_url',  // Multimodal!
            image_url: {
              url: currentPage.screenshot,  // base64 data URL
            },
          },
        ],
      });
    }

    // 3. Site Prompts (從 DB 讀取)
    const sitePrompt = await this.loadSitePrompts(tenantId);
    if (sitePrompt) {
      messages.push({
        role: 'system',
        content: sitePrompt,
      });
    }

    // 4. URL Path Prompt (從 DB 讀取 + Pattern Matching)
    const urlPrompt = await this.loadUrlPrompt(tenantId, currentUrl);
    if (urlPrompt) {
      messages.push({
        role: 'system',
        content: urlPrompt,
      });
    }

    // 5. Navigation History Summary (從 DB 讀取,只存摘要)
    const navHistory = await this.loadNavigationHistory(sessionId);
    if (navHistory) {
      messages.push({
        role: 'system',
        content: `Navigation History:\n${navHistory}`,
      });
    }

    // 6. Conversation Messages (從 DB 讀取 Active Messages)
    const activeMessages = await this.memoryManager.getActiveMessages(sessionId);
    messages.push(...activeMessages);

    // 7. Current User Query
    messages.push({
      role: 'user',
      content: userQuery,
    });

    return messages;
  }

  private async loadSitePrompts(tenantId: string): Promise<string | null> {
    const prompts = await prisma.sitePrompt.findMany({
      where: {
        tenantId,
        isGlobal: true,
        isActive: true,
      },
    });

    return prompts.map(p => p.prompt).join('\n\n');
  }

  private async loadUrlPrompt(tenantId: string, currentUrl: string): Promise<string | null> {
    const url = new URL(currentUrl);
    const pathname = url.pathname;

    // Pattern matching: /products/* matches /products/laptop-123
    const prompt = await prisma.urlPathPrompt.findFirst({
      where: {
        tenantId,
        isActive: true,
        // SQL LIKE pattern matching
        urlPattern: {
          // 簡單實現: 用 LIKE
          // 完整實現: 可以用 pg_trgm 或自定義函數
        },
      },
      orderBy: {
        priority: 'desc',  // 高優先級優先匹配
      },
    });

    return prompt?.prompt;
  }

  private async loadNavigationHistory(sessionId: string): Promise<string> {
    const history = await prisma.navigationHistory.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: 5,  // 最近 5 筆
    });

    return history
      .map(h => `${h.url}: ${h.summary}`)
      .join('\n');
  }

  private buildPageStateText(page: PageState): string {
    return `
Current Page State:
URL: ${page.url}
Title: ${page.title}

Page Content (Markdown):
${page.markdown}

Actionable Elements:
${page.actionableElements.map(el =>
  `- ${el.type}: ${el.text} (selector: ${el.selector})`
).join('\n')}
    `.trim();
  }
}
```

**Prompt 組成範例**:
```
messages[0]: System Prompt
messages[1]: Current Page State (Text + Screenshot) ← Fixed Input!
messages[2]: Site Prompt ("本站是電商網站...")
messages[3]: URL Prompt ("/products/* 商品頁說明")
messages[4]: Navigation History ("訪問過 /cart, /checkout...")
messages[5]: Compact Summary ("前15條訊息摘要...")
messages[6]: user: "之前討論的商品"
messages[7]: assistant: "您是指筆電嗎?"
messages[8]: user: "對,幫我加入購物車"  ← Current Query
```

---

## Agentic Flow

### Supervisor Agent Decision Loop

```typescript
class SupervisorAgent {
  async execute(request: ChatRequest): Promise<void> {
    // 1. 初始化 State
    const session = await this.stateManager.getOrCreateSession(
      request.userId,
      request.tenantId
    );

    const state: SupervisorState = {
      sessionId: session.id,
      userId: request.userId,
      tenantId: request.tenantId,
      currentUrl: request.currentUrl,
      currentPage: request.pageState,
      userQuery: request.message,
      currentStep: 0,
      maxSteps: 10,
    };

    // 2. Decision Loop
    while (state.currentStep < state.maxSteps) {
      // 2.1 Parse Skill (如果有 /skill-name)
      const skill = this.parseSkill(state.userQuery);

      // 2.2 Build Prompt
      const messages = await this.promptBuilder.buildPrompt(
        state.sessionId,
        state.tenantId,
        state.currentUrl,
        state.currentPage,
        state.userQuery
      );

      // 2.3 Call LLM with Tools
      const response = await this.llm.chat(messages, {
        tools: this.getAvailableTools(skill),
        stream: true,
      });

      // 2.4 Handle Response
      for await (const chunk of response) {
        if (chunk.type === 'tool_call') {
          // Execute Tool
          this.emit('tool_call_start', chunk.tool);
          const result = await this.executeTool(chunk.tool, chunk.params);
          this.emit('tool_call_end', { tool: chunk.tool, result });

          // Update State
          state.toolResults.push(result);
        } else if (chunk.type === 'text') {
          // Stream to client
          this.emit('response_chunk', chunk.content);
        }
      }

      // 2.5 Check if done
      if (response.finished) {
        break;
      }

      state.currentStep++;
    }

    // 3. Save final response to DB
    await this.memoryManager.saveMessage(
      state.sessionId,
      'assistant',
      response.finalText
    );

    // 4. Auto Memory Compact (if needed)
    const tokens = await this.estimateTokens(state.sessionId);
    if (tokens > 8000) {
      await this.memoryManager.compactMemory(state.sessionId);
    }

    this.emit('response_complete', response.finalText);
  }

  private parseSkill(query: string): string | null {
    // Parse /skill-name from query
    const match = query.match(/^\/([a-z-]+)/);
    return match ? match[1] : null;
  }

  private getAvailableTools(skill: string | null): Tool[] {
    if (skill === 'web-navigation') {
      return [
        this.tools.web_analysis,
        this.tools.web_click,
        this.tools.web_scroll,
        this.tools.web_highlight,
      ];
    } else if (skill === 'order-lookup') {
      return [
        this.tools.knowledge_search,
      ];
    } else {
      // Default: all tools
      return Object.values(this.tools);
    }
  }
}
```

---

## Tools System

### Tool Definition (Zod Validation)

所有 Tools 使用 **Zod** 進行參數驗證:

```typescript
import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';

// 1. Define Input Schema
const WebClickInputSchema = z.object({
  selector: z.string().describe('CSS selector of element to click'),
  text: z.string().optional().describe('Text content to verify'),
});

type WebClickInput = z.infer<typeof WebClickInputSchema>;

// 2. Create Tool
export const webClickTool = new DynamicStructuredTool({
  name: 'web_click',
  description: 'Click on an element in the current page',
  schema: WebClickInputSchema,

  func: async (input: WebClickInput, context) => {
    const { selector, text } = input;

    // Validate
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    if (text && element.textContent !== text) {
      return { success: false, error: 'Text mismatch' };
    }

    // Execute
    element.click();

    return {
      success: true,
      message: `Clicked on ${selector}`,
    };
  },
});
```

### Available Tools

#### 1. knowledge_search (QA 搜尋)

```typescript
const KnowledgeSearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  topK: z.number().default(5).describe('Number of results'),
});

export const knowledgeSearchTool = new DynamicStructuredTool({
  name: 'knowledge_search',
  description: 'Search customer service knowledge base (QA)',
  schema: KnowledgeSearchInputSchema,

  func: async (input, context) => {
    // 1. Generate query embedding
    const embedding = await embeddings.embed(input.query);

    // 2. Vector search in documents table
    const results = await prisma.$queryRaw`
      SELECT id, title, content,
        (embedding <=> ${embedding}::vector) as distance
      FROM documents
      WHERE tenant_id = ${context.tenantId}
      ORDER BY distance
      LIMIT ${input.topK}
    `;

    return {
      results: results.map(r => ({
        title: r.title,
        content: r.content,
        score: 1 - r.distance,
      })),
    };
  },
});
```

#### 2. web_analysis (頁面分析)

```typescript
const WebAnalysisInputSchema = z.object({
  includeScreenshot: z.boolean().default(true),
});

export const webAnalysisTool = new DynamicStructuredTool({
  name: 'web_analysis',
  description: 'Analyze current page structure and content',
  schema: WebAnalysisInputSchema,

  func: async (input, context) => {
    const webUseService = new WebUseService();
    const analysis = await webUseService.analyzePage();

    return {
      url: analysis.url,
      title: analysis.title,
      markdown: analysis.markdownContent,
      screenshot: input.includeScreenshot ? analysis.screenshot : null,
      actionableElements: analysis.actionableElements,
    };
  },
});
```

#### 3. web_click (DOM 點擊)

```typescript
const WebClickInputSchema = z.object({
  selector: z.string(),
  text: z.string().optional(),
});

export const webClickTool = new DynamicStructuredTool({
  name: 'web_click',
  description: 'Click on an element',
  schema: WebClickInputSchema,
  func: async (input) => {
    const element = document.querySelector(input.selector);
    if (!element) return { success: false, error: 'Not found' };
    element.click();
    return { success: true };
  },
});
```

#### 4. web_type (DOM 輸入)

```typescript
const WebTypeInputSchema = z.object({
  selector: z.string(),
  text: z.string(),
  clearFirst: z.boolean().default(true),
});

export const webTypeTool = new DynamicStructuredTool({
  name: 'web_type',
  description: 'Type text into an input field',
  schema: WebTypeInputSchema,
  func: async (input) => {
    const element = document.querySelector(input.selector) as HTMLInputElement;
    if (!element) return { success: false };

    if (input.clearFirst) element.value = '';
    element.value = input.text;
    element.dispatchEvent(new Event('input', { bubbles: true }));

    return { success: true };
  },
});
```

#### 5. web_scroll (頁面滾動)

```typescript
const WebScrollInputSchema = z.object({
  target: z.union([
    z.literal('up'),
    z.literal('down'),
    z.string(),  // selector
  ]),
  pixels: z.number().optional(),
});

export const webScrollTool = new DynamicStructuredTool({
  name: 'web_scroll',
  description: 'Scroll the page or to a specific element',
  schema: WebScrollInputSchema,
  func: async (input) => {
    if (input.target === 'up') {
      window.scrollBy(0, -(input.pixels || 300));
    } else if (input.target === 'down') {
      window.scrollBy(0, input.pixels || 300);
    } else {
      const element = document.querySelector(input.target);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    return { success: true };
  },
});
```

#### 6. web_highlight (視覺標註)

```typescript
const WebHighlightInputSchema = z.object({
  selector: z.string(),
  duration: z.number().default(2000),
});

export const webHighlightTool = new DynamicStructuredTool({
  name: 'web_highlight',
  description: 'Visually highlight an element',
  schema: WebHighlightInputSchema,
  func: async (input) => {
    const element = document.querySelector(input.selector) as HTMLElement;
    if (!element) return { success: false };

    element.style.outline = '3px solid #ff0000';
    element.style.backgroundColor = '#ffff00';

    setTimeout(() => {
      element.style.outline = '';
      element.style.backgroundColor = '';
    }, input.duration);

    return { success: true };
  },
});
```

---

## Memory Management

### Database Schema (Prisma)

```prisma
model Session {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id")  // 重要! 客戶的 User ID
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime @map("expires_at")
  isActive  Boolean  @default(true) @map("is_active")

  tenant            Tenant              @relation(fields: [tenantId], references: [id])
  messages          Message[]
  navigationHistory NavigationHistory[]

  @@index([tenantId, userId, isActive])
  @@map("sessions")
}

model Message {
  id        Int      @id @default(autoincrement())
  sessionId String   @map("session_id") @db.Uuid
  role      String   // 'user' | 'assistant' | 'system'
  content   String   @db.Text
  timestamp DateTime @default(now())

  // Memory Compact fields
  isCompacted     Boolean  @default(false) @map("is_compacted")
  compactedFromId Int?     @map("compacted_from_id")
  compactedToId   Int?     @map("compacted_to_id")
  archived        Boolean  @default(false)

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, archived, timestamp])
  @@index([sessionId, isCompacted])
  @@map("messages")
}
```

### Memory Compact Strategy

**觸發條件**:
- Tokens > 8000
- Active Messages > 20

**保留策略**:
- 保留最近 10 條 messages
- 其餘壓縮成 1 條 summary

**壓縮流程**:
```
1. SELECT active messages (archived = false)
2. IF count > 20 OR tokens > 8000:
3.   messages_to_compact = messages[0:-10]
4.   summary = LLM.summarize(messages_to_compact)
5.   UPDATE messages SET archived = true WHERE id IN (...)
6.   INSERT compact_message (isCompacted = true, content = summary)
7. END IF
```

---

## Admin Dashboard

### 1. Developer Test Mode (開發者測試)

**路由**: `/test-mode`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Developer Test Mode                                         │
├───────────────┬─────────────────────────┬────────────────────┤
│               │                         │                    │
│  Prompt       │      iframe             │   Agent Panel      │
│  Inspector    │   (Real Website)        │                    │
│               │                         │                    │
│  [System]     │  URL: ____________      │  Input: _______    │
│  [Site]       │  [Load]                 │  [Send]            │
│  [URL]        │                         │                    │
│  [Page State] │  ┌─────────────────┐   │  Messages:         │
│  [Messages]   │  │                 │   │  • User: ...       │
│               │  │  Website        │   │  • AI: ...         │
│  Click to     │  │  Content        │   │                    │
│  expand       │  │  Here           │   │  Streaming...      │
│               │  │                 │   │                    │
│               │  └─────────────────┘   │                    │
└───────────────┴─────────────────────────┴────────────────────┘
```

**功能**:

**左側 - Prompt Inspector**:
- 顯示每次組合的完整 Prompt
- 可展開查看各部分:
  - System Prompt
  - Site Prompt
  - URL Prompt
  - Page State (Text + Screenshot)
  - Messages (Active)
- 點擊可複製完整 Prompt

**中間 - iframe (Real Website)**:
- 輸入任意 URL
- 載入真實網站
- 看到 Agent 實際操作 (highlight, scroll, click)

**右側 - Agent Panel**:
- 輸入測試指令
- 看到 SSE Streaming 回應
- 顯示 Tool 執行過程

### 2. Management UI (管理介面)

**路由**: `/management`

#### 2.1 Prompts Management

**Site Prompts**:
```
┌─────────────────────────────────────────────────────────┐
│  Site Prompts                              [+ Add New]  │
├─────────────────────────────────────────────────────────┤
│  Prompt 1: 網站說明                        [Edit] [Del] │
│  本站是3C電商網站,主要販售筆電、手機...              │
├─────────────────────────────────────────────────────────┤
│  Prompt 2: 結帳流程說明                    [Edit] [Del] │
│  結帳流程: 選擇商品→加入購物車→填寫資料...          │
└─────────────────────────────────────────────────────────┘
```

**URL Path Prompts**:
```
┌─────────────────────────────────────────────────────────┐
│  URL Path Prompts                          [+ Add New]  │
├─────────────────────────────────────────────────────────┤
│  /products/*  (Priority: 10)               [Edit] [Del] │
│  這是商品頁面,包含商品圖片、價格、規格...            │
├─────────────────────────────────────────────────────────┤
│  /cart  (Priority: 20)                     [Edit] [Del] │
│  這是購物車頁面,可以修改數量、刪除商品...            │
└─────────────────────────────────────────────────────────┘
```

**CRUD 功能**:
- Create: Modal form
- Read: List view
- Update: Inline edit
- Delete: Confirm dialog

#### 2.2 Knowledge Base Management

```
┌─────────────────────────────────────────────────────────┐
│  Knowledge Base (QA)                     [Upload File]  │
├─────────────────────────────────────────────────────────┤
│  [Search: ____________]                  [Bulk Import]  │
├─────────────────────────────────────────────────────────┤
│  Q: 如何查詢訂單?                          [Edit] [Del] │
│  A: 請到「我的訂單」頁面,輸入訂單編號...             │
├─────────────────────────────────────────────────────────┤
│  Q: 退貨流程?                              [Edit] [Del] │
│  A: 1. 聯繫客服 2. 填寫退貨單...                     │
└─────────────────────────────────────────────────────────┘
```

**功能**:
- 單筆新增 QA
- 批次上傳 CSV/JSON
- Vector Embedding 自動生成
- 搜尋測試

---

## Integration Guide

### For Customers (企業客戶使用指南)

#### Step 1: 安裝

```bash
npm install @lens-service/widget @lens-service/server
```

#### Step 2: Database Setup

```bash
# 1. 配置環境變數
DATABASE_URL="postgresql://your_db_user:password@your_host:5432/your_db"

# 2. 執行 Migration (在客戶的 DB 上!)
npx prisma migrate deploy
```

這會創建:
- `tenants` (租戶)
- `sessions` (含 `user_id`)
- `messages` (對話訊息)
- `site_prompts` (網站 Prompt)
- `url_path_prompts` (URL Prompt)
- `documents` (Knowledge Base)
- `document_embeddings` (向量)

#### Step 3: Server Setup

```typescript
// server.ts
import express from 'express';
import { createChatHandler } from '@lens-service/server';

const app = express();

app.post('/api/chat', createChatHandler({
  prisma: prisma,  // 客戶自己的 Prisma instance
  llmProvider: 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
}));

app.listen(3002);
```

#### Step 4: Widget Integration (一行引用!)

```html
<!-- 客戶網站 -->
<!DOCTYPE html>
<html>
<head>
  <title>My E-commerce Site</title>
</head>
<body>
  <h1>Welcome!</h1>

  <!-- 引入 Lens Widget -->
  <script src="https://cdn.example.com/lens-widget.umd.js"></script>
  <script>
    // 獲取當前登入用戶的 ID (重要!)
    const currentUserId = 'user-12345';  // 從客戶的認證系統取得

    LensWidget.init({
      apiUrl: 'http://localhost:3002',
      tenantId: 'tenant-uuid-from-db',
      userId: currentUserId,  // 傳入 User ID!
    });
  </script>
</body>
</html>
```

#### Step 5: Admin Dashboard (Optional)

```bash
# Build Admin Dashboard
npm run build:admin

# Deploy to
https://your-site.com/admin/lens-dashboard
```

---

## Development Roadmap

### Phase 1: Core Infrastructure ✅

- [x] Prisma Schema 設計
- [x] Database Migration
- [x] Memory Compact 機制
- [x] Yarn 4 + Turborepo 設定

### Phase 2: Agent System (In Progress)

- [ ] Supervisor Agent 實作
- [ ] Context Engineer 完整實作
  - [ ] StateManager (Session + User)
  - [ ] MemoryManager (DB-based)
  - [ ] PromptBuilder (Fixed Input Pattern)
- [ ] Skill System
  - [ ] Skill Parser
  - [ ] Skill Registry

### Phase 3: Tools Implementation

- [ ] knowledge_search (Vector Search)
- [ ] web_analysis (Screenshot + Markdown)
- [ ] web_click (DOM Click)
- [ ] web_type (DOM Input)
- [ ] web_scroll (Page Scroll)
- [ ] web_highlight (Visual Feedback)

### Phase 4: Widget Development

- [ ] Chat UI Component
- [ ] SSE Streaming Integration
- [ ] WebUseService Integration
- [ ] Build as Library (UMD + ESM)

### Phase 5: Admin Dashboard

- [ ] Developer Test Mode
  - [ ] Prompt Inspector
  - [ ] iframe Integration
  - [ ] Agent Panel
- [ ] Management UI
  - [ ] Prompts CRUD
  - [ ] Knowledge Base CRUD

### Phase 6: Testing & Deployment

- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Docker Compose Setup
- [ ] Documentation

---

## Technical Decisions

### 1. Why Widget-based (not Browser Automation)?

**✅ Widget (DOM API)**:
- 嵌入在客戶網站中
- 直接操作 DOM
- 無需額外瀏覽器
- 客戶可見操作過程

**❌ Browser Automation (Playwright)**:
- 需要獨立瀏覽器
- 客戶看不到操作
- 部署複雜
- 成本高

### 2. Why DB-based Memory (not State-based)?

**✅ DB-based**:
- 可持久化
- 支援 Memory Compact
- 支援多 Session
- 可查詢歷史

**❌ State-based**:
- 重啟後遺失
- 無法 Compact
- 無法查詢

### 3. Why Fixed Input Pattern for Page State?

**✅ Fixed Input (messages[1])**:
- 避免舊頁面資料污染
- 節省 Tokens
- Prompt 結構清晰

**❌ 儲存到 DB**:
- 每次都要讀取
- 可能拿到舊頁面
- 浪費 Storage

### 4. Why Prisma as Template (not Hosted DB)?

**✅ Prisma Template**:
- 客戶用自己的 DB
- 數據隱私保護
- 可客製化
- 完全掌控

**❌ Hosted DB**:
- 數據集中存放
- 隱私問題
- 單點故障

---

## Summary

Lens Service v3 是一個:

✅ **Widget-based** AI Customer Service
✅ **Agentic** - Supervisor + Tools
✅ **Web Use** - DOM 操作 (非 Playwright)
✅ **Memory Compact** - 智能 Token 節省
✅ **Self-hostable** - 客戶自架
✅ **Database Agnostic** - 用客戶的 DB
✅ **Multi-modal** - Text + Screenshot
✅ **Production Ready** - 完整測試

**一行引用,全功能使用!**

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Author**: Lens Service Team

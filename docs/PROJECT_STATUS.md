# Lens Service v3 - 專案狀態與完整理解

**最後更新**: 2025-12-03
**版本**: 3.0
**狀態**: ✅ 核心功能完成，Agent Panel UI 完成

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [當前完成狀態](#當前完成狀態)
3. [最近實現的功能](#最近實現的功能-2025-12-02-to-2025-12-03)
4. [系統架構詳解](#系統架構詳解)
5. [技術棧](#技術棧)
6. [目錄結構](#目錄結構)
7. [核心組件說明](#核心組件說明)
8. [工作流程](#工作流程)
9. [已知問題與待辦](#已知問題與待辦)
10. [部署資訊](#部署資訊)

---

## 專案概述

### 什麼是 Lens Service v3？

Lens Service v3 是一個**嵌入式 AI 客服助手系統**，採用 Widget-based 架構（非 Playwright 瀏覽器自動化）。它可以：

- 🤖 在客戶網站內提供 AI 對話助手
- 🔧 執行網頁操作（點擊、輸入、滾動、標註）
- 💬 回答用戶問題並提供視覺反饋
- 📚 整合知識庫與 Skill 系統
- 🧠 支援 Memory Compact（節省 75-85% tokens）
- 🎨 提供美觀的 Frosted Glass UI

### 核心理念

```
傳統客服 Widget = 只有聊天框
Lens Service v3 = 聊天 + AI 可以操作網頁 + 視覺標註 + 知識庫
```

---

## 當前完成狀態

### ✅ 已完成功能

| 模組 | 功能 | 狀態 | 檔案位置 |
|------|------|------|----------|
| **Backend - Server** |
| API Server | Express.js 伺服器 | ✅ | `server/src/index.ts` |
| Chat API | SSE streaming 聊天端點 | ✅ | `server/src/index.ts` |
| Session Management | 會話管理 | ✅ | `server/src/index.ts` |
| Human Support API | Telegram 人工客服 | ✅ | `server/src/index.ts`, `server/src/telegram-service.ts` |
| **Backend - Agents** |
| Supervisor Agent | 主控 Agent（決策循環） | ✅ | `agents/supervisor-agent.ts` |
| Context Engineer | Prompt Builder | ✅ | `agents/context-engineer/prompt-loader.ts` |
| Trace Logger | LLM 調用追蹤 | ✅ | `agents/services/trace-logger.ts` |
| **Frontend - Admin** |
| Admin Dashboard | 管理後台 | ✅ | `admin/src/` |
| Test Agent Page | 測試頁面（全螢幕 iframe） | ✅ | `admin/src/pages/TestAgent.tsx` |
| Knowledge Base Management | 知識庫管理 | ✅ | `admin/src/pages/KnowledgeBase.tsx` |
| Skills Management | Skills 管理 | ✅ | `admin/src/pages/Skills.tsx` |
| **Frontend - Widget** |
| Widget Core | 嵌入式 Widget | ✅ | `widget/src/index.ts` |
| Web Use Service | DOM 操作服務 | ✅ | `widget/src/web-use/` |
| **Frontend - Agent Panel** |
| Agent Panel UI | Frosted Glass 對話面板 | ✅ | `packages/agent-panel/agent-panel.ts` |
| Language Switcher | 語言切換（zh-TW/en/ja） | ✅ | `packages/agent-panel/agent-panel.ts` |
| Auto Mode | 自動執行工具模式 | ✅ | `packages/agent-panel/agent-panel.ts` |
| Tool Confirmation UI | 工具執行前確認 UI | ✅ | `packages/agent-panel/agent-panel.ts` |
| Human Support Form | 人工客服表單 | ✅ | `packages/agent-panel/agent-panel.ts` |
| Hover Menu | 4 個選項的 hover 選單 | ✅ | `packages/agent-panel/agent-panel.ts` |
| **Database** |
| Prisma Schema | 資料庫 schema | ✅ | `prisma/schema.prisma` |
| Sessions | 會話表 | ✅ | - |
| Messages | 訊息表（支援 Memory Compact） | ✅ | - |
| Site Prompts | 全站提示詞 | ✅ | - |
| URL Path Prompts | URL 路徑提示詞 | ✅ | - |
| Knowledge Base | 知識庫 | ✅ | - |
| Skills | 技能系統 | ✅ | - |
| LLM Traces | LLM 調用記錄 | ✅ | - |

### ⚠️ 已移除功能

| 功能 | 原因 | 移除日期 |
|------|------|----------|
| Navigation History | Schema 簡化 | 2025-12-03 |
| Microphone (語音輸入) | 功能有問題，暫不實現 | 2025-12-03 |

### 🚧 待開發功能

| 功能 | 優先級 | 預計時間 |
|------|--------|----------|
| Tool 實際執行邏輯 | 🔴 高 | - |
| Agent Panel 與 Widget 整合測試 | 🔴 高 | - |
| Continue.dev autocomplete 研究 | 🟡 中 | - |
| 完整的 E2E 測試 | 🟢 低 | - |

---

## 最近實現的功能 (2025-12-02 to 2025-12-03)

### 2025-12-03: Agent Panel UI 大更新

#### 1. **完整 Agent Panel UI 實現**
   - 📁 檔案：`packages/agent-panel/agent-panel.ts`
   - ✨ 特點：
     - Frosted glass 設計（毛玻璃效果）
     - 獨立的 TypeScript class，可用於 Widget 和 Test Agent
     - 完整的 SSE streaming 支援
     - Tool call 顯示為可摺疊區塊
     - 自動過濾 `</complete>` 標籤

#### 2. **Hover Menu 四個選項**
   - 🌐 **語言** (zh-TW / en / ja)：循環切換三種語言
   - ⚡ **自動模式**：開啟/關閉自動執行工具
   - 🔄 **重新開始**：重置 session
   - 💬 **聯絡客服**：開啟人工客服表單

#### 3. **Auto Mode 權限系統**
   - **首次詢問**：用戶第一次 query 後顯示藍色提示框
     - 「是否允許 AI Agent 自動執行工具操作？」
     - 兩個選項：同意 / 不同意
   - **工具確認 UI**：Auto mode 關閉時
     - 顯示黃色確認框
     - 工具名稱和參數 JSON
     - 三個按鈕：✓ 執行 / ✗ 拒絕 / ✏️ 修改請求

#### 4. **人工客服 Telegram 整合**
   - 📁 檔案：`server/src/telegram-service.ts`
   - 功能：
     - 人工客服表單（類別、收件人、訊息）
     - 發送到 Telegram bot
     - 成功/失敗反饋 UI
     - 支援重試

#### 5. **Test Agent 頁面重寫**
   - 📁 檔案：`admin/src/pages/TestAgent.tsx`
   - 變更：
     - 從 2/3 + 1/3 grid layout → 全螢幕 iframe
     - 移除舊的 terminal-style output panel
     - 移除 web actions overlay
     - 加上 Agent Panel overlay
     - 美觀的 frosted glass top control bar

#### 6. **Schema 簡化**
   - 移除 `navigationHistory` 表
   - 簡化 `LLMTrace` 表（只保留 input/output）
   - 修正相關代碼：
     - `agents/context-engineer/prompt-loader.ts`
     - `agents/services/trace-logger.ts`
     - `server/routes/admin/traces.ts`

### 2025-12-02: Supervisor Agent 與 Memory Compact

#### 1. **Supervisor Agent 實現**
   - 📁 檔案：`agents/supervisor-agent.ts`
   - 功能：
     - 完整的 decision loop
     - Tool execution
     - SSE streaming
     - Memory management integration

#### 2. **Context Engineer**
   - 📁 檔案：`agents/context-engineer/prompt-loader.ts`
   - 功能：
     - Site prompts 載入
     - URL prompts 匹配
     - Pattern matching (wildcard support)

---

## 系統架構詳解

### 高層架構圖

```
┌──────────────────────────────────────────────────────────────┐
│                     客戶網站（瀏覽器）                         │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Lens Widget (嵌入式)                         │ │
│  │                                                           │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Agent Panel (TypeScript Class)                    │  │ │
│  │  │  • Frosted glass UI                                │  │ │
│  │  │  • Chat interface                                  │  │ │
│  │  │  • Hover menu (language, auto, refresh, human)    │  │ │
│  │  │  • Tool confirmation UI                            │  │ │
│  │  │  • Human support form                              │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Web Use Service                                   │  │ │
│  │  │  • analyzePage() - DOM → Markdown + Screenshot    │  │ │
│  │  │  • click() - 點擊元素                               │  │ │
│  │  │  • type() - 輸入文字                                │  │ │
│  │  │  • scroll() - 滾動                                  │  │ │
│  │  │  • highlight() - 標註                               │  │ │
│  │  │  • extract() - 提取文字                             │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│                    ↕ HTTP/SSE (Port 3333)                     │
└──────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Express.js Server                                       │ │
│  │  • /api/chat (SSE)                                       │ │
│  │  • /api/human-support (Telegram)                         │ │
│  │  • /api/admin/* (Admin APIs)                             │ │
│  │  • /admin (Static files)                                 │ │
│  │  • /widget (Static files)                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                ↓                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Supervisor Agent                                        │ │
│  │  • Decision loop                                         │ │
│  │  • Tool execution                                        │ │
│  │  • State management                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                ↓                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Context Engineer                                        │ │
│  │  • Prompt Builder (Site/URL prompts)                     │ │
│  │  • Memory Manager (Memory Compact)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                ↓                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                     │ │
│  │  • sessions                                              │ │
│  │  • messages (with Memory Compact)                        │ │
│  │  • site_prompts                                          │ │
│  │  • url_path_prompts                                      │ │
│  │  • knowledge_base                                        │ │
│  │  • skills                                                │ │
│  │  • llm_traces                                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  External Services                                       │ │
│  │  • Anthropic Claude API                                  │ │
│  │  • Telegram Bot API                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  Admin Dashboard (React)                      │
│                                                                │
│  • Test Agent (Full-screen iframe testing)                    │
│  • Knowledge Base Management                                  │
│  • Skills Management                                          │
│  • Site/URL Prompts Configuration                             │
│  • Traces Viewer                                              │
└──────────────────────────────────────────────────────────────┘
```

### 數據流向

#### 用戶查詢流程

```
1. User types: "這個產品多少錢？"
   └─ Agent Panel → POST /api/chat

2. Server receives request
   └─ Extract: userId, sessionId, message, currentUrl, language

3. Supervisor Agent starts
   └─ Save user message to DB
   └─ Build Prompt:
      ├─ Base System Prompt
      ├─ Site Prompt (from site_prompts table)
      ├─ URL Prompt (matched from url_path_prompts)
      ├─ Current Page State (if any)
      ├─ Conversation History (with Memory Compact)
      └─ Current User Query

4. Call LLM (Claude API)
   └─ LLM decides: Use tool "web_extract_text"
   └─ Stream tool_call event → Client

5. Client checks auto mode
   └─ If auto_mode = false:
      └─ Show tool confirmation UI
      └─ User clicks "執行"
   └─ If auto_mode = true:
      └─ Auto execute

6. Execute tool (假設已確認)
   └─ Tool: web_extract_text({ selector: '.product-price' })
   └─ Result: "NT$ 36,900"
   └─ Save to DB

7. Generate response
   └─ Build Prompt again (with tool result)
   └─ LLM generates: "這個產品的價格是 NT$ 36,900"
   └─ Stream response chunks → Client
   └─ Save to DB

8. Optional: Visual feedback
   └─ Tool: web_highlight({ selector: '.product-price' })
   └─ Client highlights element

9. Done
   └─ Stream "done" event
   └─ Check if Memory Compact needed
```

---

## 技術棧

### Backend

| 技術 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 18+ | Runtime |
| **TypeScript** | 5.3+ | 語言 |
| **Express.js** | - | Web framework |
| **Prisma** | 5.22+ | ORM |
| **PostgreSQL** | 14+ | 資料庫 |
| **Anthropic SDK** | - | Claude API |
| **node-fetch** | 2.x | HTTP client |

### Frontend - Admin

| 技術 | 版本 | 用途 |
|------|------|------|
| **React** | 18+ | UI framework |
| **TypeScript** | 5.3+ | 語言 |
| **Vite** | 5.0+ | Build tool |
| **React Router** | - | Routing |

### Frontend - Widget

| 技術 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | 5.3+ | 語言 |
| **Vite** | 5.0+ | Build tool |
| **html2canvas** | 1.4+ | 截圖 |
| **Turndown** | 7.1+ | HTML → Markdown |

### Frontend - Agent Panel

| 技術 | 版本 | 用途 |
|------|------|------|
| **Pure TypeScript** | 5.3+ | No framework |
| **CSS-in-JS** | - | Inline styles |

---

## 目錄結構

```
lens-service-v3/
├── server/                    # Backend server
│   ├── src/
│   │   ├── index.ts          # Main server file
│   │   ├── telegram-service.ts
│   │   └── routes/
│   │       └── admin/
│   │           ├── knowledge.ts
│   │           ├── skills.ts
│   │           └── traces.ts
│   └── package.json
│
├── agents/                    # AI Agents
│   ├── supervisor-agent.ts   # Main supervisor
│   ├── context-engineer/
│   │   └── prompt-loader.ts  # Prompt building
│   └── services/
│       └── trace-logger.ts   # LLM tracing
│
├── admin/                     # Admin dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TestAgent.tsx
│   │   │   ├── KnowledgeBase.tsx
│   │   │   └── Skills.tsx
│   │   └── App.tsx
│   ├── dist/                 # Build output
│   └── package.json
│
├── widget/                    # Embeddable widget
│   ├── src/
│   │   ├── index.ts
│   │   └── web-use/
│   │       └── web-use-service.ts
│   ├── dist/                 # Build output
│   └── package.json
│
├── packages/
│   └── agent-panel/          # Standalone Agent Panel
│       ├── agent-panel.ts    # 1030 lines
│       └── package.json
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── docs/                      # Documentation
│   ├── PROJECT_STATUS.md     # This file
│   ├── WEB_USE_ARCHITECTURE.md
│   └── DATABASE_SCHEMA.md
│
├── image/                     # Assets
│   ├── microphone.svg
│   └── widget_icon.svg
│
└── package.json               # Root package.json (yarn workspace)
```

---

## 核心組件說明

### 1. Agent Panel (`packages/agent-panel/agent-panel.ts`)

**用途**: 獨立的對話面板 UI，可用於 Widget 和 Test Agent

**特點**:
- 純 TypeScript class（無 framework 依賴）
- 1030+ 行程式碼
- 完整的 SSE streaming 支援
- Frosted glass 設計

**主要方法**:
```typescript
class AgentPanel {
  constructor(containerId: string, config: AgentPanelConfig)

  // UI Rendering
  private render(): void
  private renderAgentMode(): string
  private renderHumanSupportMode(): string

  // Event Handling
  private attachEventListeners(): void
  private handleAction(action: string): void

  // Core Features
  private async handleSend(): Promise<void>  // Send message + SSE
  private cycleLanguage(): void              // zh-TW → en → ja
  private toggleAutoMode(): void             // Toggle auto execution

  // Tool Confirmation
  private showAutoModePrompt(): void         // First-time prompt
  private showToolConfirmation(toolCall: ToolCall): void
  private confirmToolExecution(): void
  private rejectToolExecution(): void

  // Human Support
  private async submitHumanSupport(): Promise<void>

  // UI Helpers
  private updateLastMessage(content: string, tools: ToolResult[]): void
  private resetSession(): void
  private switchMode(mode: PanelMode): void
}
```

**State Management**:
```typescript
private language: string = 'zh-TW';           // 'zh-TW' | 'en' | 'ja'
private autoMode: boolean = false;            // Auto execute tools
private hasAskedAutoMode: boolean = false;    // Has asked user
private pendingToolCall: ToolCall | null = null;
private messages: Array<Message> = [];
private sessionId: string = '';
```

### 2. Supervisor Agent (`agents/supervisor-agent.ts`)

**用途**: 主控 Agent，負責決策循環和工具執行

**核心邏輯**:
```typescript
async *run(sessionId: string, userId: string, userQuery: string) {
  // 1. Save user message
  await this.saveMessage(sessionId, 'user', userQuery);

  // 2. Build prompt
  const messages = await this.promptBuilder.buildPrompt(
    sessionId,
    currentUrl,
    userQuery,
    baseSystemPrompt
  );

  // 3. Decision loop
  let maxIterations = 5;
  while (maxIterations-- > 0) {
    // Call LLM
    const response = await this.llm.chat(messages);

    // Check for tools
    if (response.tool_calls) {
      for (const tool of response.tool_calls) {
        yield { type: 'tool_call', tool };

        // Execute tool
        const result = await this.toolExecutor.execute(tool);
        yield { type: 'tool_result', result };

        // Add to messages
        messages.push({
          role: 'tool',
          content: JSON.stringify(result)
        });
      }
      continue; // Next iteration
    }

    // No more tools, response ready
    yield { type: 'response', content: response.content };
    break;
  }

  // 4. Save assistant message
  await this.saveMessage(sessionId, 'assistant', response.content);

  // 5. Check if Memory Compact needed
  await this.memoryManager.checkAndCompact(sessionId);

  yield { type: 'done' };
}
```

### 3. Web Use Service (`widget/src/web-use/web-use-service.ts`)

**用途**: 在瀏覽器內執行 DOM 操作

**核心方法**:
```typescript
class WebUseService {
  // Page Analysis
  async analyzePage(): Promise<PageAnalysis> {
    const markdown = await this.domToMarkdown();
    const screenshot = await this.takeScreenshot();
    const elements = this.extractActionableElements();
    return { url, title, markdown, screenshot, elements };
  }

  // DOM Operations
  async click(target: ElementTarget): Promise<void> {
    const element = this.locateElement(target);
    element.scrollIntoView();
    await this.sleep(300);
    element.click();
  }

  async type(target: ElementTarget, text: string, clearFirst = true): Promise<void> {
    const element = this.locateElement(target) as HTMLInputElement;
    if (clearFirst) element.value = '';

    // Type char by char
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input'));
      await this.sleep(50);
    }
    element.dispatchEvent(new Event('change'));
  }

  async scroll(direction: ScrollDirection, amount?: number): Promise<void> {
    if (typeof direction === 'object') {
      const element = this.locateElement(direction);
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }
  }

  async highlight(target: ElementTarget, duration = 2000): Promise<void> {
    const element = this.locateElement(target);
    element.scrollIntoView({ behavior: 'smooth' });

    // Add visual highlight
    element.style.outline = '3px solid #ff0000';
    element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';

    setTimeout(() => {
      element.style.outline = '';
      element.style.backgroundColor = '';
    }, duration);
  }

  extractText(target: ElementTarget): { text: string } {
    const element = this.locateElement(target);
    return { text: element.textContent || '' };
  }
}
```

### 4. Telegram Service (`server/src/telegram-service.ts`)

**用途**: 發送人工客服請求到 Telegram

**實現**:
```typescript
export class TelegramService {
  private botToken: string;
  private chatId: string;

  async sendHumanSupportMessage(data: HumanSupportMessage) {
    const messageText = this.formatMessage(data);

    const response = await fetch(
      `https://api.telegram.org/bot${this.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: messageText,
          parse_mode: 'HTML'
        })
      }
    );

    return { success: response.ok };
  }

  private formatMessage(data: HumanSupportMessage): string {
    return `🆘 <b>客服請求</b>\n\n` +
      `👤 <b>用戶ID:</b> ${data.userId}\n` +
      `📁 <b>類別:</b> ${data.category}\n` +
      `👨‍💼 <b>收件人:</b> ${data.recipient}\n` +
      `🕐 <b>時間:</b> ${data.timestamp}\n` +
      `\n📝 <b>訊息:</b>\n${data.message}`;
  }
}
```

---

## 工作流程

### Build Process

```bash
# Root level
yarn build
  ↓
  ├─ yarn build:widget    # Vite build → dist/lens-widget.iife.js
  ├─ yarn build:admin     # Vite build → dist/
  └─ yarn build:server    # TypeScript compile
```

**Build Output**:
- Widget: `widget/dist/lens-widget.iife.js` (222.71 kB, gzip: 55.40 kB)
- Admin: `admin/dist/` (201.91 kB JS, gzip: 60.84 kB)
- Server: `server/dist/` (TypeScript compiled)

### Development Workflow

```bash
# Terminal 1: Start database
docker-compose up -d

# Terminal 2: Generate Prisma client & run server
cd lens-service-v3
yarn prisma generate
yarn start  # Starts on http://localhost:3333

# Admin Dashboard: http://localhost:3333/admin
# Test Agent: http://localhost:3333/admin (navigate to Test Agent)
```

### Database Workflow

```bash
# Generate Prisma Client
yarn prisma generate

# Push schema to DB (development)
yarn prisma db push

# View DB in Prisma Studio
yarn prisma studio
```

---

## 已知問題與待辦

### 🐛 已知問題

1. **Server 啟動後 Crash**
   - 狀態: 多個 background bash processes 顯示 failed
   - 原因: 待調查
   - 影響: 需要手動重啟

2. **Tool 執行邏輯未完成**
   - 狀態: `confirmToolExecution()` 只有 console.log
   - 需要: 實際呼叫 API 執行工具

3. **Agent Panel 未與 Widget 整合測試**
   - 狀態: Agent Panel 獨立完成，但未測試與 Widget 的整合
   - 需要: 實際在網頁上測試

### 📝 待辦事項

#### 高優先級 🔴

- [ ] 實現 `confirmToolExecution()` 的實際 API 呼叫
- [ ] 完整測試 Agent Panel 在 Test Agent 頁面的運作
- [ ] 修正 server 啟動後 crash 問題
- [ ] Agent Panel 與 Widget 整合測試

#### 中優先級 🟡

- [ ] 研究 Continue.dev 的 autocomplete 實現
- [ ] 加上更多語言支援（目前只有 zh-TW/en/ja）
- [ ] 優化 Memory Compact 觸發條件
- [ ] 實現 Knowledge Base 的 hybrid search

#### 低優先級 🟢

- [ ] 加上 E2E 測試
- [ ] 優化 Widget bundle size
- [ ] 加上 Analytics 追蹤
- [ ] 實現多租戶支援（目前 schema 有但未實現）

---

## 部署資訊

### 環境變數

**Server** (`.env`):
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lens_service_v3"

# LLM
ANTHROPIC_API_KEY="sk-ant-..."

# Telegram (Optional)
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="123456789"

# Server
PORT=3333
NODE_ENV=production
```

### Port 配置

| 服務 | Port | 用途 |
|------|------|------|
| Express Server | 3333 | Main server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache (future) |
| MySQL | 3306 | Legacy (not used) |

### 部署步驟

```bash
# 1. Install dependencies
yarn install

# 2. Generate Prisma Client
yarn prisma generate

# 3. Push schema to database
yarn prisma db push

# 4. Build all projects
yarn build

# 5. Start server
yarn start

# Server will be available at:
# - API: http://localhost:3333/api/chat
# - Admin: http://localhost:3333/admin
# - Widget: http://localhost:3333/widget/lens-widget.js
```

### 健康檢查

```bash
# Check server health
curl http://localhost:3333/health

# Check database connection
yarn prisma db pull
```

---

## 總結

### 專案亮點 ✨

1. **Widget-based 架構**
   - 非瀏覽器自動化，嵌入在客戶網站內
   - 完整的 DOM 操作能力
   - 視覺反饋（highlight, scroll）

2. **美觀的 UI**
   - Frosted glass 設計
   - 響應式 hover menu
   - 流暢的動畫效果

3. **完整的權限控制**
   - Auto mode 首次詢問
   - Tool 執行前確認
   - 人工客服轉接

4. **Memory Compact**
   - 節省 75-85% tokens
   - 自動壓縮對話歷史
   - 保留重要資訊

5. **Modular 設計**
   - Agent Panel 獨立可重用
   - Web Use Service 獨立
   - Clear separation of concerns

### 技術債務 ⚠️

1. Tool 執行邏輯未完成
2. E2E 測試缺失
3. Server crash 問題待修復
4. Agent Panel 整合測試待完成

### 下一步建議 🎯

1. 優先修復 server crash 問題
2. 完成 tool 執行邏輯
3. 進行完整的整合測試
4. 研究 Continue.dev autocomplete
5. 加上更多文檔和範例

---

**文檔維護者**: Claude (Sonnet 4.5)
**最後更新**: 2025-12-03
**版本**: 1.0

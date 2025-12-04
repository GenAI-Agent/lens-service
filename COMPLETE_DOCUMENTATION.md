# Lens Service v3 - 完整系統文檔

> **最後更新**: 2025-12-04
> **版本**: 3.0.0

---

## 目錄

1. [系統概述](#系統概述)
2. [架構設計](#架構設計)
3. [核心組件](#核心組件)
4. [Agent Panel 完整功能](#agent-panel-完整功能)
5. [資料庫設計](#資料庫設計)
6. [後台管理系統](#後台管理系統)
7. [Widget 串接指南](#widget-串接指南)
8. [API 文檔](#api-文檔)
9. [部署指南](#部署指南)

---

## 系統概述

### 產品定位

Lens Service v3 是一個**企業級 AI 客服解決方案**，提供：

- 🤖 **AI Agent 對話系統** - 基於 GPT-4 的智能客服
- 📊 **後台管理系統** - 完整的內容管理與數據追蹤
- 🎨 **可嵌入式 Widget** - 輕鬆整合到任何網站
- 📈 **LLM Trace 追蹤** - 完整的對話記錄與成本分析

### 技術棧

**前端**:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (後台)
- Vanilla CSS (Agent Panel - 完全獨立)

**後端**:
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL

**AI**:
- OpenAI GPT-4
- Function Calling
- Tool Use Pattern

---

## 架構設計

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                         客戶網站                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  <script src="lens-widget.js"></script>            │     │
│  │  ↓                                                  │     │
│  │  Widget (Agent Panel) - 白色透明玻璃設計             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ WebSocket/HTTP
┌─────────────────────────────────────────────────────────────┐
│                    Lens Service Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Chat API   │  │  Admin API   │  │  Widget CDN  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           ↓                ↓                                 │
│  ┌──────────────────────────────────────────────┐          │
│  │         Agent System (agents/)               │          │
│  │  - Session Manager                           │          │
│  │  - Tool Manager (Skills + Knowledge Base)    │          │
│  │  - Trace Logger                              │          │
│  └──────────────────────────────────────────────┘          │
│           ↓                                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │         Database (PostgreSQL)                │          │
│  │  - Sessions / Messages                       │          │
│  │  - Site/URL Prompts                          │          │
│  │  - Skills / Knowledge Base                   │          │
│  │  - LLM Traces                                │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                  Admin Dashboard (後台)                       │
│  橙色 2.5D 浮雕設計 - 完全獨立於 Agent Panel                   │
│  - Dashboard / Traces                                        │
│  - Site Prompts / URL Prompts                               │
│  - Skills / Knowledge Base                                  │
│  - Test Agent                                               │
└─────────────────────────────────────────────────────────────┘
```

### 資料夾結構

```
lens-service-v3/
├── admin/                    # 後台管理系統 (橙色設計)
│   ├── src/
│   │   ├── pages/           # Dashboard, Traces, Settings, etc.
│   │   ├── components/      # 共用組件
│   │   ├── api/             # API 調用
│   │   └── index.css        # 橙色 2.5D 浮雕設計
│   └── dist/                # 建置輸出
│
├── packages/
│   └── agent-panel/         # Agent Panel (白色透明玻璃設計)
│       └── agent-panel.ts   # 獨立的 Widget 組件
│
├── widget/                  # Widget 封裝 (使用 agent-panel)
│   ├── src/
│   │   └── widget.ts        # Widget 初始化邏輯
│   └── dist/
│       └── lens-widget.iife.js  # 客戶嵌入的 JS 文件
│
├── server/                  # 後端服務
│   ├── src/
│   │   ├── index.ts         # Express 服務器
│   │   ├── routes/          # API 路由
│   │   │   ├── chat.ts      # 對話 API
│   │   │   └── admin/       # 後台 API
│   │   └── assets/          # 靜態資源 (widget_icon.svg)
│   └── dist/
│
├── agents/                  # AI Agent 系統
│   ├── services/
│   │   ├── session-manager.ts    # Session 管理
│   │   ├── tool-manager.ts       # Tool 管理
│   │   └── trace-logger.ts       # LLM Trace 記錄
│   └── tools/              # Function Calling Tools
│
└── prisma/                 # 資料庫
    ├── schema.prisma       # 資料庫 Schema
    └── migrations/         # 遷移記錄
```

---

## 核心組件

### 1. Agent Panel (packages/agent-panel/)

**設計理念**: 完全獨立的 Widget，可嵌入任何網站

**視覺設計**:
- 白色透明玻璃質感 (Frosted Glass)
- `background: rgba(255, 255, 255, 0.15)`
- `backdrop-filter: blur(40px)`
- 與後台管理系統**完全無關**

**核心類別**: `AgentPanel`

```typescript
class AgentPanel {
  constructor(config: AgentPanelConfig)
  mount(container: HTMLElement): void
  open(): void
  close(): void
}
```

### 2. Admin Dashboard (admin/)

**設計理念**: 企業級後台管理系統

**視覺設計**:
- 橙色漸層 (#FF9A56 → #FF7F50)
- 2.5D 浮雕效果
- Sharp shadows (blur-radius: 2-6px)

**主要頁面**:
- Dashboard - 統計數據總覽
- LLM Traces - 對話追蹤與成本分析
- Site Prompts - 全站提示詞
- URL Prompts - URL 特定提示詞
- Skills - AI 工具管理
- Knowledge Base - 知識庫
- Test Agent - Widget 測試環境

### 3. Server (server/)

**責任**:
- 提供 Chat API
- 提供 Admin API
- 靜態文件服務 (Widget CDN)
- Session 管理
- LLM Trace 記錄

---

## Agent Panel 完整功能

### 功能概述

Agent Panel 是一個**可嵌入任何網站的 AI 客服 Widget**，提供智能對話、工具調用、會話管理等功能。

### 1. 核心功能

#### 1.1 對話功能

**基本對話**:
- ✅ 使用者輸入訊息
- ✅ AI Agent 智能回覆
- ✅ 支援多輪對話
- ✅ 上下文記憶

**訊息類型**:
- 文字訊息
- Tool Call 展示 (可展開/收合查看詳細結果)
- 錯誤訊息處理

**實現位置**: `packages/agent-panel/agent-panel.ts`

```typescript
// 發送訊息
private async sendMessage(message: string): Promise<void> {
  // 1. 添加使用者訊息到 UI
  // 2. 調用 Chat API
  // 3. 處理 AI 回應
  // 4. 處理 Tool Calls
  // 5. 更新 UI
}
```

#### 1.2 工具調用 (Tool Calling)

**自動模式**:
- 使用者可開啟「自動執行」模式
- AI 自動執行所有 Tool Calls
- 無需每次確認

**手動模式**:
- AI 請求執行工具時需使用者確認
- 顯示工具名稱和參數
- 使用者點擊確認後執行

**支援的工具類型**:
- Search Knowledge Base (搜尋知識庫)
- Get URL Content (獲取網頁內容)
- Search Website (搜尋站內內容)
- 自定義 Skills

**實現位置**: `agents/services/tool-manager.ts`

```typescript
class ToolManager {
  // 獲取所有可用工具定義
  getToolDefinitions(): ToolDefinition[]

  // 執行工具調用
  async executeTool(toolCall: ToolCall): Promise<any>
}
```

#### 1.3 會話管理 (Session Management)

**多會話支援**:
- ✅ 使用者可創建多個對話
- ✅ 切換不同會話
- ✅ 每個會話獨立的上下文
- ✅ 會話列表顯示最後訊息和時間

**Session Sidebar**:
- 左側側邊欄顯示會話列表
- 點擊切換會話
- 新建助手按鈕
- Slide-in/out 動畫

**會話資料結構**:
```typescript
interface Session {
  id: string
  createdAt: string
  expiresAt: string
  isActive: boolean
  lastMessage: string
  messageCount: number
}
```

**實現位置**: `agents/services/session-manager.ts`

```typescript
class SessionManager {
  // 創建新會話
  async createSession(userId: string): Promise<Session>

  // 獲取使用者的所有會話
  async getUserSessions(userId: string): Promise<Session[]>

  // 添加訊息到會話
  async addMessage(sessionId: string, message: Message): Promise<void>
}
```

#### 1.4 語言切換

**支援語言**:
- 繁體中文 (zh-TW)
- English (en)
- 日本語 (ja)

**實現方式**:
- Hover menu 中的語言按鈕
- 點擊切換語言
- 立即生效

**實現位置**: `packages/agent-panel/agent-panel.ts`

```typescript
private language: string = 'zh-TW'

// 切換語言
private handleLanguageChange(): void {
  const languages = ['zh-TW', 'en', 'ja']
  const currentIndex = languages.indexOf(this.language)
  this.language = languages[(currentIndex + 1) % languages.length]
  this.render()
}
```

#### 1.5 Hover Menu (懸停菜單)

**觸發方式**: Hover 在右下角的浮動按鈕上

**菜單項目**:
1. 🌐 語言切換
2. ⚡ 自動執行開關
3. 🔄 重新開始 (創建新會話)
4. 💬 聯絡真人客服

**視覺效果**:
- 白色透明玻璃卡片
- 從按鈕右側滑出
- Backdrop blur 效果

**實現位置**: `packages/agent-panel/agent-panel.ts` (Line 657-687)

```css
.lens-hover-menu {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 8px;
  display: none;
}
```

#### 1.6 真人客服模式

**切換方式**: 從 Hover Menu 點擊「聯絡客服」

**功能**:
- 表單填寫 (姓名、Email、問題描述)
- 提交後進入待處理狀態
- 可返回 AI 助手

**實現位置**: `packages/agent-panel/agent-panel.ts`

```typescript
private mode: PanelMode = 'agent' // 'agent' | 'human-support'

// 切換模式
private switchToHumanSupport(): void {
  this.mode = 'human-support'
  this.render()
}
```

### 2. UI 設計規範

#### 2.1 浮動按鈕 (Toggle Button)

**位置**: 固定在右下角
- `position: fixed`
- `bottom: 20px`
- `right: 20px`

**設計**:
- 圓形按鈕 (60px × 60px)
- 白色透明背景
- 橙色漸層 (暫時 - 應改為白色)
- Icon: widget_icon.svg

**狀態**:
- 關閉: 顯示 Widget Icon
- 開啟: 顯示 ✕

#### 2.2 Panel Content (對話面板)

**佈局**:
```
┌────────────────────────────────────┐
│  Session Sidebar  │  Chat Area     │
│  (可收合)          │                │
│                   │  ┌──────────┐  │
│  [Sessions List]  │  │ Header   │  │
│                   │  └──────────┘  │
│                   │  ┌──────────┐  │
│                   │  │ Messages │  │
│                   │  │          │  │
│                   │  └──────────┘  │
│                   │  ┌──────────┐  │
│                   │  │ Input    │  │
│                   │  └──────────┘  │
└────────────────────────────────────┘
```

**尺寸**:
- Full screen overlay
- `position: fixed`
- `top: 0, left: 0, right: 0, bottom: 0`

**背景**:
- 白色透明玻璃質感
- `background: rgba(255, 255, 255, 0.15)`
- `backdrop-filter: blur(40px)`

#### 2.3 Session Sidebar

**開關狀態**:
- 關閉: `width: 0`
- 開啟: `width: 320px`

**內容**:
- Header: 「Sessions」標題 + 新建按鈕
- Sessions List: 會話項目列表

**會話項目設計**:
- 顯示最後訊息預覽
- 顯示時間 (Just now / 2h ago / 3d ago)
- Active 狀態高亮 (橙色漸層)
- Hover 效果

#### 2.4 Chat Header

**內容**:
- Sidebar Toggle 按鈕 (☰ / ✕)
- Lens OS Logo (橙色漸層文字)

**設計**:
- 白色透明背景
- Bottom border

#### 2.5 Messages Area

**訊息氣泡**:

**使用者訊息** (右側):
- 橙色漸層背景
- 白色文字
- 圓角氣泡

**AI 訊息** (左側):
- 白色半透明背景
- 黑色文字
- 圓角氣泡

**Tool Call 展示**:
- 可展開/收合的區塊
- 標題: 🔧 工具名稱
- 內容: JSON 格式結果

#### 2.6 Input Area

**組件**:
- 文字輸入框
- 發送按鈕 (Widget Icon)
- 語音按鈕 (disabled - 未實現)

**設計**:
- 白色透明背景
- Rounded input
- Orange focus border

### 3. 完整功能清單

#### ✅ 已實現功能

- [x] 基本對話功能
- [x] 多輪對話上下文
- [x] Tool Calling (手動/自動模式)
- [x] 會話管理 (創建/切換/列表)
- [x] Session Sidebar (展開/收合)
- [x] 語言切換 (中/英/日)
- [x] Hover Menu
- [x] 真人客服模式
- [x] 白色透明玻璃設計
- [x] 完全獨立可嵌入
- [x] Widget Icon 顯示

#### 🚧 待實現/優化功能

- [ ] 語音輸入 (Microphone)
- [ ] 檔案上傳
- [ ] 圖片顯示
- [ ] Markdown 渲染
- [ ] Code 語法高亮
- [ ] Typing Indicator (AI 正在輸入...)
- [ ] 訊息已讀/未讀狀態
- [ ] 通知提示音
- [ ] 離線訊息緩存
- [ ] 更豐富的錯誤處理
- [ ] 重試機制
- [ ] 訊息搜尋
- [ ] 匯出對話記錄

### 4. 配置選項

```typescript
interface AgentPanelConfig {
  apiUrl: string        // API 端點
  userId: string        // 使用者 ID
  onClose?: () => void  // 關閉回調
}
```

**使用範例**:

```javascript
const panel = new AgentPanel({
  apiUrl: 'https://your-domain.com',
  userId: 'user-123'
})

panel.mount(document.getElementById('agent-panel-root'))
```

---

## 資料庫設計

### Schema 概覽

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 核心資料表

#### 1. Sessions (會話)

```prisma
model Session {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime  @map("expires_at")
  isActive   Boolean   @default(true) @map("is_active")
  messages   Message[]

  @@map("sessions")
}
```

**用途**: 管理使用者會話

**關鍵欄位**:
- `userId`: 使用者 ID (外部系統提供)
- `expiresAt`: 會話過期時間 (24 小時)
- `isActive`: 是否活躍

#### 2. Messages (訊息)

```prisma
model Message {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant" | "system" | "tool"
  content   String   @db.Text
  toolCalls Json?    @map("tool_calls") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at")

  @@index([sessionId])
  @@map("messages")
}
```

**用途**: 儲存對話訊息

**關鍵欄位**:
- `role`: 訊息角色
- `content`: 訊息內容
- `toolCalls`: Tool Calling 資料

#### 3. SitePrompt (全站提示詞)

```prisma
model SitePrompt {
  id          String   @id @default(uuid())
  role        String   @default("system")
  content     String   @db.Text
  order       Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("site_prompts")
}
```

**用途**: 全站通用的 System Prompt

#### 4. URLPrompt (URL 特定提示詞)

```prisma
model URLPrompt {
  id          String   @id @default(uuid())
  urlPattern  String   @map("url_pattern")
  role        String   @default("system")
  content     String   @db.Text
  priority    Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([urlPattern])
  @@map("url_prompts")
}
```

**用途**: 針對特定 URL 的 Prompt

**範例**:
- `/product/*` → 產品相關提示
- `/support/*` → 客服相關提示

#### 5. Skill (AI 工具)

```prisma
model Skill {
  id          String   @id @default(uuid())
  name        String   @unique
  description String   @db.Text
  parameters  Json     @db.JsonB
  endpoint    String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("skills")
}
```

**用途**: 自定義 Function Calling 工具

**欄位說明**:
- `name`: 工具名稱
- `description`: 工具描述 (給 LLM 看)
- `parameters`: JSON Schema 參數定義
- `endpoint`: API 端點 (如果是外部 API)

#### 6. KnowledgeBase (知識庫)

```prisma
model KnowledgeBase {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text
  category    String?
  tags        String[]
  embedding   Unsupported("vector(1536)")?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([category])
  @@map("knowledge_base")
}
```

**用途**: 向量知識庫 (pgvector)

**欄位說明**:
- `embedding`: OpenAI text-embedding-ada-002 向量
- `tags`: 標籤陣列
- `category`: 分類

#### 7. LLMTrace (LLM 追蹤)

```prisma
model LLMTrace {
  id            String   @id @default(uuid())
  sessionId     String   @map("session_id")
  userId        String   @map("user_id")
  input         Json     @db.JsonB
  output        String   @db.Text
  model         String   @default("gpt-4")
  temperature   Float?
  maxTokens     Int?     @map("max_tokens")
  inputTokens   Int?     @map("input_tokens")
  outputTokens  Int?     @map("output_tokens")
  totalTokens   Int?     @map("total_tokens")
  cost          Float?
  status        String   @default("success")
  error         String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([sessionId])
  @@index([userId])
  @@index([status])
  @@map("llm_traces")
}
```

**用途**: LLM 調用追蹤與成本分析

**關鍵欄位**:
- `inputTokens` / `outputTokens`: Token 使用量
- `cost`: 成本 (USD)
- `status`: success / error / timeout

**成本計算**:
```typescript
// GPT-4 定價
INPUT_COST_PER_1K = 0.01   // $0.01 per 1K tokens
OUTPUT_COST_PER_1K = 0.03  // $0.03 per 1K tokens

cost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03
```

---

## 後台管理系統

### 設計系統

**顏色主題**:
- 主色: #FF9A56 → #FF7F50 (橙色漸層)
- 輔助色: 藍色 (#3498db), 綠色 (#2ecc71), 紅色 (#e74c3c)

**2.5D 浮雕效果**:
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%);
  box-shadow:
    0 3px 6px rgba(255, 154, 86, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.1);
}
```

### 頁面功能

#### 1. Dashboard (統計總覽)

**LLM Trace Statistics** (置頂):
- 時間範圍選擇: 7天 / 30天 / 90天 / 全部
- 統計指標:
  - Total Traces (總追蹤數)
  - Success Rate (成功率 %)
  - Total Tokens (總 Token 數)
  - Total Cost (總成本 USD)

**System Overview**:
- Site Prompts 數量
- URL Prompts 數量
- Skills 數量
- Knowledge Base 數量
- Active Sessions 數量

**實現位置**: `admin/src/pages/Dashboard.tsx`

#### 2. LLM Traces (追蹤記錄)

**功能**:
- 列表顯示所有 LLM 調用
- 時間範圍篩選
- 狀態篩選 (Success / Error)
- 統計卡片同 Dashboard

**表格欄位**:
- Session ID
- User ID
- Model
- Total Tokens
- Cost
- Status
- Created At

**實現位置**: `admin/src/pages/Traces.tsx`

#### 3. Site Prompts (全站提示詞)

**功能**:
- 新增/編輯/刪除 Site Prompt
- 順序調整 (order)
- 啟用/停用
- 預覽

**表單欄位**:
- Role: system / user / assistant
- Content: 提示詞內容
- Order: 排序
- Is Active: 是否啟用

**實現位置**: `admin/src/pages/SitePrompts.tsx`

#### 4. URL Prompts (URL 提示詞)

**功能**:
- URL Pattern 匹配規則
- 優先級設定
- 新增/編輯/刪除

**URL Pattern 範例**:
- `/product/*`
- `/support/faq`
- `https://example.com/blog/*`

**實現位置**: `admin/src/pages/URLPrompts.tsx`

#### 5. Skills (工具管理)

**功能**:
- 新增自定義工具
- 編輯工具參數
- 測試工具執行

**工具定義**:
```json
{
  "name": "get_weather",
  "description": "Get weather information",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name"
      }
    },
    "required": ["location"]
  }
}
```

**實現位置**: `admin/src/pages/Skills.tsx`

#### 6. Knowledge Base (知識庫)

**功能**:
- 新增知識文檔
- 向量化 (Embedding)
- 分類/標籤管理
- 搜尋測試

**編輯器**:
- Markdown 支援
- 即時預覽
- 自動 Embedding

**實現位置**: `admin/src/pages/KnowledgeBase.tsx`

#### 7. Test Agent (測試環境)

**功能**:
- 載入任意 URL 到 iframe
- Agent Panel 覆蓋在 iframe 上
- 測試對話功能
- Reset Session

**佈局**:
```
┌──────────────────────────────────────┐
│ [URL Input] [Load] [Reset Session]  │ ← 控制列
├──────────────────────────────────────┤
│                                      │
│         Loaded Website (iframe)      │
│                                      │
│         Agent Panel (overlay)        │
│                                      │
└──────────────────────────────────────┘
```

**實現位置**: `admin/src/pages/TestAgent.tsx`

---

## Widget 串接指南

### 方案 A: 直接引入 Script (推薦)

**步驟 1**: 在網站的 `<head>` 或 `</body>` 前加入:

```html
<!-- 引入 Lens Widget -->
<script src="https://your-domain.com/widget/lens-widget.js"></script>

<!-- 初始化配置 -->
<script>
  window.LENS_CONFIG = {
    apiUrl: 'https://your-domain.com',
    userId: 'user-' + Math.random().toString(36).substr(2, 9) // 或從您的系統獲取
  }
</script>

<!-- Widget 容器 -->
<div id="lens-widget-root"></div>
```

**就這樣！Widget 會自動初始化並顯示在右下角。**

---

### 方案 B: 手動初始化

```html
<div id="lens-widget-root"></div>

<script src="https://your-domain.com/widget/lens-widget.js"></script>
<script>
  // 手動初始化
  const container = document.getElementById('lens-widget-root')
  const panel = new LensAgentPanel({
    apiUrl: 'https://your-domain.com',
    userId: 'user-123'
  })
  panel.mount(container)
</script>
```

---

### 方案 C: NPM 安裝 (進階)

**安裝**:
```bash
npm install @your-org/lens-agent-panel
```

**使用**:
```typescript
import { AgentPanel } from '@your-org/lens-agent-panel'

const panel = new AgentPanel({
  apiUrl: process.env.LENS_API_URL,
  userId: getCurrentUserId()
})

panel.mount(document.getElementById('agent-panel-root'))
```

---

### 配置選項詳解

```typescript
interface AgentPanelConfig {
  /**
   * API 端點 (必填)
   * 範例: 'https://api.yourcompany.com'
   */
  apiUrl: string

  /**
   * 使用者 ID (必填)
   * 建議從您的登入系統獲取
   */
  userId: string

  /**
   * 關閉回調 (選填)
   * 當使用者關閉 Panel 時觸發
   */
  onClose?: () => void
}
```

---

### 樣式自定義

Widget 使用 **Shadow DOM** 隔離樣式,但您可以透過 CSS 變數自定義:

```css
/* 在您的網站 CSS 中 */
:root {
  --lens-primary-color: #FF9A56;
  --lens-panel-blur: 40px;
  --lens-panel-opacity: 0.15;
}
```

---

### 事件監聽

```javascript
// 監聽 Panel 開啟
window.addEventListener('lens:panel:open', () => {
  console.log('Panel opened')
})

// 監聽 Panel 關閉
window.addEventListener('lens:panel:close', () => {
  console.log('Panel closed')
})

// 監聽新訊息
window.addEventListener('lens:message:sent', (event) => {
  console.log('User sent:', event.detail.message)
})
```

---

### 完整範例

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>我的網站</title>
</head>
<body>
  <!-- 您的網站內容 -->
  <h1>歡迎來到我的網站</h1>

  <!-- Lens Widget -->
  <div id="lens-widget-root"></div>

  <script src="https://your-domain.com/widget/lens-widget.js"></script>
  <script>
    window.LENS_CONFIG = {
      apiUrl: 'https://your-domain.com',
      userId: 'user-123',
      onClose: () => {
        console.log('Widget closed')
      }
    }
  </script>
</body>
</html>
```

---

## API 文檔

### Chat API

#### POST /api/chat

發送訊息到 AI Agent

**Request**:
```json
{
  "sessionId": "session-uuid",
  "userId": "user-123",
  "message": "你好",
  "currentUrl": "https://example.com/product/123"
}
```

**Response**:
```json
{
  "sessionId": "session-uuid",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "您好！我是 AI 助手，有什麼可以幫助您的嗎？"
    }
  ],
  "toolCalls": []
}
```

---

### Admin API

#### GET /api/admin/traces

獲取 LLM Traces

**Query Parameters**:
- `dateFrom`: ISO date string (optional)
- `dateTo`: ISO date string (optional)
- `status`: success | error (optional)
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response**:
```json
[
  {
    "id": "trace-uuid",
    "sessionId": "session-uuid",
    "userId": "user-123",
    "model": "gpt-4",
    "inputTokens": 100,
    "outputTokens": 150,
    "totalTokens": 250,
    "cost": 0.0055,
    "status": "success",
    "createdAt": "2025-12-04T10:30:00Z"
  }
]
```

#### GET /api/admin/traces/stats

獲取統計數據

**Query Parameters**:
- `dateFrom`: ISO date string (optional)
- `dateTo`: ISO date string (optional)

**Response**:
```json
{
  "totalTraces": 1234,
  "successCount": 1200,
  "errorCount": 34,
  "successRate": 97.2,
  "totalCost": 12.45,
  "totalTokens": 345678
}
```

---

## 部署指南

### 環境變數

創建 `.env` 文件:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lens_service"

# OpenAI
OPENAI_API_KEY="sk-..."

# Server
PORT=3333
NODE_ENV=production

# CORS (如果需要)
ALLOWED_ORIGINS="https://yourwebsite.com,https://admin.yourwebsite.com"
```

### 建置步驟

```bash
# 1. 安裝依賴
yarn install

# 2. 生成 Prisma Client
yarn prisma generate

# 3. 執行資料庫遷移
yarn prisma migrate deploy

# 4. 建置所有組件
yarn build

# 5. 啟動服務
yarn start
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production

COPY . .

RUN yarn build

EXPOSE 3333

CMD ["yarn", "start"]
```

### Nginx 配置

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # Widget CDN
  location /widget/ {
    proxy_pass http://localhost:3333/widget/;
  }

  # API
  location /api/ {
    proxy_pass http://localhost:3333/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }

  # Admin Dashboard
  location /admin {
    proxy_pass http://localhost:3333/admin;
  }
}
```

---

## 總結

Lens Service v3 提供了一個完整的企業級 AI 客服解決方案:

✅ **Agent Panel** - 白色透明玻璃設計,可嵌入任何網站
✅ **後台管理** - 橙色 2.5D 浮雕設計,完整的管理功能
✅ **LLM Trace** - 完整的成本追蹤與數據分析
✅ **工具系統** - 靈活的 Function Calling 擴展
✅ **知識庫** - 向量搜尋支援

**下一步**:
1. 部署到生產環境
2. 添加更多自定義工具
3. 優化 Agent 回覆品質
4. 整合更多第三方服務

---

**最後更新**: 2025-12-04
**維護者**: Lens Team
**License**: MIT

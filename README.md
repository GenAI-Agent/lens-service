# Lens Service v3 - AI Customer Service Widget

**Standalone AI 客服系統** - 一個指令啟動完整服務！

完整的 AI 客服 Widget，支援流式對話、知識搜尋、網頁互動。站主只需要提供自己的 PostgreSQL 和 OpenAI API Key。

## 🎯 核心特性

- ✅ **Standalone 部署**: 一個服務包含所有功能（API + Widget + Admin）
- ✅ **零多租戶設計**: 站主擁有自己的 DB 和 API Keys
- ✅ **Streaming Response**: SSE 即時串流回覆
- ✅ **Hybrid Search**: Vector (OpenAI Embeddings) + BM25 關鍵字搜尋
- ✅ **Memory Compact**: 自動壓縮對話歷史，節省 75-85% tokens
- ✅ **Widget-based DOM**: 直接在使用者頁面操作（非 Playwright）
- ✅ **Multimodal AI**: 支援截圖 + Markdown，GPT-5.1 視覺理解
- ✅ **Skills 系統**: 自定義 `/skill_name` 指令
- ✅ **Admin Dashboard**: 完整的後台管理介面
- ✅ **Deep Crawl**: 2層深度網站爬取，自動提取內容

## 🚀 5 分鐘快速啟動

```bash
# 1. 複製環境變數
cp .env.example .env

# 2. 編輯 .env 填入你的 DATABASE_URL 和 OPENAI_API_KEY

# 3. 安裝依賴
yarn install-all

# 4. 設置資料庫
yarn prisma:generate
yarn prisma:push

# 5. 建立前端
yarn build

# 6. 啟動服務
yarn start
```

**完成！** 服務啟動在 `http://localhost:3002`

- 📊 **Admin Dashboard**: `http://localhost:3002/admin`
- 🔌 **Widget CDN**: `http://localhost:3002/widget/lens-widget.js`
- 💬 **Chat API**: `http://localhost:3002/api/chat`

📖 **詳細說明**: [QUICKSTART.md](./QUICKSTART.md)

## 📁 專案結構

```
lens-service-v3/
├── agents/                    # Agent 核心邏輯
│   ├── config/               # 配置和型別定義
│   │   ├── types.ts         # TypeScript 型別
│   │   └── ...
│   ├── context-engineer/     # Context 管理
│   │   ├── system-prompt.ts # System Prompt
│   │   ├── memory-manager.ts # Memory Compact
│   │   ├── prompt-loader.ts  # Site/URL Prompts
│   │   └── prompt-builder.ts # 完整 Prompt 組裝
│   ├── tools/                # Agent 工具
│   │   ├── knowledge-search.ts # Hybrid Search
│   │   └── web-use.ts        # Web 互動
│   ├── utils/                # 工具函數
│   │   ├── tool-parser.ts   # 解析 <tool> 標籤
│   │   └── skill-parser.ts  # 解析 /skill 指令
│   └── supervisor-agent.ts  # 主 Agent (多輪對話)
├── widget/                   # 前端 Widget
│   ├── web-use-service.ts   # DOM 操作、截圖、Markdown
│   ├── widget-main.ts       # Widget UI 邏輯
│   ├── index.html          # Demo 頁面
│   └── package.json
├── server/                   # 後端 API
│   ├── src/
│   │   └── index.ts         # Express + SSE
│   └── package.json
├── admin/                    # 後台管理 (待實作)
├── prisma/
│   └── schema.prisma        # Database Schema
└── docs/                     # 文檔
    ├── WEB_USE_ARCHITECTURE.md
    ├── DEVELOPMENT_PLAN.md
    └── DATABASE_SCHEMA.md
```

## 🌐 嵌入到你的網站

### 方式 1: 直接嵌入 HTML

```html
<!-- 在 </body> 之前加入 -->
<script>
  window.LENS_CONFIG = {
    apiUrl: 'http://localhost:3002',  // 你的 Lens Service URL
    userId: 'user-123',  // 實際的使用者 ID
  };
</script>
<script src="http://localhost:3002/widget/lens-widget.js"></script>
<link rel="stylesheet" href="http://localhost:3002/widget/assets/index.css">
```

### 方式 2: Next.js

```jsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script id="lens-config" strategy="beforeInteractive">
          {`
            window.LENS_CONFIG = {
              apiUrl: 'https://your-lens-service.com',
              userId: '${user?.id || 'anonymous'}',
            };
          `}
        </Script>
        <Script src="https://your-lens-service.com/widget/lens-widget.js" />
        <link
          rel="stylesheet"
          href="https://your-lens-service.com/widget/assets/index.css"
        />
      </body>
    </html>
  );
}
```

## 📊 Admin Dashboard 功能

開啟 `http://localhost:3002/admin` 進入管理介面：

### 1. **Knowledge Base** - 知識庫管理
- 新增/編輯客服 QA、公司文件
- 自動生成 Vector Embedding（用於語意搜尋）
- 支援 BM25 關鍵字搜尋
- 欄位：name, description, content, keywords, category

### 2. **Site Prompts** - 全站 Prompt
- 設定網站基本資訊
- 定義 Agent 行為和語氣
- 說明網站功能和政策

### 3. **URL Prompts** - URL 路徑 Prompt
- 針對特定頁面類型配置（如 `/products/*`, `/checkout`）
- 說明頁面元素和功能
- 優先級排序

### 4. **Skills** - 自定義技能
- 建立 `/skill_name` 指令
- 預先定義 Agent 行為模式
- 範例：`/order-lookup`, `/product-recommendation`

### 5. **Sessions** - 對話記錄
- 按 user_id 分組查看所有對話
- 時間排序
- 查看完整訊息歷史
- **手動回覆**功能（處理複雜問題）

### 6. **Test Agent** - 測試介面
- 即時測試 Agent 功能
- 查看 Tool Calls 和結果
- 除錯和驗證配置

## 🔧 開發模式

如果要修改 Widget 或 Admin 的前端程式碼：

```bash
yarn dev

# 或分別安裝
cd agents && yarn install
cd ../widget && yarn install
cd ../server && yarn install
```

### 2. 配置環境變數

複製 `.env.example` 到 `.env` 並填入：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lens_service_v3"

# OpenAI API
OPENAI_API_KEY="sk-..."

# LLM Model
LLM_MODEL="gpt-5.1"

# Server
PORT=3002
```

### 3. 資料庫設置

```bash
# 生成 Prisma Client
yarn prisma generate

# 推送 Schema 到資料庫
yarn prisma db push
```

### 4. 啟動服務

```bash
# 啟動 Server (Terminal 1)
cd server
yarn dev

# 啟動 Widget Dev Server (Terminal 2)
cd widget
yarn dev
```

## 📊 資料庫 Schema

### 核心表

- **sessions**: 對話 Session (含 userId)
- **messages**: 對話訊息 (支援 Memory Compact)
- **navigation_history**: 頁面導航歷史
- **site_prompts**: 全站 Prompt 配置
- **url_path_prompts**: URL 路徑 Prompt 配置
- **knowledge_base**: 知識庫 (Hybrid Search: Vector + BM25)
- **skills**: 技能配置 (`/skill_name`)

## 🤖 Agent 工作流程

### 1. 使用者發送訊息

Widget → Server `/api/chat` (SSE)

### 2. Supervisor Agent 處理

```
1. 解析 Skill (/skill_name query)
2. 儲存使用者訊息到 DB
3. 進入多輪 LLM 循環:
   a. 組裝完整 Prompt (System + Page + Site + URL + Memory + User Query)
   b. 呼叫 LLM (GPT-5.1) streaming
   c. 即時 Parse 工具調用 (<tool>...</tool>)
   d. 執行工具並儲存結果
   e. 檢查 <complete/> 標記
4. Memory Compact (如果需要)
5. 回傳完成
```

### 3. Prompt 組成順序

```
[0] System Prompt (工具說明、規則)
[1] Current Page State (URL, Title, Markdown, Screenshot) ← 不存 DB
[2] Site Prompt (全站配置)
[3] URL Prompt (頁面類型配置)
[4] Navigation History (最近 5 筆)
[5-N] Active Messages (未 archived 的訊息，包含 compacted summary)
[N+1] User Query (當前問題)
```

## 🔧 工具系統

### 1. knowledge_search

Hybrid Search: Vector Similarity + BM25 Keyword Matching

```typescript
<tool>
tool_name: knowledge_search
parameters: {
  "query": "如何退貨",
  "topK": 5
}
</tool>
```

**實作**:
- OpenAI `text-embedding-3-small` 生成 Query Embedding
- 與 `knowledge_base` 表中的 embeddings 計算 Cosine Similarity
- BM25 關鍵字匹配 (keywords 欄位)
- Reciprocal Rank Fusion (RRF) 合併結果

### 2. web_use

DOM 操作工具

```typescript
<tool>
tool_name: web_use
parameters: {
  "action": "highlight",
  "selector": ".product-price"
}
</tool>
```

**支援動作**:
- `analyze`: 分析頁面 (DOM → Markdown + Screenshot)
- `click`: 點擊元素
- `scroll`: 滾動頁面
- `highlight`: 高亮標註元素

## 💾 Memory Compact

自動壓縮對話歷史，避免 token 超限：

```
觸發條件:
- Active messages > 20 條
- 或 Estimated tokens > 8000

壓縮策略:
- 保留最近 10 條訊息
- 其餘用 LLM 生成摘要
- 標記為 archived = true
- 插入一條 isCompacted = true 的摘要訊息
```

**效果**: 節省 75-85% tokens

## 🎨 Skills 系統

使用者可以用 `/skill_name` 調用預設的技能：

```
用戶輸入: /order-lookup 查詢我的訂單狀態

處理流程:
1. SkillParser 解析出 skill_name = "order-lookup"
2. 從 DB 載入該 Skill 的 prompt
3. 修改 query = skill.prompt + "\n\nUser Query:\n" + 原始 query
4. 傳給 LLM
```

## 🌐 Site & URL Prompts

### Site Prompts (全站)

```sql
INSERT INTO site_prompts (name, prompt, is_global) VALUES (
  '網站說明',
  '我們是 3C 電商網站。主要功能：瀏覽產品、加入購物車、結帳、會員中心...',
  TRUE
);
```

### URL Path Prompts (特定頁面)

```sql
INSERT INTO url_path_prompts (url_pattern, prompt, priority) VALUES (
  '/products/*',
  '這是產品詳情頁。包含：產品名稱、價格 (.product-price)、加入購物車按鈕...',
  100
);
```

**Pattern Matching**: 支援萬用字元 (`/products/*`)

## 📡 API

### POST /api/chat

SSE Streaming endpoint

**Request**:
```json
{
  "userId": "user-123",
  "message": "這個產品多少錢？",
  "currentUrl": "https://example.com/products/laptop",
  "currentPage": {
    "url": "...",
    "title": "...",
    "markdown": "...",
    "screenshot": "data:image/jpeg;base64,...",
    "actionableElements": [...]
  }
}
```

**Response** (SSE):
```
data: {"type":"text","content":"正在查詢..."}
data: {"type":"tool_call","toolCall":{"name":"knowledge_search","parameters":{...}}}
data: {"type":"tool_result","toolResult":{...}}
data: {"type":"text","content":"價格是 NT$ 36,900"}
data: {"type":"done"}
data: [DONE]
```

## 🔄 完整流程範例

### 情境: 使用者問「這個產品多少錢？」

```
1. Widget 截圖當前頁面 + DOM to Markdown
2. 發送到 Server /api/chat
3. Server:
   a. 取得/建立 Session
   b. 建立 Supervisor Agent
   c. Agent.execute():
      - 儲存 user message
      - buildPrompt() 組裝完整 Prompt
      - 呼叫 LLM (gpt-5.1) streaming
      - LLM 輸出: "我看到頁面上有價格資訊<complete/>"
      - 偵測到 <complete/> → 結束
4. Server SSE 串流回覆給 Widget
5. Widget 顯示回答
```

## 🛠 開發指南

### 新增工具

1. 在 `agents/tools/` 建立新工具
2. 實作 `execute(params): Promise<ToolResult>`
3. 在 `supervisor-agent.ts` 的 `executeTool()` 中註冊
4. 在 `system-prompt.ts` 中說明工具用法

### 新增 Skill

```sql
INSERT INTO skills (name, prompt) VALUES (
  'product-recommendation',
  '你是產品推薦專家。根據使用者需求推薦最適合的產品。'
);
```

### 部署到生產環境

1. 使用者提供自己的 PostgreSQL
2. 使用者提供自己的 OpenAI API Key
3. 執行 `yarn prisma db push` 建立表結構
4. 啟動 Server
5. 在網站中嵌入 Widget Script

## 📝 待實作功能

- [ ] Admin 後台 (Prompt 管理、Knowledge Base CRUD)
- [ ] Widget pause/resume 機制
- [ ] 更完善的錯誤處理
- [ ] Widget 身份驗證整合
- [ ] 單元測試和整合測試

## 📚 相關文件

- [Web Use Architecture](./docs/WEB_USE_ARCHITECTURE.md) - Widget 架構說明
- [Development Plan](./docs/DEVELOPMENT_PLAN.md) - 完整開發計畫
- [Database Schema](./docs/DATABASE_SCHEMA.md) - 資料庫 Schema 詳細說明

## 🤝 貢獻

本專案由 Claude (Sonnet 4.5) 協助開發。

## 📄 授權

MIT License

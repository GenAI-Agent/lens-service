# Lens Service v3 - Complete Database Schema

**最後更新**: 2025-12-03
**版本**: 3.1 (Simplified Single-Tenant)

## 架構說明

此資料庫設計支援：
- ✅ Session-based conversation (對話管理)
- ✅ Memory Compact (記憶壓縮，節省 75-85% tokens)
- ✅ Site & URL-specific Prompts (站點/URL 提示詞)
- ✅ Knowledge Base (知識庫，Hybrid Search)
- ✅ Skills (自定義技能)
- ✅ LLM Traces (調試與監控)

## 架構變更 (2025-12-03)

**簡化為單租戶架構**:
- ❌ 移除 `tenants` 表 (不再支援多租戶)
- ❌ 移除 `navigation_history` 表 (暫時移除導航追蹤)
- ❌ 移除 `generated_pages` 表 (暫時移除動態頁面生成)
- ✅ 簡化 `LLMTrace` 模型 (只保留 input/output 欄位)
- ✅ 所有表格不再依賴 `tenant_id`

---

## 資料表結構

### 1. `sessions` - 會話表
使用者的對話 session

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,  -- 客戶網站的 User ID
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sessions_user ON sessions(user_id, is_active);
```

**欄位說明**:
- `id`: Session 唯一 ID (UUID)
- `user_id`: **客戶網站的使用者 ID** (由客戶網站認證系統提供)
- `created_at`: 建立時間
- `expires_at`: 過期時間 (預設 24 小時，可在 .env 配置)
- `is_active`: 是否仍有效

**重要**: `user_id` 是客戶網站傳入的，Lens Service 本身不做用戶認證！

**Session 管理**:
- 自動過期清理 (定期清理 `expires_at < NOW()` 的 sessions)
- 可配置過期時間: `SESSION_EXPIRY_HOURS=24` (.env)
- 支援手動刷新 (從 Widget 的 hover 菜單觸發)

---

### 2. `messages` - 訊息表
對話訊息（支援 Memory Compact）

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Memory Compact 欄位
  is_compacted BOOLEAN DEFAULT false,
  compacted_from_id INT REFERENCES messages(id) ON DELETE SET NULL,
  compacted_to_id INT REFERENCES messages(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages(session_id, archived, timestamp);
CREATE INDEX idx_messages_compacted ON messages(session_id, is_compacted);
```

**欄位說明**:
- `role`: 訊息角色 ('user', 'assistant', 'system', 'tool')
- `content`: 訊息內容 (TEXT，支援大量文字)
- `timestamp`: 訊息時間戳
- `archived`: 是否已被壓縮（不再顯示，但保留在 DB）
- `is_compacted`: 是否為壓縮摘要訊息
- `compacted_from_id/to_id`: 壓縮的訊息範圍 (INT, 可為 NULL)

**Memory Compact 流程**:
1. 當 token 數過高 (超過閾值，如 80,000 tokens)，選擇前 N 條訊息
2. 用 LLM 生成摘要 (壓縮率約 75-85%)
3. 將原始訊息標記 `archived = true`
4. 插入新的摘要訊息 `is_compacted = true`
5. 後續查詢只取 `archived = false` 的訊息

**範例**:
```
訊息 1-10: archived = true (被壓縮)
訊息 11: is_compacted = true, content = "前10條訊息摘要: 用戶詢問產品價格..."
訊息 12-20: archived = false (正常顯示)
```

**自關聯 (Self-Referencing Relations)**:
```prisma
compactedFrom          Message?  @relation("CompactedFrom", fields: [compactedFromId], references: [id], onDelete: SetNull)
compactedTo            Message?  @relation("CompactedTo", fields: [compactedToId], references: [id], onDelete: SetNull)
messagesCompactedFrom  Message[] @relation("CompactedFrom")
messagesCompactedTo    Message[] @relation("CompactedTo")
```

---

### 3. `site_prompts` - 站點提示詞表
全站提示詞配置

```sql
CREATE TABLE site_prompts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  is_global BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_site_prompts_active ON site_prompts(is_active);
```

**欄位說明**:
- `name`: 提示詞名稱 (e.g., "網站說明", "客服政策")
- `prompt`: 提示詞內容 (TEXT, 支援長文本)
- `is_global`: 是否全站適用 (預設 true)
- `is_active`: 是否啟用 (預設 true)

**用途**: 讓站主配置網站通用說明，幫助 AI 理解網站結構與業務邏輯

**範例**:
```sql
INSERT INTO site_prompts (name, prompt, is_global) VALUES (
  '網站結構說明',
  '本站是 3C 電商網站，主要販售筆電、手機、相機。
   導航列：首頁 | 產品列表 | 購物車 | 會員中心
   用戶登入後可以查看訂單、修改資料、查詢物流。
   客服時間：週一至週五 9:00-18:00。',
  true
);
```

---

### 4. `url_path_prompts` - URL 路徑提示詞表
特定 URL 的提示詞（支援 wildcard）

```sql
CREATE TABLE url_path_prompts (
  id SERIAL PRIMARY KEY,
  url_pattern TEXT NOT NULL,
  prompt TEXT NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_url_prompts_pattern ON url_path_prompts(url_pattern);
CREATE INDEX idx_url_prompts_priority ON url_path_prompts(is_active, priority DESC);
```

**欄位說明**:
- `url_pattern`: URL 模式 (TEXT, 支援 wildcard，e.g., "/products/*", "/cart")
- `prompt`: 該路徑的提示詞 (TEXT, 支援長文本)
- `priority`: 優先級（INT, 越高越優先匹配，預設 0）
- `is_active`: 是否啟用 (預設 true)

**匹配邏輯**:
1. 按 `priority DESC` 排序
2. 使用簡單的 wildcard matching (支援 `*` 萬用字元)
3. 第一個匹配的 prompt 將被使用

**範例**:
```sql
-- 產品頁
INSERT INTO url_path_prompts (url_pattern, prompt, priority) VALUES (
  '/products/*',
  '這是商品頁面，包含：
   • 產品名稱、圖片、價格（.product-price）
   • 規格選擇（顏色、容量）
   • 數量輸入框
   • 加入購物車按鈕（右下角，綠色）',
  100
);

-- 購物車
INSERT INTO url_path_prompts (url_pattern, prompt, priority) VALUES (
  '/cart',
  '這是購物車頁面，可以：
   • 查看已加入的商品
   • 修改數量、刪除商品
   • 查看總價
   • 前往結帳',
  100
);

-- 結帳流程
INSERT INTO url_path_prompts (url_pattern, prompt, priority) VALUES (
  '/checkout/*',
  '這是結帳流程頁面，步驟：
   1. 填寫收件資訊
   2. 選擇付款方式
   3. 確認訂單',
  100
);
```

---

### 5. `knowledge_base` - 知識庫表
知識庫（Hybrid Search: Vector + BM25）

```sql
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,         -- 知識條目名稱
  description TEXT NOT NULL,          -- 簡短描述 (用於向量嵌入)
  content TEXT NOT NULL,              -- 完整內容 (BM25 搜尋此欄位)
  category TEXT,                      -- 可選分類
  keywords TEXT[],                    -- 可選標籤 (用於過濾與第三級 BM25 信號)
  embedding TEXT,                     -- JSON 陣列格式的浮點向量 (description 的向量)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_knowledge_active ON knowledge_base(is_active);
CREATE INDEX idx_knowledge_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_name ON knowledge_base(name);
```

**欄位說明**:
- `name`: 知識條目名稱 (VARCHAR(255), e.g., "退貨政策", "運送方式")
- `description`: 簡短描述 (TEXT, 用於向量嵌入)
- `content`: 完整內容 (TEXT, BM25 搜尋此欄位，返回在搜尋結果中)
- `category`: 可選分類 (TEXT, 用於過濾，目前搜尋未使用)
- `keywords`: 可選標籤 (TEXT[], 用於過濾與第三級 BM25 信號)
- `embedding`: 向量嵌入 (TEXT, JSON 陣列格式，向量來自 description)
- `is_active`: 是否啟用 (預設 true)

**Hybrid Search 說明**:
- **Vector Search**: 使用 `embedding` 欄位進行語義相似度搜尋
- **BM25 Search**: 使用 `content` 欄位進行全文檢索
- **Combined Score**: 結合兩者分數，取 top-k 結果

**使用場景**:
- LLM 調用 `knowledge_search` 工具
- 根據用戶查詢，返回相關知識庫條目
- 支援語義搜尋 (向量) + 關鍵字搜尋 (BM25)

**範例**:
```sql
INSERT INTO knowledge_base (name, description, content, category, keywords) VALUES (
  '退貨政策',
  '退貨與退款相關規定',
  '收到商品 7 天內可申請退貨。請至「會員中心 > 訂單管理」點擊「申請退貨」，
   填寫退貨原因後送出。我們將在 3 個工作天內審核，通過後請將商品寄回。
   退款將在收到退貨商品後 7-14 個工作天內退回原付款方式。',
  '購物規定',
  ARRAY['退貨', '退款', '7天鑑賞期', '退貨流程']
);
```

**注意**:
- `embedding` 欄位為 TEXT (儲存 JSON 陣列)，非 PostgreSQL 原生 VECTOR 型別
- 原因: 避免依賴 pgvector extension，簡化部署
- 向量相似度計算在應用層完成 (TypeScript/JavaScript)

---

### 6. `skills` - 技能表
自定義技能 (Custom Prompts)

```sql
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,  -- 技能名稱，用於 /skill_name
  prompt TEXT NOT NULL,                -- 技能提示詞 (前置於用戶查詢)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skills_active ON skills(is_active);
```

**欄位說明**:
- `name`: 技能名稱 (VARCHAR(255), UNIQUE, e.g., "product_expert", "customer_support")
- `prompt`: 技能提示詞 (TEXT, 前置於用戶查詢)
- `is_active`: 是否啟用 (預設 true)

**用途**: 允許站主定義特定的 AI 行為模式

**範例**:
```sql
INSERT INTO skills (name, prompt) VALUES (
  'product_expert',
  '你是一位專業的 3C 產品顧問。
   你的任務是幫助用戶選擇最適合他們需求的產品。
   請詳細詢問用戶的使用場景、預算、偏好，然後提供專業建議。'
);

INSERT INTO skills (name, prompt) VALUES (
  'order_assistant',
  '你是訂單查詢助手。
   你的任務是幫助用戶追蹤訂單狀態、查詢物流資訊、處理訂單相關問題。
   請保持專業且有同理心的態度。'
);
```

**使用方式**:
- 用戶在對話中輸入: `/product_expert` 或 `/order_assistant`
- 系統將對應的 `prompt` 前置到用戶查詢中
- AI 將以該技能的角色回應

---

### 7. `llm_traces` - LLM 追蹤表
調試與監控 LLM 呼叫

```sql
CREATE TABLE llm_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,           -- 所屬 session
  user_id TEXT NOT NULL,              -- 所屬用戶
  input JSONB NOT NULL,               -- 輸入 (messages 陣列)
  output TEXT NOT NULL,               -- 輸出 (完整文字回應)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_llm_traces_session ON llm_traces(session_id);
CREATE INDEX idx_llm_traces_user ON llm_traces(user_id);
CREATE INDEX idx_llm_traces_created ON llm_traces(created_at);
```

**欄位說明**:
- `id`: 追蹤記錄唯一 ID (UUID)
- `session_id`: 所屬 session (TEXT, 非外鍵)
- `user_id`: 所屬用戶 (TEXT, 非外鍵)
- `input`: 輸入 (JSONB, 儲存 messages 陣列，完整送給 LLM 的資料)
- `output`: 輸出 (TEXT, 儲存 LLM 回應的完整文字)
- `created_at`: 建立時間

**簡化說明** (2025-12-03):
- 移除欄位: `response`, `completion`, `toolCalls`, `status`, `error`, `durationMs`, `inputTokens`, `outputTokens`, `totalTokens`
- 原因: 簡化追蹤邏輯，只保留最核心的 input/output
- 如需更詳細的追蹤，可在應用層擴展

**用途**:
- 調試 LLM 呼叫
- 監控 LLM 行為
- 分析用戶對話品質
- 後台管理介面查詢 (Admin Panel)

**範例**:
```sql
INSERT INTO llm_traces (session_id, user_id, input, output) VALUES (
  'session-123',
  'user-456',
  '{"messages": [{"role": "user", "content": "這個產品多少錢?"}]}',
  '這個產品的價格是 NT$ 36,900'
);

---

## Prisma Schema (最新版本)

完整的 Prisma schema 位於 [prisma/schema.prisma](../prisma/schema.prisma)

**當前版本** (2025-12-03):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==============================================================================
// Sessions (User conversations)
// ==============================================================================

model Session {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime @map("expires_at")
  isActive  Boolean  @default(true) @map("is_active")

  // Relations
  messages Message[]

  @@index([userId, isActive])
  @@map("sessions")
}

// ==============================================================================
// Messages (Conversation with Memory Compact)
// ==============================================================================

model Message {
  id        Int      @id @default(autoincrement())
  sessionId String   @map("session_id") @db.Uuid
  role      String   // 'user' | 'assistant' | 'system' | 'tool'
  content   String   @db.Text
  timestamp DateTime @default(now())

  // Memory Compact fields
  isCompacted     Boolean  @default(false) @map("is_compacted")
  compactedFromId Int?     @map("compacted_from_id")
  compactedToId   Int?     @map("compacted_to_id")
  archived        Boolean  @default(false)

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  session                Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  compactedFrom          Message?  @relation("CompactedFrom", fields: [compactedFromId], references: [id], onDelete: SetNull)
  compactedTo            Message?  @relation("CompactedTo", fields: [compactedToId], references: [id], onDelete: SetNull)
  messagesCompactedFrom  Message[] @relation("CompactedFrom")
  messagesCompactedTo    Message[] @relation("CompactedTo")

  @@index([sessionId, archived, timestamp])
  @@index([sessionId, isCompacted])
  @@map("messages")
}

// ==============================================================================
// Site Prompts (Site-wide configuration)
// ==============================================================================

model SitePrompt {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(255)
  prompt    String   @db.Text
  isGlobal  Boolean  @default(true) @map("is_global")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([isActive])
  @@map("site_prompts")
}

// ==============================================================================
// URL Path Prompts (Path-specific configuration)
// ==============================================================================

model UrlPathPrompt {
  id         Int      @id @default(autoincrement())
  urlPattern String   @map("url_pattern") @db.Text
  prompt     String   @db.Text
  priority   Int      @default(0)
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([urlPattern])
  @@index([isActive, priority(sort: Desc)])
  @@map("url_path_prompts")
}

// ==============================================================================
// Knowledge Base (QA with Hybrid Search: Vector + BM25)
// ==============================================================================

model KnowledgeBase {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(255) // Knowledge entry name
  description String   @db.Text // Short description (used for vector embedding)
  content     String   @db.Text // Full content (BM25 searches this field, returned in search results)
  category    String? // Optional category for filtering (not used in search currently)
  keywords    String[] // Optional tags for filtering and tertiary BM25 signal
  embedding   String?  @db.Text // JSON array of floats (vector of description)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([isActive])
  @@index([category])
  @@index([name])
  @@map("knowledge_base")
}

// ==============================================================================
// Skills (Custom prompts for specific queries)
// ==============================================================================

model Skill {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(255) // skill name used in /skill_name
  prompt    String   @db.Text // prompt to prepend to user query
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([isActive])
  @@map("skills")
}

// ==============================================================================
// LLM Traces (For debugging and monitoring LLM calls)
// ==============================================================================

model LLMTrace {
  id            String   @id @default(uuid())
  sessionId     String   @map("session_id") // Which session this belongs to
  userId        String   @map("user_id") // Which user made the request

  // Input & Output (exact format sent to and received from LLM)
  input         Json     @db.JsonB // Messages array sent to LLM API
  output        String   @db.Text // Complete text output from LLM

  createdAt     DateTime @default(now()) @map("created_at")

  @@index([sessionId])
  @@index([userId])
  @@index([createdAt])
  @@map("llm_traces")
}
```

---

## 部署指南

### 1. 本機開發環境

使用 Docker Compose 啟動 PostgreSQL (port 8888):

```bash
# 1. 啟動 Docker PostgreSQL
cd lens-service-v3
docker-compose up -d

# 2. 推送 schema (開發模式)
yarn prisma db push

# 3. 生成 Prisma Client
yarn prisma generate

# 4. 啟動服務
yarn start
```

### 2. 生產環境部署

部署到外部 PostgreSQL:

```bash
# 1. 設定 DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# 2. 執行 migration (生產模式)
yarn prisma migrate deploy

# 3. 生成 Prisma Client
yarn prisma generate

# 4. 啟動服務
NODE_ENV=production yarn start
```

### 3. 環境變數配置

參考 [.env](.env.example):

```bash
# Database
DATABASE_URL="postgresql://lens_admin:lens_secret_2025@localhost:8888/lens_service?schema=public"

# Session
SESSION_EXPIRY_HOURS=24
SESSION_CLEANUP_INTERVAL_MINUTES=60

# LLM Provider
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Embedding
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

---

## 索引說明

關鍵索引 (優化查詢效能):

1. **sessions**:
   - `(user_id, is_active)` - 快速查詢使用者的 active session

2. **messages**:
   - `(session_id, archived, timestamp)` - 查詢對話歷史（最新優先，過濾 archived）
   - `(session_id, is_compacted)` - 查詢壓縮摘要

3. **site_prompts**:
   - `(is_active)` - 查詢啟用的站點提示詞

4. **url_path_prompts**:
   - `(url_pattern)` - URL 模式匹配
   - `(is_active, priority DESC)` - 優先級排序

5. **knowledge_base**:
   - `(is_active)` - 查詢啟用的知識庫
   - `(category)` - 分類過濾
   - `(name)` - 名稱查詢

6. **skills**:
   - `(is_active)` - 查詢啟用的技能

7. **llm_traces**:
   - `(session_id)` - Session 追蹤
   - `(user_id)` - 用戶追蹤
   - `(created_at)` - 時間排序

---

## 維護任務

### 定期清理過期 Session

```sql
-- 清理過期且未活躍的 sessions (保留 7 天)
DELETE FROM sessions
WHERE expires_at < NOW() - INTERVAL '7 days' AND is_active = false;
```

**自動化**: 可在後台定期執行 (建議每天執行一次)

### Memory Compact 統計

```sql
-- 查看每個 session 的訊息壓縮狀態
SELECT
  session_id,
  COUNT(*) as total_messages,
  SUM(CASE WHEN archived = true THEN 1 ELSE 0 END) as archived_messages,
  SUM(CASE WHEN is_compacted = true THEN 1 ELSE 0 END) as compacted_messages,
  ROUND(100.0 * SUM(CASE WHEN archived = true THEN 1 ELSE 0 END) / COUNT(*), 2) as compression_rate
FROM messages
GROUP BY session_id
HAVING COUNT(*) > 10
ORDER BY total_messages DESC;
```

### LLM Traces 清理

```sql
-- 清理超過 30 天的舊追蹤記錄
DELETE FROM llm_traces
WHERE created_at < NOW() - INTERVAL '30 days';
```

### 資料庫大小監控

```sql
-- 查看每個表的大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 總結

此 schema 設計支援 (Version 3.1):

- ✅ **Single-Tenant Architecture** (簡化部署)
- ✅ **Session-based Memory** (對話管理)
- ✅ **Memory Compact** (75-85% token 節省)
- ✅ **Flexible Prompts** (Site + URL-specific)
- ✅ **Knowledge Base** (Hybrid Search: Vector + BM25)
- ✅ **Skills System** (自定義 AI 行為)
- ✅ **LLM Traces** (調試與監控)
- ✅ **PostgreSQL Only** (不依賴 pgvector extension)

## 後續優化方向

1. **性能優化**:
   - 加入 Redis 快取 (sessions, prompts)
   - 資料庫連接池優化
   - Query 優化與索引調整

2. **功能擴展**:
   - 恢復 Navigation History (用戶行為追蹤)
   - 加入 A/B Testing 支援
   - 多語言支援 (i18n)

3. **監控與分析**:
   - 擴展 LLM Traces (加入 token 統計、延遲分析)
   - 用戶行為分析
   - 成本追蹤與預警

4. **Multi-Tenancy**:
   - 如需支援多租戶，可恢復 `tenants` 表
   - 加入 `tenant_id` 外鍵到所有相關表

---

**文檔版本**: 3.1
**最後更新**: 2025-12-03
**維護者**: Lens Service Team

# Lens Service v3 - Complete Database Schema

## 架構說明

此資料庫設計支援：
- ✅ Multi-tenancy (多租戶)
- ✅ Session-based conversation (對話管理)
- ✅ Memory Compact (記憶壓縮，節省 75-85% tokens)
- ✅ Navigation History (導航歷史)
- ✅ Site & URL-specific Prompts (站點/URL 提示詞)
- ✅ Knowledge Base (知識庫)

---

## 資料表結構

### 1. `tenants` - 租戶表
每個使用 Lens Service 的客戶網站

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_api_key ON tenants(api_key);
```

**欄位說明**:
- `id`: 租戶唯一 ID
- `name`: 租戶名稱 (e.g., "我的電商網站")
- `api_key`: API 金鑰，用於驗證請求
- `is_active`: 是否啟用

---

### 2. `sessions` - 會話表
使用者的對話 session

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- 客戶網站的 User ID
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_tenant_user ON sessions(tenant_id, user_id, is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**欄位說明**:
- `id`: Session 唯一 ID
- `tenant_id`: 所屬租戶
- `user_id`: **客戶網站的使用者 ID** (由客戶網站認證系統提供)
- `expires_at`: 過期時間 (預設 24 小時)
- `is_active`: 是否仍有效

**重要**: `user_id` 是客戶網站傳入的，Lens Service 本身不做用戶認證！

---

### 3. `messages` - 訊息表
對話訊息（支援 Memory Compact）

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Memory Compact 欄位
  archived BOOLEAN DEFAULT false,
  is_compacted BOOLEAN DEFAULT false,
  compacted_from_id INT REFERENCES messages(id),
  compacted_to_id INT REFERENCES messages(id),

  -- 額外資訊
  metadata JSONB
);

CREATE INDEX idx_messages_session ON messages(session_id, timestamp DESC);
CREATE INDEX idx_messages_archived ON messages(session_id, archived);
CREATE INDEX idx_messages_compacted ON messages(session_id, is_compacted);
```

**欄位說明**:
- `role`: 訊息角色 ('user', 'assistant', 'system', 'tool')
- `content`: 訊息內容
- `archived`: 是否已被壓縮（不再顯示，但保留在 DB）
- `is_compacted`: 是否為壓縮摘要訊息
- `compacted_from_id/to_id`: 壓縮的訊息範圍

**Memory Compact 流程**:
1. 當 token 數過高，選擇前 N 條訊息
2. 用 LLM 生成摘要
3. 將原始訊息標記 `archived = true`
4. 插入新的摘要訊息 `is_compacted = true`
5. 後續查詢只取 `archived = false` 的訊息

**範例**:
```
訊息 1-10: archived = true
訊息 11: is_compacted = true, content = "前10條訊息摘要..."
訊息 12-20: archived = false (正常顯示)
```

---

### 4. `navigation_history` - 導航歷史表
使用者瀏覽頁面的歷史

```sql
CREATE TABLE navigation_history (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  summary TEXT,  -- 該頁面的摘要 (LLM 生成)
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_navigation_session ON navigation_history(session_id, timestamp DESC);
```

**欄位說明**:
- `url`: 訪問的 URL
- `summary`: 頁面摘要 (例如: "使用者查看了筆電商品頁")

**使用場景**:
- Prompt 中包含最近 3-5 個導航記錄
- 幫助 LLM 理解使用者的瀏覽脈絡

---

### 5. `site_prompts` - 站點提示詞表
租戶配置的全站提示詞

```sql
CREATE TABLE site_prompts (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_global BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_site_prompts_tenant ON site_prompts(tenant_id, is_active);
```

**欄位說明**:
- `name`: 提示詞名稱 (e.g., "網站說明")
- `prompt`: 提示詞內容 (e.g., "本站是 3C 電商，主要販售筆電、手機...")
- `is_global`: 是否全站適用

**範例**:
```
name: "網站說明"
prompt: "本站是 3C 電商網站，主要販售筆電、手機、相機。購物車在右上角。客服時間週一至週五 9:00-18:00。"
```

---

### 6. `url_path_prompts` - URL 路徑提示詞表
特定 URL 的提示詞（支援 wildcard）

```sql
CREATE TABLE url_path_prompts (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url_pattern TEXT NOT NULL,
  prompt TEXT NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_url_prompts_tenant ON url_path_prompts(tenant_id, is_active);
CREATE INDEX idx_url_prompts_priority ON url_path_prompts(tenant_id, priority DESC);
```

**欄位說明**:
- `url_pattern`: URL 模式 (支援 wildcard，e.g., "/products/*")
- `prompt`: 該路徑的提示詞
- `priority`: 優先級（越高越優先匹配）

**範例**:
```
url_pattern: "/products/*"
prompt: "這是商品頁面，包含商品圖片、價格、規格、加入購物車按鈕。"
priority: 10

url_pattern: "/cart"
prompt: "這是購物車頁面，可以修改數量、刪除商品、前往結帳。"
priority: 20
```

**匹配邏輯**:
1. 按 `priority DESC` 排序
2. 使用簡單的 wildcard matching 或 regex
3. 第一個匹配的 prompt 將被使用

---

### 7. `knowledge_base` - 知識庫表
QA 內容，供 `knowledge_search` 工具使用

```sql
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],  -- 關鍵字陣列
  embedding VECTOR(1536),  -- OpenAI text-embedding-3-small
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_knowledge_tenant ON knowledge_base(tenant_id, is_active);
CREATE INDEX idx_knowledge_category ON knowledge_base(tenant_id, category);
CREATE INDEX idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

**欄位說明**:
- `category`: 分類 (e.g., "退貨政策", "運送方式")
- `question`: 問題
- `answer`: 答案
- `keywords`: 關鍵字 (用於全文搜索)
- `embedding`: 向量 (用於語義搜索)

**使用場景**:
- LLM 調用 `knowledge_search` 工具
- Hybrid search: 關鍵字 + 向量相似度

**範例**:
```
category: "退貨政策"
question: "如何辦理退貨?"
answer: "收到商品 7 天內可申請退貨。請至「會員中心 > 訂單管理」點擊「申請退貨」..."
keywords: ["退貨", "退款", "7天鑑賞期"]
```

---

### 8. `generated_pages` - 動態生成頁面表
AI 生成的推薦頁面

```sql
CREATE TABLE generated_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL,  -- 頁面區塊 (JSON 格式)
  html TEXT,  -- 渲染後的 HTML
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- 過期時間 (可選)
  view_count INT DEFAULT 0
);

CREATE INDEX idx_generated_pages_tenant ON generated_pages(tenant_id, created_at DESC);
CREATE INDEX idx_generated_pages_session ON generated_pages(session_id);
```

**欄位說明**:
- `title`: 頁面標題
- `blocks`: 頁面區塊 (JSON 格式，包含 hero, product-grid, cta 等)
- `html`: 渲染後的完整 HTML
- `expires_at`: 過期時間 (例如: 推薦頁有效期 7 天)

**使用場景**:
- LLM 調用 `generate_page` 工具
- 根據對話內容動態生成推薦頁面
- 例如: "根據您的需求，我為您準備了專屬的筆電推薦頁"

**Block 格式範例**:
```json
{
  "blocks": [
    {
      "type": "hero",
      "props": {
        "title": "為您推薦的高效筆電",
        "backgroundImage": "..."
      }
    },
    {
      "type": "product-grid",
      "props": {
        "products": [...]
      }
    }
  ]
}
```

---

## Prisma Schema

完整的 Prisma schema 位於 `prisma/schema.prisma`，包含：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  apiKey    String   @unique @map("api_key")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  sessions         Session[]
  sitePrompts      SitePrompt[]
  urlPathPrompts   UrlPathPrompt[]
  knowledgeBase    KnowledgeBase[]
  generatedPages   GeneratedPage[]

  @@map("tenants")
}

model Session {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  messages Message[]
  navigationHistory NavigationHistory[]

  @@index([tenantId, userId, isActive])
  @@index([expiresAt])
  @@map("sessions")
}

model Message {
  id        Int      @id @default(autoincrement())
  sessionId String   @map("session_id") @db.Uuid
  role      String   // 'user' | 'assistant' | 'system' | 'tool'
  content   String   @db.Text
  timestamp DateTime @default(now())

  // Memory Compact
  archived        Boolean @default(false)
  isCompacted     Boolean @default(false) @map("is_compacted")
  compactedFromId Int?    @map("compacted_from_id")
  compactedToId   Int?    @map("compacted_to_id")

  metadata Json?

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  compactedFrom         Message?  @relation("CompactedFrom", fields: [compactedFromId], references: [id])
  compactedTo           Message?  @relation("CompactedTo", fields: [compactedToId], references: [id])
  messagesCompactedFrom Message[] @relation("CompactedFrom")
  messagesCompactedTo   Message[] @relation("CompactedTo")

  @@index([sessionId, timestamp(sort: Desc)])
  @@index([sessionId, archived])
  @@index([sessionId, isCompacted])
  @@map("messages")
}

model NavigationHistory {
  id        Int      @id @default(autoincrement())
  sessionId String   @map("session_id") @db.Uuid
  url       String
  summary   String?  @db.Text
  timestamp DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, timestamp(sort: Desc)])
  @@map("navigation_history")
}

model SitePrompt {
  id        Int      @id @default(autoincrement())
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String
  prompt    String   @db.Text
  isGlobal  Boolean  @default(true) @map("is_global")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, isActive])
  @@map("site_prompts")
}

model UrlPathPrompt {
  id         Int      @id @default(autoincrement())
  tenantId   String   @map("tenant_id") @db.Uuid
  urlPattern String   @map("url_pattern")
  prompt     String   @db.Text
  priority   Int      @default(0)
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, isActive])
  @@index([tenantId, priority(sort: Desc)])
  @@map("url_path_prompts")
}

model KnowledgeBase {
  id        Int      @id @default(autoincrement())
  tenantId  String   @map("tenant_id") @db.Uuid
  category  String?
  question  String   @db.Text
  answer    String   @db.Text
  keywords  String[]
  embedding Unsupported("vector(1536)")?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, isActive])
  @@index([tenantId, category])
  @@map("knowledge_base")
}

model GeneratedPage {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  sessionId String?  @map("session_id") @db.Uuid
  title     String
  blocks    Json
  html      String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime? @map("expires_at")
  viewCount Int      @default(0) @map("view_count")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([sessionId])
  @@map("generated_pages")
}
```

---

## 部署指南

### 1. 客戶部署 (選項 A - 推薦)

客戶將 Prisma schema 部署到**他們自己的 PostgreSQL**:

```bash
# 1. 客戶複製 schema
cp prisma/schema.prisma ~/my-project/prisma/

# 2. 設定 DATABASE_URL
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"' > .env

# 3. 執行 migration
npx prisma migrate deploy

# 4. 生成 Prisma Client
npx prisma generate
```

### 2. Lens Service 本機測試

Lens Service 專案本身的測試資料庫 (port 8888):

```bash
# 1. 啟動 Docker PostgreSQL
docker-compose up -d

# 2. 推送 schema
npx prisma db push

# 3. 生成 client
npx prisma generate

# 4. 執行測試
node test-prisma.js
```

---

## 索引說明

關鍵索引：

1. **sessions**:
   - `(tenant_id, user_id, is_active)` - 快速查詢使用者的 active session
   - `(expires_at)` - 定期清理過期 session

2. **messages**:
   - `(session_id, timestamp DESC)` - 查詢對話歷史（最新優先）
   - `(session_id, archived)` - 過濾 archived 訊息
   - `(session_id, is_compacted)` - 查詢壓縮摘要

3. **navigation_history**:
   - `(session_id, timestamp DESC)` - 查詢最近導航記錄

4. **knowledge_base**:
   - `(tenant_id, is_active)` - 查詢知識庫
   - `embedding` (ivfflat) - 向量相似度搜索 (需要 pgvector extension)

---

## 維護任務

### 定期清理過期 Session
```sql
DELETE FROM sessions
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Memory Compact 統計
```sql
SELECT
  session_id,
  COUNT(*) as total_messages,
  SUM(CASE WHEN archived = true THEN 1 ELSE 0 END) as archived_messages,
  SUM(CASE WHEN is_compacted = true THEN 1 ELSE 0 END) as compacted_messages
FROM messages
GROUP BY session_id;
```

---

## 總結

此 schema 設計支援：
- ✅ Multi-tenancy
- ✅ Session-based memory
- ✅ Memory Compact (75-85% token savings)
- ✅ Flexible prompts (Site + URL)
- ✅ Knowledge Base with vector search
- ✅ AI page generation
- ✅ 完全客製化部署（客戶用自己的 DB）

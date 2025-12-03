# Lens Service v3 - Standalone 架構說明

## 🎯 設計理念

**一個服務，包含所有功能**

Lens Service v3 採用 Standalone 架構，站主只需要部署一個服務，就包含：
- 💬 Chat API (SSE Streaming)
- 🔌 Widget Static Files (CDN)
- 📊 Admin Dashboard
- 🔧 Admin API

## 📦 架構圖

```
┌─────────────────────────────────────────┐
│   Lens Service (localhost:3002)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Express Server                     │ │
│  │                                     │ │
│  │  Routes:                            │ │
│  │  - POST /api/chat        (SSE)     │ │
│  │  - /api/admin/*          (CRUD)    │ │
│  │  - /widget/*             (Static)  │ │
│  │  - /admin/*              (Static)  │ │
│  │  - GET /health           (健康檢查)│ │
│  └────────────────────────────────────┘ │
│                                          │
│  Database: PostgreSQL (站主提供)         │
│  OpenAI: API Key (站主提供)              │
└─────────────────────────────────────────┘
           ↑                    ↑
           │                    │
    ┌──────┴──────┐      ┌─────┴──────┐
    │ 使用者瀏覽器 │      │  站主管理員  │
    │             │      │             │
    │ Widget      │      │ Admin UI    │
    │ (嵌入網站)   │      │ (管理配置)   │
    └─────────────┘      └─────────────┘
```

## 🗂️ 檔案結構

### 生產環境

```
lens-service-v3/
├── server/
│   ├── dist/                 # 編譯後的 server 程式碼
│   │   └── index.js
│   └── node_modules/
│
├── widget/dist/              # Widget 靜態檔案
│   ├── lens-widget.js       # 主程式
│   └── assets/
│       └── index.css        # 樣式
│
├── admin/dist/               # Admin 靜態檔案
│   ├── index.html
│   └── assets/
│       ├── index.js
│       └── index.css
│
├── prisma/
│   └── schema.prisma        # 資料庫 Schema
│
├── .env                      # 環境變數（站主配置）
└── package.json
```

### Server 啟動流程

```javascript
// server/src/index.ts
import express from 'express';
import path from 'path';

const app = express();

// 1. Serve Widget 靜態檔案 (作為 CDN)
app.use('/widget', express.static(path.join(__dirname, '../../widget/dist')));

// 2. Serve Admin Dashboard 靜態檔案
app.use('/admin', express.static(path.join(__dirname, '../../admin/dist')));

// 3. Admin API Routes (CRUD)
app.use('/api/admin', adminRouter);

// 4. Chat API (SSE Streaming)
app.post('/api/chat', chatHandler);

// 啟動
app.listen(3002);
```

## 🔌 Widget 嵌入方式

站主在他們的網站加入：

```html
<script>
  window.LENS_CONFIG = {
    apiUrl: 'https://lens.example.com',  // Lens Service 的 URL
    userId: '{{ user.id }}',              // 動態插入使用者 ID
  };
</script>
<script src="https://lens.example.com/widget/lens-widget.js"></script>
<link rel="stylesheet" href="https://lens.example.com/widget/assets/index.css">
```

Widget 會：
1. 讀取 `window.LENS_CONFIG`
2. 向 `apiUrl + /api/chat` 發送請求
3. 處理 SSE streaming 回應
4. 執行 DOM 操作（web_use）

## 📊 Admin Dashboard 存取

站主直接瀏覽：`https://lens.example.com/admin`

Admin 是 React SPA：
- 前端：React (已編譯成靜態檔案)
- API：`/api/admin/*` (由同一個 Express server 提供)

## 🔄 資料流

### 1. 使用者發送訊息

```
使用者 → Widget → POST /api/chat → SupervisorAgent
                                    ↓
                                  OpenAI API
                                    ↓
                      ← SSE Stream ← 回應
```

### 2. Admin 新增知識庫

```
管理員 → Admin UI → POST /api/admin/knowledge-base
                    ↓
                  生成 Embedding (OpenAI)
                    ↓
                  儲存到 PostgreSQL
```

### 3. Agent 搜尋知識

```
User Query → knowledge_search tool
            ↓
          Hybrid Search (Vector + BM25)
            ↓
          PostgreSQL
            ↓
          返回結果
```

## 🚀 部署選項

### 選項 1: VPS (推薦新手)

```bash
# 在 VPS 上
git clone <repo>
cd lens-service-v3

# 配置
cp .env.example .env
nano .env  # 填入 DATABASE_URL 和 OPENAI_API_KEY

# 安裝和建立
yarn install-all
yarn prisma:push
yarn build

# 使用 PM2 啟動
npm install -g pm2
pm2 start "yarn start" --name lens-service
pm2 save
pm2 startup
```

### 選項 2: Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lens_service_v3
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  lens-service:
    build: .
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/lens_service_v3
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

### 選項 3: Platform as a Service

**Railway / Render / Heroku**

1. 連接 Git repository
2. 設定環境變數
3. 自動部署

建立腳本需要：
```json
{
  "scripts": {
    "build": "yarn install-all && yarn prisma:generate && yarn build",
    "start": "cd server && yarn start"
  }
}
```

## 🔒 安全性考量

### 1. 環境變數保護

```bash
# .env
DATABASE_URL="postgresql://..."  # 不要提交到 Git
OPENAI_API_KEY="sk-..."          # 不要提交到 Git
```

在 `.gitignore` 加入：
```
.env
.env.local
.env.production
```

### 2. Admin Dashboard 保護

**建議**：加上身份驗證

在 `server/src/index.ts` 加入：

```typescript
// Simple auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const validToken = process.env.ADMIN_TOKEN;

  if (authHeader === `Bearer ${validToken}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Protect admin routes
app.use('/api/admin', requireAuth, adminRouter);
app.use('/admin', requireAuth, express.static(...));
```

### 3. CORS 配置

如果 Widget 和 API 在不同域名：

```typescript
app.use(cors({
  origin: ['https://your-website.com'],
  credentials: true,
}));
```

## 📈 擴展性

### 單機 vs 多機

**目前架構：單機 Standalone**
- 適合：中小型網站（<10萬 DAU）
- 優點：部署簡單、維護容易
- 成本：低

**如果需要擴展到多機：**

```
Load Balancer
      ↓
┌─────┴─────┬─────────┬─────────┐
│ Server 1  │ Server 2│ Server 3│
└───────────┴─────────┴─────────┘
      ↓
Shared PostgreSQL
      ↓
Shared Redis (Session)
```

改動：
1. 使用 Redis 儲存 Session
2. Widget/Admin 靜態檔案移到 CDN (CloudFlare, AWS S3)
3. 負載均衡器分配請求

## 🎯 與其他架構比較

### Lens Service (Standalone) vs SaaS

| 特性 | Standalone | SaaS (如 Intercom) |
|------|-----------|-------------------|
| 資料擁有權 | ✅ 完全擁有 | ❌ 存在第三方 |
| 客製化 | ✅ 完全可控 | ❌ 受限 |
| 成本 | 💰 OpenAI API | 💰💰💰 訂閱費 |
| 部署複雜度 | 🔧 需要技術 | ✅ 簡單 |
| 維護 | 🔧 自己維護 | ✅ 供應商維護 |

### Lens Service vs Library (如 Langchain)

| 特性 | Standalone | Library |
|------|-----------|---------|
| 開箱即用 | ✅ 是 | ❌ 需要開發 |
| 前端 UI | ✅ 包含 Widget + Admin | ❌ 需要自己做 |
| 整合難度 | ✅ 嵌入 script | 🔧 需要寫程式 |
| 靈活性 | 🔧 固定架構 | ✅ 完全自由 |

## 💡 最佳實踐

### 1. 環境分離

```
開發: localhost:3002
測試: staging.lens.example.com
生產: lens.example.com
```

每個環境有自己的：
- `.env` 檔案
- PostgreSQL 資料庫
- OpenAI API Key (可選)

### 2. 資料庫備份

```bash
# 每日備份
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 或使用 PostgreSQL 託管服務的自動備份
```

### 3. 監控

使用 PM2 監控：

```bash
pm2 monit lens-service
pm2 logs lens-service
```

或整合 APM 工具（如 New Relic, DataDog）

### 4. 更新流程

```bash
# 1. 拉取最新程式碼
git pull

# 2. 安裝依賴
yarn install-all

# 3. 更新資料庫
yarn prisma:generate
yarn prisma:push

# 4. 重新建立
yarn build

# 5. 重啟服務
pm2 restart lens-service
```

## 🆘 問題排查

### Widget 無法連接

1. 檢查 `window.LENS_CONFIG.apiUrl` 是否正確
2. 檢查 CORS 設定
3. 檢查 Server 是否運行：`http://your-server/health`

### Admin Dashboard 空白

1. 檢查靜態檔案是否存在：`admin/dist/index.html`
2. 檢查瀏覽器 Console 錯誤
3. 確認 `yarn build` 成功執行

### Knowledge Search 無結果

1. 確認 Knowledge Base 有資料且 `isActive = true`
2. 檢查 embedding 是否生成
3. 使用 Test Agent 頁面測試

---

**這就是 Standalone 架構的完整說明！** 🎉

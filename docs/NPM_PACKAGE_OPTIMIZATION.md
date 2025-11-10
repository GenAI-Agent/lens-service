# Lens Service NPM 套件優化建議

## 目錄
1. [核心問題分析](#核心問題分析)
2. [架構優化建議](#架構優化建議)
3. [Dependencies 優化](#dependencies-優化)
4. [部署模式建議](#部署模式建議)
5. [API 設計改進](#api-設計改進)
6. [文檔與範例](#文檔與範例)
7. [實施步驟](#實施步驟)

---

## 核心問題分析

### 當前架構的主要問題

#### 1. **前後端耦合過緊**
```javascript
// 問題: 前端 widget 直接依賴後端服務
const API_BASE_URL = 'http://localhost:3002';  // 寫死在程式碼中
```

**影響:**
- 使用者必須同時運行 db-server.js 和 Docker PostgreSQL
- 無法作為純前端套件使用
- 增加部署複雜度

#### 2. **Database 相關依賴不合理**
```json
"dependencies": {
  "@prisma/client": "^6.16.3",  // ❌ 不應該在前端 widget
  "prisma": "^6.16.3",           // ❌ 不應該在前端 widget
  "pg": "^8.7.3",                // ❌ Node.js 專用
  "postgres": "^3.4.7",          // ❌ Node.js 專用
  "express": "^5.1.0",           // ❌ 後端框架
  "cors": "^2.8.5"               // ❌ 後端中介軟體
}
```

**影響:**
- 套件體積過大 (包含不必要的後端依賴)
- 在瀏覽器環境無法正常運作
- 安全風險 (暴露資料庫連線邏輯)

#### 3. **混合架構造成的困惑**
```
lens-service/
├── src/             # 前端 widget 程式碼
├── db-server.js     # 後端 API server
├── sql/             # PostgreSQL 相關
└── package.json     # 混合依賴
```

---

## 架構優化建議

### 方案 A: 前後端完全分離 (推薦) ⭐

#### 結構設計
```
lens-service/
├── packages/
│   ├── widget/              # 純前端套件
│   │   ├── package.json     # 只含前端依賴
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   └── services/
│   │   └── dist/
│   │
│   └── server/              # 後端服務 (選用)
│       ├── package.json     # 只含後端依賴
│       ├── src/
│       │   ├── api/
│       │   ├── database/
│       │   └── index.ts
│       └── Dockerfile
│
└── examples/                # 範例與文檔
```

#### Widget Package (lens-service)
```json
{
  "name": "lens-service",
  "version": "2.0.0",
  "description": "Embeddable AI Customer Service Widget",
  "main": "dist/lens-service.umd.js",
  "module": "dist/lens-service.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "dependencies": {
    "html2canvas": "^1.4.1"  // 只保留必要的前端依賴
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

#### Server Package (lens-service-server)
```json
{
  "name": "@lens-service/server",
  "version": "2.0.0",
  "description": "Backend API for Lens Service Widget",
  "main": "dist/index.js",
  "dependencies": {
    "@prisma/client": "^6.16.3",
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "pg": "^8.7.3",
    "dotenv": "^16.3.1"
  }
}
```

### 方案 B: 配置化後端 (折衷方案)

保持單一套件,但讓後端 API URL 完全可配置:

```typescript
interface LensServiceConfig {
  // 必填: 後端 API 端點
  apiEndpoint: string;  // 用戶需自行提供 API server

  // 選填: Azure OpenAI (可在前端或後端呼叫)
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
  };

  // 選填: Telegram 通知
  telegram?: {
    botToken: string;
    chatId: string;
  };

  // UI 配置
  ui?: {
    width?: string;
    position?: 'left' | 'right';
    iconPosition?: string | object;
  };
}
```

---

## Dependencies 優化

### 前端套件 (lens-service)

#### 保留的依賴
```json
{
  "dependencies": {
    // 只保留真正需要在瀏覽器運行的依賴
    "html2canvas": "^1.4.1"  // 截圖功能
  },
  "peerDependencies": {
    // 如果需要讓使用者自行提供
  }
}
```

#### 移除的依賴 (移到 server package)
```json
{
  "dependencies": {
    "@prisma/client": "^6.16.3",    // → 移到 server
    "prisma": "^6.16.3",             // → 移到 server
    "pg": "^8.7.3",                  // → 移到 server
    "postgres": "^3.4.7",            // → 移到 server
    "express": "^5.1.0",             // → 移到 server
    "cors": "^2.8.5",                // → 移到 server
    "dotenv": "^16.3.1",             // → 移到 server
    "@types/pg": "^8.15.5",          // → 移到 server
    "pg-connection-string": "^2.9.1" // → 移到 server
  }
}
```

#### 動態載入的依賴
```typescript
// html2canvas 應該動態載入,不打包進 bundle
private async loadHtml2Canvas(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}
```

### Vite 配置優化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LensService',
      fileName: 'lens-service',
      formats: ['umd', 'es']
    },
    rollupOptions: {
      // 不要打包 html2canvas,讓它動態載入
      external: ['html2canvas'],
      output: {
        globals: {
          'html2canvas': 'html2canvas'
        }
      }
    },
    // 優化輸出
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生產環境移除 console
      }
    }
  }
});
```

---

## 部署模式建議

### 模式 1: SaaS 模式 (最簡單) ⭐

**架構:**
```
用戶網站 (前端)
    ↓
lens-service (Widget)
    ↓
Your Hosted API (你自己架設的 API server)
    ↓
PostgreSQL Database
```

**使用方式:**
```typescript
// 使用者只需安裝 widget
npm install lens-service

// 在他們的應用中使用
import LensService from 'lens-service';

LensService.init({
  // 指向你提供的 SaaS API
  apiEndpoint: 'https://api.lens-service.com/v1',

  // 或使用者自己架設
  // apiEndpoint: 'https://their-domain.com/lens-api',

  azureOpenAI: {
    endpoint: 'https://xxx.openai.azure.com/',
    apiKey: 'user-api-key',
    deployment: 'gpt-4'
  }
});
```

**優點:**
- 使用者最簡單,只需安裝 npm 套件
- 你可以提供 SaaS 服務收費
- 集中管理資料庫和 API

### 模式 2: Self-hosted 模式

**架構:**
```
用戶網站 (前端)
    ↓
lens-service (Widget)
    ↓
用戶自己的 API Server (使用你提供的 Docker image)
    ↓
用戶自己的 PostgreSQL
```

**提供:**
```bash
# 使用者可以用 Docker 快速架設 API server
docker run -d \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e AZURE_OPENAI_ENDPOINT="https://xxx.openai.azure.com/" \
  -e AZURE_OPENAI_KEY="key" \
  -p 3002:3002 \
  lens-service/server:latest
```

### 模式 3: Serverless 模式

**使用 Vercel/Netlify Functions:**
```typescript
// api/conversations.ts (Vercel Function)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const conversations = await prisma.conversation.findMany();
  res.json(conversations);
}
```

**優點:**
- 無需維護伺服器
- 自動擴展
- 按使用量付費

---

## API 設計改進

### 當前問題
```typescript
// src/services/DatabaseService.ts
const API_BASE_URL = 'http://localhost:3002';  // ❌ 寫死
```

### 改進方案

#### 1. 配置化 API 端點
```typescript
// src/services/DatabaseService.ts
export class DatabaseService {
  private static apiBaseUrl: string = '';

  // 初始化時設定 API endpoint
  static initialize(apiEndpoint: string) {
    this.apiBaseUrl = apiEndpoint;
  }

  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiBaseUrl) {
      throw new Error('DatabaseService not initialized. Call DatabaseService.initialize() first.');
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // ... 其他方法
}
```

#### 2. 更新 Widget 初始化
```typescript
// src/index.ts
async init(config: ServiceModulerConfig): Promise<void> {
  if (!config.apiEndpoint) {
    throw new Error('apiEndpoint is required in config');
  }

  // 初始化資料庫服務
  DatabaseService.initialize(config.apiEndpoint);

  // ... 其他初始化
}
```

#### 3. API 版本控制
```typescript
interface ServiceModulerConfig {
  apiEndpoint: string;      // 必填
  apiVersion?: string;      // 選填, 默認 'v1'
  // ...
}

// 使用
const endpoint = `${config.apiEndpoint}/${config.apiVersion || 'v1'}`;
```

### 標準化 API 端點

```
GET    /api/v1/conversations          # 獲取所有對話
POST   /api/v1/conversations          # 創建對話
GET    /api/v1/conversations/:id      # 獲取特定對話
PUT    /api/v1/conversations/:id      # 更新對話

GET    /api/v1/manual-indexes         # 獲取知識庫
POST   /api/v1/manual-indexes         # 新增知識
PUT    /api/v1/manual-indexes/:id     # 更新知識
DELETE /api/v1/manual-indexes/:id     # 刪除知識
POST   /api/v1/manual-indexes/search  # 搜尋知識

GET    /api/v1/settings               # 獲取所有設定
GET    /api/v1/settings/:key          # 獲取特定設定
PUT    /api/v1/settings/:key          # 更新設定

POST   /api/v1/admin/login            # 管理員登入
GET    /api/v1/admin/users            # 獲取管理員列表
```

---

## 文檔與範例

### README.md 結構

```markdown
# Lens Service

> Embeddable AI Customer Service Widget

## Installation

```bash
npm install lens-service
```

## Quick Start

### Option 1: Use with our hosted API (Recommended)

```typescript
import LensService from 'lens-service';
import 'lens-service/dist/style.css';

LensService.init({
  apiEndpoint: 'https://api.lens-service.com/v1',
  azureOpenAI: {
    endpoint: 'https://your-resource.openai.azure.com/',
    apiKey: 'your-api-key',
    deployment: 'gpt-4'
  }
});
```

### Option 2: Self-hosted

#### Step 1: Deploy the backend

```bash
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -p 3002:3002 \
  lens-service/server
```

#### Step 2: Use the widget

```typescript
LensService.init({
  apiEndpoint: 'http://localhost:3002/api/v1',
  // ... other config
});
```

## Configuration

[詳細配置說明...]

## Examples

- [React Example](./examples/react)
- [Next.js Example](./examples/nextjs)
- [Vue Example](./examples/vue)
- [Vanilla JS Example](./examples/vanilla)

## API Documentation

[API 文檔...]

## License

MIT
```

### 提供完整範例

#### React 範例
```typescript
// examples/react/src/App.tsx
import { useEffect } from 'react';
import LensService from 'lens-service';
import 'lens-service/dist/style.css';

function App() {
  useEffect(() => {
    LensService.init({
      apiEndpoint: process.env.REACT_APP_LENS_API_ENDPOINT,
      azureOpenAI: {
        endpoint: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT,
        apiKey: process.env.REACT_APP_AZURE_OPENAI_KEY,
        deployment: 'gpt-4'
      },
      ui: {
        position: 'right',
        iconPosition: 'bottom-right'
      }
    });
  }, []);

  return (
    <div className="App">
      <h1>My Website</h1>
      {/* Widget will appear automatically */}
    </div>
  );
}

export default App;
```

#### Next.js 範例
```typescript
// examples/nextjs/pages/_app.tsx
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import 'lens-service/dist/style.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 動態載入避免 SSR 問題
    import('lens-service').then(({ default: LensService }) => {
      LensService.init({
        apiEndpoint: process.env.NEXT_PUBLIC_LENS_API_ENDPOINT,
        // ... config
      });
    });
  }, []);

  return <Component {...pageProps} />;
}
```

---

## 實施步驟

### Phase 1: 基礎重構 (2-3 天)

#### 1.1 拆分前後端依賴
- [ ] 創建新的 package.json (widget only)
- [ ] 移除所有後端依賴
- [ ] 更新 vite.config.ts

#### 1.2 配置化 API 端點
- [ ] 修改 DatabaseService.ts
- [ ] 移除所有 hardcoded URLs
- [ ] 添加 API endpoint 驗證

#### 1.3 更新 TypeScript 類型
```typescript
// src/types.ts
export interface ServiceModulerConfig {
  // 必填配置
  apiEndpoint: string;  // 新增

  // 選填配置
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
    apiVersion?: string;
  };

  telegram?: {
    botToken: string;
    chatId: string;
  };

  ui?: {
    width?: string;
    position?: 'left' | 'right';
    iconPosition?: string | false | {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };

  debug?: boolean;
}
```

### Phase 2: 後端服務改進 (3-4 天)

#### 2.1 創建獨立的 server package
```bash
mkdir packages
mkdir packages/widget
mkdir packages/server

# 移動檔案
mv src packages/widget/
mv db-server.js packages/server/src/
mv sql packages/server/
```

#### 2.2 標準化 API
- [ ] 統一 API 路徑格式
- [ ] 添加 API 版本控制
- [ ] 實作錯誤處理中介軟體
- [ ] 添加請求驗證

#### 2.3 建立 Docker 部署
```dockerfile
# packages/server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["node", "src/index.js"]
```

### Phase 3: 文檔與範例 (2-3 天)

#### 3.1 撰寫文檔
- [ ] 更新 README.md
- [ ] 撰寫 API 文檔
- [ ] 撰寫部署指南
- [ ] 撰寫配置說明

#### 3.2 建立範例
- [ ] React 範例
- [ ] Next.js 範例
- [ ] Vue 範例
- [ ] Vanilla JS 範例

### Phase 4: 測試與發布 (2-3 天)

#### 4.1 測試
- [ ] Widget 功能測試
- [ ] API 整合測試
- [ ] 各框架範例測試
- [ ] 瀏覽器相容性測試

#### 4.2 發布準備
```json
// package.json
{
  "name": "lens-service",
  "version": "2.0.0",
  "scripts": {
    "prepublishOnly": "npm run build && npm test"
  }
}
```

#### 4.3 發布到 NPM
```bash
# 測試發布 (不會真的發布)
npm publish --dry-run

# 正式發布
npm publish --access public
```

---

## 額外優化建議

### 1. 錯誤處理改進

```typescript
// src/services/DatabaseService.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);

    if (!response.ok) {
      throw new APIError(
        response.status,
        await response.text(),
        endpoint
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, 'Network error', endpoint);
  }
}
```

### 2. 添加重試機制

```typescript
private static async apiCallWithRetry(
  endpoint: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<any> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.apiCall(endpoint, options);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
}
```

### 3. 添加快取機制

```typescript
private static cache = new Map<string, { data: any; timestamp: number }>();
private static CACHE_TTL = 60000; // 1 分鐘

private static getCached(key: string): any | null {
  const cached = this.cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > this.CACHE_TTL) {
    this.cache.delete(key);
    return null;
  }

  return cached.data;
}

private static setCached(key: string, data: any): void {
  this.cache.set(key, { data, timestamp: Date.now() });
}
```

### 4. 效能優化

```typescript
// 延遲載入不常用的功能
async enableScreenshotMode(): Promise<void> {
  if (!this.html2canvasLoaded) {
    await this.loadHtml2Canvas();
    this.html2canvasLoaded = true;
  }
  // ...
}

// 使用 Web Workers 處理大量數據
private async processDataInWorker(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/data-processor.js');
    worker.postMessage(data);
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = (e) => reject(e);
  });
}
```

### 5. TypeScript 嚴格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

## 套件大小優化

### 當前問題
- 包含不必要的後端依賴
- 打包了所有程式碼包含 admin panel

### 優化策略

#### 1. 分離 Admin Panel
```typescript
// 主套件只包含 widget
export { LensServiceWidget as default } from './widget';

// Admin panel 作為獨立入口
export { AdminPanel } from './admin';
```

```json
// package.json
{
  "exports": {
    ".": {
      "import": "./dist/lens-service.mjs",
      "require": "./dist/lens-service.umd.js"
    },
    "./admin": {
      "import": "./dist/admin.mjs",
      "require": "./dist/admin.umd.js"
    },
    "./style.css": "./dist/style.css"
  }
}
```

#### 2. Tree-shaking 優化
```typescript
// 使用 ES modules
export { LensServiceWidget } from './widget';
export { AdminPanel } from './admin';
export type * from './types';

// 而不是
export default { LensServiceWidget, AdminPanel };
```

#### 3. 動態載入
```typescript
// 只在需要時載入 admin panel
async openAdmin() {
  if (!this.adminPanel) {
    const { AdminPanel } = await import('./admin/AdminPanel');
    this.adminPanel = new AdminPanel();
  }
  await this.adminPanel.open();
}
```

---

## 總結

### 優先級順序

#### P0 (必須做) 🔴
1. **移除後端依賴** - 減少套件大小,提高安全性
2. **配置化 API 端點** - 讓 widget 可獨立使用
3. **更新文檔** - 讓使用者知道如何正確使用

#### P1 (應該做) 🟡
4. **拆分前後端套件** - 清晰的架構
5. **提供 Docker image** - 方便使用者部署後端
6. **建立範例專案** - 降低學習成本

#### P2 (可以做) 🟢
7. **效能優化** - 提升使用體驗
8. **錯誤處理改進** - 提高穩定性
9. **添加測試** - 保證品質

### 預估時間線

- **Phase 1 (基礎重構)**: 2-3 天
- **Phase 2 (後端改進)**: 3-4 天
- **Phase 3 (文檔範例)**: 2-3 天
- **Phase 4 (測試發布)**: 2-3 天

**總計: 2-3 週**

### 發布後的版本規劃

- `v2.0.0` - 重構版本 (Breaking changes)
- `v2.1.0` - 效能優化
- `v2.2.0` - 新功能添加
- `v3.0.0` - 完整的 SaaS 解決方案

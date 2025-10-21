# Lens Service

一個可嵌入的 AI 客服 Widget，支援多種功能包括對話管理、知識庫搜索、Sitemap 爬取等。

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製 `.env.example` 到 `.env` 並填入必要的配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# 資料庫連接
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Azure OpenAI（可選）
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_DEPLOYMENT="gpt-4"
```

### 3. 生成 Prisma Client

```bash
npm run db:generate
```

### 4. 構建

```bash
npm run build
```

## 📦 在其他專案中使用

### 方式 1: 本地路徑（開發中）

在你的專案的 `package.json` 中：

```json
{
  "dependencies": {
    "lens-service": "file:../lens-service"
  }
}
```

然後執行：

```bash
npm install
# 或
yarn install
```

### 方式 2: Git 倉庫（生產環境）

```json
{
  "dependencies": {
    "lens-service": "github:GenAI-Agent/lens-service"
  }
}
```

## 🎯 使用範例

### 在 Next.js 中使用

```typescript
// app/layout.tsx 或 pages/_app.tsx
import 'lens-service/dist/lens-service.css';

// 在你的組件中
import { useEffect } from 'react';

export default function MyApp() {
  useEffect(() => {
    // 動態導入 lens-service
    import('lens-service').then((LensService) => {
      LensService.default.init({
        apiEndpoint: '/api/lens-service',
        position: 'bottom-right',
      });
    });
  }, []);

  return (
    <div>
      {/* 你的應用內容 */}
    </div>
  );
}
```

### 在 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="path/to/lens-service.css">
</head>
<body>
  <!-- 你的內容 -->
  
  <script src="path/to/lens-service.umd.js"></script>
  <script>
    LensService.init({
      apiEndpoint: '/api/lens-service',
      position: 'bottom-right',
    });
  </script>
</body>
</html>
```

## 🗄️ 資料庫

### 現有資料庫結構

Lens Service 使用 Prisma ORM 連接到 PostgreSQL 資料庫。主要的資料表包括：

- **conversations**: 對話記錄
- **manual_indexes**: 手動建立的知識庫索引
- **admin_users**: 管理員帳號
- **sitemap_configs**: Sitemap 配置
- **sitemap_pages**: 爬取的頁面內容
- **sitemap_crawl_logs**: 爬取日誌
- **settings**: 系統設定

### 查看資料庫

使用 Prisma Studio 查看和編輯資料：

```bash
npx prisma studio
```

## 🔧 開發

### 開發模式

```bash
npm run dev
```

### 構建

```bash
npm run build
```

### 生成 Prisma Client

```bash
npm run db:generate
```

### 同步資料庫結構

如果資料庫結構有變化，可以重新 introspect：

```bash
npx prisma db pull
npm run db:generate
```

## 📁 專案結構

```
lens-service/
├── src/
│   ├── admin/              # 管理面板
│   ├── components/         # UI 組件
│   ├── services/           # 業務邏輯服務
│   ├── index.ts           # 主入口
│   └── types.ts           # TypeScript 類型定義
├── prisma/
│   └── schema.prisma      # Prisma 資料庫 schema
├── dist/                  # 構建輸出
├── .env                   # 環境變數（不提交到 git）
├── .env.example          # 環境變數範例
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔑 主要功能

### 1. 對話管理
- 儲存和檢索用戶對話
- 支援多輪對話
- 對話歷史記錄

### 2. 知識庫搜索
- 手動建立的知識庫索引
- 關鍵字搜索
- 內容匹配

### 3. Sitemap 爬取
- 自動爬取網站內容
- 定期更新
- 爬取日誌記錄

### 4. 管理後台
- 管理員認證
- 對話管理
- 知識庫管理
- 系統設定

## 🔐 環境變數說明

| 變數名稱 | 說明 | 必填 |
|---------|------|------|
| `DATABASE_URL` | PostgreSQL 資料庫連接字串 | ✅ |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI 端點 | ❌ |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API 金鑰 | ❌ |
| `AZURE_OPENAI_DEPLOYMENT` | Azure OpenAI 部署名稱 | ❌ |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ❌ |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | ❌ |

## 📝 API 文檔

詳細的 API 文檔請參考 [API Routes](../api-routes.md)。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🔗 相關連結

- [GitHub Repository](https://github.com/GenAI-Agent/lens-service)
- [Issues](https://github.com/GenAI-Agent/lens-service/issues)

## 💡 提示

### 在 lens-platform 中測試

1. 確保 lens-service 已經構建：
   ```bash
   cd lens-service
   npm run build
   ```

2. 在 lens-platform 中安裝依賴：
   ```bash
   cd lens-platform
   yarn install
   ```

3. 啟動 lens-platform：
   ```bash
   yarn dev
   ```

### 更新 lens-service

當你修改 lens-service 的代碼後：

1. 重新構建：
   ```bash
   cd lens-service
   npm run build
   ```

2. 在 lens-platform 中重新安裝（如果需要）：
   ```bash
   cd lens-platform
   yarn install --force
   ```

## 🐛 故障排除

### Prisma Client 錯誤

如果遇到 Prisma Client 相關錯誤，嘗試：

```bash
npm run db:generate
```

### 資料庫連接錯誤

確認：
1. `.env` 文件中的 `DATABASE_URL` 是否正確
2. 資料庫是否可以訪問
3. 資料庫憑證是否正確

### 構建錯誤

清理並重新構建：

```bash
rm -rf dist node_modules
npm install
npm run build
```


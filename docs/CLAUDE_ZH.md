# CLAUDE.md

本文件為 Claude Code (claude.ai/code) 在此儲存庫中工作時提供指導。

## 專案概述

Lens Service 是一個可嵌入的 AI 客服 Widget 函式庫，使用 Azure OpenAI 提供智能客服支援。可嵌入任何網頁應用程式，包含客戶端聊天 Widget 和管理後台面板。

Widget 使用混合搜尋方法，結合：
1. 手動索引（管理員建立的知識庫條目）
2. LLMs.txt 內容（專為 AI 代理格式化的網站文檔）
3. Azure OpenAI 智能回應
4. Telegram 通知（需要人工支援的問題）

## 開發指令

本專案使用 **bun** 作為套件管理器。

### Widget 開發
```bash
# 安裝依賴
bun install

# 開發模式（Vite 開發伺服器）
bun run dev

# 建置 Widget 函式庫
bun run build

# 預覽正式版建置
bun run preview
```

### 後端服務
```bash
# 啟動資料庫 API 伺服器（Widget 功能必需）
bun run server          # 正式版模式
bun run server:dev      # 開發模式（自動重載）

# 啟動資料庫代理（替代的資料庫存取層）
bun run db:proxy        # 正式版模式
bun run db:proxy:dev    # 開發模式（自動重載）
```

### 資料庫管理
```bash
# 生成 Prisma 客戶端
bun run db:generate

# 推送結構變更到資料庫
bun run db:push

# 執行資料庫遷移
bun run db:migrate
```

### PostgreSQL 資料庫設置
資料庫運行在 Docker 中。資料庫檔案和設置腳本位於 `sql/` 目錄：

```bash
# 啟動 PostgreSQL 資料庫
cd sql
docker-compose up -d

# 初始化資料庫（容器啟動後）
docker exec -i lens-service-db psql -U postgres -d lens_service < init.sql

# 連接資料庫
docker exec -it lens-service-db psql -U postgres -d lens_service

# 停止資料庫
docker-compose down
```

**連接字串**: `postgresql://postgres@localhost:5432/lens_service`

## 架構

### 建置系統
- **TypeScript** 啟用嚴格模式
- **Vite** 打包為 UMD 和 ES 模組
- **目標**: ES2020 with DOM 函式庫
- **輸出**: `dist/lens-service.umd.js`、`dist/lens-service.mjs` 和型別定義

### 核心元件結構

**src/index.ts** - 主要 Widget 類別（`LensServiceWidget`）
- 進入點和初始化邏輯
- 管理對話狀態和訊息流程
- 協調 UI 元件和後端服務
- 處理 Azure OpenAI API 呼叫（文字和視覺）
- 實現截圖捕捉模式（Q+點擊）

**src/components/** - UI 元件
- `SidePanel.ts` - 客戶端聊天介面
- `styles.ts` - Widget 樣式

**src/admin/** - 管理後台
- `AdminPanel.ts` - 管理員管理介面
- 可在 `/lens-service` 路由存取

**src/services/** - 服務層
- `DatabaseService.ts` - 資料庫操作 API 客戶端（呼叫 db-server 端點）
- `ConversationService.ts` - 對話管理
- `ManualIndexService.ts` - 知識庫搜尋（BM25 + 向量搜尋）
- `LlmsTxtService.ts` - LLMs.txt 內容搜尋（指紋和區塊搜尋）
- `ConfigService.ts` - 配置管理
- `CustomerServiceManager.ts` - 客服工作流程編排
- `AdminUserManager.ts` - 管理員認證和使用者管理

**src/types.ts** - 所有資料結構的 TypeScript 型別定義

### 後端架構

**db-server.js**（port 3002）
- Express API 伺服器提供 RESTful 端點
- 透過 Docker exec + psql 執行 PostgreSQL 查詢
- 端點：對話、手動索引、設定、管理員使用者
- 前端 DatabaseService 與此伺服器通訊

**sql/** - 資料庫層
- PostgreSQL 資料庫運行在 Docker
- 資料表：`conversations`、`manual_indexes`、`settings`、`admin_users`
- `simple-db-server.js` - 替代資料庫伺服器實作
- `db-proxy.js` - 資料庫代理層

### 資料庫結構

**conversations** - 儲存客服對話記錄
- 欄位：id、conversation_id、user_id、status、messages（JSONB）、時間戳記

**manual_indexes** - 知識庫條目
- 欄位：id、title、description、content、url、時間戳記
- 用於 BM25 + 語義搜尋

**settings** - 系統配置
- 鍵值對：system_prompt、default_reply、llms_txt_url

**admin_users** - 管理員認證
- 欄位：id、username、password、email、created_at
- 預設使用者：lens/1234、admin/admin123

### 訊息處理流程

1. **使用者發送訊息** → Widget 捕捉輸入
2. **搜尋階段**：
   - 搜尋手動索引（BM25 + 向量）
   - 搜尋 LLMs.txt 區塊（指紋搜尋含上下文）
   - 合併和排序結果
3. **LLM 階段**：
   - 從搜尋結果建立上下文
   - 使用增強提示呼叫 Azure OpenAI
   - 分析回應信心度
4. **回應處理**：
   - 如果有信心：返回 AI 回應
   - 如果不確定：返回預設回覆 + 發送 Telegram 通知
5. **儲存到資料庫**：儲存包含所有元資料的對話

### Widget 配置

Widget 接受 `ServiceModulerConfig` 包含：
- `azureOpenAI`：Azure OpenAI 端點、API 金鑰、部署名稱
- `telegram`：Bot token 和 chat ID（人工升級通知）
- `ui`：位置、寬度、圖示位置、顏色
- `database`：PostgreSQL 連接詳情
- `features`：啟用/停用截圖、規則、搜尋

### 嵌入應用程式

Widget 設計為嵌入 React/Next.js 應用程式：

1. 安裝：`npm install GenAI-Agent/lens-service`
2. 匯入樣式：`import 'lens-service/dist/style.css'`
3. 在 React 元件中初始化 Widget：
   ```typescript
   const { LensService } = await import('lens-service');
   new LensService({ container, apiBaseUrl, azureOpenAI, telegram });
   ```
4. 管理後台：匯入 `AdminPanel` 並以類似方式初始化

## 主要功能

### 截圖捕捉模式
- 在聊天面板開啟時按住 **Q** 鍵
- 點擊任何元素以捕捉截圖
- 截圖自動附加到訊息輸入
- 使用 html2canvas 函式庫（動態載入）

### 搜尋技術
- **BM25**：手動索引的關鍵字排序
- **向量搜尋**：使用嵌入的語義搜尋
- **指紋搜尋**：LLMs.txt 內容的快速區塊匹配
- **上下文視窗**：返回帶有周圍上下文的區塊，提升 LLM 理解

### LLMs.txt 整合
- 從配置的 URL 抓取和快取內容（1 小時快取）
- 分割為 500 字元區塊，100 字元重疊
- 建立指紋以進行快速相似度匹配
- 返回匹配的區塊及前後上下文

### Telegram 通知
當 AI 無法回答問題時：
- 發送通知到配置的 Telegram 聊天
- 包含會話 ID、使用者訊息、時間戳記
- 允許人工客服透過管理後台回應

## 測試和除錯

### 本地開發設置
1. 啟動 PostgreSQL：`cd sql && docker-compose up -d`
2. 初始化資料庫：見上述資料庫指令
3. 啟動 db-server：`bun run server:dev`（port 3002）
4. 啟動 Widget 開發伺服器：`bun run dev`
5. 管理後台可存取：`http://localhost:[dev-port]/lens-service`

### 預設測試帳號
- 使用者名稱：lens，密碼：1234
- 使用者名稱：admin，密碼：admin123

### 除錯技巧
- Widget 使用帶有表情符號前綴的 console 日誌（✅、❌、🔍、📸 等）
- 檢查瀏覽器 console 查看初始化和 API 呼叫日誌
- 資料庫 API 日誌出現在 server:dev 終端
- 在配置中使用 `debug: true` 進行詳細日誌記錄

## 重要實作注意事項

- **資料庫服務**：前端 `DatabaseService.ts` 是呼叫 `db-server.js` 端點（`http://localhost:3002`）的 API 客戶端
- **狀態管理**：對話儲存在 PostgreSQL，也維護在 localStorage 以便快速恢復
- **會話管理**：每個對話獲得唯一會話 ID（`sm_${timestamp}_${random}`）
- **新對話**：每次面板開啟時建立（預設不從先前會話持久化）
- **外部依賴**：僅在使用截圖功能時動態載入 html2canvas
- **建置輸出**：生成 UMD（用於 script 標籤）和 ES 模組（用於現代打包工具）
- **型別定義**：建置期間在 `dist/` 目錄中生成

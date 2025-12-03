# Lens Service v3 - 部署指南

完整的部署步驟和企業主使用指南。

## 🎯 系統需求

### 必要條件

1. **PostgreSQL 資料庫**
   - 版本: 12.0 或更新
   - 建議使用託管服務（如 AWS RDS, Google Cloud SQL, Supabase）

2. **OpenAI API Key**
   - 需要有效的 OpenAI API Key
   - 使用模型: GPT-5.1 (或 GPT-4)
   - 使用 Embedding: text-embedding-3-small

3. **Node.js 環境**
   - 版本: 18.0 或更新
   - 包管理器: yarn 或 npm

## 📦 第一步：準備環境

### 1. 克隆專案

```bash
git clone <your-repo>
cd lens-service-v3
```

### 2. 安裝依賴

```bash
# 根目錄安裝（可選）
yarn install

# 或分別安裝各模組
cd agents && yarn install
cd ../widget && yarn install
cd ../server && yarn install
cd ../admin && yarn install
```

### 3. 配置環境變數

在 `lens-service-v3` 根目錄建立 `.env` 檔案：

```env
# PostgreSQL 資料庫連線
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# OpenAI API Key
OPENAI_API_KEY="sk-..."

# LLM 模型（可選，預設為 gpt-5.1）
LLM_MODEL="gpt-5.1"

# Server Port（可選，預設為 3002）
PORT=3002
```

**重要：**
- `DATABASE_URL` 請替換為你自己的 PostgreSQL 連線字串
- `OPENAI_API_KEY` 請替換為你的 OpenAI API Key
- 如果 GPT-5.1 不可用，可改用 `gpt-4` 或 `gpt-4-turbo`

## 🗄️ 第二步：設置資料庫

### 1. 生成 Prisma Client

```bash
yarn prisma generate
```

### 2. 推送資料庫 Schema

```bash
yarn prisma db push
```

這會在你的 PostgreSQL 資料庫中建立以下表：
- `sessions` - 對話 Session
- `messages` - 對話訊息
- `navigation_history` - 頁面導航歷史
- `site_prompts` - 全站 Prompt
- `url_path_prompts` - URL 路徑 Prompt
- `knowledge_base` - 知識庫
- `skills` - 技能配置

### 3. 驗證資料庫

```bash
yarn prisma studio
```

這會開啟 Prisma Studio，讓你可以視覺化查看資料庫內容。

## 🚀 第三步：啟動服務

### 開發模式

**Terminal 1: 啟動 Server**
```bash
cd server
yarn dev
```

Server 會在 `http://localhost:3002` 啟動。

**Terminal 2: 啟動 Widget Dev Server**
```bash
cd widget
yarn dev
```

Widget 會在 `http://localhost:5173` 啟動。

**Terminal 3: 啟動 Admin Dashboard**
```bash
cd admin
yarn dev
```

Admin 會在 `http://localhost:3003` 啟動。

### 生產模式

**1. 建立 Widget**
```bash
cd widget
yarn build
```

這會在 `widget/dist` 生成靜態檔案。

**2. 啟動 Server**
```bash
cd server
yarn build
yarn start
```

Server 會在生產模式啟動。

**3. 建立 Admin Dashboard**
```bash
cd admin
yarn build
```

Admin 靜態檔案會在 `admin/dist`，可部署到任何靜態託管服務。

## 🎨 第四步：配置 Admin 後台

### 1. 開啟 Admin Dashboard

瀏覽器開啟 `http://localhost:3003`

你會看到側邊欄有以下功能：
- **Dashboard** - 總覽
- **Site Prompts** - 全站 Prompt
- **URL Prompts** - URL 路徑 Prompt
- **Skills** - 技能
- **Knowledge Base** - 知識庫（最重要）
- **Sessions** - 對話記錄
- **Test Agent** - 測試 Agent

### 2. 設置全站 Prompt (Site Prompts)

點擊 **Site Prompts** → **+ Add Prompt**

範例：
```
Name: 網站介紹
Prompt:
我們是一家3C電商網站。主要販售筆記型電腦、手機、配件等產品。
我們提供：
- 免費運送（訂單滿 $1000）
- 7天鑑賞期
- 1年保固
- 24小時客服

網站主要功能：
- 瀏覽產品
- 加入購物車
- 結帳
- 會員中心
- 訂單查詢
```

勾選 **Global** 和 **Active**，點擊 **Create**。

### 3. 設置 URL 路徑 Prompt (URL Prompts)

點擊 **URL Prompts** → **+ Add Prompt**

範例 1: 產品頁面
```
URL Pattern: /products/*
Prompt:
這是產品詳情頁。
頁面包含：
- 產品名稱
- 產品價格（.product-price）
- 產品描述
- 規格
- 庫存狀態
- 加入購物車按鈕（.add-to-cart）

你可以幫助使用者了解產品資訊、比較規格、確認價格等。
```

範例 2: 結帳頁面
```
URL Pattern: /checkout*
Prompt:
這是結帳頁面。
使用者可以：
- 填寫收件資訊
- 選擇付款方式
- 選擇運送方式
- 確認訂單

請協助使用者完成結帳流程，解答付款和運送相關問題。
```

設置 **Priority**（數字越大優先級越高）和 **Active**。

### 4. 設置知識庫 (Knowledge Base) ⭐ 最重要

點擊 **Knowledge Base** → **+ Add New Entry**

**範例 1: 退貨政策**
```
Name: 退貨政策
Description: 產品退貨、退款、7天鑑賞期相關規定
Content:
【退貨政策】

退貨條件：
1. 購買後7天內可退貨
2. 商品必須保持全新未使用狀態
3. 需包含完整包裝、配件、發票

退貨流程：
1. 聯繫客服申請退貨（提供訂單編號）
2. 收到退貨地址後寄回商品
3. 我們收到商品後3-5個工作天內退款

退款方式：
- 信用卡：退回原信用卡
- ATM轉帳：退回指定帳戶

特殊說明：
- 運費由買家負擔（商品瑕疵除外）
- 特價商品、客製化商品不接受退貨

聯繫客服：
電話：0800-123-456
Email: service@example.com
Category: 退貨退款
Keywords: 退貨, 退款, 退回, 鑑賞期, 不滿意, refund, return
```

**範例 2: 運送資訊**
```
Name: 運送資訊
Description: 配送方式、運費、配送時間、物流追蹤
Content:
【運送資訊】

運送方式：
1. 宅配（全台灣）
   - 運費：$100
   - 訂單滿 $1000 免運
   - 配送時間：3-5個工作天

2. 便利商店取貨
   - 運費：$60
   - 配送時間：3-4個工作天
   - 支援 7-11、全家、萊爾富

配送時間：
- 週一至週五：09:00-18:00
- 假日及國定假日不配送
- 偏遠地區需額外1-2天

物流追蹤：
- 訂單出貨後會收到簡訊通知
- 可在「會員中心」查詢物流狀態
- 物流編號可在訂單詳情查看

Category: 運送配送
Keywords: 運送, 配送, 物流, 快遞, 宅配, 免運, 運費, shipping, delivery
```

**範例 3: 產品保固**
```
Name: 產品保固
Description: 產品保固期限、保固範圍、維修流程
Content:
【產品保固】

保固期限：
- 筆記型電腦：1年
- 手機：1年
- 配件：6個月

保固範圍：
✅ 包含：
- 正常使用下的故障
- 製造瑕疵
- 零件故障

❌ 不包含：
- 人為損壞（摔落、進水）
- 擅自拆機維修
- 超過保固期限

維修流程：
1. 聯繫客服說明問題
2. 寄回產品（附購買證明）
3. 檢測後通知維修方案
4. 維修完成後寄回（約7-14天）

聯繫方式：
電話：0800-123-456
Email: warranty@example.com

Category: 保固維修
Keywords: 保固, 維修, 故障, 壞掉, 不能用, warranty, repair
```

### 5. 設置 Skills（可選）

Skills 讓 Agent 可以用 `/skill_name query` 調用特定技能。

點擊 **Skills** → **+ Add Skill**

**範例：訂單查詢**
```
Name: order-lookup
Prompt:
你是訂單查詢專家。
使用者會提供訂單編號或相關資訊。
你需要：
1. 確認訂單編號格式
2. 使用 web_use 工具在頁面上查找訂單資訊
3. 提供訂單狀態、配送進度、預計到貨時間
4. 如果訂單有問題，主動建議解決方案

請用親切、專業的語氣回答。
```

使用時用戶可以輸入：`/order-lookup 我想查詢訂單 12345 的狀態`

## 🔍 第五步：測試 Agent

### 1. 使用 Test Agent 頁面

在 Admin Dashboard 點擊 **Test Agent**

輸入問題測試：
- "這個產品多少錢？"
- "如何退貨？"
- "運費怎麼算？"
- "保固期多久？"

觀察 Agent 是否：
- 正確呼叫 knowledge_search 工具
- 找到相關的知識庫內容
- 提供準確的回答

### 2. 在實際網站測試

在你的網站頁面嵌入 Widget（見下一步）。

## 🌐 第六步：嵌入 Widget 到你的網站

### 1. 建立 Widget

```bash
cd widget
yarn build
```

### 2. 部署 Widget 靜態檔案

將 `widget/dist` 的檔案部署到你的 CDN 或靜態檔案伺服器。

### 3. 在網站中嵌入

在你的網站 HTML `<head>` 或 `<body>` 末尾加入：

```html
<!-- Lens Service Widget -->
<div id="lens-widget"></div>
<script>
  window.LENS_CONFIG = {
    apiUrl: 'https://your-server.com', // 你的 Server URL
    userId: 'user-123', // 替換為實際的使用者 ID
  };
</script>
<script src="https://your-cdn.com/lens-widget.js"></script>
<link rel="stylesheet" href="https://your-cdn.com/lens-widget.css">
```

### 4. 驗證

重新載入網站，你應該會看到右下角的聊天按鈕。點擊後可以開始對話。

## 📊 第七步：監控和管理

### 查看對話記錄

在 Admin Dashboard 點擊 **Sessions**：
- 可以看到所有使用者的對話 Session
- 按 user_id 分組
- 按時間排序
- 點擊 Session 查看完整對話記錄

### 手動回覆

在 Sessions 頁面：
1. 選擇一個 Session
2. 查看對話內容
3. 在下方輸入框手動回覆
4. 點擊 **Send Reply** 發送

這適合處理 Agent 無法回答的複雜問題。

## 🔧 常見問題

### Q1: Database connection error

**問題**: 無法連接到資料庫

**解決方案**:
1. 檢查 `.env` 的 `DATABASE_URL` 是否正確
2. 確認 PostgreSQL 服務正在運行
3. 檢查防火牆是否允許連線
4. 確認資料庫使用者有正確的權限

### Q2: OpenAI API error

**問題**: OpenAI API 呼叫失敗

**解決方案**:
1. 檢查 `OPENAI_API_KEY` 是否有效
2. 確認 API Key 有足夠的額度
3. 檢查模型名稱是否正確（GPT-5.1 或 GPT-4）
4. 查看 OpenAI API 狀態頁面

### Q3: Widget 沒有出現

**問題**: 網站上看不到 Widget

**解決方案**:
1. 檢查 JavaScript 和 CSS 檔案是否正確載入
2. 檢查瀏覽器 Console 是否有錯誤
3. 確認 `apiUrl` 設置正確
4. 檢查 CORS 設定

### Q4: Knowledge Search 找不到內容

**問題**: Agent 無法找到知識庫內容

**解決方案**:
1. 檢查 Knowledge Base 是否已建立且 `isActive = true`
2. 確認 `description` 欄位有填寫（用於 vector search）
3. 檢查 `keywords` 是否包含相關關鍵字（用於 BM25 search）
4. 測試用更明確的關鍵字查詢

### Q5: Memory Compact 什麼時候觸發？

**問題**: 對話歷史太長會怎樣？

**回答**:
系統會自動壓縮對話歷史：
- 當訊息數 > 20 條
- 或 Token 數 > 8000

壓縮後會保留最近 10 條訊息，其餘用 LLM 生成摘要，可節省 75-85% tokens。

## 📝 最佳實踐

### 1. Knowledge Base 內容撰寫

- **Name**: 簡短明確（如：退貨政策）
- **Description**: 用於搜尋，包含關鍵字和概要（100-200字）
- **Content**: 完整內容，包含具體步驟、細節、聯絡方式
- **Keywords**: 包含中英文關鍵字、同義詞、常見錯字

### 2. Prompt 設計

- **Site Prompt**: 包含網站基本資訊、功能、政策
- **URL Prompt**: 針對特定頁面類型，說明頁面元素和功能
- 使用具體的 CSS Selector（如 `.add-to-cart`）

### 3. 安全性

- 不要將 `.env` 提交到版本控制
- 定期更換 API Keys
- 限制 Admin Dashboard 的存取（加上身份驗證）
- 定期備份資料庫

### 4. 效能優化

- 定期清理過期的 Session
- 監控 OpenAI API 使用量
- 使用 CDN 加速 Widget 載入
- 考慮使用 Redis 快取常見查詢

## 🚢 生產部署建議

### Server 部署選項

1. **VPS / Cloud Instance** (AWS EC2, Google Compute Engine, DigitalOcean)
   - 安裝 Node.js 18+
   - 使用 PM2 管理 process
   - 配置 Nginx 反向代理

2. **Platform as a Service** (Heroku, Railway, Render)
   - 直接推送 Git repository
   - 自動處理環境配置

3. **Serverless** (AWS Lambda, Google Cloud Functions)
   - 需要調整架構以支援 SSE

### 資料庫

建議使用託管服務：
- AWS RDS
- Google Cloud SQL
- Supabase
- PlanetScale

### Widget & Admin

部署到靜態託管：
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

## 📞 支援

如有問題，請：
1. 查看 [README.md](../README.md)
2. 查看相關文檔：
   - [WEB_USE_ARCHITECTURE.md](./WEB_USE_ARCHITECTURE.md)
   - [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
   - [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
3. 提交 Issue 到 GitHub

---

**祝你部署順利！🎉**

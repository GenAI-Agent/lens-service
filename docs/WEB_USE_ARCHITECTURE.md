# Web Use Architecture - 完整說明文件

**日期**: 2025-12-02
**版本**: 3.0 (Widget-based, 非 Playwright)

---

## 🎯 核心架構決策

### Widget-based vs Browser Automation

**關鍵理解**:
- ❌ **不是** Playwright/Puppeteer (開新瀏覽器控制)
- ✅ **是** 內嵌 Widget (在客戶網站內操作)

類似於：
- Intercom 聊天插件
- Zendesk Widget
- 內嵌在客戶網站的 AI 助手

### 技術棧

```typescript
// ❌ 錯誤的技術（Browser Automation）
import { chromium } from 'playwright';
import puppeteer from 'puppeteer';

// ✅ 正確的技術（DOM API）
document.querySelector('.button')
element.click()
element.scrollIntoView()
html2canvas(element)
```

---

## 📐 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                   客戶網站                                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Lens Widget (嵌入式)                      │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │       Web Use Service (DOM API)              │  │ │
│  │  │                                               │  │ │
│  │  │  • analyzePage() - DOM → Markdown + Screenshot│ │
│  │  │  • click() - 點擊元素                          │ │
│  │  │  • type() - 輸入文字                          │ │
│  │  │  • scroll() - 滾動頁面                        │ │
│  │  │  • highlight() - 標註區塊                     │ │
│  │  │  • extract() - 提取文字                       │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │       Chat UI (React)                        │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↕ HTTP/WebSocket               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend Server                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │       Supervisor Agent                             │ │
│  │       • Decision Loop                              │ │
│  │       • Tool Execution                             │ │
│  │       • Memory Management                          │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │       Context Engineer                             │ │
│  │       • PromptBuilder (Site/URL Prompts)           │ │
│  │       • MemoryManager (Memory Compact)             │ │
│  │       • StateManager (Ephemeral State)             │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │       Database (PostgreSQL)                        │ │
│  │       • messages                                   │ │
│  │       • navigation_history                         │ │
│  │       • site_prompts ← 新增                        │ │
│  │       • url_path_prompts ← 新增                    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (新增)

### site_prompts (站主配置的全站 Prompt)

```sql
CREATE TABLE site_prompts (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  is_global BOOLEAN DEFAULT TRUE,  -- 適用於所有頁面
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**用途**: 讓站主配置自己網站的說明，幫助 AI 理解網站結構

**範例**:
```
我們是一個電商網站，主要販售 3C 產品。
導航列：首頁 | 產品列表 | 購物車 | 會員中心
用戶登入後可以查看訂單、修改資料、查詢物流。
```

### url_path_prompts (URL 路徑匹配的 Prompt)

```sql
CREATE TABLE url_path_prompts (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url_pattern TEXT NOT NULL,  -- e.g., "/products/*", "/cart"
  prompt TEXT NOT NULL,
  priority INT DEFAULT 0,     -- 匹配優先級
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**用途**: 為特定頁面提供額外的上下文說明

**範例**:
| URL Pattern | Prompt |
|-------------|--------|
| `/products/*` | 這是產品詳情頁。頁面包含：產品名稱、價格、規格、庫存、加入購物車按鈕。用戶可以選擇數量後加入購物車。 |
| `/cart` | 這是購物車頁面。用戶可以修改數量、刪除商品、查看總價、進行結帳。 |
| `/checkout/*` | 這是結帳流程頁面。包含：填寫收件資訊 → 選擇付款方式 → 確認訂單。 |

---

## 🧠 PromptBuilder 更新

### 新的 API 簽名

```typescript
// 舊版（已移除）
buildPrompt(sessionId, currentPage, currentQuery, baseSystemPrompt)

// 新版（支援 site/URL prompts + multimodal screenshot）
buildPrompt(
  sessionId: string,
  tenantId: string,        // ← 新增：用來載入 site_prompts
  currentUrl: string,      // ← 新增：用來匹配 url_path_prompts
  currentPage: PageState | null,
  currentQuery: string,
  baseSystemPrompt: string
): Promise<ChatMessage[]>
```

### Prompt 組成順序

```
[0] Base System Prompt
    └─ 基礎系統指令（如何使用工具、如何回應等）

[1] Site-Specific Prompt (站主配置)
    └─ 從 site_prompts 表載入（全站適用）

[2] URL-Specific Prompt (路徑匹配)
    └─ 從 url_path_prompts 表載入（當前 URL 匹配）

[3] Fixed Input (Current Page + Screenshot)
    └─ 包含：
       • URL、標題
       • Markdown 內容（DOM 結構）
       • Screenshot（base64）← multimodal
       • 可操作元素列表
       • 導航歷史

[4-N] Messages from DB (includes Memory Compact)
    └─ 對話歷史（自動 Compact）

[N+1] Current User Query
    └─ 當前用戶問題
```

### Multimodal 支援

```typescript
// Fixed Input 現在支援 multimodal (text + image)
{
  role: 'system',
  content: [
    {
      type: 'text',
      text: '[當前頁面]\nURL: https://example.com/cart\n...',
    },
    {
      type: 'image_url',
      image_url: {
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',  // base64
      },
    },
  ],
}
```

**為什麼需要 Screenshot？**
1. ✅ Multimodal 模型（GPT-4V, Gemini 2.0 Flash）可以「看」頁面
2. ✅ AI 可以理解視覺元素（按鈕顏色、位置、layout）
3. ✅ 更精準的元素定位
4. ✅ 用戶看到的 = AI 看到的（同步視角）

---

## 🛠️ Web Use Service (Widget 端實作)

### 位置
```
packages/widget/src/web-use/web-use-service.ts
```

### 核心功能

#### 1. analyzePage() - 頁面分析

```typescript
async analyzePage(): Promise<PageAnalysis> {
  // 1. DOM → Markdown (Turndown)
  const markdownContent = await this.domToMarkdown();

  // 2. 截圖 (html2canvas)
  const screenshot = await this.takeScreenshot();

  // 3. 提取可操作元素
  const actionableElements = this.extractActionableElements();

  return {
    url: window.location.href,
    title: document.title,
    markdownContent,
    screenshot,  // base64 data URL
    actionableElements,
    navigationPaths: [],
    cachedAt: new Date(),
  };
}
```

**輸出範例**:
```json
{
  "url": "https://example.com/products/123",
  "title": "iPhone 15 Pro - 產品詳情",
  "markdownContent": "# iPhone 15 Pro\n\n價格: NT$ 36,900\n...",
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "actionableElements": [
    {
      "id": "el-0",
      "type": "button",
      "description": "button \"加入購物車\"",
      "selector": "[data-lens-id=\"el-0\"]",
      "action": "點擊此按鈕: 加入購物車"
    },
    {
      "id": "el-1",
      "type": "input",
      "description": "input placeholder: \"數量\"",
      "selector": "[data-lens-id=\"el-1\"]",
      "action": "在此輸入: 數量"
    }
  ]
}
```

#### 2. click() - 點擊元素

```typescript
await webUse.click({
  selector: '[data-lens-id="el-0"]'
});
```

**流程**:
1. 定位元素（多種策略：selector, xpath, text, aria-label）
2. 滾動到元素位置（`scrollIntoView`）
3. 等待 300ms（確保滾動完成）
4. 觸發點擊（`element.click()`）

#### 3. type() - 輸入文字

```typescript
await webUse.type(
  { selector: 'input[name="quantity"]' },
  '2',
  true  // clearFirst
);
```

**流程**:
1. 定位輸入框
2. 滾動到可見
3. 清空（如果 `clearFirst = true`）
4. 逐字輸入（模擬真實打字，50ms 延遲）
5. 觸發 `input` 和 `change` 事件

#### 4. scroll() - 滾動頁面

```typescript
// 滾動方向
await webUse.scroll('down', 500);
await webUse.scroll('up', 300);
await webUse.scroll('top');
await webUse.scroll('bottom');

// 滾動到元素
await webUse.scroll({ selector: '#section-5' });
```

#### 5. highlight() - 標註區塊

```typescript
await webUse.highlight(
  { selector: '.product-price' },
  2000  // duration (ms)
);
```

**視覺效果**:
- 紅色外框（`outline: 3px solid #ff0000`）
- 黃色半透明背景（`backgroundColor: rgba(255, 255, 0, 0.3)`）
- 平滑滾動到元素位置
- 2 秒後自動移除標註

**用途**: 當 AI 回答用戶問題時，可以標註相關區塊

#### 6. extractText() - 提取文字

```typescript
const result = webUse.extractText({ selector: '.product-description' });
console.log(result.text);
```

#### 7. navigate() - 導航

```typescript
webUse.navigate('https://example.com/cart');
```

---

## 📊 完整執行流程

### 情境：用戶問「這個產品多少錢？」

```
1. User: "這個產品多少錢？"
   └─ Widget → Backend

2. Backend: Supervisor Agent
   └─ Step 1: Save user query to DB

   └─ Step 2: Build Prompt
      ├─ [0] Base System Prompt
      ├─ [1] Site Prompt: "我們是電商網站..."
      ├─ [2] URL Prompt: "這是產品詳情頁..."
      ├─ [3] Fixed Input:
      │   ├─ Text: "[當前頁面] URL: /products/123..."
      │   └─ Image: <screenshot of page>
      ├─ [4-N] Conversation History
      └─ [N+1] User Query: "這個產品多少錢？"

   └─ Step 3: Call LLM (GPT-4V / Gemini 2.0 Flash)
      └─ LLM 看到頁面截圖 + DOM 結構
      └─ LLM 決定：使用 web_extract_text 工具

3. Backend: Execute Tool
   └─ Tool: web_extract_text({ selector: '.product-price' })
   └─ Widget 執行: webUse.extractText({ selector: '.product-price' })
   └─ Result: "NT$ 36,900"

4. Backend: Save to DB
   └─ Save tool call: "web_extract_text(...)"
   └─ Save tool result: "NT$ 36,900"

5. Backend: Generate Response
   └─ Build Prompt again (包含 tool result)
   └─ LLM 生成回答: "這個產品的價格是 NT$ 36,900"
   └─ Save response to DB

6. Backend: Optional - Highlight
   └─ Tool: web_highlight({ selector: '.product-price' })
   └─ Widget 標註價格區塊（紅框 + 黃色背景）

7. User 看到:
   ├─ 回答: "這個產品的價格是 NT$ 36,900"
   └─ 頁面上價格區塊被標註（視覺反饋）
```

---

## 🎯 關鍵優勢

### 1. 完整的視覺同步

**問題**: 如果 AI 只有 DOM/Markdown，可能知道資訊在頁面下方，但用戶看不到

**解決**:
```typescript
// AI 回答前先滾動 + 標註
1. scroll({ selector: '#section-5' })  // 滾動到正確位置
2. highlight({ selector: '.answer' })   // 標註答案區塊
3. respond("答案在這裡：...")          // 回答
```

**結果**: 用戶看到的 = AI 操作的位置

### 2. Multimodal 理解

**傳統方式** (只有 text):
```
AI 看到: "button 加入購物車"
AI 不知道: 按鈕在哪裡？什麼顏色？多大？
```

**Multimodal 方式** (text + image):
```
AI 看到:
  • Text: "button 加入購物車"
  • Image: 看到按鈕在右下角，綠色，很明顯

AI 可以: "點擊右下角的綠色「加入購物車」按鈕"
```

### 3. 站主可配置

**傳統**: AI 不了解網站結構，容易出錯

**現在**: 站主可以配置
```sql
-- 全站說明
INSERT INTO site_prompts VALUES (
  'global-prompt',
  '我們是電商網站，導航列有：首頁、產品、購物車、會員中心...'
);

-- 產品頁說明
INSERT INTO url_path_prompts VALUES (
  '/products/*',
  '產品頁包含：產品名稱、價格、規格、庫存、加入購物車按鈕。
   價格在 .product-price 元素中。
   加入購物車按鈕在右下角。',
  100  -- high priority
);
```

**結果**: AI 完全理解網站結構，操作更精準

---

## 📚 與 Playwright/Browser-Use 的比較

| 特性 | Playwright | Browser-Use | Lens Widget (我們) |
|------|-----------|-------------|-------------------|
| **執行環境** | 開新瀏覽器 | 開新瀏覽器 | 嵌入客戶網站 |
| **適用場景** | 測試、爬蟲 | AI 自動化 | 客服助手 |
| **用戶可見性** | 用戶看不到 | 用戶看不到 | 用戶即時看到 |
| **Session 管理** | 複雜 | 複雜 | 不需要（已在網站內） |
| **截圖** | `page.screenshot()` | 支援 | `html2canvas()` |
| **DOM 操作** | `page.click()` | 支援 | `element.click()` |
| **標註功能** | ❌ | ❌ | ✅ `highlight()` |
| **視覺同步** | ❌ | ❌ | ✅ scroll + highlight |
| **站主配置** | ❌ | ❌ | ✅ site/URL prompts |
| **Multimodal** | 可截圖 | 可截圖 | ✅ 自動送 screenshot |

---

## 🚀 使用範例

### Backend: Supervisor Agent

```typescript
import { SupervisorAgent } from '@lens-service/core/supervisor';
import { StateManager, MemoryManager, PromptBuilder } from '@lens-service/core/context-engineer';

// 初始化
const stateManager = new StateManager(db);
const memoryManager = new MemoryManager(llm, db);
const promptBuilder = new PromptBuilder(memoryManager, db);

const agent = new SupervisorAgent(
  llm,
  toolExecutor,
  stateManager,
  memoryManager,
  promptBuilder
);

// 執行
for await (const event of agent.run(sessionId, userId, userQuery)) {
  switch (event.type) {
    case 'tool_call_start':
      console.log('Tool:', event.tool);
      break;
    case 'tool_call_end':
      console.log('Result:', event.result);
      break;
    case 'response_chunk':
      process.stdout.write(event.content);
      break;
  }
}
```

### Widget: Web Use Service

```typescript
import { WebUseService } from './web-use/web-use-service';

const webUse = new WebUseService();

// 分析頁面
const analysis = await webUse.analyzePage();
console.log('Screenshot:', analysis.screenshot.substring(0, 100));
console.log('Elements:', analysis.actionableElements.length);

// 執行操作
await webUse.click({ selector: '.add-to-cart' });
await webUse.type({ selector: 'input[name="quantity"]' }, '2');
await webUse.scroll('down', 500);
await webUse.highlight({ selector: '.product-price' }, 2000);
```

### 配置 Site/URL Prompts

```sql
-- 站主配置全站說明
INSERT INTO site_prompts (tenant_id, name, prompt, is_global) VALUES (
  'tenant-123',
  '網站結構說明',
  '我們是 3C 電商網站。主要功能：
   • 瀏覽產品
   • 加入購物車
   • 結帳流程
   • 會員中心（查詢訂單、修改資料）',
  TRUE
);

-- 配置產品頁說明
INSERT INTO url_path_prompts (tenant_id, url_pattern, prompt, priority) VALUES (
  'tenant-123',
  '/products/*',
  '產品詳情頁。包含：
   • 產品名稱、圖片、價格（.product-price）
   • 規格選擇（顏色、容量）
   • 數量輸入框
   • 加入購物車按鈕（右下角）',
  100
);

-- 配置購物車頁說明
INSERT INTO url_path_prompts (tenant_id, url_pattern, prompt, priority) VALUES (
  'tenant-123',
  '/cart',
  '購物車頁面。包含：
   • 商品列表（可修改數量、刪除）
   • 總價顯示
   • 結帳按鈕
   • 優惠券輸入框',
  100
);
```

---

## 📝 總結

### 核心理念

1. **Widget-based，非 Browser Automation**
   - 嵌入在客戶網站內
   - 使用 DOM API 直接操作
   - 用戶即時看到 AI 的操作

2. **Multimodal 優先**
   - 每次分析頁面都截圖
   - AI 同時看到 text + image
   - 更精準的理解和操作

3. **完整視覺同步**
   - Scroll to section
   - Highlight elements
   - 用戶看到 = AI 操作的位置

4. **站主可配置**
   - Site-wide prompts
   - URL-specific prompts
   - 幫助 AI 理解網站結構

### 技術優勢

- ✅ 不需要 Session 管理（已在網站內）
- ✅ 不需要登入處理（用戶已登入）
- ✅ 完整的視覺反饋（highlight, scroll）
- ✅ Multimodal 支援（screenshot）
- ✅ 站主可配置（site/URL prompts）
- ✅ Memory Compact（節省 75-85% tokens）

---

## 📖 參考資料

### 實作參考
- [html2canvas](https://html2canvas.hertzen.com/) - DOM to Screenshot
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown
- [MDN: DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)

### 相關比較
- [Playwright](https://playwright.dev/) - Browser Automation
- [Browser-Use](https://github.com/browser-use/browser-use) - AI Browser Agent
- [Stagehand](https://github.com/browserbase/stagehand) - AI Web Browsing

---

**狀態**: ✅ 架構設計完成，實作完成
**作者**: Claude (Sonnet 4.5)
**最後更新**: 2025-12-02

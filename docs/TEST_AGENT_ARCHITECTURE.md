# Test Agent Architecture

## 概述
Test Agent 是一個完整的 Puppeteer 測試環境，能夠模擬 widget 嵌入真實網站，並讓 AI Agent 可以實際操作網頁、讀取 DOM、截圖等。

## 架構設計

```
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Dashboard (React)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TestAgent.tsx                                           │   │
│  │  - URL Input & Control Bar                              │   │
│  │  - Agent Panel (overlay)                                │   │
│  │  - Puppeteer Preview (screenshot stream)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────────┐
│                    Test Agent Middleware Layer                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PuppeteerTestBridge                                     │   │
│  │  - Manages Puppeteer browser instance                   │   │
│  │  - Injects widget script into target page               │   │
│  │  - Captures DOM snapshots & screenshots                 │   │
│  │  - Executes tool calls (click, scroll, etc.)            │   │
│  │  - Returns results to Agent                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Puppeteer Browser Instance                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Target Website (loaded in headless/headful mode)        │   │
│  │  + Injected Widget Script                               │   │
│  │    - Widget Panel UI                                    │   │
│  │    - DOM extraction utilities                           │   │
│  │    - Action execution handlers                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 核心組件

### 1. PuppeteerTestBridge (新建)
`server/src/puppeteer-test-bridge.ts`

負責：
- 管理 Puppeteer browser 生命週期
- 加載目標網址
- 注入 widget script
- 提供 DOM to Markdown 轉換
- 提供截圖功能
- 執行 web actions (click, scroll, etc.)
- 返回執行結果

### 2. TestAgent.tsx (修改)
`admin/src/pages/TestAgent.tsx`

當前：
- 使用 iframe 顯示目標網站（無法控制）
- Agent Panel overlay

修改為：
- 不使用 iframe
- 改用 Puppeteer screenshot stream 顯示
- 實時更新預覽
- Agent Panel 仍然 overlay

### 3. Admin Routes (擴充)
`server/src/admin-routes.ts`

新增路由：
- `POST /api/admin/test-agent/load-url` - 加載 URL 並注入 widget
- `POST /api/admin/test-agent/get-dom` - 獲取當前頁面的 DOM markdown
- `POST /api/admin/test-agent/screenshot` - 獲取當前頁面截圖
- `POST /api/admin/test-agent/web-action` - 執行 web action
- `GET /api/admin/test-agent/status` - 獲取當前狀態
- `POST /api/admin/test-agent/close` - 關閉 browser

### 4. Widget Injection Script
`packages/agent-panel/dist/widget.js`

需要能夠被注入到 Puppeteer 頁面中，並正常運作。

## 工作流程

### 載入網址流程
1. 用戶在 TestAgent UI 輸入 URL，點擊 "Load URL"
2. Frontend 調用 `/api/admin/test-agent/load-url`
3. PuppeteerTestBridge 創建新頁面，導航到目標 URL
4. 注入 widget script 到頁面
5. Widget 初始化，顯示 Agent Panel
6. 返回初始 screenshot 給 frontend
7. Frontend 顯示 screenshot + overlay Agent Panel

### Agent 交互流程
1. 用戶在 Agent Panel 發送消息
2. SupervisorAgent 處理請求
3. 如果需要 tool call：
   - SupervisorAgent 調用相應 tool
   - WebUseTool 檢測到 userId === 'test-admin-user'
   - 調用 `/api/admin/test-agent/web-action`
   - PuppeteerTestBridge 在頁面上執行 action
   - 返回執行結果
4. 如果需要頁面信息：
   - 調用 `/api/admin/test-agent/get-dom`
   - 返回當前頁面 DOM markdown
5. 更新 screenshot，顯示最新狀態

## 關鍵技術點

### Widget 注入方式
```javascript
await page.addScriptTag({
  url: `${serverUrl}/widget/widget.js`
});

await page.evaluate((serverUrl, userId) => {
  window.lensAgentPanel = new window.LensAgentPanel({
    apiUrl: serverUrl,
    userId: userId
  });
  window.lensAgentPanel.mount(document.body);
}, serverUrl, TEST_USER_ID);
```

### DOM to Markdown
```javascript
const domMarkdown = await page.evaluate(() => {
  // 使用現有的 dom-to-markdown 邏輯
  return window.domToMarkdown(document.body);
});
```

### Screenshot Stream
```javascript
const screenshot = await page.screenshot({
  type: 'png',
  fullPage: false,
  encoding: 'base64'
});
```

### Web Action 執行
```javascript
async executeWebAction(action: string, params: any) {
  switch (action) {
    case 'click':
      await this.page.click(params.selector);
      break;
    case 'scroll':
      await this.page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, params.distance || 300);
      break;
    // ... 其他 actions
  }
}
```

## 實現步驟

1. **創建 PuppeteerTestBridge**
   - 基於現有 puppeteer-loader.ts
   - 新增 widget 注入邏輯
   - 新增 DOM 提取和 screenshot 功能

2. **修改 Admin Routes**
   - 新增 test-agent 相關路由
   - 整合 PuppeteerTestBridge

3. **修改 TestAgent.tsx**
   - 移除 iframe
   - 使用 screenshot 顯示
   - 實現實時更新

4. **修改 WebUseTool**
   - 檢測 test-admin-user
   - 調用 test-agent API

5. **測試整合**
   - 確保 widget 正確注入
   - 確保 tool calls 正常執行
   - 確保 screenshot 實時更新

## 優勢

1. **真實環境測試**：在真實網站上測試 agent 行為
2. **完整功能**：所有 tool calls 都實際執行
3. **視覺化**：實時看到 agent 操作效果
4. **調試友好**：可以看到每一步的結果
5. **獨立隔離**：test-admin-user 專用，不影響正常用戶

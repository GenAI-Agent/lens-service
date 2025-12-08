# Web Agent 實作總結

## 完成日期
2025-12-08

## 實作概述

成功實作了基於 LangChain 的 Web Agent Sub-Agent，這是一個專門處理複雜網頁操作的智能代理系統。保持了 Supervisor Agent 的簡單、快速、高效架構，同時通過 Sub-Agent 提供強大的網頁交互能力。

---

## 架構設計

### 雙層架構
```
Supervisor Agent (Simple, Fast, Efficient)
    ↓ calls web_agent tool
Web Agent Sub-Agent (LangChain-based)
    ↓ uses various web tools
    ├── click
    ├── type
    ├── scroll
    ├── highlight
    ├── extract
    ├── wait
    └── screenshot
```

### 核心優勢
1. **Supervisor Agent 保持簡單** - 只註冊少數核心工具
2. **Sub-Agent 功能強大** - 使用 LangChain 進行複雜的序列式操作
3. **面板狀態簡化** - 只有兩個狀態：normal 和 web-agent
4. **進度可視化** - 漸進式進度條顯示執行狀態

---

## 已實作功能

### 1. LangChain 依賴安裝 ✅
**檔案**: package.json
- langchain ^0.3.0
- @langchain/core ^0.3.0
- @langchain/openai ^0.3.0
- langsmith ^0.2.0
- zod ^4.1.13

### 2. Web Agent State ✅
**檔案**: [agents/web-agent/state.ts](agents/web-agent/state.ts:1)

使用 LangChain 的 `Annotation.Root` 進行狀態管理：
- `task`: 當前任務描述
- `messages`: 訊息歷史（LangChain 格式）
- `operationHistory`: 操作歷史記錄（帶 reducer）
- `pageState`: 當前頁面狀態
- `completedSteps`: 已完成的步驟
- `errors`: 錯誤記錄
- `result`: 最終結果

### 3. System Prompts ✅
**檔案**: [agents/web-agent/prompts.ts](agents/web-agent/prompts.ts:1)

包含：
- 完整的系統提示詞模板
- 頁面信息格式化函數
- 操作歷史格式化函數
- 任務完成判斷提示詞

### 4. Web Agent Tools ✅
**檔案**: agents/web-agent/tools/

所有工具都使用 `DynamicStructuredTool` 和 Zod schema：

| 工具 | 功能 | 檔案 |
|------|------|------|
| click | 點擊元素 | [click.ts](agents/web-agent/tools/click.ts:1) |
| type | 輸入文字 | [type.ts](agents/web-agent/tools/type.ts:1) |
| scroll | 捲動頁面 | [scroll.ts](agents/web-agent/tools/scroll.ts:1) |
| highlight | 高亮元素 | [highlight.ts](agents/web-agent/tools/highlight.ts:1) |
| extract | 提取內容 | [extract.ts](agents/web-agent/tools/extract.ts:1) |
| wait | 等待時間 | [wait.ts](agents/web-agent/tools/wait.ts:1) |
| screenshot | 截圖 | [screenshot.ts](agents/web-agent/tools/screenshot.ts:1) |

### 5. Web Agent 主程式 ✅
**檔案**: [agents/web-agent/agent.ts](agents/web-agent/agent.ts:1)

**核心特性**:
- 使用 ChatOpenAI with gpt-5.1
- createReactAgent 進行自主規劃
- Panel Controller 整合
- 進度追蹤（0-100%）
- 完整的錯誤處理
- 執行摘要生成

**執行流程**:
```typescript
1. enterWebAgentMode() → 面板變透明
2. 創建 tools + React Agent
3. 執行 agent.stream() → 自主操作
4. 更新進度條
5. exitWebAgentMode() → 面板恢復正常
6. 返回摘要給 Supervisor
```

### 6. Web Agent Tool 包裝器 ✅
**檔案**: [agents/tools/web-agent.ts](agents/tools/web-agent.ts:1)

為 Supervisor Agent 提供簡單的介面來調用 Web Agent Sub-Agent。

### 7. Panel Controller ✅
**檔案**: [widget/panel-controller.ts](widget/panel-controller.ts:1)

**功能**:
- 兩個狀態：`normal` 和 `web-agent`
- `enterWebAgentMode()`: blur(0px), opacity(0.05)
- `exitWebAgentMode()`: blur(6px), opacity(1)
- 進度條管理（帶漸變效果）
- 平滑過渡動畫（0.3s ease）

**進度條樣式**:
- 固定在頂部中央
- 半透明白色背景（backdrop-filter: blur(10px)）
- 漸變進度條（紫色漸變）
- 百分比文字顯示

### 8. Highlight Effects ✅
**檔案**: [widget/effects/highlight-effects.ts](widget/effects/highlight-effects.ts:1)

**三種高亮效果**:

1. **Highlighter** (螢光筆效果) - 適合文字元素
   - 黃色漸變掃過效果
   - 模擬真實螢光筆畫線
   - 動畫時長可調整

2. **Glow** (發光效果) - 適合容器/div
   - 脈衝邊框 + 陰影
   - 紫色漸變發光
   - 無限循環動畫

3. **Circle** (圓圈效果) - 適合按鈕
   - SVG 紅色圓圈
   - 繪製動畫效果
   - stroke-dasharray 實現

**自動檢測**:
- 小按鈕/連結 → circle
- 文字元素 (span, p, h1-h6) → highlighter
- 其他容器 → glow

### 9. WebUseService 增強 ✅
**檔案**: [widget/web-use-service.ts](widget/web-use-service.ts:1)

**新增方法**:
- `type()`: 輸入文字到 input/textarea
- `extract()`: 提取元素內容或屬性
- `screenshot()`: 公開截圖方法

**更新方法**:
- `highlight()`: 整合新的 HighlightEffects
- 支援 style 參數選擇高亮效果
- 自動檢測最佳高亮方式

### 10. Supervisor Agent 整合 ✅
**檔案**: [agents/supervisor-agent.ts](agents/supervisor-agent.ts:1)

**變更內容**:
1. 引入 WebAgentTool 和 PanelController
2. 初始化 WebAgentTool（傳入 config、callback、panelController）
3. 在 `executeTool()` 中新增 `web_agent` case
4. 保留舊的 web use 工具（向後兼容）

**工具註冊**:
- ✅ knowledge_search
- ✅ product_search
- ✅ web_agent (新增)
- ✅ click, doubleClick, scroll, etc. (舊版保留)

---

## 檔案結構

```
lens-service-v3/
├── agents/
│   ├── web-agent/                      # Web Agent Sub-Agent
│   │   ├── state.ts                    # LangChain State 定義
│   │   ├── prompts.ts                  # 系統提示詞
│   │   ├── agent.ts                    # 主 Agent 類別
│   │   └── tools/                      # Agent 工具
│   │       ├── index.ts                # 工具匯出
│   │       ├── click.ts                # 點擊工具
│   │       ├── type.ts                 # 輸入工具
│   │       ├── scroll.ts               # 捲動工具
│   │       ├── highlight.ts            # 高亮工具
│   │       ├── extract.ts              # 提取工具
│   │       ├── wait.ts                 # 等待工具
│   │       └── screenshot.ts           # 截圖工具
│   ├── tools/
│   │   └── web-agent.ts                # Supervisor 用的包裝器
│   └── supervisor-agent.ts             # 更新：整合 WebAgentTool
├── widget/
│   ├── panel-controller.ts             # 面板控制器（新增）
│   ├── web-use-service.ts              # 更新：新方法 + 高亮整合
│   └── effects/
│       └── highlight-effects.ts        # 高亮效果管理器（新增）
└── WEB_AGENT_IMPLEMENTATION_PLAN.md    # 設計文檔
```

---

## 關鍵設計決策

### 1. 為什麼使用 LangChain？
- ✅ 成熟的 State 管理（Annotation.Root）
- ✅ 內建的 Tool 管理（DynamicStructuredTool）
- ✅ React Agent 自主規劃能力
- ✅ 訊息歷史自動管理
- ✅ Streaming 支援

### 2. 為什麼不改 Supervisor？
**用戶需求**: "我沒有打算改我的agent的設計，所以你頂多設計一個新的tool的parser或是把一個tool變成是一個很強大的組合tool"

**解決方案**:
- Supervisor 保持簡單快速
- 複雜性封裝在 Sub-Agent
- 只需註冊一個 `web_agent` 工具

### 3. 為什麼面板只有兩個狀態？
**用戶需求**: "我不希望中間我的agent panel一下透明一下清楚，這樣很奇怪"

**解決方案**:
- normal: Supervisor 控制（清楚可見）
- web-agent: Sub-Agent 執行中（變透明一次）
- 整個 Sub-Agent 執行期間保持透明
- 執行完成後恢復正常

### 4. 為什麼使用 gpt-5.1？
**用戶明確要求**: "我的model都是要用gpt-5.1"

所有 LLM 調用統一使用 gpt-5.1 模型。

### 5. 為什麼需要多種高亮效果？
**用戶需求**: "像是文字可能以螢光筆去把他們highlight會是比較好的，然後一個大的div好了可能是讓這個組件的邊緣發光...又或是一個小按鈕，可能我就會覺得用一個螢幕上的紅筆畫出一個圓圈"

**實作**:
- Highlighter: 文字元素
- Glow: 容器/div
- Circle: 小按鈕
- 自動檢測最佳效果

---

## 使用方式

### Supervisor 調用 Web Agent
```typescript
// Supervisor Agent 自動解析工具調用
<tool>web_agent</tool>
<parameters>
{
  "task": "幫我在網頁上找到搜尋框並輸入 'hello world'",
  "pageState": { ... } // 可選：當前頁面狀態
}
</parameters>
```

### Web Agent 執行流程
1. 接收任務
2. 面板變透明（進度條顯示）
3. LangChain React Agent 自主規劃
4. 序列式執行工具（click → type → extract → etc.）
5. 每個操作都有視覺反饋（高亮、捲動等）
6. 完成後返回摘要給 Supervisor
7. 面板恢復正常

### Web Agent 可用工具
- `click(selector, reason?)`: 點擊元素
- `type(selector, text, clear?)`: 輸入文字
- `scroll(direction, distance?)`: 捲動頁面
- `highlight(selector, duration?, style?)`: 高亮元素
- `extract(selector, attribute?, all?)`: 提取內容
- `wait(duration, reason?)`: 等待（最多 5 秒）
- `screenshot(reason?)`: 截圖

---

## 技術亮點

### 1. LangChain State Management
```typescript
export const WebAgentState = Annotation.Root({
  task: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
  }),
  operationHistory: Annotation<OperationRecord[]>({
    reducer: (current, update) => current.concat(update),
  }),
  // ...
});
```

### 2. DynamicStructuredTool + Zod
```typescript
new DynamicStructuredTool({
  name: 'click',
  description: 'Click on an element...',
  schema: z.object({
    selector: z.string().describe('CSS selector...'),
    reason: z.string().optional(),
  }),
  func: async ({ selector, reason }) => { ... },
});
```

### 3. React Agent 自主規劃
```typescript
const agent = createReactAgent({
  llm: this.llm, // ChatOpenAI with gpt-5.1
  tools,
  stateSchema: WebAgentState,
  messageModifier: systemMessage,
});

const stream = await agent.stream(initialState);
for await (const chunk of stream) {
  // 處理每個步驟...
}
```

### 4. 漸進式進度追蹤
```typescript
for await (const chunk of stream) {
  const progress = Math.min((iteration / maxIterations) * 100, 95);
  panelController.updateProgress(progress);
}
```

### 5. 動態高亮效果
```typescript
// 自動檢測最佳高亮方式
const style = this.highlightEffects.detectBestStyle(element);
await this.highlightEffects.highlight(element, style, duration);
```

---

## 測試建議

### 1. 簡單任務測試
```
用戶: "幫我點擊頁面上的登入按鈕"
預期: Web Agent 找到並點擊，顯示高亮效果
```

### 2. 複雜任務測試
```
用戶: "幫我在搜尋框輸入 'iPhone 15'，然後點擊搜尋按鈕，再把搜尋結果的標題提取出來"
預期:
1. 面板變透明（進度條顯示）
2. 依序執行：highlight → type → click → wait → extract
3. 每個操作都有視覺反饋
4. 完成後返回結果，面板恢復
```

### 3. 錯誤處理測試
```
用戶: "點擊一個不存在的按鈕"
預期: Web Agent 嘗試多種策略，最終回報錯誤但不崩潰
```

---

## 已知限制

1. **Smart Selector 簡化版** - 目前使用基本的 CSS selector，未實作完整的 AI vision-based 選擇器
2. **進度估算** - 進度條基於迭代次數估算，非實際任務完成度
3. **Panel 定位** - Panel Controller 依賴 DOM 查找，需確保 `.lens-os-agent-panel` 存在

---

## 未來優化方向

### 1. Smart Selector Engine (可選)
實作多策略元素定位：
- CSS selector (primary)
- Text content matching
- Position-based filtering
- AI vision-based location (GPT-5.1)

### 2. 更精確的進度追蹤
- 基於任務分解的實際進度
- 預估剩餘時間

### 3. 執行歷史可視化
- 在 Panel 中顯示操作歷史
- 可回放操作序列

### 4. 批次操作優化
- 相同類型的操作合併
- 減少不必要的等待時間

---

## 總結

✅ **成功實作** 基於 LangChain 的 Web Agent Sub-Agent
✅ **保持簡單** Supervisor Agent 架構未改變
✅ **功能強大** Sub-Agent 可處理複雜的序列式操作
✅ **體驗優秀** 面板狀態平滑、進度可視化、高亮效果豐富
✅ **易於擴展** 新增工具只需加入 tools/ 目錄

這個實作完美符合用戶的需求：
1. ✅ 不改變 Supervisor Agent 的簡單架構
2. ✅ 使用 LangChain 處理複雜操作
3. ✅ 面板只有兩個狀態，不會閃爍
4. ✅ 多種高亮效果（螢光筆、發光、圓圈）
5. ✅ 所有模型使用 gpt-5.1

---

**實作完成**: 2025-12-08
**實作者**: Claude Code
**架構**: Supervisor + LangChain Sub-Agent
**模型**: gpt-5.1

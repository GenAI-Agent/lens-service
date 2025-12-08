# Web Agent Sub-Agent 實作計劃

## 📋 概述

創建一個基於 **LangChain** 的 Web Agent Sub-Agent，專門處理複雜的網頁操作任務。

### 核心理念

```
┌─────────────────────────────────────────────────────────────┐
│  Supervisor Agent (簡單、快速、高效)                        │
│  - 使用自己的簡潔架構                                       │
│  - 處理對話、知識搜尋、產品搜尋                             │
│  - 調用 Web Agent 處理複雜網頁操作                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ web_agent tool call
┌─────────────────────────────────────────────────────────────┐
│  Web Agent Sub-Agent (LangChain-based)                      │
│  - 使用 LangChain 的模組化架構                              │
│  - State 管理（記住操作歷史）                               │
│  - Tool 管理（所有 web use tools）                          │
│  - 序列式處理優勢                                           │
│  - 自主規劃和執行                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 設計原則

1. **Supervisor Agent 只註冊少量工具**
   - `web_agent` - 複雜網頁操作
   - `analyze_page` - 分析當前頁面（抓取 URL 資訊）
   - `knowledge_search` - 知識搜尋
   - `product_search` - 產品搜尋

2. **Web Agent Sub-Agent 擁有完整工具集**
   - `click`, `doubleClick`, `type`, `select`
   - `scroll`, `scrollToElement`
   - `highlight`, `drag`
   - `wait`, `screenshot`
   - `extract` - 提取特定資料

3. **Panel 狀態超簡化**
   ```typescript
   // 只有兩種狀態
   - 'normal'    // Supervisor 在控制
   - 'web-agent' // Web Agent 在執行（Panel 透明）
   ```

4. **LangChain 優勢**
   - 🔄 State 管理：記住所有操作歷史
   - 🛠️ Tool 模組化：每個工具獨立定義
   - 🧠 Memory：自動處理 context
   - 📊 Observability：完整的執行追蹤
   - ♻️ Error Recovery：自動重試機制

## 📂 文件結構

```
lens-service-v3/
├── agents/
│   ├── supervisor-agent.ts              ← 保持簡單
│   ├── web-agent/                       ← 新增：LangChain Sub-Agent
│   │   ├── index.ts                     ← Web Agent 主入口
│   │   ├── agent.ts                     ← LangChain Agent 定義
│   │   ├── state.ts                     ← State 管理
│   │   ├── tools/                       ← 所有 web use tools
│   │   │   ├── click.ts
│   │   │   ├── type.ts
│   │   │   ├── scroll.ts
│   │   │   ├── highlight.ts
│   │   │   ├── extract.ts
│   │   │   └── index.ts
│   │   ├── prompts.ts                   ← Prompt templates
│   │   └── utils/
│   │       ├── smart-selector.ts        ← 智能選擇器
│   │       └── animator.ts              ← 動畫控制器
│   └── tools/
│       ├── web-agent-tool.ts            ← Supervisor 調用的入口
│       ├── analyze-page.ts              ← 頁面分析工具
│       ├── knowledge-search.ts          ← 保持不變
│       └── product-search.ts            ← 保持不變
├── widget/
│   ├── web-use-service-enhanced.ts      ← 增強的瀏覽器控制器
│   ├── panel-controller.ts              ← 超簡化的 Panel 控制
│   └── effects/                         ← 動畫效果
│       ├── highlighter.ts
│       ├── glow.ts
│       ├── circle.ts
│       └── index.ts
└── package.json                         ← 新增 LangChain 依賴
```

## 📦 依賴安裝

```json
{
  "dependencies": {
    "langchain": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "langsmith": "^0.2.0"
  }
}
```

## 🔧 核心實作

### 1. Web Agent State (LangChain)

```typescript
// agents/web-agent/state.ts
import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export const WebAgentState = Annotation.Root({
  // 當前任務
  task: Annotation<string>(),

  // 訊息歷史
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),

  // 操作歷史
  operationHistory: Annotation<OperationRecord[]>({
    reducer: (x, y) => x.concat(y),
  }),

  // 當前頁面狀態
  pageState: Annotation<PageState | null>(),

  // 已完成的步驟
  completedSteps: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),

  // 錯誤記錄
  errors: Annotation<ErrorRecord[]>({
    reducer: (x, y) => x.concat(y),
  }),

  // 最終結果
  result: Annotation<AgentResult | null>(),
});

interface OperationRecord {
  step: number;
  action: string;
  selector?: string;
  description: string;
  result: 'success' | 'failed';
  timestamp: Date;
  screenshot?: string;
}

interface ErrorRecord {
  step: number;
  error: string;
  retryCount: number;
  timestamp: Date;
}

interface AgentResult {
  success: boolean;
  summary: string;
  steps: OperationRecord[];
  screenshots: string[];
  finalPageState: PageState;
}
```

### 2. Web Agent Tools (LangChain Tools)

```typescript
// agents/web-agent/tools/click.ts
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const createClickTool = (widgetCallback: WidgetCallback) => {
  return new DynamicStructuredTool({
    name: 'click',
    description: `點擊網頁元素。

使用時機：
- 點擊按鈕、連結
- 選擇選項
- 觸發事件

重要：會自動進行智能定位，如果有多個相同 selector，會用文字、位置等方式過濾。`,

    schema: z.object({
      selector: z.string().describe('CSS selector，例如: button.login-btn'),
      textHint: z.string().optional().describe('文字提示，用於區分多個相同元素，例如: "登入"'),
      description: z.string().describe('這一步在做什麼，例如: "點擊登入按鈕"'),
    }),

    func: async ({ selector, textHint, description }) => {
      // 執行點擊（帶動畫）
      const result = await widgetCallback('click', {
        selector,
        textHint,
        withAnimation: true,
        animationType: 'auto' // 自動選擇最佳動畫
      });

      if (result.success) {
        return JSON.stringify({
          success: true,
          message: `成功${description}`,
          elementInfo: result.elementInfo
        });
      } else {
        throw new Error(`點擊失敗: ${result.error}`);
      }
    },
  });
};
```

```typescript
// agents/web-agent/tools/type.ts
export const createTypeTool = (widgetCallback: WidgetCallback) => {
  return new DynamicStructuredTool({
    name: 'type',
    description: `在輸入框中輸入文字。

使用時機：
- 填寫表單
- 搜尋
- 輸入內容`,

    schema: z.object({
      selector: z.string().describe('輸入框的 selector'),
      text: z.string().describe('要輸入的文字'),
      clear: z.boolean().optional().describe('是否先清空，預設 true'),
      description: z.string().describe('這一步在做什麼'),
    }),

    func: async ({ selector, text, clear = true, description }) => {
      const result = await widgetCallback('type', {
        selector,
        text,
        clear,
        withAnimation: true,
        animationType: 'typing' // 逐字輸入動畫
      });

      if (result.success) {
        return JSON.stringify({
          success: true,
          message: `成功${description}`,
          typedText: text
        });
      } else {
        throw new Error(`輸入失敗: ${result.error}`);
      }
    },
  });
};
```

```typescript
// agents/web-agent/tools/extract.ts
export const createExtractTool = (widgetCallback: WidgetCallback) => {
  return new DynamicStructuredTool({
    name: 'extract',
    description: `從頁面中提取特定資料。

使用時機：
- 提取搜尋結果
- 提取商品資訊
- 提取列表資料`,

    schema: z.object({
      selector: z.string().describe('要提取的元素 selector'),
      fields: z.array(z.object({
        name: z.string(),
        selector: z.string(),
        attribute: z.string().optional()
      })).describe('要提取的欄位'),
      description: z.string(),
    }),

    func: async ({ selector, fields, description }) => {
      const result = await widgetCallback('extract', {
        selector,
        fields
      });

      if (result.success) {
        return JSON.stringify({
          success: true,
          message: `成功${description}`,
          data: result.data,
          count: result.count
        });
      } else {
        throw new Error(`提取失敗: ${result.error}`);
      }
    },
  });
};
```

### 3. Web Agent (LangChain Agent)

```typescript
// agents/web-agent/agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { WebAgentState } from './state';
import { createWebAgentTools } from './tools';
import { WEB_AGENT_SYSTEM_PROMPT } from './prompts';

export class WebAgent {
  private agent: any;
  private tools: any[];
  private model: ChatOpenAI;

  constructor(
    private openaiApiKey: string,
    private widgetCallback: WidgetCallback,
    private panelController: PanelController
  ) {
    // 初始化 GPT-5.1
    this.model = new ChatOpenAI({
      modelName: 'gpt-5.1',
      apiKey: openaiApiKey,
      temperature: 0.1,
      streaming: false
    });

    // 創建所有工具
    this.tools = createWebAgentTools(widgetCallback);

    // 創建 LangChain Agent
    this.agent = createReactAgent({
      llm: this.model,
      tools: this.tools,
      stateSchema: WebAgentState,
      messageModifier: WEB_AGENT_SYSTEM_PROMPT
    });
  }

  async execute(task: string, maxSteps: number = 15): Promise<AgentResult> {
    // Panel 進入 web-agent 模式（透明化）
    await this.panelController.enterWebAgentMode();

    try {
      // 初始化 state
      const initialState = {
        task,
        messages: [new HumanMessage(task)],
        operationHistory: [],
        pageState: null,
        completedSteps: [],
        errors: [],
        result: null
      };

      // 執行 Agent（自動處理多輪）
      const finalState = await this.agent.invoke(initialState, {
        recursionLimit: maxSteps,
        callbacks: [
          {
            // 每一步執行時的回調
            handleToolStart: async (tool, input) => {
              console.log(`[Web Agent] 執行: ${tool.name}`, input);

              // 更新進度
              const stepNum = initialState.operationHistory.length + 1;
              this.panelController.updateProgress(stepNum, maxSteps);
            },

            handleToolEnd: async (output, tool) => {
              console.log(`[Web Agent] 完成: ${tool.name}`, output);
            },

            handleToolError: async (error, tool) => {
              console.error(`[Web Agent] 錯誤: ${tool.name}`, error);
            }
          }
        ]
      });

      // 構建結果
      const result: AgentResult = {
        success: true,
        summary: this.generateSummary(finalState),
        steps: finalState.operationHistory,
        screenshots: finalState.operationHistory
          .filter(op => op.screenshot)
          .map(op => op.screenshot!),
        finalPageState: finalState.pageState!
      };

      return result;

    } catch (error) {
      console.error('[Web Agent] 執行失敗:', error);

      return {
        success: false,
        summary: `任務失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        steps: [],
        screenshots: [],
        finalPageState: null as any
      };

    } finally {
      // Panel 恢復正常
      await this.panelController.exitWebAgentMode();
    }
  }

  private generateSummary(state: typeof WebAgentState.State): string {
    const total = state.operationHistory.length;
    const successful = state.operationHistory.filter(op => op.result === 'success').length;
    const failed = total - successful;

    let summary = `任務完成！\n`;
    summary += `總共執行 ${total} 個步驟，成功 ${successful} 個`;

    if (failed > 0) {
      summary += `，失敗 ${failed} 個`;
    }

    summary += `。\n\n步驟：\n`;
    state.operationHistory.forEach((op, i) => {
      const status = op.result === 'success' ? '✓' : '✗';
      summary += `${i + 1}. ${status} ${op.description}\n`;
    });

    return summary;
  }
}
```

### 4. Web Agent Tool (Supervisor 調用入口)

```typescript
// agents/tools/web-agent-tool.ts
import { ToolResult } from '../config/types';
import { WebAgent } from '../web-agent/agent';

interface WebAgentParams {
  task: string;
  maxSteps?: number;
}

export class WebAgentTool {
  private webAgent: WebAgent;

  constructor(
    openaiApiKey: string,
    widgetCallback: WidgetCallback,
    panelController: PanelController
  ) {
    this.webAgent = new WebAgent(openaiApiKey, widgetCallback, panelController);
  }

  async execute(params: WebAgentParams): Promise<ToolResult> {
    const { task, maxSteps = 15 } = params;

    try {
      // 調用 LangChain Web Agent
      const result = await this.webAgent.execute(task, maxSteps);

      return {
        success: result.success,
        result: {
          summary: result.summary,
          totalSteps: result.steps.length,
          successfulSteps: result.steps.filter(s => s.result === 'success').length,
          failedSteps: result.steps.filter(s => s.result === 'failed').length,
          finalPageUrl: result.finalPageState?.url,
          screenshots: result.screenshots
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
```

### 5. Panel Controller (超簡化)

```typescript
// widget/panel-controller.ts
export type PanelMode = 'normal' | 'web-agent';

export class PanelController {
  private panel: HTMLElement | null = null;
  private fab: HTMLElement | null = null;
  private currentMode: PanelMode = 'normal';
  private progressBar: HTMLElement | null = null;

  constructor() {
    this.initPanel();
  }

  private initPanel(): void {
    this.panel = document.querySelector('.lens-os-agent-panel');
    this.fab = document.querySelector('.lens-os-agent-fab');
  }

  /**
   * 進入 Web Agent 模式（Panel 透明化）
   */
  async enterWebAgentMode(): Promise<void> {
    if (!this.panel) return;

    this.currentMode = 'web-agent';

    // Panel 淡出
    this.panel.style.transition = 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)';
    this.panel.style.backdropFilter = 'blur(0px)';
    this.panel.style.opacity = '0.05';
    this.panel.style.transform = 'translate(-50%, -50%) scale(0.95)';

    // FAB 保持不變
    if (this.fab) {
      this.fab.style.opacity = '1';
      this.fab.style.transform = 'scale(1)';
      this.fab.style.pointerEvents = 'all';
    }

    // 顯示進度條
    this.showProgressBar();

    await this.sleep(600);
  }

  /**
   * 離開 Web Agent 模式（Panel 恢復）
   */
  async exitWebAgentMode(): Promise<void> {
    if (!this.panel) return;

    this.currentMode = 'normal';

    // Panel 恢復
    this.panel.style.transition = 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)';
    this.panel.style.backdropFilter = 'blur(6px)';
    this.panel.style.opacity = '1';
    this.panel.style.transform = 'translate(-50%, -50%) scale(1)';

    // 隱藏進度條
    this.hideProgressBar();

    await this.sleep(600);
  }

  /**
   * 更新進度
   */
  updateProgress(current: number, total: number): void {
    if (!this.progressBar) return;

    const fill = this.progressBar.querySelector('#lens-progress-fill') as HTMLElement;
    if (fill) {
      const percentage = (current / total) * 100;
      fill.style.width = `${percentage}%`;

      // 更新文字
      const text = this.progressBar.querySelector('#lens-progress-text') as HTMLElement;
      if (text) {
        text.textContent = `${current} / ${total}`;
      }
    }
  }

  private showProgressBar(): void {
    if (this.progressBar) {
      this.progressBar.style.display = 'block';
      return;
    }

    this.progressBar = document.createElement('div');
    this.progressBar.id = 'lens-progress-bar';
    this.progressBar.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 24px;
      padding: 12px 20px;
      z-index: 999999;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    this.progressBar.innerHTML = `
      <div style="color: #00ff88; font-size: 12px; margin-bottom: 8px; font-family: Monaco, monospace;">
        WEB AGENT EXECUTING
      </div>
      <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
        <div id="lens-progress-fill" style="height: 100%; background: linear-gradient(90deg, #00ff88, #00ccff); width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <div id="lens-progress-text" style="color: #888; font-size: 10px; margin-top: 6px; text-align: center; font-family: Monaco, monospace;">
        0 / 0
      </div>
    `;

    document.body.appendChild(this.progressBar);
  }

  private hideProgressBar(): void {
    if (this.progressBar) {
      this.progressBar.style.opacity = '0';
      setTimeout(() => {
        this.progressBar?.remove();
        this.progressBar = null;
      }, 300);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🔄 執行流程

```
用戶: "幫我搜尋手機並點擊第一個結果"
  ↓
Supervisor Agent 收到
  ↓
識別需要網頁操作 → 調用 web_agent tool
  ↓
  ┌─────────────────────────────────────┐
  │ Web Agent (LangChain) 開始執行      │
  │                                     │
  │ 1. Panel 透明化 (600ms)             │
  │ 2. 顯示進度條                       │
  │                                     │
  │ 3. LangChain Agent 自主規劃:        │
  │    Step 1: scrollToElement          │
  │    Step 2: type                     │
  │    Step 3: click                    │
  │    Step 4: wait                     │
  │    Step 5: extract                  │
  │    Step 6: click                    │
  │                                     │
  │ 4. 逐步執行（帶動畫）:               │
  │    ├─ 螢光筆標記搜尋框              │
  │    ├─ 逐字輸入 "手機"               │
  │    ├─ 紅筆圈選搜尋按鈕              │
  │    ├─ 點擊漣漪                      │
  │    ├─ 等待結果載入                  │
  │    ├─ 提取第一個結果                │
  │    └─ 點擊第一個結果                │
  │                                     │
  │ 5. 生成 Summary                     │
  │ 6. Panel 恢復 (600ms)               │
  └─────────────────────────────────────┘
  ↓
Web Agent 返回結果給 Supervisor
  ↓
Supervisor 顯示給用戶:
"✓ 已完成！成功執行 6 個步驟：
1. ✓ 找到搜尋框
2. ✓ 輸入「手機」
3. ✓ 點擊搜尋按鈕
4. ✓ 等待結果載入
5. ✓ 提取第一個結果
6. ✓ 點擊第一個結果"
```

## 📊 實作順序

1. ✅ **撰寫設計文檔** (本文件)
2. ⏳ **安裝 LangChain 依賴**
3. ⏳ **實作 State 定義**
4. ⏳ **實作 Web Agent Tools**
   - click, type, scroll, highlight, extract...
5. ⏳ **實作 Web Agent (LangChain)**
6. ⏳ **實作 Panel Controller**
7. ⏳ **實作增強的 WebUseService**
8. ⏳ **實作 Smart Selector**
9. ⏳ **實作動畫效果**
10. ⏳ **更新 Supervisor Agent**
11. ⏳ **測試完整流程**

## 🎯 優勢總結

### Supervisor Agent
- ✅ 保持簡單、快速、高效的架構
- ✅ 只處理對話、知識、產品搜尋
- ✅ 調用 Web Agent 處理複雜操作

### Web Agent (LangChain)
- ✅ 模組化：每個工具獨立管理
- ✅ State：自動記住操作歷史
- ✅ Memory：自動處理 context
- ✅ 序列式：自主規劃和執行
- ✅ 錯誤恢復：自動重試
- ✅ Observability：完整追蹤

### Panel 管理
- ✅ 超簡單：只有 normal 和 web-agent 兩種狀態
- ✅ 流暢：整個任務只透明一次
- ✅ 清晰：進度條顯示執行狀態

## 🚀 開始實作！

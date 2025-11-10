import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { ServiceModulerConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Import all tools (新整合結構)
import { databaseTools, initDatabaseTools } from './tools/database';
import { telegramTools, initTelegramTools } from './tools/telegram';
import { aipageTools, initAIPageTools } from './tools/aipage';
import { webScraperTools } from './tools/web-scraper';
import { searchTools, initSearchTools } from './tools/search';
import { EmbeddingService } from '../services/EmbeddingService';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: {
    toolsUsed?: string[];
    pageId?: string;
    [key: string]: any;
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  metadata?: {
    toolsUsed?: string[];
    pageId?: string;
    requiresHumanApproval?: boolean;
    suggestedAction?: string;
    [key: string]: any;
  };
  error?: string;
}

export class AgentService {
  private model: ChatOpenAI;
  private agent: any;
  private memory: MemorySaver;
  private config: ServiceModulerConfig;
  private enabledTools: any[] = [];

  constructor(config: ServiceModulerConfig) {
    this.config = config;
    this.memory = new MemorySaver();

    // 初始化 LLM
    const llmConfig = config.llmAPI || config.azureOpenAI;
    if (!llmConfig) {
      throw new Error("LLM API 配置缺失");
    }

    this.model = new ChatOpenAI({
      temperature: 0.3, // 降低溫度以減少token使用
      maxTokens: 1500, // 限制最大輸出token
      configuration: {
        apiKey: llmConfig.apiKey,
        baseURL: `${llmConfig.endpoint}/openai/deployments/${llmConfig.deployment}`,
        defaultQuery: { 'api-version': llmConfig.apiVersion || "2024-02-15-preview" },
        defaultHeaders: { 'api-key': llmConfig.apiKey },
      },
    });

    // 初始化並收集啟用的 tools
    this.initializeTools();

    // 創建 ReAct Agent
    this.agent = createReactAgent({
      llm: this.model,
      tools: this.enabledTools,
      checkpointSaver: this.memory,
    });
  }

  /**
   * 初始化並收集啟用的工具
   */
  private initializeTools(): void {
    const agentConfig = this.config.agent || {};

    // 初始化全站搜尋工具（新增，優先使用）
    // Unified search tools removed
    // 初始化資料庫工具
    if (agentConfig.enableDatabaseTools && this.config.database) {
      initDatabaseTools(this.config);
      this.enabledTools.push(...databaseTools);
      console.log('[AgentService] 已啟用資料庫工具，已添加', databaseTools.length, '個工具');
    } else {
      console.log('[AgentService] ⚠️ Database tools NOT enabled:', {
        enableDatabaseTools: agentConfig.enableDatabaseTools,
        hasDatabase: !!this.config.database
      });
    }

    // 初始化 Telegram 通知工具
    if (agentConfig.enableTelegramNotify && this.config.telegram?.botToken) {
      initTelegramTools(this.config);
      this.enabledTools.push(...telegramTools);
    }

    // 初始化 AI Page 生成工具
    if (agentConfig.enableAIPageGeneration) {
      initAIPageTools({});
      this.enabledTools.push(...aipageTools);
    }

    // 初始化內部搜尋工具（新整合的搜尋工具，預設啟用）
    if (agentConfig.enableManualIndexSearch !== false) {
      initSearchTools(this.config);
      this.enabledTools.push(...searchTools);
      console.log('[AgentService] 已啟用內部搜尋工具，已添加', searchTools.length, '個工具');
    }

    // 網頁爬取工具（包含通用爬取 + 熱門書籍）
    // 預設關閉，只在明確指定 enableWebScraper=true 或有 Rule 需要時才啟用
    if (agentConfig.enableWebScraper === true) {
      this.enabledTools.push(...webScraperTools);
      console.log('[AgentService] 已啟用網頁爬取工具（包含通用爬取 + 熱門書籍），已添加', webScraperTools.length, '個工具');
    }

    if (this.enabledTools.length === 0) {
      console.warn('[AgentService] 沒有啟用任何工具，Agent 將僅能進行對話');
    }
  }

  /**
   * 載入資料庫 Schema 從 TzAI_web/config/database-schema.json
   */
  private loadDatabaseSchema(): any | null {
    try {
      // 從 lens-service 的位置，向上找到 TzAI_web/config/database-schema.json
      const possiblePaths = [
        // 假設 lens-service 和 TzAI_web 在同一層
        path.resolve(process.cwd(), '../TzAI_web/config/database-schema.json'),
        // 或者 lens-service 是在 TzAI_web 內部
        path.resolve(process.cwd(), './config/database-schema.json'),
        // 或者從當前工作目錄的相對路徑
        path.resolve(process.cwd(), './TzAI_web/config/database-schema.json'),
      ];

      for (const schemaPath of possiblePaths) {
        if (fs.existsSync(schemaPath)) {
          console.log(`[AgentService] Loading database schema from: ${schemaPath}`);
          const data = fs.readFileSync(schemaPath, 'utf-8');
          return JSON.parse(data);
        }
      }

      console.warn('[AgentService] database-schema.json not found in any expected location');
      return null;
    } catch (error) {
      console.error('[AgentService] Failed to load database-schema.json:', error);
      return null;
    }
  }

  /**
   * 處理用戶訊息
   */
  async processMessage(
    message: string,
    userId: string,
    conversationId?: string,
    options?: {
      additionalTools?: any[];
      customSystemPrompt?: string;
    }
  ): Promise<AgentResponse> {
    try {
      const threadId = conversationId || `user-${userId}-${Date.now()}`;

      // 🔒 重新初始化資料庫工具，注入當前用戶ID
      const agentConfig = this.config.agent || {};
      if (agentConfig.enableDatabaseTools && this.config.database) {
        console.log(`[AgentService] 🔒 Re-initializing database tools with userId: ${userId}`);
        initDatabaseTools(this.config, userId);
      }

      // 如果有額外的工具，創建臨時 Agent
      let agent = this.agent;
      if (options?.additionalTools && options.additionalTools.length > 0) {
        console.log(`[AgentService] Creating temporary agent with ${options.additionalTools.length} additional tools`);
        const allTools = [...this.enabledTools, ...options.additionalTools];
        agent = createReactAgent({
          llm: this.model,
          tools: allTools,
          checkpointSaver: this.memory,
        });
      }

      // 構建系統提示詞
      // 如果有 customSystemPrompt，將其追加到預設系統提示詞後面
      // 這樣可以保留核心工具說明，同時加入 Rule 的角色指示
      let systemPrompt = this.buildSystemPrompt(userId, threadId);
      if (options?.customSystemPrompt) {
        systemPrompt += `\n\n${options.customSystemPrompt}`;
      }

      // 取得並修剪對話歷史（只保留最後 2 次 QA）
      const trimmedHistory = await this.getTrimmedConversationHistory(threadId);

      // 調用 Agent
      console.log('[AgentService] 📤 Invoking agent');
      console.log('[AgentService] 📝 User query:', message);
      console.log('[AgentService] 🧵 Thread ID:', threadId);
      console.log('[AgentService] 💬 Using', trimmedHistory.length, 'previous Q&A pairs');

      const result = await agent.invoke(
        {
          messages: [
            { role: "system", content: systemPrompt },
            ...trimmedHistory,
            { role: "user", content: message }
          ],
        },
        {
          configurable: {
            thread_id: threadId,
          },
        }
      );

      // 提取完整的執行日誌
      const executionLog = this.buildExecutionLog(result.messages, message, systemPrompt);
      console.log('[AgentService] 📋 Execution log created with', executionLog.steps.length, 'steps');

      // 詳細記錄每個工具調用和結果
      this.logToolCalls(result.messages);

      // 提取 Agent 回應
      const lastMessage = result.messages[result.messages.length - 1];
      const toolsUsed = this.extractToolsUsed(result.messages);

      // 提取 pageId（如果有調用 generate_ai_page 工具）
      const pageId = this.extractPageId(result.messages);

      console.log('[AgentService] ✅ Agent response:', lastMessage.content?.substring(0, 200) + '...');
      console.log('[AgentService] 🔧 Tools used:', toolsUsed);
      if (pageId) {
        console.log('[AgentService] 📄 AI Page ID:', pageId);
      }

      return {
        success: true,
        message: lastMessage.content,
        metadata: {
          toolsUsed,
          conversationId: threadId,
          executionLog, // 添加完整執行日誌
          pageId, // 添加 pageId（如果有生成 AI Page）
        },
      };
    } catch (error: any) {
      console.error('[AgentService] 處理訊息時發生錯誤:', error);
      return {
        success: false,
        message: "處理您的請求時發生錯誤，請稍後再試。",
        error: error.message,
      };
    }
  }

  /**
   * 構建系統提示詞（簡潔版）
   */
  private buildSystemPrompt(userId?: string, sessionId?: string): string {
    const agentConfig = this.config.agent || {};

    // 取得當前時間
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const currentDateTime = taiwanTime.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    let systemPrompt = `你是 TzAI 智能客服助理。當前時間：${currentDateTime}，用戶ID：${userId || '未知'}

## 工具使用指南

**重要**: 當需要使用多個獨立工具時，可以在同一次回應中並行調用多個工具以提升效率。
`;

    // 搜尋工具
    if (agentConfig.enableInternalSearch) {
      systemPrompt += `
### 搜尋工具
- **search_customer_service_data**: 搜尋客服資料庫（用於客服問題）
  用途: 搜尋手動建立的知識文檔、FAQ、政策、客服流程
  參數: query, limit, minScore
  使用時機: 訂單處理、退貨、運送、公司政策等客服相關問題

- **search_products**: 搜尋商品（用於書籍/商品推薦）
  用途: 搜尋已索引的書籍、商品、AI頁面、文章
  參數: query, contentTypes, limit, mode
  使用時機: 用戶搜尋特定書籍、商品推薦、產品資訊查詢
  重要: 書籍推薦應使用此工具，搜尋 search_index 中已索引的商品資料

- **get_content_detail**: 取得完整內容
  用途: 從搜尋結果獲取完整資訊
  參數: contentId

規則: 無搜尋結果時調用 send_notification
`;
    }

    // Manual Index - 已整合到上面
    if (agentConfig.enableManualIndexSearch !== false) {
      // 不需要額外說明，已在 search_customer_service_data 中涵蓋
    }

    // 資料庫工具
    const dbSchema = this.loadDatabaseSchema();
    if (agentConfig.enableDatabaseTools && dbSchema) {
      systemPrompt += `
### 資料庫工具 (測試模式 - 無安全限制)
- **find_records**: 查詢記錄
  參數: tableName, conditions, limit, orderBy

- **create_record**: 新增記錄
  參數: tableName, data

- **update_record**: 更新記錄
  參數: tableName, conditions, data

- **delete_record**: 刪除記錄
  參數: tableName, conditions

資料庫 Schema:
\`\`\`json
${JSON.stringify(dbSchema, null, 2)}
\`\`\`
`;
    }

    if (agentConfig.enableTelegramNotify) {
      systemPrompt += `
### Telegram 通知
- **send_notification**: 發送通知
  客服通知: notifyType="customer_service", userQuery, questionType, userId, priority, details
  物流通知: notifyType="logistics", subject, orderNumber, requestType, details
`;
    }

    if (agentConfig.enableAIPageGeneration) {
      systemPrompt += `
### AI Page 生成 (MANDATORY for book/product recommendations)
- **generate_ai_page**: Generate visual HTML page with 30-min expiry

  **CRITICAL - When you MUST use this tool:**
  - Book introductions and recommendations (ANY book-related content)
  - Product recommendations and showcases
  - User searches for products/books
  - Complex information that benefits from visual presentation
  - Multi-item displays (3+ items)

  **Workflow:**
  1. Use search_products to get book data from indexed products
  2. IMMEDIATELY call generate_ai_page with the book data
  3. Respond with detailed book recommendations:
     - List book titles, authors, and brief descriptions
     - Explain why these books are recommended
     - Provide engaging summary of the collection
     - Frontend will automatically add a clickable link to view the AI Page

  **Templates:**
  - neon-gradient-style: Modern/tech feel
  - magazine-style: Elegant/sophisticated
  - social-feed-style: Casual/friendly
  - comic-pop-style: Fun/energetic

  This is NOT optional - AI Pages provide visual engagement that increases customer purchases.
`;
    }

    if (agentConfig.enableWebScraper !== false) {
      systemPrompt += `
### 網頁爬取
- **scrape_web**: 爬取網頁內容
  參數: url
`;
    }

    return systemPrompt;
  }

  /**
   * 詳細記錄工具調用和結果（包含並行調用檢測）
   */
  private logToolCalls(messages: any[]): void {
    console.log('[AgentService] 🔍 ===== Tool Calls Detail =====');

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // 記錄工具調用
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // 檢測並行調用
        if (msg.tool_calls.length > 1) {
          console.log(`[AgentService] ⚡ PARALLEL EXECUTION: ${msg.tool_calls.length} tools called simultaneously`);
        }

        for (const toolCall of msg.tool_calls) {
          console.log(`[AgentService] 🔧 Tool Call: ${toolCall.name}`);
          console.log(`[AgentService] 📥 Input:`, JSON.stringify(toolCall.args, null, 2));
        }
      }

      // 記錄工具結果
      if (msg.role === 'tool' && msg.content) {
        console.log(`[AgentService] 📤 Tool Result (${msg.name || 'unknown'}):`, msg.content.substring(0, 500));
      }
    }

    console.log('[AgentService] 🔍 ===== End Tool Calls =====');
  }

  /**
   * 從訊息中提取使用的工具
   */
  private extractToolsUsed(messages: any[]): string[] {
    const toolsUsed: string[] = [];

    for (const msg of messages) {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const toolCall of msg.tool_calls) {
          if (toolCall.name && !toolsUsed.includes(toolCall.name)) {
            toolsUsed.push(toolCall.name);
          }
        }
      }
    }

    return toolsUsed;
  }

  /**
   * 從 messages 中提取 AI Page 的 pageId
   */
  private extractPageId(messages: any[]): string | undefined {
    for (const message of messages) {
      // Check if this is a generate_ai_page tool response
      // LangChain messages use 'type' not 'role', and ToolMessage has type='tool'
      const isGenerateAIPageResponse =
        message.name === 'generate_ai_page' ||
        (message.type === 'tool' && message.name === 'generate_ai_page');

      if (isGenerateAIPageResponse && message.content) {
        try {
          const result = JSON.parse(message.content);
          if (result.success && result.pageId) {
            console.log('[AgentService] ✅ Extracted pageId:', result.pageId);
            return result.pageId;
          }
        } catch (e) {
          console.log('[AgentService] ⚠️ Failed to parse generate_ai_page result');
        }
      }
    }

    return undefined;
  }

  /**
   * 構建完整的執行日誌
   */
  private buildExecutionLog(messages: any[], userQuery: string, systemPrompt: string) {
    const steps: any[] = [];
    let stepNumber = 0;

    // Step 0: User Query
    steps.push({
      step: stepNumber++,
      type: 'user_query',
      content: userQuery,
      timestamp: new Date().toISOString(),
    });

    // Process all messages
    for (const msg of messages) {
      // Skip system messages
      if (msg.role === 'system') {
        continue;
      }

      // AI Tool Calls
      if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        for (const toolCall of msg.tool_calls) {
          steps.push({
            step: stepNumber++,
            type: 'tool_call',
            toolName: toolCall.name,
            toolArgs: toolCall.args,
            toolCallId: toolCall.id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Tool Results
      if (msg.role === 'tool' && msg.content) {
        steps.push({
          step: stepNumber++,
          type: 'tool_result',
          toolName: msg.name,
          result: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          timestamp: new Date().toISOString(),
        });
      }

      // AI Responses (thinking/final answer)
      if ((msg.role === 'assistant' || msg.role === 'ai') && msg.content) {
        steps.push({
          step: stepNumber++,
          type: 'llm_response',
          content: msg.content,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      userQuery,
      totalSteps: steps.length,
      steps,
      summary: {
        toolsUsed: this.extractToolsUsed(messages),
        finalAnswer: messages[messages.length - 1]?.content || '',
      },
    };
  }

  /**
   * 取得修剪過的對話歷史（只保留最後 2 次 QA，不含工具調用）
   */
  private async getTrimmedConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const state = await this.memory.get({
        configurable: { thread_id: conversationId }
      }) as any;

      if (!state || !state.values || !state.values.messages) {
        return [];
      }

      const allMessages = state.values.messages || [];

      // 過濾掉 tool 和 tool_calls，只保留 user 和 assistant 的最終回答
      const qaMessages: any[] = [];
      let currentQA: any[] = [];

      for (const msg of allMessages) {
        // 跳過 system 和 tool 訊息
        if (msg.role === 'system' || msg.role === 'tool') {
          continue;
        }

        // 用戶訊息開始新的 QA 對
        if (msg.role === 'user') {
          if (currentQA.length > 0) {
            qaMessages.push(...currentQA);
            currentQA = [];
          }
          currentQA.push(msg);
        }
        // Assistant 的最終回答（沒有 tool_calls）
        else if (msg.role === 'assistant' && (!msg.tool_calls || msg.tool_calls.length === 0)) {
          currentQA.push(msg);
        }
        // 跳過有 tool_calls 的 assistant 訊息
      }

      // 加入最後一組 QA
      if (currentQA.length > 0) {
        qaMessages.push(...currentQA);
      }

      // 只保留最後 2 組 QA（每組 QA 是 user + assistant 共 2 則訊息，所以取最後 4 則）
      const trimmed = qaMessages.slice(-4);

      console.log(`[AgentService] 💬 Trimmed conversation history: ${qaMessages.length} total messages → ${trimmed.length} kept (last 2 Q&A pairs)`);

      return trimmed;
    } catch (error) {
      console.error('[AgentService] Failed to get trimmed conversation history:', error);
      return [];
    }
  }

  /**
   * 取得對話歷史
   */
  async getConversationHistory(conversationId: string): Promise<AgentMessage[]> {
    try {
      const state = await this.memory.get({
        configurable: { thread_id: conversationId }
      }) as any;

      if (!state || !state.values || !state.values.messages) {
        return [];
      }

      return state.values.messages.map((msg: any) => ({
        role: msg.role || 'assistant',
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
      }));
    } catch (error) {
      console.error('[AgentService] 取得對話歷史失敗:', error);
      return [];
    }
  }

  /**
   * 清除對話歷史
   */
  async clearConversation(conversationId: string): Promise<void> {
    try {
      await this.memory.put(
        { configurable: { thread_id: conversationId } },
        {
          v: 1,
          ts: new Date().toISOString(),
          id: `clear-${Date.now()}`,
          channel_values: { messages: [] },
          channel_versions: {},
          versions_seen: {}
        },
        {
          source: "update",
          step: -1,
          parents: {}
        }
      );
    } catch (error) {
      console.error('[AgentService] 清除對話歷史失敗:', error);
    }
  }

  /**
   * 取得啟用的工具列表
   */
  getEnabledTools(): string[] {
    return this.enabledTools.map(tool => tool.name);
  }
}

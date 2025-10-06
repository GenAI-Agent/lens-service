import { OpenAIService } from '../services/OpenAIService';
import { PluginManager } from '../plugins';
import { Message, Rule, Source } from '../types';

/**
 * Supervisor Agent（兩階段 LLM 流程）
 * 1. 第一次 LLM：判斷需要使用哪些 search tools
 * 2. 執行搜尋：並行調用所需的 search tools
 * 3. 第二次 LLM：基於搜尋結果 + 對話歷史生成回覆
 * 4. 判斷是否能回答，不能則發送到 Telegram
 */
export class SupervisorAgent {
  private openAI: OpenAIService;
  private pluginManager: PluginManager;
  private rules: Rule[];
  private currentRule?: Rule;
  private telegramBotToken?: string;
  private telegramChatId?: string;

  constructor(
    openAI: OpenAIService,
    pluginManager: PluginManager,
    rules: Rule[] = [],
    telegramConfig?: { botToken: string; chatId: string }
  ) {
    this.openAI = openAI;
    this.pluginManager = pluginManager;
    this.rules = rules;
    this.telegramBotToken = telegramConfig?.botToken;
    this.telegramChatId = telegramConfig?.chatId;

    // 設置默認規則
    if (rules.length > 0) {
      this.currentRule = rules.find(r => r.isActive) || rules[0];
    }
  }

  /**
   * 設置當前規則
   */
  setRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      this.currentRule = rule;
    }
  }

  /**
   * 從SQL數據庫獲取系統設定
   */
  private async getSystemSettings(): Promise<{ systemPrompt: string; defaultReply: string }> {
    try {
      const response = await fetch('http://localhost:3002/settings');
      if (response.ok) {
        const settings = await response.json();
        const systemPrompt = settings.find((s: any) => s.key === 'system_prompt')?.value || '你是一個專業的客服助理，請根據提供的資料回答用戶問題。如果沒有相關資料，請告知用戶會轉交給人工客服處理。';
        const defaultReply = settings.find((s: any) => s.key === 'default_reply')?.value || '此問題我們會在 3 小時內給予回覆，請稍候。';
        return { systemPrompt, defaultReply };
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
    }

    // 回退到預設值
    return {
      systemPrompt: '你是一個專業的客服助理，請根據提供的資料回答用戶問題。如果沒有相關資料，請告知用戶會轉交給人工客服處理。',
      defaultReply: '此問題我們會在 3 小時內給予回覆，請稍候。'
    };
  }

  /**
   * 處理用戶訊息（新的兩階段流程）
   */
  async processMessage(
    userMessage: string,
    conversationHistory: Message[],
    sessionId: string,
    userId: string
  ): Promise<{ response: string; sources: Source[]; needsHumanReply: boolean }> {
    console.log('🤖 Starting two-stage LLM process...');

    // 階段 1: 判斷需要使用哪些 search tools
    const toolsToUse = await this.determineSearchTools(userMessage);
    console.log('🔧 Tools to use:', toolsToUse);

    let sources: Source[] = [];
    let searchContext = '';

    // 階段 2: 執行搜尋（如果需要）
    if (toolsToUse.length > 0) {
      console.log('🔍 Searching with tools:', toolsToUse);
      sources = await this.pluginManager.search(userMessage, 5);
      searchContext = this.formatSearchContext(sources);
      console.log(`✅ Found ${sources.length} results`);
    }

    // 階段 3: 基於搜尋結果生成回覆
    const { response, canAnswer } = await this.generateResponse(
      userMessage,
      conversationHistory,
      searchContext
    );

    // 階段 4: 如果無法回答，發送到 Telegram
    if (!canAnswer) {
      console.log('⚠️ Cannot answer, sending to Telegram...');
      await this.sendToTelegram(sessionId, userId, userMessage);
      return {
        response: '此問題我們會在 3 小時內給予回覆，請稍候。',
        sources: [],
        needsHumanReply: true
      };
    }

    return { response, sources, needsHumanReply: false };
  }

  /**
   * 階段 1: 使用 LLM 判斷需要使用哪些 search tools
   */
  private async determineSearchTools(userMessage: string): Promise<string[]> {
    const enabledPlugins = await this.pluginManager.getEnabledPlugins();
    const availableTools = enabledPlugins.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || `Search ${p.name}`
    }));

    if (availableTools.length === 0) {
      return [];
    }

    const systemPrompt = `你是一個工具選擇助手。根據用戶的問題，判斷需要使用哪些搜尋工具。

可用的工具：
${availableTools.map((t: any) => `- ${t.id}: ${t.description}`).join('\n')}

請以 JSON 格式回覆，例如：
{
  "tools": ["manual-index", "frontend-pages"],
  "reason": "用戶詢問功能說明，需要搜尋手動索引和前端頁面"
}

如果不需要任何工具，返回：
{
  "tools": [],
  "reason": "這是一般對話，不需要搜尋"
}`;

    try {
      const response = await this.openAI.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        0.3,
        500
      );

      const parsed = JSON.parse(response);
      console.log('Tool selection reason:', parsed.reason);
      return parsed.tools || [];
    } catch (error) {
      console.error('Failed to determine tools:', error);
      // 如果解析失敗，默認使用所有工具
      return availableTools.map((t: any) => t.id);
    }
  }

  /**
   * 階段 3: 基於搜尋結果生成回覆
   */
  private async generateResponse(
    userMessage: string,
    conversationHistory: Message[],
    searchContext: string
  ): Promise<{ response: string; canAnswer: boolean }> {
    // 從SQL數據庫獲取系統設定
    const { systemPrompt: baseSystemPrompt, defaultReply } = await this.getSystemSettings();

    // 構建系統提示詞
    let systemPrompt = this.currentRule?.systemPrompt || baseSystemPrompt;

    systemPrompt += `

你的任務是根據提供的搜尋結果回答用戶問題。

重要規則：
1. 如果搜尋結果中有明確相關的資訊，請基於這些資訊回答
2. 如果搜尋結果不足以回答問題，請在回覆中明確說明 "CANNOT_ANSWER"
3. 不要編造或猜測資訊
4. 如果能回答，請提供清晰、準確的答案

${searchContext ? `\n搜尋結果：\n${searchContext}` : '\n沒有找到相關的搜尋結果。'}`;

    // 構建對話歷史（前兩次 QA）
    const recentQA = this.getRecentQA(conversationHistory, 2);
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加對話記憶
    if (recentQA.length > 0) {
      messages.push({
        role: 'system',
        content: `\n--- 對話記憶（前 ${recentQA.length} 次 QA）---\n${recentQA.join('\n\n')}`
      });
    }

    // 添加當前問題
    messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      const response = await this.openAI.chatCompletion(
        messages,
        this.currentRule?.temperature || 0.7,
        this.currentRule?.maxTokens || 1000
      );

      // 判斷是否能回答
      const canAnswer = !response.includes('CANNOT_ANSWER');

      // 如果不能回答，使用從SQL獲取的預設回覆
      if (!canAnswer) {
        return { response: defaultReply, canAnswer: false };
      }

      // 如果能回答，移除 CANNOT_ANSWER 標記
      const cleanResponse = response.replace(/CANNOT_ANSWER/g, '').trim();

      return { response: cleanResponse || response, canAnswer };
    } catch (error) {
      console.error('Failed to generate response:', error);
      return {
        response: '抱歉，系統暫時無法處理您的請求。',
        canAnswer: false
      };
    }
  }

  /**
   * 獲取最近的 N 次 QA 對話
   */
  private getRecentQA(history: Message[], count: number): string[] {
    const qa: string[] = [];
    let currentQ = '';

    // 從後往前遍歷，找到最近的 N 次完整 QA
    for (let i = history.length - 1; i >= 0 && qa.length < count; i--) {
      const msg = history[i];

      if (msg.role === 'assistant' && currentQ) {
        // 找到一對完整的 QA
        qa.unshift(`Q: ${currentQ}\nA: ${msg.content}`);
        currentQ = '';
      } else if (msg.role === 'user') {
        currentQ = msg.content;
      }
    }

    return qa;
  }

  /**
   * 發送無法回答的問題到 Telegram
   */
  private async sendToTelegram(
    sessionId: string,
    userId: string,
    userMessage: string
  ): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChatId) {
      console.warn('Telegram config not set, skipping notification');
      return;
    }

    const message = `🔔 新的客服問題需要人工回覆

Session ID: ${sessionId}
User ID: ${userId}
問題: ${userMessage}

請到後台管理系統查看並回覆。`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      console.log('✅ Sent to Telegram successfully');
    } catch (error) {
      console.error('Failed to send to Telegram:', error);
    }
  }

  /**
   * 格式化搜尋結果為上下文
   */
  private formatSearchContext(sources: Source[]): string {
    if (sources.length === 0) return '';

    let context = '';

    sources.forEach((source, index) => {
      context += `[來源 ${index + 1}] ${source.title}\n`;
      if (source.type) {
        context += `類型：${this.getSourceTypeName(source.type)}\n`;
      }
      context += `內容：${source.content || source.snippet}\n`;
      if (source.url) {
        context += `連結：${source.url}\n`;
      }
      context += '\n';
    });

    return context;
  }

  /**
   * 獲取來源類型名稱
   */
  private getSourceTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'manual-index': '手動索引',
      'frontend-page': '前端頁面',
      'sitemap': 'Sitemap',
      'sql': 'SQL 資料庫'
    };
    return typeNames[type] || type;
  }
  
  /**
   * 獲取所有規則
   */
  getRules(): Rule[] {
    return this.rules;
  }
  
  /**
   * 獲取當前規則
   */
  getCurrentRule(): Rule | undefined {
    return this.currentRule;
  }
}


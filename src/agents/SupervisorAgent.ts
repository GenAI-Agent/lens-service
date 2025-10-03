import { OpenAIService } from '../services/OpenAIService';
import { PluginManager } from '../plugins';
import { Message, Rule, Source } from '../types';

/**
 * Supervisor Agent（前端版本 - Plugin 架構）
 * 協調對話和搜尋功能
 */
export class SupervisorAgent {
  private openAI: OpenAIService;
  private pluginManager: PluginManager;
  private rules: Rule[];
  private currentRule?: Rule;

  constructor(openAI: OpenAIService, pluginManager: PluginManager, rules: Rule[] = []) {
    this.openAI = openAI;
    this.pluginManager = pluginManager;
    this.rules = rules;

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
   * 處理用戶訊息
   */
  async processMessage(
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<{ response: string; sources: Source[] }> {
    // 1. 決定是否需要搜尋
    const needsSearch = this.shouldSearch(userMessage);

    let sources: Source[] = [];
    let context = '';

    // 2. 如果需要搜尋，使用 Plugin Manager 執行搜尋
    if (needsSearch) {
      console.log('🔍 Searching for:', userMessage);
      sources = await this.pluginManager.search(userMessage, 5);
      context = this.formatSearchContext(sources);
      console.log(`✅ Found ${sources.length} results from plugins`);
    }

    // 3. 構建訊息
    const messages = this.buildMessages(
      userMessage,
      conversationHistory,
      context
    );

    // 4. 調用 OpenAI
    const response = await this.openAI.chatCompletion(
      messages,
      this.currentRule?.temperature || 0.7,
      this.currentRule?.maxTokens || 1000
    );

    return { response, sources };
  }

  /**
   * 判斷是否需要搜尋
   */
  private shouldSearch(message: string): boolean {
    const searchKeywords = [
      '搜尋', '查詢', '找', '哪裡', '如何', '怎麼', '什麼',
      'search', 'find', 'where', 'how', 'what', 'which',
      '功能', '頁面', '文件', '說明', '介紹', '資訊',
      '有沒有', '可以', '能不能', '是否'
    ];

    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * 格式化搜尋結果為上下文
   */
  private formatSearchContext(sources: Source[]): string {
    if (sources.length === 0) return '';

    let context = '\n\n以下是相關的參考資料：\n\n';

    sources.forEach((source, index) => {
      context += `[${index + 1}] ${source.title}\n`;
      if (source.type) {
        context += `來源類型：${this.getSourceTypeName(source.type)}\n`;
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
   * 構建訊息列表
   */
  private buildMessages(
    userMessage: string,
    history: Message[],
    context: string
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    // 1. 系統提示詞
    let systemPrompt = this.currentRule?.systemPrompt || '你是一個有幫助的 AI 助手。';
    
    if (context) {
      systemPrompt += '\n\n' + context;
      systemPrompt += '\n\n請根據以上內容回答用戶的問題。如果內容中有相關資訊，請引用並提供來源連結。';
    }
    
    messages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // 2. 對話歷史（最近 10 條）
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });
    
    // 3. 當前用戶訊息
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
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


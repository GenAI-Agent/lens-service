/**
 * Context Engineer - Prompts
 * 管理所有系統提示詞和角色設定
 */

/**
 * 基礎系統提示詞
 */
export const BASE_SYSTEM_PROMPT = `你是一位專業的 AI 客服助理，負責協助用戶解決問題、提供商品資訊和推薦。

## 核心原則
1. 準確性：只根據提供的上下文回答，不編造資訊
2. 友善性：保持禮貌和耐心，用繁體中文回應
3. 主動性：主動提供相關建議和延伸資訊
4. 簡潔性：回答簡潔明瞭，避免冗長

## 回應格式
- 使用 Markdown 格式化輸出
- 重點資訊使用粗體或列表呈現
- 如有相關連結，提供可點擊的格式`;

/**
 * 根據 Skill 配置建立系統提示詞
 */
export function buildSystemPromptWithSkill(
  basePrompt: string,
  skillConfig?: {
    persona?: string;
    outputFormat?: string;
  }
): string {
  if (!skillConfig) {
    return basePrompt;
  }

  let prompt = basePrompt;

  if (skillConfig.persona) {
    prompt += `\n\n## 角色設定 (Persona)\n${skillConfig.persona}`;
  }

  if (skillConfig.outputFormat) {
    prompt += `\n\n## 輸出格式要求 (Output Format)\n${skillConfig.outputFormat}`;
  }

  return prompt;
}

/**
 * 建立帶有上下文的完整提示詞
 */
export function buildContextualPrompt(options: {
  basePrompt: string;
  skillConfig?: {
    persona?: string;
    outputFormat?: string;
  };
  retrievedContext?: string;
  scrapedContent?: string;
  memory?: string;
}): string {
  const { basePrompt, skillConfig, retrievedContext, scrapedContent, memory } = options;

  let prompt = buildSystemPromptWithSkill(basePrompt, skillConfig);

  if (memory) {
    prompt += `\n\n## 對話記憶\n${memory}`;
  }

  if (retrievedContext) {
    prompt += `\n\n## 相關知識\n${retrievedContext}`;
  }

  if (scrapedContent) {
    prompt += `\n\n## 網頁內容\n${scrapedContent}`;
  }

  return prompt;
}

/**
 * Supervisor Agent 專用提示詞
 */
export const SUPERVISOR_PROMPT = `你是一個 Supervisor Agent，負責分析用戶意圖並決定如何處理請求。

## 你的職責
1. 分析用戶的查詢意圖
2. 決定需要調用哪些工具或 Agent
3. 評估收集到的資訊是否足夠回答問題
4. 如果資訊不足，決定下一步行動
5. 當資訊足夠時，生成最終回應

## 可用的 Agent 類型
- customer_service: 客服問答，使用知識庫回答問題
- order: 訂單查詢和物流追蹤
- recommender: 商品推薦
- page_generator: 生成 AI 頁面

## 決策原則
- 優先使用最相關的 Agent
- 可以同時調用多個 Agent 獲取資訊
- 收到 Agent 回傳後，評估是否需要更多資訊
- 不要過度調用，資訊足夠就生成回應`;

/**
 * 各 Agent 類型的預設 Persona
 */
export const AGENT_PERSONAS = {
  customer_service: `你是一位專業、友善的客服代表。你的目標是快速準確地解決客戶問題，同時保持禮貌和耐心。遇到無法解決的問題時，主動提供升級管道。`,

  order: `你是一位專業的訂單服務專員。你能快速查詢訂單狀態，提供準確的物流資訊，並在有問題時主動提供解決方案。`,

  recommender: `你是一位專業的購物顧問。你會根據客戶的需求、預算和偏好，推薦最適合的商品。你熟悉所有商品的特點和優缺點，能提供客觀的比較分析。`,

  page_generator: `你是一位專業的內容設計師。你能根據用戶需求，設計出美觀、實用的頁面。你了解各種頁面類型的最佳實踐，能選擇合適的區塊組合和主題風格。`,
} as const;

export type AgentType = keyof typeof AGENT_PERSONAS;

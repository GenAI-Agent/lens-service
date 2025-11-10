/**
 * Rotating ChatOpenAI
 *
 * 擴展 ChatOpenAI 來支援 API key 輪詢，避免 rate limit 問題
 */

import { ChatOpenAI } from "@langchain/openai";
import { getApiKeyRotationService, AzureOpenAIConfig } from './ApiKeyRotationService';

export class RotatingChatOpenAI extends ChatOpenAI {
  private rotationService = getApiKeyRotationService();
  private currentConfig: AzureOpenAIConfig | null = null;

  constructor(options?: any) {
    // 先獲取第一個配置來初始化
    const rotationService = getApiKeyRotationService();
    const initialConfig = rotationService.getNextConfig();

    if (!initialConfig) {
      throw new Error('No API configuration available for RotatingChatOpenAI');
    }

    // 解析 endpoint URL 來提取 deployment 和其他參數
    const { baseURL, deployment, apiVersion } = parseEndpointURL(initialConfig.endpoint);

    super({
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 1500,
      configuration: {
        apiKey: initialConfig.apiKey,
        baseURL: baseURL || `${initialConfig.endpoint}/openai/deployments/${deployment || initialConfig.deployment}`,
        defaultQuery: { 'api-version': apiVersion || initialConfig.apiVersion || "2025-01-01-preview" },
        defaultHeaders: { 'api-key': initialConfig.apiKey },
      },
      ...options,
    });

    this.currentConfig = initialConfig;
  }

  /**
   * 重寫 invoke 方法來實現 API key 輪詢
   */
  async invoke(
    input: any,
    options?: any
  ): Promise<any> {
    let lastError: Error | null = null;
    const maxRetries = this.rotationService.getTotalCount();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 呼叫父類的 invoke 方法
        const result = await super.invoke(input, options);

        // 成功後報告給輪詢服務
        if (this.currentConfig) {
          this.rotationService.reportSuccess(this.currentConfig);
        }

        return result;
      } catch (error: any) {
        lastError = error;

        // 檢查是否是 rate limit 錯誤
        const isRateLimitError =
          error?.message?.includes('rate limit') ||
          error?.message?.includes('429') ||
          error?.status === 429 ||
          error?.code === 'rate_limit_exceeded';

        if (isRateLimitError && this.currentConfig) {
          console.warn(`[Rotating ChatOpenAI] Rate limit hit, rotating to next API key (attempt ${attempt + 1}/${maxRetries})`);

          // 報告失敗
          this.rotationService.reportFailure(this.currentConfig);

          // 獲取下一個配置
          const nextConfig = this.rotationService.getNextConfig();
          if (nextConfig && nextConfig.apiKey !== this.currentConfig.apiKey) {
            // 更新配置
            await this.updateConfiguration(nextConfig);
            this.currentConfig = nextConfig;

            // 繼續重試
            continue;
          }
        }

        // 如果不是 rate limit 錯誤，或者無法切換到新的 key，直接拋出錯誤
        throw error;
      }
    }

    // 所有重試都失敗
    throw lastError || new Error('All API keys exhausted');
  }

  /**
   * 更新 ChatOpenAI 的配置
   */
  private async updateConfiguration(config: AzureOpenAIConfig): Promise<void> {
    const { baseURL, deployment, apiVersion } = parseEndpointURL(config.endpoint);

    // 更新內部配置
    (this as any).azureOpenAIApiKey = config.apiKey;
    (this as any).azureOpenAIApiVersion = apiVersion || config.apiVersion || "2025-01-01-preview";

    // 更新 client configuration
    if ((this as any).client) {
      (this as any).client.apiKey = config.apiKey;
      (this as any).client.baseURL = baseURL || `${config.endpoint}/openai/deployments/${deployment || config.deployment}`;
      (this as any).client.defaultQuery = { 'api-version': apiVersion || config.apiVersion || "2025-01-01-preview" };
      (this as any).client.defaultHeaders = { 'api-key': config.apiKey };
    }

    console.log(`[Rotating ChatOpenAI] Switched to new API configuration`);
  }

  /**
   * 獲取當前的輪詢狀態
   */
  public getRotationStatus() {
    return this.rotationService.getStatus();
  }

  /**
   * 重置輪詢服務的失敗計數
   */
  public resetRotation() {
    this.rotationService.reset();
  }
}

/**
 * 解析 endpoint URL 來提取 baseURL, deployment, 和 apiVersion
 */
function parseEndpointURL(endpoint: string): { baseURL: string; deployment: string | null; apiVersion: string | null } {
  try {
    const url = new URL(endpoint);

    // 檢查是否是完整的 API URL (包含 /openai/deployments/...)
    const pathMatch = url.pathname.match(/\/openai\/deployments\/([^\/]+)/);
    if (pathMatch) {
      const deployment = pathMatch[1].replace('/chat/completions', '');
      const apiVersion = url.searchParams.get('api-version');
      const baseURL = `${url.protocol}//${url.host}${url.pathname}`;

      return {
        baseURL,
        deployment,
        apiVersion,
      };
    }

    // 如果只是基礎 URL (例如 https://xxx.openai.azure.com/)
    return {
      baseURL: endpoint,
      deployment: null,
      apiVersion: null,
    };
  } catch (error) {
    console.error('[Rotating ChatOpenAI] Failed to parse endpoint URL:', error);
    return {
      baseURL: endpoint,
      deployment: null,
      apiVersion: null,
    };
  }
}

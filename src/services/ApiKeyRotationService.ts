/**
 * API Key Rotation Service
 *
 * 管理多個 Azure OpenAI API keys 的輪詢使用，避免單一 key 達到 rate limit
 */

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment?: string;
  apiVersion?: string;
}

export class ApiKeyRotationService {
  private configs: AzureOpenAIConfig[] = [];
  private currentIndex: number = 0;
  private failureCounts: Map<number, number> = new Map();
  private lastUsedTime: Map<number, number> = new Map();
  private readonly MAX_FAILURES = 3;
  private readonly COOLDOWN_MS = 60000; // 1 minute cooldown after failures

  constructor() {
    this.loadConfigs();
  }

  /**
   * 從環境變數載入所有可用的 API configurations
   */
  private loadConfigs(): void {
    const configs: AzureOpenAIConfig[] = [];

    // 嘗試載入多個 API keys (AZURE_OPENAI_ENDPOINT_1, AZURE_OPENAI_API_KEY_1, etc.)
    for (let i = 1; i <= 10; i++) {
      const endpoint = process.env[`AZURE_OPENAI_ENDPOINT_${i}`];
      const apiKey = process.env[`AZURE_OPENAI_API_KEY_${i}`];

      if (endpoint && apiKey) {
        configs.push({
          endpoint,
          apiKey,
          deployment: process.env[`AZURE_OPENAI_DEPLOYMENT_${i}`] || process.env.AZURE_OPENAI_DEPLOYMENT,
          apiVersion: process.env[`AZURE_OPENAI_API_VERSION_${i}`] || process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
        });

        // 初始化失敗計數
        this.failureCounts.set(i - 1, 0);
        this.lastUsedTime.set(i - 1, 0);
      }
    }

    // 如果沒有找到任何多 key 配置，使用舊的單一 key 格式作為後備
    if (configs.length === 0) {
      const legacyEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const legacyApiKey = process.env.AZURE_OPENAI_API_KEY;

      if (legacyEndpoint && legacyApiKey) {
        configs.push({
          endpoint: legacyEndpoint,
          apiKey: legacyApiKey,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
        });
        this.failureCounts.set(0, 0);
        this.lastUsedTime.set(0, 0);
      }
    }

    this.configs = configs;
    console.log(`[API Key Rotation] Loaded ${configs.length} API key configuration(s)`);
  }

  /**
   * 檢查指定的 config index 是否可用
   */
  private isConfigAvailable(index: number): boolean {
    const failures = this.failureCounts.get(index) || 0;
    const lastUsed = this.lastUsedTime.get(index) || 0;
    const now = Date.now();

    // 如果失敗次數超過上限，檢查是否已經過了冷卻時間
    if (failures >= this.MAX_FAILURES) {
      if (now - lastUsed < this.COOLDOWN_MS) {
        return false; // 還在冷卻期
      }
      // 冷卻期過了，重置失敗計數
      this.failureCounts.set(index, 0);
    }

    return true;
  }

  /**
   * 獲取下一個可用的 API configuration
   * 使用 round-robin 策略輪詢
   */
  public getNextConfig(): AzureOpenAIConfig | null {
    if (this.configs.length === 0) {
      console.error('[API Key Rotation] No API configurations available');
      return null;
    }

    // 如果只有一個 config，直接返回
    if (this.configs.length === 1) {
      return this.configs[0];
    }

    // 嘗試找到下一個可用的 config
    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < this.configs.length) {
      if (this.isConfigAvailable(this.currentIndex)) {
        const config = this.configs[this.currentIndex];
        const selectedIndex = this.currentIndex;

        // 更新使用時間
        this.lastUsedTime.set(selectedIndex, Date.now());

        // 移動到下一個 index (round-robin)
        this.currentIndex = (this.currentIndex + 1) % this.configs.length;

        console.log(`[API Key Rotation] Using API config #${selectedIndex + 1}/${this.configs.length}`);
        return config;
      }

      // 當前 config 不可用，嘗試下一個
      this.currentIndex = (this.currentIndex + 1) % this.configs.length;
      attempts++;
    }

    // 所有 configs 都不可用，返回第一個作為後備
    console.warn('[API Key Rotation] All configs in cooldown, using first config as fallback');
    return this.configs[0];
  }

  /**
   * 報告某個 config 的請求失敗（通常是 rate limit 或其他錯誤）
   */
  public reportFailure(config: AzureOpenAIConfig): void {
    const index = this.configs.findIndex(c => c.apiKey === config.apiKey);
    if (index !== -1) {
      const currentFailures = this.failureCounts.get(index) || 0;
      this.failureCounts.set(index, currentFailures + 1);
      console.warn(`[API Key Rotation] Config #${index + 1} failure count: ${currentFailures + 1}`);
    }
  }

  /**
   * 報告某個 config 的請求成功
   */
  public reportSuccess(config: AzureOpenAIConfig): void {
    const index = this.configs.findIndex(c => c.apiKey === config.apiKey);
    if (index !== -1) {
      // 成功請求後重置失敗計數
      this.failureCounts.set(index, 0);
    }
  }

  /**
   * 獲取所有 configs 的狀態
   */
  public getStatus(): Array<{ index: number; failures: number; available: boolean; lastUsed: number }> {
    return this.configs.map((_, index) => ({
      index: index + 1,
      failures: this.failureCounts.get(index) || 0,
      available: this.isConfigAvailable(index),
      lastUsed: this.lastUsedTime.get(index) || 0,
    }));
  }

  /**
   * 重置所有失敗計數
   */
  public reset(): void {
    this.failureCounts.clear();
    this.lastUsedTime.clear();
    this.configs.forEach((_, index) => {
      this.failureCounts.set(index, 0);
      this.lastUsedTime.set(index, 0);
    });
    console.log('[API Key Rotation] Reset all failure counts');
  }

  /**
   * 獲取可用的 config 數量
   */
  public getAvailableCount(): number {
    return this.configs.filter((_, index) => this.isConfigAvailable(index)).length;
  }

  /**
   * 獲取總 config 數量
   */
  public getTotalCount(): number {
    return this.configs.length;
  }
}

// 單例模式
let instance: ApiKeyRotationService | null = null;

export function getApiKeyRotationService(): ApiKeyRotationService {
  if (!instance) {
    instance = new ApiKeyRotationService();
  }
  return instance;
}

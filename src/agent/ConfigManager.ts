import * as fs from 'fs';
import * as path from 'path';
import type { ServiceModulerConfig } from '../types';

export interface ConfigManagerOptions {
  configFilePath?: string;
  autoSave?: boolean;
}

/**
 * ConfigManager 負責管理 Agent 配置
 *
 * 配置來源優先級：
 * 1. 運行時傳入的配置（initConfig）
 * 2. 本地 JSON 檔案配置（config.json）
 * 3. 預設配置
 */
export class ConfigManager {
  private config: ServiceModulerConfig;
  private configFilePath: string;
  private autoSave: boolean;
  private defaultConfig: Partial<ServiceModulerConfig> = {
    agent: {
      enableDatabaseTools: false,
      enableTelegramNotify: false,
      enableAIPageGeneration: true,
      enablePermissionCheck: true,
      dangerousActions: [
        'delete',
        'drop',
        'truncate',
        'remove',
        'destroy',
        'revoke',
        'ban',
        'suspend',
        'disable',
        'deactivate',
        '刪除',
        '移除',
        '註銷',
        '停用',
      ],
      sensitiveTables: [
        'users',
        'accounts',
        'payments',
        'transactions',
        'credentials',
        '用戶',
        '帳戶',
        '支付',
        '交易',
      ],
      orderConfig: {
        enabled: false,
        tableName: 'orders',
        statusField: 'status',
        orderNumberField: 'order_number',
      },
    },
    ui: {
      position: 'right',
      width: '33.33%',
      language: 'zh-TW',
      iconPosition: 'bottom-right',
    },
    features: {
      enableScreenshot: false,
      enableRules: false,
      enableSearch: true,
    },
    debug: false,
  };

  constructor(
    initConfig: ServiceModulerConfig,
    options?: ConfigManagerOptions
  ) {
    this.configFilePath = options?.configFilePath || path.join(process.cwd(), 'lens-service-config.json');
    this.autoSave = options?.autoSave ?? true;

    // 載入並合併配置
    this.config = this.loadAndMergeConfig(initConfig);
  }

  /**
   * 載入並合併配置
   * 優先級: initConfig > fileConfig > defaultConfig
   */
  private loadAndMergeConfig(initConfig: ServiceModulerConfig): ServiceModulerConfig {
    const fileConfig = this.loadConfigFromFile();

    // 深度合併配置
    return this.deepMerge(
      this.deepMerge(this.defaultConfig, fileConfig),
      initConfig
    ) as ServiceModulerConfig;
  }

  /**
   * 從檔案載入配置
   */
  private loadConfigFromFile(): Partial<ServiceModulerConfig> {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        console.log('[ConfigManager] 已載入本地配置檔案:', this.configFilePath);
        return parsed;
      }
    } catch (error: any) {
      console.error('[ConfigManager] 載入配置檔案失敗:', error.message);
    }
    return {};
  }

  /**
   * 儲存配置到檔案
   */
  async saveConfigToFile(config?: Partial<ServiceModulerConfig>): Promise<boolean> {
    try {
      const configToSave = config || this.config;

      // 確保目錄存在
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 寫入檔案
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(configToSave, null, 2),
        'utf-8'
      );

      console.log('[ConfigManager] 配置已儲存至:', this.configFilePath);
      return true;
    } catch (error: any) {
      console.error('[ConfigManager] 儲存配置檔案失敗:', error.message);
      return false;
    }
  }

  /**
   * 取得完整配置
   */
  getConfig(): ServiceModulerConfig {
    return this.config;
  }

  /**
   * 取得特定配置項
   */
  get<K extends keyof ServiceModulerConfig>(key: K): ServiceModulerConfig[K] {
    return this.config[key];
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<ServiceModulerConfig>): Promise<boolean> {
    try {
      this.config = this.deepMerge(this.config, updates) as ServiceModulerConfig;

      if (this.autoSave) {
        return await this.saveConfigToFile();
      }

      return true;
    } catch (error: any) {
      console.error('[ConfigManager] 更新配置失敗:', error.message);
      return false;
    }
  }

  /**
   * 更新 Agent 配置
   */
  async updateAgentConfig(agentConfig: Partial<ServiceModulerConfig['agent']>): Promise<boolean> {
    return this.updateConfig({
      agent: this.deepMerge(this.config.agent || {}, agentConfig) as any,
    });
  }

  /**
   * 更新 UI 配置
   */
  async updateUIConfig(uiConfig: Partial<ServiceModulerConfig['ui']>): Promise<boolean> {
    return this.updateConfig({
      ui: this.deepMerge(this.config.ui || {}, uiConfig) as any,
    });
  }

  /**
   * 更新資料庫配置
   */
  async updateDatabaseConfig(dbConfig: Partial<ServiceModulerConfig['database']>): Promise<boolean> {
    return this.updateConfig({ database: dbConfig as any });
  }

  /**
   * 更新 Telegram 配置
   */
  async updateTelegramConfig(tgConfig: Partial<ServiceModulerConfig['telegram']>): Promise<boolean> {
    return this.updateConfig({ telegram: tgConfig as any });
  }

  /**
   * 重置為預設配置
   */
  async resetToDefault(): Promise<boolean> {
    this.config = this.defaultConfig as ServiceModulerConfig;
    if (this.autoSave) {
      return await this.saveConfigToFile();
    }
    return true;
  }

  /**
   * 驗證配置有效性
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 檢查必要的 LLM 配置
    if (!this.config.llmAPI && !this.config.azureOpenAI) {
      errors.push('缺少 LLM API 配置 (llmAPI 或 azureOpenAI)');
    }

    // 檢查資料庫工具配置
    if (this.config.agent?.enableDatabaseTools) {
      if (!this.config.database) {
        errors.push('已啟用資料庫工具但缺少 database 配置');
      }
    }

    // 檢查 Telegram 配置
    if (this.config.agent?.enableTelegramNotify) {
      if (!this.config.telegram?.botToken) {
        errors.push('已啟用 Telegram 通知但缺少 botToken');
      }
      if (!this.config.telegram?.chatId && !this.config.telegram?.chatIds?.default) {
        errors.push('已啟用 Telegram 通知但缺少 chatId 或 chatIds.default');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 取得配置摘要（用於 debug）
   */
  getConfigSummary(): {
    agentToolsEnabled: string[];
    featuresEnabled: string[];
    hasDatabase: boolean;
    hasTelegram: boolean;
  } {
    const agentToolsEnabled: string[] = [];
    if (this.config.agent?.enableDatabaseTools) agentToolsEnabled.push('database');
    if (this.config.agent?.enableTelegramNotify) agentToolsEnabled.push('telegram');
    if (this.config.agent?.enableAIPageGeneration) agentToolsEnabled.push('aipage');
    if (this.config.agent?.enablePermissionCheck !== false) agentToolsEnabled.push('permission');

    const featuresEnabled: string[] = [];
    if (this.config.features?.enableScreenshot) featuresEnabled.push('screenshot');
    if (this.config.features?.enableRules) featuresEnabled.push('rules');
    if (this.config.features?.enableSearch) featuresEnabled.push('search');

    return {
      agentToolsEnabled,
      featuresEnabled,
      hasDatabase: !!this.config.database,
      hasTelegram: !!this.config.telegram?.botToken,
    };
  }

  /**
   * 深度合併物件
   */
  private deepMerge(target: any, source: any): any {
    if (!source) return target;
    if (!target) return source;

    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key], source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 匯出配置為 JSON 字串
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 從 JSON 字串匯入配置
   */
  async importConfig(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString);
      return await this.updateConfig(imported);
    } catch (error: any) {
      console.error('[ConfigManager] 匯入配置失敗:', error.message);
      return false;
    }
  }
}

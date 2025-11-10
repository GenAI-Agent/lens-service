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
export declare class ConfigManager {
    private config;
    private configFilePath;
    private autoSave;
    private defaultConfig;
    constructor(initConfig: ServiceModulerConfig, options?: ConfigManagerOptions);
    /**
     * 載入並合併配置
     * 優先級: initConfig > fileConfig > defaultConfig
     */
    private loadAndMergeConfig;
    /**
     * 從檔案載入配置
     */
    private loadConfigFromFile;
    /**
     * 儲存配置到檔案
     */
    saveConfigToFile(config?: Partial<ServiceModulerConfig>): Promise<boolean>;
    /**
     * 取得完整配置
     */
    getConfig(): ServiceModulerConfig;
    /**
     * 取得特定配置項
     */
    get<K extends keyof ServiceModulerConfig>(key: K): ServiceModulerConfig[K];
    /**
     * 更新配置
     */
    updateConfig(updates: Partial<ServiceModulerConfig>): Promise<boolean>;
    /**
     * 更新 Agent 配置
     */
    updateAgentConfig(agentConfig: Partial<ServiceModulerConfig['agent']>): Promise<boolean>;
    /**
     * 更新 UI 配置
     */
    updateUIConfig(uiConfig: Partial<ServiceModulerConfig['ui']>): Promise<boolean>;
    /**
     * 更新資料庫配置
     */
    updateDatabaseConfig(dbConfig: Partial<ServiceModulerConfig['database']>): Promise<boolean>;
    /**
     * 更新 Telegram 配置
     */
    updateTelegramConfig(tgConfig: Partial<ServiceModulerConfig['telegram']>): Promise<boolean>;
    /**
     * 重置為預設配置
     */
    resetToDefault(): Promise<boolean>;
    /**
     * 驗證配置有效性
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 取得配置摘要（用於 debug）
     */
    getConfigSummary(): {
        agentToolsEnabled: string[];
        featuresEnabled: string[];
        hasDatabase: boolean;
        hasTelegram: boolean;
    };
    /**
     * 深度合併物件
     */
    private deepMerge;
    /**
     * 匯出配置為 JSON 字串
     */
    exportConfig(): string;
    /**
     * 從 JSON 字串匯入配置
     */
    importConfig(jsonString: string): Promise<boolean>;
}

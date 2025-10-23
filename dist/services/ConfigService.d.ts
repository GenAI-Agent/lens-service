/**
 * 配置管理服務
 * 管理所有插件配置，包括系統設定等
 */
export interface SearchMode {
    projectSearch: boolean;
    siteSearch: boolean;
}
export interface ToolDescriptions {
    projectSearch: string;
    siteSearch: string;
}
export interface SiteConfig {
    sitemapUrl?: string;
    domains?: string[];
    subdomains?: string[];
    excludeSubdomains?: string[];
}
export interface PluginConfig {
    azureOpenAI?: {
        endpoint: string;
        apiKey: string;
        deployment: string;
        embeddingDeployment?: string;
        apiVersion?: string;
    };
    searchMode: SearchMode;
    toolDescriptions: ToolDescriptions;
    siteConfig?: SiteConfig;
    autoRefresh: {
        enabled: boolean;
        interval: number;
    };
    lastUpdated?: {
        siteIndex?: number;
        projectIndex?: number;
    };
}
export declare class ConfigService {
    private static readonly STORAGE_KEY;
    private static readonly DEFAULT_CONFIG;
    /**
     * 獲取配置
     */
    static getConfig(): PluginConfig;
    /**
     * 儲存配置
     */
    static saveConfig(config: Partial<PluginConfig>): void;
    /**
     * 更新 Azure OpenAI 配置
     */
    static updateAzureOpenAI(config: PluginConfig['azureOpenAI']): void;
    /**
     * 更新搜尋模式
     */
    static updateSearchMode(mode: SearchMode): void;
    /**
     * 更新 Tool Descriptions
     */
    static updateToolDescriptions(descriptions: ToolDescriptions): void;
    /**
     * 更新網站配置
     */
    static updateSiteConfig(config: SiteConfig): void;
    /**
     * 更新自動刷新設定
     */
    static updateAutoRefresh(enabled: boolean, interval: number): void;
    /**
     * 更新最後更新時間
     */
    static updateLastUpdated(type: 'siteIndex' | 'projectIndex'): void;
    /**
     * 重置所有配置
     */
    static reset(): void;
    /**
     * 檢查是否已配置 Azure OpenAI
     */
    static hasAzureOpenAI(): boolean;
    /**
     * 檢查是否已配置網站索引
     */
    static hasSiteConfig(): boolean;
    /**
     * 獲取啟用的搜尋工具
     */
    static getEnabledSearchTools(): string[];
    /**
     * 導出配置（用於備份）
     */
    static exportConfig(): string;
    /**
     * 導入配置（用於還原）
     */
    static importConfig(jsonString: string): void;
    /**
     * 獲取系統設定
     */
    static getSystemSettings(): Promise<any[]>;
    /**
     * 獲取單個系統設定
     */
    static getSystemSetting(key: string): Promise<string | null>;
    /**
     * 設置系統設定
     */
    static setSystemSetting(key: string, value: string): Promise<void>;
}

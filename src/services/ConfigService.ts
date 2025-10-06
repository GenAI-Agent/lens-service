import { DatabaseService } from './DatabaseService';

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
  // Azure OpenAI
  azureOpenAI?: {
    endpoint: string;
    apiKey: string;
    deployment: string;
    embeddingDeployment?: string;
    apiVersion?: string;
  };
  
  // 搜尋模式
  searchMode: SearchMode;
  
  // Tool Descriptions
  toolDescriptions: ToolDescriptions;
  
  // 網站配置
  siteConfig?: SiteConfig;
  
  // 自動刷新
  autoRefresh: {
    enabled: boolean;
    interval: number;  // 毫秒
  };
  
  // 最後更新時間
  lastUpdated?: {
    siteIndex?: number;
    projectIndex?: number;
  };
}

export class ConfigService {
  private static readonly STORAGE_KEY = 'lens-service-config';
  private static readonly DEFAULT_CONFIG: PluginConfig = {
    searchMode: {
      projectSearch: true,
      siteSearch: false
    },
    toolDescriptions: {
      projectSearch: '搜尋當前專案的所有頁面內容。適用於詢問本專案相關的問題。',
      siteSearch: '搜尋整個網站的所有頁面內容（基於 sitemap）。適用於詢問網站整體資訊的問題。'
    },
    autoRefresh: {
      enabled: false,
      interval: 86400000  // 24 小時
    }
  };
  
  /**
   * 獲取配置
   */
  static getConfig(): PluginConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        // 合併默認配置（確保新增的欄位有默認值）
        return { ...this.DEFAULT_CONFIG, ...config };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    
    return { ...this.DEFAULT_CONFIG };
  }
  
  /**
   * 儲存配置
   */
  static saveConfig(config: Partial<PluginConfig>): void {
    try {
      const current = this.getConfig();
      const updated = { ...current, ...config };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }
  
  /**
   * 更新 Azure OpenAI 配置
   */
  static updateAzureOpenAI(config: PluginConfig['azureOpenAI']): void {
    this.saveConfig({ azureOpenAI: config });
  }
  
  /**
   * 更新搜尋模式
   */
  static updateSearchMode(mode: SearchMode): void {
    this.saveConfig({ searchMode: mode });
  }
  
  /**
   * 更新 Tool Descriptions
   */
  static updateToolDescriptions(descriptions: ToolDescriptions): void {
    this.saveConfig({ toolDescriptions: descriptions });
  }
  
  /**
   * 更新網站配置
   */
  static updateSiteConfig(config: SiteConfig): void {
    this.saveConfig({ siteConfig: config });
  }
  
  /**
   * 更新自動刷新設定
   */
  static updateAutoRefresh(enabled: boolean, interval: number): void {
    this.saveConfig({
      autoRefresh: { enabled, interval }
    });
  }
  
  /**
   * 更新最後更新時間
   */
  static updateLastUpdated(type: 'siteIndex' | 'projectIndex'): void {
    const config = this.getConfig();
    const lastUpdated = config.lastUpdated || {};
    lastUpdated[type] = Date.now();
    this.saveConfig({ lastUpdated });
  }
  
  /**
   * 重置所有配置
   */
  static reset(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // 同時清除索引資料
      localStorage.removeItem('lens-service-site-index');
      localStorage.removeItem('lens-service-project-index');
      console.log('Config reset successfully');
    } catch (error) {
      console.error('Failed to reset config:', error);
      throw error;
    }
  }
  
  /**
   * 檢查是否已配置 Azure OpenAI
   */
  static hasAzureOpenAI(): boolean {
    const config = this.getConfig();
    return !!(
      config.azureOpenAI?.endpoint &&
      config.azureOpenAI?.apiKey &&
      config.azureOpenAI?.deployment
    );
  }
  
  /**
   * 檢查是否已配置網站索引
   */
  static hasSiteConfig(): boolean {
    const config = this.getConfig();
    return !!(config.siteConfig?.sitemapUrl || config.siteConfig?.domains);
  }
  
  /**
   * 獲取啟用的搜尋工具
   */
  static getEnabledSearchTools(): string[] {
    const config = this.getConfig();
    const tools: string[] = [];
    
    if (config.searchMode.projectSearch) {
      tools.push('search_project');
    }
    
    if (config.searchMode.siteSearch) {
      tools.push('search_site');
    }
    
    return tools;
  }
  
  /**
   * 導出配置（用於備份）
   */
  static exportConfig(): string {
    const config = this.getConfig();
    return JSON.stringify(config, null, 2);
  }
  
  /**
   * 導入配置（用於還原）
   */
  static importConfig(jsonString: string): void {
    try {
      const config = JSON.parse(jsonString);
      this.saveConfig(config);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('Invalid config format');
    }
  }

  /**
   * 獲取系統設定
   */
  static async getSystemSettings(): Promise<any[]> {
    try {
      return await DatabaseService.getSettings();
    } catch (error) {
      console.error('Failed to get system settings:', error);
      return [];
    }
  }

  /**
   * 獲取單個系統設定
   */
  static async getSystemSetting(key: string): Promise<string | null> {
    try {
      return await DatabaseService.getSetting(key);
    } catch (error) {
      console.error('Failed to get system setting:', error);
      return null;
    }
  }

  /**
   * 設置系統設定
   */
  static async setSystemSetting(key: string, value: string): Promise<void> {
    try {
      await DatabaseService.setSetting(key, value);
      console.log('System setting updated:', key);
    } catch (error) {
      console.error('Failed to set system setting:', error);
      throw error;
    }
  }
}


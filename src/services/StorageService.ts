import { ConversationState, IndexedPage, AgentToolConfig } from '../types';

/**
 * 本地存儲服務
 * 使用 localStorage 和 sessionStorage
 */
export class StorageService {
  private static readonly CONVERSATION_KEY = 'sm_conversation';
  private static readonly INDEX_KEY = 'sm_indexed_pages';
  private static readonly CONFIG_KEY = 'sm_config';
  private static readonly AGENT_TOOL_CONFIG_KEY = 'sm_agent_tool_config';
  private static readonly ADMIN_PASSWORD_KEY = 'sm_admin_password';
  
  /**
   * 保存對話狀態
   */
  static saveConversation(state: ConversationState): void {
    try {
      sessionStorage.setItem(
        this.CONVERSATION_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }
  
  /**
   * 載入對話狀態
   */
  static loadConversation(): ConversationState | null {
    try {
      const data = sessionStorage.getItem(this.CONVERSATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }
  
  /**
   * 清除對話狀態
   */
  static clearConversation(): void {
    sessionStorage.removeItem(this.CONVERSATION_KEY);
  }
  
  /**
   * 保存索引頁面
   */
  static saveIndexedPages(pages: IndexedPage[]): void {
    try {
      localStorage.setItem(
        this.INDEX_KEY,
        JSON.stringify(pages)
      );
    } catch (error) {
      console.error('Failed to save indexed pages:', error);
    }
  }
  
  /**
   * 載入索引頁面
   */
  static loadIndexedPages(): IndexedPage[] {
    try {
      const data = localStorage.getItem(this.INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load indexed pages:', error);
      return [];
    }
  }
  
  /**
   * 清除索引
   */
  static clearIndex(): void {
    localStorage.removeItem(this.INDEX_KEY);
  }
  
  /**
   * 保存配置
   */
  static saveConfig(config: any): void {
    try {
      localStorage.setItem(
        this.CONFIG_KEY,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
  
  /**
   * 載入配置
   */
  static loadConfig(): any {
    try {
      const data = localStorage.getItem(this.CONFIG_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  /**
   * 保存 Agent Tool 配置
   */
  static saveAgentToolConfig(config: AgentToolConfig): void {
    try {
      localStorage.setItem(
        this.AGENT_TOOL_CONFIG_KEY,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error('Failed to save agent tool config:', error);
    }
  }

  /**
   * 載入 Agent Tool 配置
   */
  static loadAgentToolConfig(): AgentToolConfig | null {
    try {
      const data = localStorage.getItem(this.AGENT_TOOL_CONFIG_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // 返回默認配置
      return {
        manualIndex: {
          enabled: true,
          priority: 1,
          description: '手動新增的索引內容'
        },
        frontendPages: {
          enabled: true,
          priority: 2,
          description: '前端專案頁面內容'
        },
        sitemap: {
          enabled: false,
          priority: 3,
          description: '外部網站 Sitemap 內容',
          domains: []
        },
        sqlDatabase: {
          enabled: false,
          priority: 4,
          description: 'SQL 資料庫查詢結果',
          connections: []
        }
      };
    } catch (error) {
      console.error('Failed to load agent tool config:', error);
      return null;
    }
  }

  /**
   * 保存管理員密碼
   */
  static saveAdminPassword(password: string): void {
    try {
      localStorage.setItem(this.ADMIN_PASSWORD_KEY, password);
    } catch (error) {
      console.error('Failed to save admin password:', error);
    }
  }

  /**
   * 載入管理員密碼
   */
  static loadAdminPassword(): string {
    try {
      const password = localStorage.getItem(this.ADMIN_PASSWORD_KEY);
      return password || '1234'; // 默認密碼
    } catch (error) {
      console.error('Failed to load admin password:', error);
      return '1234';
    }
  }

  /**
   * 驗證管理員密碼
   */
  static verifyAdminPassword(password: string): boolean {
    return password === this.loadAdminPassword();
  }
}


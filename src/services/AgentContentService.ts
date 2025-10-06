/**
 * Agent內容管理服務
 * 用於管理Agent MD/GEO等專門為LLM準備的內容
 */

import { ContentExtractor } from './ContentExtractor';
import { OpenAIService } from './OpenAIService';
import { StorageService } from './StorageService';

export interface AgentContent {
  id: string;
  name: string;
  base_url: string;
  url_suffix: string; // 例如：/agent-md, /geo-data
  enabled: boolean;
  auto_update: boolean;
  update_interval: number; // 小時
  last_crawled_at?: number;
  crawl_status: 'pending' | 'running' | 'completed' | 'failed';
  total_pages: number;
  indexed_pages: number;
  created_at: number;
  updated_at: number;
}

export interface AgentContentPage {
  id: string;
  content_id: string;
  url: string;
  title: string;
  content: string;
  embedding?: number[];
  fingerprint?: number[];
  keywords?: string[];
  crawl_status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at: number;
  updated_at: number;
}

export class AgentContentService {
  private static contentExtractor = new ContentExtractor();

  /**
   * 創建Agent內容配置
   */
  static async createAgentContent(config: {
    name: string;
    base_url: string;
    url_suffix: string;
    enabled?: boolean;
    auto_update?: boolean;
    update_interval?: number;
  }): Promise<AgentContent> {
    const id = this.generateId();
    const now = Date.now();

    const agentContent: AgentContent = {
      id,
      name: config.name,
      base_url: config.base_url.replace(/\/$/, ''), // 移除末尾斜線
      url_suffix: config.url_suffix.startsWith('/') ? config.url_suffix : '/' + config.url_suffix,
      enabled: config.enabled ?? true,
      auto_update: config.auto_update ?? false,
      update_interval: config.update_interval ?? 24, // 預設24小時
      crawl_status: 'pending',
      total_pages: 0,
      indexed_pages: 0,
      created_at: now,
      updated_at: now
    };

    try {
      const response = await fetch('http://localhost:3002/agent-contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentContent)
      });

      if (!response.ok) {
        throw new Error(`Failed to create agent content: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create agent content:', error);
      throw error;
    }
  }

  /**
   * 獲取所有Agent內容配置
   */
  static async getAgentContents(): Promise<AgentContent[]> {
    try {
      const response = await fetch('http://localhost:3002/agent-contents');
      if (!response.ok) {
        return [];
      }
      const contents = await response.json();
      return Array.isArray(contents) ? contents : [];
    } catch (error) {
      console.error('Failed to load agent contents:', error);
      return [];
    }
  }

  /**
   * 刪除Agent內容配置
   */
  static async deleteAgentContent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3002/agent-contents/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete agent content:', error);
      return false;
    }
  }

  /**
   * 更新Agent內容配置
   */
  static async updateAgentContent(id: string, updates: Partial<AgentContent>): Promise<AgentContent | null> {
    try {
      const response = await fetch(`http://localhost:3002/agent-contents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update agent content:', error);
      return null;
    }
  }

  /**
   * 爬取Agent內容並建立索引
   */
  static async crawlAgentContent(contentId: string): Promise<{
    success: boolean;
    totalPages: number;
    processedPages: number;
    errors: string[];
  }> {
    // 觸發SQL API的爬取
    try {
      const response = await fetch(`http://localhost:3002/agent-contents/${contentId}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ crawl_type: 'manual' })
      });

      if (!response.ok) {
        throw new Error(`Failed to start crawl: ${response.statusText}`);
      }

      // 返回成功狀態，實際爬取在後端進行
      return {
        success: true,
        totalPages: 0,
        processedPages: 0,
        errors: []
      };
    } catch (error) {
      console.error('Failed to crawl agent content:', error);
      return {
        success: false,
        totalPages: 0,
        processedPages: 0,
        errors: [error instanceof Error ? error.message : '未知錯誤']
      };
    }
  }

  /**
   * 一鍵刷新所有啟用的Agent內容
   */
  static async refreshAllAgentContents(): Promise<Array<{
    contentId: string;
    contentName: string;
    result: {
      success: boolean;
      processedPages: number;
      errors: string[];
    };
  }>> {
    const allContents = await this.getAgentContents();
    const enabledContents = allContents.filter(c => c.enabled);
    const results = [];

    for (const content of enabledContents) {
      console.log(`刷新Agent內容: ${content.name}`);
      
      try {
        const result = await this.crawlAgentContent(content.id);
        results.push({
          contentId: content.id,
          contentName: content.name,
          result
        });
      } catch (error) {
        console.error(`刷新Agent內容失敗 ${content.name}:`, error);
        results.push({
          contentId: content.id,
          contentName: content.name,
          result: {
            success: false,
            processedPages: 0,
            errors: [error instanceof Error ? error.message : '未知錯誤']
          }
        });
      }
    }

    return results;
  }

  /**
   * 搜尋Agent內容頁面
   */
  static async searchAgentContentPages(query: string, limit: number = 3): Promise<Array<{
    url: string;
    title: string;
    content: string;
    score: number;
    source: string;
  }>> {
    // 使用SQL API搜尋Agent內容頁面
    try {
      const response = await fetch(`http://localhost:3002/agent-content-pages/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      if (!response.ok) {
        return [];
      }
      const pages = await response.json();
      return pages.map((page: any) => ({
        url: page.url,
        title: page.title || '',
        content: page.content || '',
        score: 0.8, // 預設分數
        source: 'agent-content'
      }));
    } catch (error) {
      console.error('Failed to search agent content pages:', error);
      return [];
    }
  }

  /**
   * 將Agent內容頁面轉換為手動索引
   */
  static async convertToManualIndex(pageId: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3002/agent-content-pages/${pageId}/convert-to-manual-index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to convert to manual index:', error);
      return false;
    }
  }

  /**
   * 生成ID
   */
  private static generateId(): string {
    return 'agent_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

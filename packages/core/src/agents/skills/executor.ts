/**
 * Skills Executor
 * 執行 Skill 的 searchTools（爬取網頁）
 */

import type { SkillConfig, ParsedQuery, SkillExecutionResult } from './types';

/**
 * Skill Executor
 * 負責執行 Skill 的 pre-actions（主要是 searchTools 爬取）
 */
export class SkillExecutor {
  private scrapeFunction?: (url: string, mode: string) => Promise<{
    success: boolean;
    title?: string;
    url?: string;
    content?: string;
    metadata?: { description?: string };
  }>;

  /**
   * 設置爬取函數（依賴注入）
   */
  setScrapeFunction(
    fn: (url: string, mode: string) => Promise<{
      success: boolean;
      title?: string;
      url?: string;
      content?: string;
      metadata?: { description?: string };
    }>
  ): void {
    this.scrapeFunction = fn;
  }

  /**
   * 執行 Skill 的 searchTools
   */
  async executeSearchTools(parsedQuery: ParsedQuery): Promise<SkillExecutionResult> {
    if (!parsedQuery.skillConfig?.searchTools) {
      return {
        success: true,
        skillName: parsedQuery.skillName,
      };
    }

    if (!this.scrapeFunction) {
      console.warn('[Skill Executor] No scrape function configured');
      return {
        success: false,
        skillName: parsedQuery.skillName,
        error: 'Scrape function not configured',
      };
    }

    try {
      // 收集所有 active searchTools 的 URLs
      const activeSearchTools = parsedQuery.skillConfig.searchTools.filter(
        tool => tool.isActive
      );

      const allUrls: string[] = [];
      for (const tool of activeSearchTools) {
        if (tool.urls && Array.isArray(tool.urls)) {
          allUrls.push(...tool.urls);
        }
      }

      if (allUrls.length === 0) {
        console.log('[Skill Executor] No URLs to scrape in searchTools');
        return {
          success: true,
          skillName: parsedQuery.skillName,
        };
      }

      console.log(
        `[Skill Executor] Scraping ${allUrls.length} URLs from skill "${parsedQuery.skillName}"`
      );

      // 並行爬取所有 URLs
      const results = await Promise.all(
        allUrls.map(url => this.scrapeFunction!(url, 'article'))
      );

      // 合併所有成功的爬取結果
      const successfulResults = results.filter(r => r.success);

      if (successfulResults.length === 0) {
        console.log('[Skill Executor] No successful scrapes');
        return {
          success: true,
          skillName: parsedQuery.skillName,
        };
      }

      // 格式化為結構化資訊返回
      let combinedContent = `\n\n## 自動爬取的網頁內容 (來自 Skill: ${parsedQuery.skillName})\n\n`;

      successfulResults.forEach((result, index) => {
        combinedContent += `### 頁面 ${index + 1}: ${result.title}\n`;
        combinedContent += `URL: ${result.url}\n`;
        if (result.metadata?.description) {
          combinedContent += `描述: ${result.metadata.description}\n`;
        }
        combinedContent += `\n${result.content}\n\n---\n\n`;
      });

      console.log(
        `[Skill Executor] Successfully scraped ${successfulResults.length}/${allUrls.length} URLs`
      );

      return {
        success: true,
        skillName: parsedQuery.skillName,
        scrapedContent: combinedContent,
      };
    } catch (error) {
      console.error('[Skill Executor] Failed to execute searchTools:', error);
      return {
        success: false,
        skillName: parsedQuery.skillName,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 獲取 Skill 的 LLM 參數
   */
  getSkillParameters(skillConfig?: SkillConfig): {
    temperature: number;
    maxTokens: number;
  } {
    return {
      temperature: skillConfig?.temperature ?? 0.7,
      maxTokens: skillConfig?.maxTokens ?? 2000,
    };
  }
}

// 全局 Executor 實例
let globalExecutor: SkillExecutor | null = null;

export function getSkillExecutor(): SkillExecutor {
  if (!globalExecutor) {
    globalExecutor = new SkillExecutor();
  }
  return globalExecutor;
}

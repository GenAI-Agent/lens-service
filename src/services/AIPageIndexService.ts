/**
 * AIPageIndexService - AI Page 索引服務
 *
 * 功能：
 * - 當 Agent 生成 AI Page 時，自動索引
 * - 從 .ai-pages/index.json 讀取 AI Page 資料
 * - 提取標題、內容、摘要
 * - 生成適當的標籤和分類
 */

import { Pool } from 'pg';
import { SearchIndexService, SearchDocument } from './SearchIndexService';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface AIPageData {
  pageId: string;
  content: string;
  createdAt: number;
}

export class AIPageIndexService {
  private pool: Pool;
  private searchIndexService: SearchIndexService;
  private aiPagesDir: string;
  private aiPagesIndexFile: string;

  constructor(databaseUrl: string, searchIndexService: SearchIndexService) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
    });
    this.searchIndexService = searchIndexService;

    // AI Pages 儲存路徑
    this.aiPagesDir = path.join(process.cwd(), '.ai-pages');
    this.aiPagesIndexFile = path.join(this.aiPagesDir, 'index.json');
  }

  /**
   * 索引單個 AI Page (通常在生成時呼叫)
   */
  async indexAIPage(pageData: AIPageData): Promise<void> {
    console.log(`[AIPageIndex] 索引 AI Page: ${pageData.pageId}`);

    try {
      const doc = this.convertToSearchDocument(pageData);
      await this.searchIndexService.indexDocument(doc);

      console.log(`[AIPageIndex] ✅ AI Page 索引完成: ${pageData.pageId}`);
    } catch (error) {
      console.error(`[AIPageIndex] ❌ AI Page 索引失敗 ${pageData.pageId}:`, error);
      throw error;
    }
  }

  /**
   * 從 JSON 檔案載入所有 AI Pages
   */
  private loadAIPagesFromDisk(): Record<string, AIPageData> {
    try {
      if (!fs.existsSync(this.aiPagesIndexFile)) {
        console.log('[AIPageIndex] AI Pages 索引檔案不存在');
        return {};
      }

      const data = fs.readFileSync(this.aiPagesIndexFile, 'utf-8');
      const pages = JSON.parse(data);

      console.log(`[AIPageIndex] 從磁碟載入 ${Object.keys(pages).length} 個 AI Pages`);
      return pages;
    } catch (error) {
      console.error('[AIPageIndex] 載入 AI Pages 失敗:', error);
      return {};
    }
  }

  /**
   * 批次索引所有 AI Pages
   */
  async indexAllAIPages(): Promise<void> {
    console.log('[AIPageIndex] 開始索引所有 AI Pages...');
    const startTime = Date.now();

    try {
      const pages = this.loadAIPagesFromDisk();
      const pageIds = Object.keys(pages);

      if (pageIds.length === 0) {
        console.log('[AIPageIndex] 沒有找到任何 AI Pages');
        return;
      }

      console.log(`[AIPageIndex] 找到 ${pageIds.length} 個 AI Pages`);

      let successCount = 0;
      let failureCount = 0;

      for (const pageId of pageIds) {
        try {
          const pageData: AIPageData = {
            pageId,
            content: pages[pageId].content,
            createdAt: pages[pageId].createdAt,
          };

          await this.indexAIPage(pageData);
          successCount++;
        } catch (error) {
          console.error(`[AIPageIndex] 索引失敗: ${pageId}`);
          failureCount++;
        }
      }

      const took = Date.now() - startTime;
      console.log(
        `[AIPageIndex] ✅ 批次索引完成: 成功 ${successCount}, 失敗 ${failureCount} (${took}ms)`
      );
    } catch (error) {
      console.error('[AIPageIndex] ❌ 批次索引失敗:', error);
      throw error;
    }
  }

  /**
   * 轉換 AI Page 為 SearchDocument
   */
  private convertToSearchDocument(pageData: AIPageData): SearchDocument {
    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(pageData.content);

    // 提取標題 (從 <title> 或第一個 <h1>)
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim();
    }
    if (!title) {
      title = pageData.pageId.replace('ai-page-', 'AI Page ');
    }

    // 移除 script 和 style 標籤
    $('script').remove();
    $('style').remove();

    // 提取純文本
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    // 生成摘要 (前 200 字元)
    const summary = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');

    // 生成 URL
    const url = `/api/ai-page/${pageData.pageId}`;

    // 從內容推測標籤
    const tags = this.extractTags(textContent, title);

    // 從內容推測分類
    const category = this.inferCategory(textContent, title);

    // Metadata
    const metadata = {
      pageId: pageData.pageId,
      createdAt: new Date(pageData.createdAt).toISOString(),
      htmlLength: pageData.content.length,
      textLength: textContent.length,
    };

    return {
      contentId: pageData.pageId,
      contentType: 'ai_page',
      title,
      content: textContent.substring(0, 5000), // 限制長度
      summary,
      url,
      tags,
      category,
      metadata,
    };
  }

  /**
   * 從文本中提取關鍵字作為標籤
   */
  private extractTags(text: string, title: string): string[] {
    const tags: string[] = ['ai-generated'];

    // 常見關鍵字
    const keywords = [
      '訂單',
      '商品',
      '使用者',
      '報表',
      '統計',
      '分析',
      '查詢',
      '搜尋',
      '列表',
      '詳情',
      '資料',
      '系統',
      '管理',
      '設定',
      '通知',
      '訊息',
      '歷史',
      '記錄',
    ];

    const combinedText = (title + ' ' + text.substring(0, 500)).toLowerCase();

    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags.slice(0, 10); // 最多 10 個標籤
  }

  /**
   * 推測頁面分類
   */
  private inferCategory(text: string, title: string): string {
    const combinedText = (title + ' ' + text.substring(0, 500)).toLowerCase();

    // 分類規則
    const categories = [
      { name: '訂單管理', keywords: ['訂單', 'order', '購買', '交易'] },
      { name: '商品資訊', keywords: ['商品', 'product', '書籍', '圖書'] },
      { name: '使用者資料', keywords: ['使用者', 'user', '會員', '帳號'] },
      { name: '統計報表', keywords: ['統計', '報表', '分析', 'report', 'analytics'] },
      { name: '系統設定', keywords: ['設定', 'setting', '配置', 'config'] },
      { name: '通知訊息', keywords: ['通知', 'notification', '訊息', 'message'] },
      { name: '查詢工具', keywords: ['查詢', 'query', '搜尋', 'search'] },
    ];

    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (combinedText.includes(keyword)) {
          return category.name;
        }
      }
    }

    return 'AI 生成內容';
  }

  /**
   * 刪除 AI Page 索引
   */
  async deleteAIPageIndex(pageId: string): Promise<void> {
    await this.searchIndexService.deleteDocument(pageId);
    console.log(`[AIPageIndex] ✅ 刪除 AI Page 索引: ${pageId}`);
  }

  /**
   * 關閉連線
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

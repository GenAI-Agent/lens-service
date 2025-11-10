/**
 * StaticPageIndexService - 靜態頁面索引服務
 *
 * 功能：
 * - 索引 Next.js 靜態頁面
 * - 從檔案系統掃描頁面路由
 * - 提取頁面標題和內容
 * - 支援自訂頁面資訊
 */

import { Pool } from 'pg';
import { SearchIndexService, SearchDocument } from './SearchIndexService';
import * as fs from 'fs';
import * as path from 'path';

export interface StaticPageInfo {
  route: string; // 頁面路由 (如 /admin, /business-intelligent)
  title: string; // 頁面標題
  description?: string; // 頁面描述
  category?: string; // 分類
  tags?: string[]; // 標籤
  priority?: number; // 優先級 (用於排序)
}

// 預定義的靜態頁面資訊
const STATIC_PAGES: StaticPageInfo[] = [
  {
    route: '/admin',
    title: '管理後台',
    description: '系統管理後台，管理商品、訂單、使用者等資料',
    category: '系統管理',
    tags: ['管理', '後台', 'admin'],
    priority: 1,
  },
  {
    route: '/business-intelligent',
    title: '商業智能',
    description: 'AI 商業智能分析工具',
    category: '商業工具',
    tags: ['AI', '分析', '商業智能'],
    priority: 2,
  },
  {
    route: '/business-intelligent/docAgent',
    title: '文件 AI 助手',
    description: 'AI 文件分析與處理助手',
    category: '商業工具',
    tags: ['AI', '文件', '助手'],
    priority: 2,
  },
  {
    route: '/business-intelligent/gmail',
    title: 'Gmail 整合',
    description: 'Gmail 郵件管理與 AI 分析',
    category: '商業工具',
    tags: ['Gmail', '郵件', 'AI'],
    priority: 2,
  },
  {
    route: '/business-intelligent/pricing',
    title: '定價方案',
    description: '商業智能服務定價與方案',
    category: '商業工具',
    tags: ['定價', '方案'],
    priority: 3,
  },
  {
    route: '/ai-forum',
    title: 'AI 論壇',
    description: 'AI 技術討論與交流論壇',
    category: '社群',
    tags: ['論壇', 'AI', '討論'],
    priority: 2,
  },
  {
    route: '/editorChoice',
    title: '編輯精選',
    description: '編輯推薦的精選書籍',
    category: '推薦',
    tags: ['編輯', '精選', '推薦'],
    priority: 2,
  },
  {
    route: '/editorChoiceAll',
    title: '全部編輯精選',
    description: '所有編輯推薦的書籍列表',
    category: '推薦',
    tags: ['編輯', '精選', '列表'],
    priority: 3,
  },
  {
    route: '/dj_podcast',
    title: 'DJ Podcast',
    description: '音樂 DJ 與 Podcast 節目',
    category: '娛樂',
    tags: ['DJ', 'Podcast', '音樂'],
    priority: 3,
  },
  {
    route: '/find',
    title: '搜尋頁面',
    description: '商品搜尋與篩選',
    category: '搜尋',
    tags: ['搜尋', '查詢'],
    priority: 1,
  },
  {
    route: '/learning',
    title: 'AI 學習',
    description: 'AI 輔助學習平台',
    category: '學習',
    tags: ['AI', '學習', '教育'],
    priority: 2,
  },
  {
    route: '/meet-bookstore',
    title: '書店導覽',
    description: '實體與虛擬書店導覽',
    category: '書店',
    tags: ['書店', '導覽'],
    priority: 3,
  },
  {
    route: '/mental-livingroom',
    title: '心靈客廳',
    description: '心靈成長與療癒空間',
    category: '心靈',
    tags: ['心靈', '療癒'],
    priority: 3,
  },
  {
    route: '/mental-livingroom-voice',
    title: '心靈客廳語音版',
    description: '心靈客廳語音互動版本',
    category: '心靈',
    tags: ['心靈', '語音', '互動'],
    priority: 3,
  },
  {
    route: '/pdf-to-audio',
    title: 'PDF 轉音訊',
    description: 'PDF 文件轉換為音訊播放',
    category: '工具',
    tags: ['PDF', '音訊', '轉換'],
    priority: 3,
  },
  {
    route: '/personalizedRecommend',
    title: '個人化推薦',
    description: 'AI 個人化書籍推薦',
    category: '推薦',
    tags: ['AI', '推薦', '個人化'],
    priority: 2,
  },
  {
    route: '/profile',
    title: '個人檔案',
    description: '使用者個人資料與設定',
    category: '使用者',
    tags: ['個人', '設定'],
    priority: 2,
  },
];

export class StaticPageIndexService {
  private pool: Pool;
  private searchIndexService: SearchIndexService;

  constructor(databaseUrl: string, searchIndexService: SearchIndexService) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
    });
    this.searchIndexService = searchIndexService;
  }

  /**
   * 索引所有靜態頁面
   */
  async indexAllStaticPages(): Promise<void> {
    console.log('[StaticPageIndex] 開始索引所有靜態頁面...');
    const startTime = Date.now();

    let successCount = 0;
    let failureCount = 0;

    for (const pageInfo of STATIC_PAGES) {
      try {
        await this.indexStaticPage(pageInfo);
        successCount++;
      } catch (error) {
        console.error(`[StaticPageIndex] 索引失敗: ${pageInfo.route}`);
        failureCount++;
      }
    }

    const took = Date.now() - startTime;
    console.log(
      `[StaticPageIndex] ✅ 批次索引完成: 成功 ${successCount}, 失敗 ${failureCount} (${took}ms)`
    );
  }

  /**
   * 索引單個靜態頁面
   */
  async indexStaticPage(pageInfo: StaticPageInfo): Promise<void> {
    console.log(`[StaticPageIndex] 索引頁面: ${pageInfo.route}`);

    try {
      const doc = this.convertToSearchDocument(pageInfo);
      await this.searchIndexService.indexDocument(doc);

      console.log(`[StaticPageIndex] ✅ 頁面索引完成: ${pageInfo.route}`);
    } catch (error) {
      console.error(`[StaticPageIndex] ❌ 頁面索引失敗 ${pageInfo.route}:`, error);
      throw error;
    }
  }

  /**
   * 轉換靜態頁面為 SearchDocument
   */
  private convertToSearchDocument(pageInfo: StaticPageInfo): SearchDocument {
    const contentParts: string[] = [];

    // 標題
    contentParts.push(pageInfo.title);

    // 描述
    if (pageInfo.description) {
      contentParts.push(pageInfo.description);
    }

    // 路由資訊
    contentParts.push(`路由: ${pageInfo.route}`);

    const content = contentParts.join('\n\n');

    // 摘要
    const summary = pageInfo.description || pageInfo.title;

    // URL
    const url = pageInfo.route;

    // 標籤
    const tags = pageInfo.tags || [];
    tags.push('static-page');

    // 分類
    const category = pageInfo.category || '其他';

    // Metadata
    const metadata = {
      route: pageInfo.route,
      priority: pageInfo.priority || 5,
    };

    return {
      contentId: `static_page_${pageInfo.route.replace(/\//g, '_')}`,
      contentType: 'static_page',
      title: pageInfo.title,
      content,
      summary,
      url,
      tags,
      category,
      metadata,
    };
  }

  /**
   * 刪除靜態頁面索引
   */
  async deleteStaticPageIndex(route: string): Promise<void> {
    const contentId = `static_page_${route.replace(/\//g, '_')}`;
    await this.searchIndexService.deleteDocument(contentId);
    console.log(`[StaticPageIndex] ✅ 刪除靜態頁面索引: ${route}`);
  }

  /**
   * 關閉連線
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

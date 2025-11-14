/**
 * SearchIndexService - 全站搜尋索引服務
 *
 * 功能：
 * - 索引內容到 search_index 表 (商品、AI Pages、靜態頁面)
 * - 執行混合搜尋 (BM25 + Vector + RRF)
 * - 支援 Faceted Search (分面搜尋)
 * - 記錄搜尋分析日誌
 *
 * 技術：
 * - PostgreSQL + pgvector
 * - BM25 全文搜尋 (使用 tsvector)
 * - 向量語意搜尋 (使用 OpenAI embeddings)
 * - RRF (Reciprocal Rank Fusion) 混合排序
 */

import { Pool } from 'pg';
import { EmbeddingService } from './EmbeddingService';

// ==================== 類型定義 ====================

export interface SearchDocument {
  contentId: string;
  contentType: 'product' | 'ai_page' | 'static_page' | 'event_page';
  title: string;
  content: string;
  summary?: string;
  url: string;
  tags?: string[];
  category?: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  tags: string[];
  category?: string;
  metadata?: Record<string, any>;

  // 分數
  score: number;
  bm25Score?: number;
  vectorScore?: number;

  // 排名資訊
  rank?: number;
  relevanceExplanation?: string;
}

export interface SearchOptions {
  mode?: 'keyword' | 'semantic' | 'hybrid'; // 搜尋模式
  contentTypes?: string[]; // 限定內容類型
  categories?: string[]; // 限定分類
  tags?: string[]; // 限定標籤
  limit?: number; // 結果數量
  offset?: number; // 分頁偏移
  minScore?: number; // 最低分數過濾
  computeFacets?: boolean; // 是否計算分面統計
}

export interface FacetResult {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

export interface SearchResponse {
  results: SearchResult[];
  facets?: FacetResult[];
  total: number;
  searchMode: string;
  took: number; // 搜尋耗時 (ms)
}

// ==================== SearchIndexService ====================

export class SearchIndexService {
  private pool: Pool;
  private embeddingService: EmbeddingService;

  constructor(databaseUrl: string, embeddingService: EmbeddingService) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 10, // 連線池大小
    });
    this.embeddingService = embeddingService;
  }

  // ==================== 索引操作 ====================

  /**
   * 索引單個文檔
   */
  async indexDocument(doc: SearchDocument): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`[SearchIndex] 索引文檔: ${doc.contentId} (${doc.contentType})`);

      // 1. 生成向量嵌入 (只用 title_vector)
      const titleEmbedding = await this.embeddingService.generateEmbedding(doc.title);

      // 2. 插入或更新索引
      const query = `
        INSERT INTO search_index (
          content_id, content_type, title, content, summary,
          url, tags, category, metadata,
          title_vector,
          indexed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (content_id)
        DO UPDATE SET
          content_type = EXCLUDED.content_type,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          summary = EXCLUDED.summary,
          url = EXCLUDED.url,
          tags = EXCLUDED.tags,
          category = EXCLUDED.category,
          metadata = EXCLUDED.metadata,
          title_vector = EXCLUDED.title_vector,
          updated_at = NOW(),
          indexed_at = NOW()
      `;

      await this.pool.query(query, [
        doc.contentId,
        doc.contentType,
        doc.title,
        doc.content,
        doc.summary || null,
        doc.url,
        doc.tags || [],
        doc.category || null,
        doc.metadata ? JSON.stringify(doc.metadata) : '{}',
        JSON.stringify(titleEmbedding),
      ]);

      const took = Date.now() - startTime;
      console.log(`[SearchIndex] ✅ 索引完成: ${doc.contentId} (${took}ms)`);
    } catch (error: any) {
      console.error(`[SearchIndex] ❌ 索引失敗 ${doc.contentId}:`, error.message);
      throw error;
    }
  }

  /**
   * 批次索引多個文檔
   */
  async indexDocuments(docs: SearchDocument[]): Promise<void> {
    console.log(`[SearchIndex] 批次索引 ${docs.length} 個文檔...`);
    const startTime = Date.now();

    let successCount = 0;
    let failureCount = 0;

    for (const doc of docs) {
      try {
        await this.indexDocument(doc);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`[SearchIndex] 索引失敗: ${doc.contentId}`);
      }
    }

    const took = Date.now() - startTime;
    console.log(`[SearchIndex] ✅ 批次索引完成: 成功 ${successCount}, 失敗 ${failureCount} (${took}ms)`);
  }

  /**
   * 刪除索引項目
   */
  async deleteDocument(contentId: string): Promise<void> {
    await this.pool.query('DELETE FROM search_index WHERE content_id = $1', [contentId]);
    console.log(`[SearchIndex] ✅ 刪除索引: ${contentId}`);
  }

  // ==================== 搜尋操作 ====================

  /**
   * 統一搜尋入口
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      mode = 'hybrid',
      limit = 20,
      offset = 0,
    } = options;

    try {
      let results: SearchResult[];

      if (mode === 'keyword') {
        results = await this.keywordSearch(query, options);
      } else if (mode === 'semantic') {
        results = await this.semanticSearch(query, options);
      } else {
        results = await this.hybridSearch(query, options);
      }

      // 計算分面統計 (如果需要)
      let facets: FacetResult[] | undefined;
      if (options.computeFacets) {
        facets = await this.computeFacets(query, options);
      }

      const took = Date.now() - startTime;

      // 記錄搜尋分析
      await this.logSearchAnalytics({
        query,
        searchMode: mode,
        resultsCount: results.length,
        searchDurationMs: took,
      });

      return {
        results,
        facets,
        total: results.length,
        searchMode: mode,
        took,
      };
    } catch (error) {
      console.error('[SearchIndex] 搜尋失敗:', error);
      throw error;
    }
  }

  /**
   * BM25 關鍵字搜尋
   */
  async keywordSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      contentTypes = [],
      categories = [],
      tags = [],
      limit = 20,
      offset = 0,
      minScore = 0,
    } = options;

    const conditions: string[] = ['(title_tsv @@ query OR content_tsv @@ query)'];
    const params: any[] = [this.prepareQuery(query)];
    let paramIndex = 2;

    if (contentTypes.length > 0) {
      conditions.push(`content_type = ANY($${paramIndex}::text[])`);
      params.push(contentTypes);
      paramIndex++;
    }

    if (categories.length > 0) {
      conditions.push(`category = ANY($${paramIndex}::text[])`);
      params.push(categories);
      paramIndex++;
    }

    if (tags.length > 0) {
      conditions.push(`tags && $${paramIndex}::text[]`);
      params.push(tags);
      paramIndex++;
    }

    const sql = `
      SELECT
        id, content_id, content_type, title, content, summary,
        url, tags, category, metadata,
        ts_rank(title_tsv, query) * 2.0 + ts_rank(content_tsv, query) as score
      FROM search_index, to_tsquery('simple', $1) as query
      WHERE ${conditions.join(' AND ')}
      ORDER BY score DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await this.pool.query(sql, params);

    return result.rows
      .filter((row) => row.score >= minScore)
      .map((row, index) => ({
        ...row,
        tags: row.tags || [],
        metadata: row.metadata || {},
        score: row.score,
        bm25Score: row.score,
        vectorScore: 0,
        rank: offset + index + 1,
      }));
  }

  /**
   * 向量語意搜尋
   */
  async semanticSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      contentTypes = [],
      categories = [],
      tags = [],
      limit = 20,
      offset = 0,
      minScore = 0,
    } = options;

    // 生成查詢向量
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const conditions: string[] = [];
    const params: any[] = [JSON.stringify(queryEmbedding)];
    let paramIndex = 2;

    if (contentTypes.length > 0) {
      conditions.push(`content_type = ANY($${paramIndex}::text[])`);
      params.push(contentTypes);
      paramIndex++;
    }

    if (categories.length > 0) {
      conditions.push(`category = ANY($${paramIndex}::text[])`);
      params.push(categories);
      paramIndex++;
    }

    if (tags.length > 0) {
      conditions.push(`tags && $${paramIndex}::text[]`);
      params.push(tags);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        id, content_id, content_type, title, content, summary,
        url, tags, category, metadata,
        (1 - (title_vector <=> $1)) as score
      FROM search_index
      ${whereClause}
      ORDER BY title_vector <=> $1
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await this.pool.query(sql, params);

    return result.rows
      .filter((row) => row.score >= minScore)
      .map((row, index) => ({
        ...row,
        tags: row.tags || [],
        metadata: row.metadata || {},
        score: row.score,
        bm25Score: 0,
        vectorScore: row.score,
        rank: offset + index + 1,
      }));
  }

  /**
   * 混合搜尋 (Hybrid: BM25 + Vector with RRF)
   *
   * RRF (Reciprocal Rank Fusion) 公式：
   * RRF_score = Σ(1 / (k + rank_i))
   *
   * 其中 k 是常數 (通常 = 60)，rank_i 是該結果在第 i 個排名列表中的位置
   */
  async hybridSearch(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      contentTypes = [],
      categories = [],
      tags = [],
      limit = 20,
      offset = 0,
      minScore = 0,
    } = options;

    // 生成查詢向量
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const conditions: string[] = [];
    const params: any[] = [this.prepareQuery(query), JSON.stringify(queryEmbedding)];
    let paramIndex = 3;

    if (contentTypes.length > 0) {
      conditions.push(`content_type = ANY($${paramIndex}::text[])`);
      params.push(contentTypes);
      paramIndex++;
    }

    if (categories.length > 0) {
      conditions.push(`category = ANY($${paramIndex}::text[])`);
      params.push(categories);
      paramIndex++;
    }

    if (tags.length > 0) {
      conditions.push(`tags && $${paramIndex}::text[]`);
      params.push(tags);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // RRF 混合搜尋
    const sql = `
      WITH bm25_results AS (
        SELECT
          id, content_id, content_type, title, content, summary, url, tags, category, metadata,
          ROW_NUMBER() OVER (ORDER BY ts_rank(title_tsv, query) * 2.0 + ts_rank(content_tsv, query) DESC) as bm25_rank,
          ts_rank(title_tsv, query) * 2.0 + ts_rank(content_tsv, query) as bm25_score
        FROM search_index, to_tsquery('simple', $1) as query
        WHERE (title_tsv @@ query OR content_tsv @@ query)
        ${whereClause}
        LIMIT 100
      ),
      vector_results AS (
        SELECT
          id, content_id, content_type, title, content, summary, url, tags, category, metadata,
          ROW_NUMBER() OVER (ORDER BY title_vector <=> $2 ASC) as vector_rank,
          1 - (title_vector <=> $2) as vector_score
        FROM search_index
        WHERE TRUE
        ${whereClause}
        LIMIT 100
      )
      SELECT
        COALESCE(b.id, v.id) as id,
        COALESCE(b.content_id, v.content_id) as content_id,
        COALESCE(b.content_type, v.content_type) as content_type,
        COALESCE(b.title, v.title) as title,
        COALESCE(b.content, v.content) as content,
        COALESCE(b.summary, v.summary) as summary,
        COALESCE(b.url, v.url) as url,
        COALESCE(b.tags, v.tags) as tags,
        COALESCE(b.category, v.category) as category,
        COALESCE(b.metadata, v.metadata) as metadata,

        -- RRF Score (k=60)
        (COALESCE(1.0 / (60 + b.bm25_rank), 0) + COALESCE(1.0 / (60 + v.vector_rank), 0)) as score,

        COALESCE(b.bm25_score, 0) as bm25_score,
        COALESCE(v.vector_score, 0) as vector_score
      FROM bm25_results b
      FULL OUTER JOIN vector_results v ON b.id = v.id
      ORDER BY score DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await this.pool.query(sql, params);

    return result.rows
      .filter((row) => row.score >= minScore)
      .map((row, index) => ({
        ...row,
        tags: row.tags || [],
        metadata: row.metadata || {},
        rank: offset + index + 1,
      }));
  }

  /**
   * 商品搜尋 - 支援多查詢詞 + 時間/折扣加分
   *
   * @param queries 查詢詞陣列,每個查詢詞都會進行 BM25 + Vector 搜尋
   * @param options 搜尋選項
   */
  async searchProducts(
    queries: string[],
    options: {
      categories?: string[] | null;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      categories = null,
      limit = 20,
      offset = 0,
    } = options;

    if (!queries || queries.length === 0) {
      return [];
    }

    try {
      // 1. 為每個查詢詞生成向量
      const queryEmbeddings = await Promise.all(
        queries.map(q => this.embeddingService.generateEmbedding(q))
      );

      // 2. 構建分類過濾條件
      let categoryFilter = '';
      const params: any[] = [];
      if (categories && categories.length > 0) {
        categoryFilter = 'AND category = ANY($1::text[])';
        params.push(categories);
      }

      // 3. 為每個查詢詞建立 BM25 和 Vector 排名的 CTE
      const bm25CTEs = queries.map((_, idx) => {
        const paramIdx = params.length + 1 + idx * 2;
        return `
          bm25_q${idx} AS (
            SELECT
              id,
              ROW_NUMBER() OVER (ORDER BY ts_rank(title_tsv, query) * 2.0 + ts_rank(content_tsv, query) DESC) as rank
            FROM search_index, to_tsquery('simple', $${paramIdx}) as query
            WHERE (title_tsv @@ query OR content_tsv @@ query)
              AND content_type = 'static_page'
              AND content_id LIKE 'local_book_%'
              ${categoryFilter}
            LIMIT 100
          )`;
      });

      const vectorCTEs = queries.map((_, idx) => {
        const paramIdx = params.length + 1 + idx * 2 + 1;
        return `
          vector_q${idx} AS (
            SELECT
              id,
              ROW_NUMBER() OVER (ORDER BY title_vector <=> $${paramIdx} ASC) as rank
            FROM search_index
            WHERE content_type = 'static_page'
              AND content_id LIKE 'local_book_%'
              ${categoryFilter}
            LIMIT 100
          )`;
      });

      // 4. 組合所有 RRF 計算
      const rrfJoins = queries.map((_, idx) => {
        return `
          LEFT JOIN bm25_q${idx} ON base.id = bm25_q${idx}.id
          LEFT JOIN vector_q${idx} ON base.id = vector_q${idx}.id`;
      }).join('');

      const rrfScoreCalc = queries.map((_, idx) => {
        return `COALESCE(1.0 / (60 + bm25_q${idx}.rank), 0) + COALESCE(1.0 / (60 + vector_q${idx}.rank), 0)`;
      }).join(' + ');

      // 5. 主查詢 (simplified without publish_year and discount_rate)
      const sql = `
        WITH
          ${bm25CTEs.join(',\n')},
          ${vectorCTEs.join(',\n')},
          base AS (
            SELECT DISTINCT id, content_id, content_type, title, content, summary, url, tags, category, metadata
            FROM search_index
            WHERE content_type = 'static_page'
              AND content_id LIKE 'local_book_%'
              ${categoryFilter}
          ),
          scored AS (
            SELECT
              base.*,
              (${rrfScoreCalc}) as base_score
            FROM base
            ${rrfJoins}
            WHERE (${rrfScoreCalc}) > 0
          )
        SELECT
          id, content_id, content_type, title, content, summary, url, tags, category, metadata,
          base_score,
          base_score as final_score
        FROM scored
        ORDER BY final_score DESC
        LIMIT $${params.length + queries.length * 2 + 1}
        OFFSET $${params.length + queries.length * 2 + 2}
      `;

      // 6. 準備參數 (交錯：tsquery, vector, tsquery, vector, ...)
      queries.forEach((query, idx) => {
        params.push(this.prepareQuery(query)); // tsquery
        params.push(JSON.stringify(queryEmbeddings[idx])); // vector
      });
      params.push(limit, offset);

      console.log('[SearchIndex] Executing multi-query product search:', {
        queries,
        categories,
        limit,
        offset,
      });

      const result = await this.pool.query(sql, params);

      return result.rows.map((row, index) => ({
        ...row,
        tags: row.tags || [],
        metadata: row.metadata || {},
        score: parseFloat(row.final_score),
        bm25Score: parseFloat(row.base_score),
        vectorScore: 0,
        rank: offset + index + 1,
        relevanceExplanation: `RRF=${parseFloat(row.base_score).toFixed(3)}`,
      }));
    } catch (error) {
      console.error('[SearchIndex] searchProducts failed:', error);
      throw error;
    }
  }

  // ==================== 分面搜尋 (Faceted Search) ====================

  /**
   * 計算分面統計
   */
  async computeFacets(
    query: string,
    options: SearchOptions = {}
  ): Promise<FacetResult[]> {
    const {
      contentTypes = [],
      categories = [],
      tags = [],
    } = options;

    const conditions: string[] = [];
    const params: any[] = [this.prepareQuery(query)];
    let paramIndex = 2;

    if (contentTypes.length > 0) {
      conditions.push(`content_type = ANY($${paramIndex}::text[])`);
      params.push(contentTypes);
      paramIndex++;
    }

    const whereClause = conditions.length > 0
      ? `AND ${conditions.join(' AND ')}`
      : '';

    const sql = `
      WITH search_results AS (
        SELECT id, content_type, category, tags
        FROM search_index, to_tsquery('simple', $1) as query
        WHERE (title_tsv @@ query OR content_tsv @@ query)
        ${whereClause}
      )
      SELECT
        'content_type' as field,
        content_type as value,
        COUNT(*) as count
      FROM search_results
      GROUP BY content_type

      UNION ALL

      SELECT
        'category' as field,
        category as value,
        COUNT(*) as count
      FROM search_results
      WHERE category IS NOT NULL
      GROUP BY category

      UNION ALL

      SELECT
        'tag' as field,
        UNNEST(tags) as value,
        COUNT(*) as count
      FROM search_results
      WHERE tags IS NOT NULL
      GROUP BY value

      ORDER BY field, count DESC
    `;

    const result = await this.pool.query(sql, params);

    // 組織分面結果
    const facets: FacetResult[] = [];
    const facetMap = new Map<string, Array<{ value: string; count: number }>>();

    for (const row of result.rows) {
      if (!facetMap.has(row.field)) {
        facetMap.set(row.field, []);
      }
      facetMap.get(row.field)!.push({
        value: row.value,
        count: parseInt(row.count),
      });
    }

    for (const [field, values] of facetMap) {
      facets.push({ field, values });
    }

    return facets;
  }

  // ==================== 輔助方法 ====================

  /**
   * 準備 tsquery 查詢字串
   */
  private prepareQuery(query: string): string {
    // 移除特殊字符，只保留字母、數字、空格
    const cleaned = query.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ').trim();

    // 將多個空格轉換為單個空格，然後用 | (OR) 連接
    return cleaned.split(/\s+/).join(' | ');
  }

  /**
   * 記錄搜尋分析日誌
   */
  async logSearchAnalytics(data: {
    query: string;
    searchMode: string;
    resultsCount: number;
    userId?: string;
    agentId?: string;
    searchDurationMs: number;
  }): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO search_analytics
         (query, search_mode, results_count, user_id, agent_id, search_duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.query,
          data.searchMode,
          data.resultsCount,
          data.userId || null,
          data.agentId || null,
          data.searchDurationMs,
        ]
      );
    } catch (error) {
      console.error('[SearchIndex] 記錄分析日誌失敗:', error);
      // 不影響主要搜尋流程
    }
  }

  /**
   * 關閉資料庫連線
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

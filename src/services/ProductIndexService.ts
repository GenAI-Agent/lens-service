/**
 * ProductIndexService - 商品索引服務（通用版）
 *
 * 功能：
 * - 接收商品資料並轉換為 SearchDocument
 * - 批次索引商品
 * - 支援增量更新
 */

import { Pool } from 'pg';
import { SearchIndexService, SearchDocument } from './SearchIndexService';

export interface ProductData {
  prod_id: string;
  prod_title_main?: string;
  prod_title_next?: string;
  main_author?: string;
  publisher_name?: string;
  main_isbn?: string;
  main_publish_date?: string;
  prod_sale_price?: string | number;
  main_list_price?: string | number;
  cat4xsx_cat_nm?: string;
  bk_tags?: string[];
  prod_pf?: string;
  sp_rec?: string;
  author_pf?: string;
  cover_str?: string;
  stk_flg?: string;
  prod_status_flg?: string;
}

export interface ProductIndexOptions {
  batchSize?: number;
  baseUrl?: string; // 商品頁面基礎 URL
}

export class ProductIndexService {
  private pool: Pool;
  private searchIndexService: SearchIndexService;
  private baseUrl: string;

  constructor(
    databaseUrl: string,
    searchIndexService: SearchIndexService,
    options: { baseUrl?: string } = {}
  ) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
    });
    this.searchIndexService = searchIndexService;
    this.baseUrl = options.baseUrl || 'https://example.com/products';
  }

  /**
   * 批次索引商品
   */
  async indexProducts(products: ProductData[]): Promise<void> {
    console.log(`[ProductIndex] 索引 ${products.length} 個商品...`);

    const docs = products.map((p) => this.convertToSearchDocument(p));
    await this.searchIndexService.indexDocuments(docs);

    console.log(`[ProductIndex] ✅ 已索引 ${products.length} 個商品`);
  }

  /**
   * 索引單個商品
   */
  async indexProduct(product: ProductData): Promise<void> {
    console.log(`[ProductIndex] 索引商品: ${product.prod_id}`);

    const doc = this.convertToSearchDocument(product);
    await this.searchIndexService.indexDocument(doc);

    console.log(`[ProductIndex] ✅ 商品索引完成: ${product.prod_id}`);
  }

  /**
   * 轉換商品資料為 SearchDocument
   */
  private convertToSearchDocument(product: ProductData): SearchDocument {
    const title = product.prod_title_main || '未命名商品';
    const subtitle = product.prod_title_next || '';

    const contentParts: string[] = [];
    if (subtitle) contentParts.push(subtitle);
    if (product.prod_pf) contentParts.push('商品介紹: ' + product.prod_pf);
    if (product.sp_rec) contentParts.push('編輯推薦: ' + product.sp_rec);
    if (product.author_pf) contentParts.push('作者簡介: ' + product.author_pf);
    if (product.cover_str) contentParts.push('封面文字: ' + product.cover_str);

    const content = contentParts.join('\n\n');
    const summary = this.generateSummary(product);
    const url = `${this.baseUrl}/${product.prod_id}.html`;

    const tags: string[] = [];
    if (product.bk_tags && Array.isArray(product.bk_tags)) {
      tags.push(...product.bk_tags);
    }
    if (product.main_author) tags.push(product.main_author);
    if (product.publisher_name) tags.push(product.publisher_name);

    const category = product.cat4xsx_cat_nm || '未分類';

    const metadata = {
      isbn: product.main_isbn || null,
      author: product.main_author || null,
      publisher: product.publisher_name || null,
      publishDate: product.main_publish_date || null,
      price: parseFloat(String(product.prod_sale_price || product.main_list_price || 0)),
      stockStatus: product.stk_flg === '1' ? 'in_stock' : 'out_of_stock',
    };

    return {
      contentId: `product_${product.prod_id}`,
      contentType: 'product',
      title,
      content: content || title,
      summary,
      url,
      tags,
      category,
      metadata,
    };
  }

  /**
   * 生成商品摘要
   */
  private generateSummary(product: ProductData): string {
    const parts: string[] = [];

    if (product.main_author) parts.push(`作者: ${product.main_author}`);
    if (product.publisher_name) parts.push(`出版社: ${product.publisher_name}`);

    const price = parseFloat(String(product.prod_sale_price || product.main_list_price || 0));
    if (price) parts.push(`售價: NT$ ${price}`);

    const stockStatus = product.stk_flg === '1' ? '有庫存' : '缺貨';
    parts.push(`庫存: ${stockStatus}`);

    if (product.prod_pf) {
      const shortDesc = product.prod_pf.substring(0, 100);
      parts.push(shortDesc + (product.prod_pf.length > 100 ? '...' : ''));
    }

    return parts.join(' | ');
  }

  /**
   * 刪除商品索引
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.searchIndexService.deleteDocument(`product_${productId}`);
    console.log(`[ProductIndex] ✅ 刪除商品索引: ${productId}`);
  }

  /**
   * 批次刪除商品索引
   */
  async deleteProducts(productIds: string[]): Promise<void> {
    console.log(`[ProductIndex] 刪除 ${productIds.length} 個商品索引...`);

    for (const productId of productIds) {
      await this.deleteProduct(productId);
    }

    console.log(`[ProductIndex] ✅ 已刪除 ${productIds.length} 個商品索引`);
  }

  /**
   * 關閉連線
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

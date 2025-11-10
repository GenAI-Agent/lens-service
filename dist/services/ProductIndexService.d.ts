/**
 * ProductIndexService - 商品索引服務（通用版）
 *
 * 功能：
 * - 接收商品資料並轉換為 SearchDocument
 * - 批次索引商品
 * - 支援增量更新
 */
import { SearchIndexService } from './SearchIndexService';
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
    baseUrl?: string;
}
export declare class ProductIndexService {
    private pool;
    private searchIndexService;
    private baseUrl;
    constructor(databaseUrl: string, searchIndexService: SearchIndexService, options?: {
        baseUrl?: string;
    });
    /**
     * 批次索引商品
     */
    indexProducts(products: ProductData[]): Promise<void>;
    /**
     * 索引單個商品
     */
    indexProduct(product: ProductData): Promise<void>;
    /**
     * 轉換商品資料為 SearchDocument
     */
    private convertToSearchDocument;
    /**
     * 生成商品摘要
     */
    private generateSummary;
    /**
     * 刪除商品索引
     */
    deleteProduct(productId: string): Promise<void>;
    /**
     * 批次刪除商品索引
     */
    deleteProducts(productIds: string[]): Promise<void>;
    /**
     * 關閉連線
     */
    close(): Promise<void>;
}

/**
 * 訂單服務
 * 負責調用 TzAI_web 的訂單相關 API
 */
export declare class OrderService {
    private static baseUrl;
    /**
     * 判斷用戶訊息是否與訂單相關
     */
    static isOrderRelated(message: string): boolean;
    /**
     * 查詢用戶訂單列表
     */
    static getUserOrders(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    /**
     * 查詢訂單詳情
     */
    static getOrderDetails(masNo: string): Promise<any>;
    /**
     * 查詢訂單統計
     */
    static getOrderStatistics(): Promise<any>;
    /**
     * 查詢用戶資料
     */
    static getUserProfile(): Promise<any>;
    /**
     * 格式化訂單列表為易讀文本
     */
    static formatOrdersForLLM(ordersData: any): string;
    /**
     * 格式化訂單詳情為易讀文本
     */
    static formatOrderDetailsForLLM(orderData: any): string;
    /**
     * 格式化統計資訊為易讀文本
     */
    static formatStatisticsForLLM(statsData: any): string;
}

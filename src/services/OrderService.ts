/**
 * 訂單服務
 * 負責調用 TzAI_web 的訂單相關 API
 */
export class OrderService {
  private static baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';

  /**
   * 判斷用戶訊息是否與訂單相關
   */
  static isOrderRelated(message: string): boolean {
    const orderKeywords = [
      '訂單', '订单', 'order',
      '購買', '购买', 'purchase',
      '買', '买', 'buy', 'bought',
      '出貨', '出货', 'ship', 'delivery',
      '配送', '送達', 'deliver',
      '取消', 'cancel',
      '退貨', '退货', 'return', 'refund',
      '收件', '地址', 'address',
      '物流', 'logistics',
      '訂購', '订购',
      '商品', '产品', 'product',
      '包裹', 'package',
      '追蹤', '追踪', 'track',
      '狀態', '状态', 'status'
    ];

    const lowercaseMessage = message.toLowerCase();

    // 檢查是否包含訂單相關關鍵字
    const hasOrderKeyword = orderKeywords.some(keyword =>
      lowercaseMessage.includes(keyword.toLowerCase())
    );

    // 檢查是否包含查詢動作詞 + 訂單相關詞
    const queryActions = ['查', '查詢', '查询', '看', '顯示', '显示', 'show', 'view', 'check', 'find', '我的', '最近', 'recent'];
    const hasQueryAction = queryActions.some(action =>
      lowercaseMessage.includes(action.toLowerCase())
    );

    // 如果有查詢動作詞，且訊息很短（可能是「查訂單」這種），也算是訂單查詢
    if (hasQueryAction && lowercaseMessage.length < 30) {
      // 排除明顯不是訂單的查詢
      const excludeKeywords = ['書', '作者', '推薦', '閱讀', '讀', '文章', 'book', 'author', 'recommend'];
      const isExcluded = excludeKeywords.some(keyword =>
        lowercaseMessage.includes(keyword.toLowerCase())
      );
      if (!isExcluded) {
        console.log('🔍 Query action detected in short message, treating as order-related');
        return true;
      }
    }

    return hasOrderKeyword;
  }

  /**
   * 查詢用戶訂單列表
   */
  static async getUserOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${this.baseUrl}/api/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // 包含 cookies (session)
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授權：請先登入');
        }
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * 查詢訂單詳情
   */
  static async getOrderDetails(masNo: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders/${masNo}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授權：請先登入');
        }
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  /**
   * 查詢訂單統計
   */
  static async getOrderStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders/statistics`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授權：請先登入');
        }
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  }

  /**
   * 查詢用戶資料
   */
  static async getUserProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授權：請先登入');
        }
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * 格式化訂單列表為易讀文本
   */
  static formatOrdersForLLM(ordersData: any): string {
    if (!ordersData.success || !ordersData.data || ordersData.data.length === 0) {
      return '您目前沒有訂單記錄。';
    }

    const orders = ordersData.data;
    const statusMap: Record<string, string> = {
      A: '待處理',
      B: '已確認',
      C: '已出貨',
      D: '已完成',
      X: '已取消',
    };

    const orderTexts = orders.map((order: any, index: number) => {
      const orderDate = order.crt_time ? new Date(order.crt_time).toLocaleDateString('zh-TW') : '未知';
      const status = statusMap[order.status_flg] || order.status_flg;

      return `訂單 ${index + 1}:
- 訂單編號: ${order.mas_no}
- 狀態: ${status}
- 金額: NT$ ${order.total_amount || 0}
- 訂購日期: ${orderDate}
- 收件人: ${order.rcv_nm || '未指定'}
- 配送方式: ${order.deliver === 'A' ? '宅配' : order.deliver === 'B' ? '超商取貨' : '其他'}`;
    });

    const pagination = ordersData.pagination;
    const totalInfo = pagination
      ? `\n\n總共有 ${pagination.total} 筆訂單（目前顯示第 ${pagination.page} 頁，共 ${pagination.totalPages} 頁）`
      : '';

    return `您有以下訂單記錄：\n\n${orderTexts.join('\n\n')}${totalInfo}`;
  }

  /**
   * 格式化訂單詳情為易讀文本
   */
  static formatOrderDetailsForLLM(orderData: any): string {
    if (!orderData.success || !orderData.data) {
      return '找不到該訂單資訊。';
    }

    const order = orderData.data;
    const statusMap: Record<string, string> = {
      A: '待處理',
      B: '已確認',
      C: '已出貨',
      D: '已完成',
      X: '已取消',
    };

    const orderDate = order.crt_time ? new Date(order.crt_time).toLocaleDateString('zh-TW') : '未知';
    const status = statusMap[order.status_flg] || order.status_flg;
    const deliveryMap: Record<string, string> = {
      A: '宅配',
      B: '超商取貨',
      C: '門市自取',
    };

    let detailText = `訂單詳細資訊：

【訂單基本資訊】
- 訂單編號: ${order.mas_no}
- 訂單狀態: ${status}
- 訂購日期: ${orderDate}

【金額資訊】
- 商品金額: NT$ ${order.total_sum_amount || 0}
- 運費: NT$ ${order.freight || 0}
- 訂單總額: NT$ ${order.total_amount || 0}

【收件資訊】
- 收件人: ${order.rcv_nm || '未指定'}
- 收件電話: ${order.rcv_mobile || order.rcv_tel_day || '未指定'}
- 收件地址: ${order.rcv_address || '未指定'}
- 配送方式: ${deliveryMap[order.deliver] || '其他'}`;

    // 如果有訂單項目
    if (order.items && order.items.length > 0) {
      const itemTexts = order.items.map((item: any, index: number) => {
        return `  ${index + 1}. ${item.prod_nm || '商品名稱未知'}
     數量: ${item.qty || 1}
     單價: NT$ ${item.unit_price || 0}
     小計: NT$ ${item.sub_amount || 0}`;
      });

      detailText += `\n\n【訂購商品】\n${itemTexts.join('\n')}`;
    }

    return detailText;
  }

  /**
   * 格式化統計資訊為易讀文本
   */
  static formatStatisticsForLLM(statsData: any): string {
    if (!statsData.success || !statsData.data) {
      return '無法取得訂單統計資訊。';
    }

    const stats = statsData.data;
    const statusMap: Record<string, string> = {
      A: '待處理',
      B: '已確認',
      C: '已出貨',
      D: '已完成',
      X: '已取消',
    };

    if (!stats.byStatus || stats.byStatus.length === 0) {
      return '目前沒有訂單統計資料。';
    }

    const statusTexts = stats.byStatus.map((stat: any) => {
      const status = statusMap[stat.status_flg] || stat.status_flg;
      return `- ${status}: ${stat.count} 筆訂單，總金額 NT$ ${stat.total_amount}`;
    });

    let summaryText = `訂單統計資訊：\n\n【各狀態訂單統計】\n${statusTexts.join('\n')}`;

    if (stats.total) {
      summaryText += `\n\n【總計】
- 總訂單數: ${stats.total.count} 筆
- 總金額: NT$ ${stats.total.totalAmount}`;
    }

    return summaryText;
  }
}

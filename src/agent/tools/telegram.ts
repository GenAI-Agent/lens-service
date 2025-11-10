import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from '../../types';

let currentConfig: ServiceModulerConfig | null = null;

export function initTelegramTools(config: ServiceModulerConfig) {
  currentConfig = config;
}

function isTelegramEnabled(): boolean {
  return currentConfig?.agent?.enableTelegramNotify !== false && !!currentConfig?.telegram?.botToken;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

/**
 * Tool: 發送 Telegram 通知
 * 整合客服通知與物流通知功能
 */
export const sendNotificationTool = new DynamicStructuredTool({
  name: "send_notification",
  description: `發送 Telegram 通知到指定部門（客服或物流）。

**使用時機**：
1. 客服通知 (notifyType: "customer_service")：
   - 知識庫搜尋沒有找到相關資訊時
   - 需要人工處理的敏感請求
   - 資料庫操作失敗或權限不足時

2. 物流通知 (notifyType: "logistics")：
   - 訂單地址變更
   - 配送方式變更
   - 訂單內容修改
   - 訂單取消

**參數說明**：
- notifyType: 通知類型 ("customer_service" 或 "logistics")
- 客服通知必填：userQuery, questionType
- 物流通知必填：subject, orderNumber, requestType, details`,
  schema: z.object({
    notifyType: z.enum(['customer_service', 'logistics']).describe("通知類型"),

    // 客服通知參數
    userQuery: z.string().optional().describe("用戶的原始問題（客服通知必填）"),
    questionType: z.enum(['knowledge_gap', 'sensitive_request', 'technical_error', 'other']).optional()
      .describe("問題類型（客服通知必填）"),
    userId: z.string().optional().describe("用戶ID"),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional().describe("優先級"),

    // 物流通知參數
    subject: z.string().optional().describe("通知主題（物流通知必填）"),
    orderNumber: z.string().optional().describe("訂單編號（物流通知必填）"),
    requestType: z.enum(['address_change', 'shipping_method_change', 'delivery_date_change', 'item_change', 'delete', 'other']).optional()
      .describe("訂單變更類型（物流通知必填）"),

    // 通用參數
    details: z.string().optional().describe("詳細說明"),
  }),
  func: async ({ notifyType, userQuery, questionType, userId, priority, subject, orderNumber, requestType, details }) => {
    if (!isTelegramEnabled()) {
      return JSON.stringify({ success: false, message: "Telegram未配置" });
    }

    const config = currentConfig!;

    // 根據通知類型選擇 Chat ID
    let chatId: string | undefined;
    if (notifyType === 'customer_service') {
      chatId = config.telegram!.chatIds?.customerService ||
               config.telegram!.chatIds?.default ||
               config.telegram!.chatId;
    } else {
      chatId = config.telegram!.chatIds?.logistics ||
               config.telegram!.chatIds?.default ||
               config.telegram!.chatId;
    }

    if (!chatId) {
      return JSON.stringify({
        success: false,
        message: `${notifyType === 'customer_service' ? '客服部' : '物流中心'}Chat ID未設定`
      });
    }

    let message = '';

    // 客服通知
    if (notifyType === 'customer_service') {
      if (!userQuery || !questionType) {
        return JSON.stringify({
          success: false,
          message: "客服通知必須提供 userQuery 和 questionType",
        });
      }

      const questionTypeMap = {
        'knowledge_gap': '❓ 知識庫無相關資料',
        'sensitive_request': '⚠️ 敏感操作請求',
        'technical_error': '🔧 技術錯誤',
        'other': 'ℹ️ 其他'
      };

      const priorityEmoji = priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : 'ℹ️';
      message = `
${priorityEmoji} <b>客服轉接通知</b>

<b>問題類型:</b> ${questionTypeMap[questionType]}
<b>用戶ID:</b> ${userId || '未知'}
<b>時間:</b> ${new Date().toLocaleString('zh-TW')}

<b>用戶問題:</b>
${userQuery}

${details ? `<b>補充說明:</b>\n${details}\n` : ''}
<i>由 AI Agent 自動發送</i>
`.trim();

      console.log('[Telegram] 發送客服通知:', {
        questionType,
        userId,
        userQuery: userQuery.substring(0, 50) + '...',
      });
    }
    // 物流通知
    else {
      if (!subject || !orderNumber || !requestType) {
        return JSON.stringify({
          success: false,
          message: "物流通知必須提供 subject, orderNumber 和 requestType",
        });
      }

      const emojiMap: Record<string, string> = {
        'address_change': '📍',
        'shipping_method_change': '🚚',
        'delivery_date_change': '📅',
        'item_change': '📦',
        'delete': '🗑️',
        'other': '📝'
      };
      const typeEmoji = emojiMap[requestType] || '📝';

      message = `
${typeEmoji} <b>物流通知 - ${subject}</b>

<b>訂單編號:</b> ${orderNumber}
<b>請求類型:</b> ${requestType}
<b>時間:</b> ${new Date().toLocaleString('zh-TW')}

<b>詳情:</b>
${details || '無'}

<i>由 AI Agent 自動發送</i>
`.trim();

      console.log('[Telegram] 發送物流通知:', {
        orderNumber,
        requestType,
      });
    }

    const sent = await sendTelegramMessage(config.telegram!.botToken, chatId, message);

    return JSON.stringify({
      success: sent,
      message: sent
        ? `已通知${notifyType === 'customer_service' ? '客服部門' : '物流中心'}處理`
        : "發送通知失敗",
    });
  },
});

export const telegramTools = [
  sendNotificationTool,
];

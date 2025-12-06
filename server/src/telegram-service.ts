/**
 * Telegram Bot Service
 * Sends human support messages to Telegram
 */

import fetch from 'node-fetch';

export interface HumanSupportMessage {
  userId: string;
  category: string;
  recipient: string;
  message: string;
  timestamp: string;
  sessionId?: string;
}

export interface FileAttachment {
  name: string;
  size: number;
  data: string; // base64 encoded file data
}

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';

    if (!this.botToken || !this.chatId) {
      console.warn('[TelegramService] Bot token or chat ID not configured');
    }
  }

  /**
   * Send human support request to Telegram
   */
  async sendHumanSupportMessage(
    data: HumanSupportMessage,
    attachments?: FileAttachment[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken || !this.chatId) {
      return {
        success: false,
        error: 'Telegram bot not configured',
      };
    }

    try {
      const messageText = this.formatMessage(data);

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: messageText,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        console.error('[TelegramService] Failed to send message:', result);
        return {
          success: false,
          error: result.description || 'Failed to send message',
        };
      }

      console.log('[TelegramService] Message sent successfully');

      // Send attachments if any
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const fileResult = await this.sendFile(attachment);
          if (!fileResult.success) {
            console.error(`[TelegramService] Failed to send file ${attachment.name}:`, fileResult.error);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[TelegramService] Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send file to Telegram
   */
  private async sendFile(attachment: FileAttachment): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert base64 to Buffer
      const base64Data = attachment.data.split(',')[1] || attachment.data;
      const buffer = Buffer.from(base64Data, 'base64');

      // Create form data
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      formData.append('chat_id', this.chatId);
      formData.append('document', buffer, {
        filename: attachment.name,
        contentType: 'application/octet-stream',
      });
      formData.append('caption', `📎 ${attachment.name} (${(attachment.size / 1024).toFixed(1)}KB)`);

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendDocument`, {
        method: 'POST',
        body: formData as any,
        headers: formData.getHeaders(),
      });

      const result: any = await response.json();

      if (!response.ok || !result.ok) {
        console.error('[TelegramService] Failed to send file:', result);
        return {
          success: false,
          error: result.description || 'Failed to send file',
        };
      }

      console.log(`[TelegramService] File ${attachment.name} sent successfully`);
      return { success: true };
    } catch (error) {
      console.error('[TelegramService] Error sending file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format message for Telegram
   */
  private formatMessage(data: HumanSupportMessage): string {
    return `🆘 <b>客服請求</b>\n\n` +
      `👤 <b>用戶ID:</b> ${data.userId}\n` +
      `📁 <b>類別:</b> ${data.category}\n` +
      `👨‍💼 <b>收件人:</b> ${data.recipient}\n` +
      `🕐 <b>時間:</b> ${data.timestamp}\n` +
      (data.sessionId ? `🔗 <b>Session ID:</b> ${data.sessionId}\n` : '') +
      `\n📝 <b>訊息:</b>\n${data.message}`;
  }
}

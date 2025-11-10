/**
 * SettingsPanel - 後台 GUI 設定介面
 *
 * 提供視覺化界面來配置 Agent 功能，包括：
 * - Agent 工具開關
 * - 資料庫連線設定
 * - Telegram 通知設定
 * - 訂單系統配置
 * - 權限管理
 */

import type { ServiceModulerConfig } from '../types';
import type { ConfigManager } from '../agent/ConfigManager';

export interface SettingsPanelOptions {
  configManager: ConfigManager;
  onSave?: (config: ServiceModulerConfig) => void;
  onCancel?: () => void;
}

export class SettingsPanel {
  private container: HTMLDivElement;
  private overlay: HTMLDivElement;
  private configManager: ConfigManager;
  private onSaveCallback?: (config: ServiceModulerConfig) => void;
  private onCancelCallback?: () => void;

  constructor(options: SettingsPanelOptions) {
    this.configManager = options.configManager;
    this.onSaveCallback = options.onSave;
    this.onCancelCallback = options.onCancel;

    this.overlay = this.createOverlay();
    this.container = this.createContainer();
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 999999;
      align-items: center;
      justify-content: center;
    `;
    return overlay;
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 0;
    `;

    const config = this.configManager.getConfig();
    container.innerHTML = this.renderSettingsHTML(config);

    // 綁定事件
    this.bindEvents(container);

    return container;
  }

  private renderSettingsHTML(config: ServiceModulerConfig): string {
    const agentConfig = config.agent || {};
    const dbConfig = config.database || {};
    const tgConfig = config.telegram || { botToken: '', chatIds: {} };
    const uiConfig = config.ui || {};

    return `
      <div style="position: sticky; top: 0; background: white; border-bottom: 1px solid #e0e0e0; padding: 24px; z-index: 1;">
        <h2 style="margin: 0; font-size: 24px; color: #333;">Agent 設定</h2>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">配置 AI Agent 的功能和行為</p>
      </div>

      <div style="padding: 24px;">
        <!-- Agent 功能開關 -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 8px;">
            🤖 Agent 功能
          </h3>

          <div style="display: grid; gap: 16px;">
            ${this.renderToggle('enableDatabaseTools', '資料庫工具', agentConfig.enableDatabaseTools, '允許 Agent 查詢和操作資料庫')}
            ${this.renderToggle('enableTelegramNotify', 'Telegram 通知', agentConfig.enableTelegramNotify, '啟用 Telegram 通知到不同部門')}
            ${this.renderToggle('enableAIPageGeneration', 'AI Page 生成', agentConfig.enableAIPageGeneration, '允許 Agent 生成臨時 HTML 頁面')}
            ${this.renderToggle('enablePermissionCheck', '權限檢查', agentConfig.enablePermissionCheck !== false, '對危險操作進行權限驗證')}
          </div>
        </section>

        <!-- 資料庫設定 -->
        ${agentConfig.enableDatabaseTools ? `
        <section style="margin-bottom: 32px; background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">
            🗄️ 資料庫設定
          </h3>

          <div style="display: grid; gap: 12px;">
            ${this.renderInput('dbUrl', 'PostgreSQL 連線 URL', dbConfig.url || '', 'postgresql://user:password@host:port/database', 'url')}

            <div style="margin: 12px 0; text-align: center; color: #666; font-size: 14px;">或</div>

            ${this.renderInput('dbHost', '主機', dbConfig.host || '', 'localhost')}
            ${this.renderInput('dbPort', '端口', dbConfig.port?.toString() || '5432', '5432', 'number')}
            ${this.renderInput('dbDatabase', '資料庫名稱', dbConfig.database || '', 'mydb')}
            ${this.renderInput('dbUser', '使用者', dbConfig.user || '', 'postgres')}
            ${this.renderInput('dbPassword', '密碼', dbConfig.password || '', '', 'password')}
          </div>
        </section>
        ` : ''}

        <!-- Telegram 設定 -->
        ${agentConfig.enableTelegramNotify ? `
        <section style="margin-bottom: 32px; background: #e3f2fd; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">
            📱 Telegram 通知設定
          </h3>

          <div style="display: grid; gap: 12px;">
            ${this.renderInput('tgBotToken', 'Bot Token', tgConfig.botToken || '', '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz', 'password')}
            ${this.renderInput('tgChatIdDefault', '預設群組 Chat ID', tgConfig.chatIds?.default || tgConfig.chatId || '', '-1001234567890')}
            ${this.renderInput('tgChatIdCS', '客服部門 Chat ID', tgConfig.chatIds?.customerService || '', '-1001234567890')}
            ${this.renderInput('tgChatIdLogistics', '物流中心 Chat ID', tgConfig.chatIds?.logistics || '', '-1001234567890')}
          </div>

          <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 4px; font-size: 13px; color: #666;">
            💡 提示：使用 @getidsbot 或將 bot 加入群組後查看訊息取得 Chat ID
          </div>
        </section>
        ` : ''}

        <!-- 訂單系統配置 -->
        ${agentConfig.enableDatabaseTools ? `
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333; border-bottom: 2px solid #ff9800; padding-bottom: 8px;">
            📦 訂單系統配置
          </h3>

          <div style="display: grid; gap: 12px;">
            ${this.renderToggle('orderEnabled', '啟用訂單功能', agentConfig.orderConfig?.enabled, '啟用訂單查詢和修改功能')}
            ${agentConfig.orderConfig?.enabled !== false ? `
              ${this.renderInput('orderTableName', '訂單表格名稱', agentConfig.orderConfig?.tableName || 'orders', 'orders')}
              ${this.renderInput('orderStatusField', '狀態欄位', agentConfig.orderConfig?.statusField || 'status', 'status')}
              ${this.renderInput('orderNumberField', '訂單編號欄位', agentConfig.orderConfig?.orderNumberField || 'order_number', 'order_number')}
            ` : ''}
          </div>
        </section>
        ` : ''}

        <!-- UI 設定 -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333; border-bottom: 2px solid #9c27b0; padding-bottom: 8px;">
            🎨 UI 設定
          </h3>

          <div style="display: grid; gap: 12px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #555;">側邊欄位置</label>
              <select id="uiPosition" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="right" ${uiConfig.position === 'right' ? 'selected' : ''}>右側</option>
                <option value="left" ${uiConfig.position === 'left' ? 'selected' : ''}>左側</option>
              </select>
            </div>

            ${this.renderInput('uiWidth', '側邊欄寬度', uiConfig.width || '33.33%', '33.33%')}

            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #555;">語言</label>
              <select id="uiLanguage" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option value="zh-TW" ${uiConfig.language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                <option value="en" ${uiConfig.language === 'en' ? 'selected' : ''}>English</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 按鈕 -->
        <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <button id="cancelBtn" style="padding: 12px 24px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; color: #666;">
            取消
          </button>
          <button id="saveBtn" style="padding: 12px 24px; border: none; background: #2196F3; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
            儲存設定
          </button>
        </div>
      </div>
    `;
  }

  private renderToggle(id: string, label: string, checked?: boolean, description?: string): string {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border: 1px solid #e0e0e0; border-radius: 6px;">
        <div>
          <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${label}</div>
          ${description ? `<div style="font-size: 13px; color: #666;">${description}</div>` : ''}
        </div>
        <label style="position: relative; display: inline-block; width: 50px; height: 26px;">
          <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
          <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: ${checked ? '#2196F3' : '#ccc'}; border-radius: 26px; transition: 0.3s;"></span>
          <span style="position: absolute; content: ''; height: 20px; width: 20px; left: ${checked ? '27px' : '3px'}; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;"></span>
        </label>
      </div>
    `;
  }

  private renderInput(id: string, label: string, value: string, placeholder?: string, type: string = 'text'): string {
    return `
      <div>
        <label for="${id}" style="display: block; margin-bottom: 6px; font-weight: 600; color: #555;">${label}</label>
        <input
          type="${type}"
          id="${id}"
          value="${value}"
          placeholder="${placeholder || ''}"
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
        />
      </div>
    `;
  }

  private bindEvents(container: HTMLDivElement): void {
    // 儲存按鈕
    const saveBtn = container.querySelector('#saveBtn') as HTMLButtonElement;
    saveBtn?.addEventListener('click', () => this.handleSave());

    // 取消按鈕
    const cancelBtn = container.querySelector('#cancelBtn') as HTMLButtonElement;
    cancelBtn?.addEventListener('click', () => this.hide());

    // Toggle 開關樣式更新
    const toggles = container.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        const slider = input.nextElementSibling as HTMLElement;
        const knob = slider?.nextElementSibling as HTMLElement;
        if (slider && knob) {
          slider.style.background = input.checked ? '#2196F3' : '#ccc';
          knob.style.left = input.checked ? '27px' : '3px';
        }

        // 如果是功能開關，重新渲染相關設定區塊
        if (['enableDatabaseTools', 'enableTelegramNotify'].includes(input.id)) {
          this.refreshSettings();
        }
      });
    });
  }

  private handleSave(): void {
    const config = this.collectFormData();

    // 驗證配置
    const validation = this.validateFormData(config);
    if (!validation.valid) {
      alert('設定驗證失敗：\n' + validation.errors.join('\n'));
      return;
    }

    // 更新配置
    this.configManager.updateConfig(config);

    // 回調
    if (this.onSaveCallback) {
      this.onSaveCallback(this.configManager.getConfig());
    }

    alert('設定已儲存！');
    this.hide();
  }

  private collectFormData(): Partial<ServiceModulerConfig> {
    const getValue = (id: string): any => {
      const el = this.container.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
      if (!el) return undefined;
      if (el.type === 'checkbox') return (el as HTMLInputElement).checked;
      if (el.type === 'number') return el.value ? parseInt(el.value) : undefined;
      return el.value || undefined;
    };

    const config: Partial<ServiceModulerConfig> = {
      agent: {
        enableDatabaseTools: getValue('enableDatabaseTools'),
        enableTelegramNotify: getValue('enableTelegramNotify'),
        enableAIPageGeneration: getValue('enableAIPageGeneration'),
        enablePermissionCheck: getValue('enablePermissionCheck'),
        orderConfig: {
          enabled: getValue('orderEnabled'),
          tableName: getValue('orderTableName'),
          statusField: getValue('orderStatusField'),
          orderNumberField: getValue('orderNumberField'),
        },
      },
      ui: {
        position: getValue('uiPosition'),
        width: getValue('uiWidth'),
        language: getValue('uiLanguage'),
      },
    };

    // 資料庫設定
    const dbUrl = getValue('dbUrl');
    if (dbUrl) {
      config.database = { url: dbUrl };
    } else {
      config.database = {
        host: getValue('dbHost'),
        port: getValue('dbPort'),
        database: getValue('dbDatabase'),
        user: getValue('dbUser'),
        password: getValue('dbPassword'),
      };
    }

    // Telegram 設定
    const tgBotToken = getValue('tgBotToken');
    if (tgBotToken) {
      config.telegram = {
        botToken: tgBotToken,
        chatIds: {
          default: getValue('tgChatIdDefault'),
          customerService: getValue('tgChatIdCS'),
          logistics: getValue('tgChatIdLogistics'),
        },
      };
    }

    return config;
  }

  private validateFormData(config: Partial<ServiceModulerConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.agent?.enableDatabaseTools) {
      if (!config.database?.url && !config.database?.host) {
        errors.push('啟用資料庫工具時必須提供連線資訊');
      }
    }

    if (config.agent?.enableTelegramNotify) {
      if (!config.telegram?.botToken) {
        errors.push('啟用 Telegram 通知時必須提供 Bot Token');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private refreshSettings(): void {
    const config = this.collectFormData();
    this.configManager.updateConfig(config);
    this.container.innerHTML = this.renderSettingsHTML(this.configManager.getConfig());
    this.bindEvents(this.container);
  }

  show(): void {
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }

  destroy(): void {
    this.overlay.remove();
  }
}

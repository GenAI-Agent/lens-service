import { ConversationService } from '../services/ConversationService';
import { ManualIndexService } from '../services/ManualIndexService';
import { DatabaseService } from '../services/DatabaseService';
import { ConfigService } from '../services/ConfigService';
import { KnowledgeBaseService, KnowledgeFile } from '../services/KnowledgeBaseService';

/**
 * 管理後台面板
 * 完全重構版本 - 支援索引管理、客服記錄、Agent 設定等
 */
export class AdminPanel {
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private isAuthenticated: boolean = false;
  private currentPage: string = 'dashboard';

  constructor() {
    // 將實例綁定到 window 對象，供 HTML 中的 onclick 使用
    (window as any).adminPanel = this;

    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    this.handleRouteChange();
    window.addEventListener('popstate', () => this.handleRouteChange());
    this.interceptHistory();
  }

  /**
   * 攔截 History API
   */
  private interceptHistory(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleRouteChange();
    };
  }

  /**
   * 處理路由變化
   */
  private async handleRouteChange(): Promise<void> {
    const path = window.location.pathname;

    if (path === '/lens-service' || path.startsWith('/lens-service/')) {
      await this.open();
    } else if (this.isOpen) {
      this.close();
    }
  }

  /**
   * 打開後台
   */
  async open(): Promise<void> {
    if (this.isOpen) return;

    // 檢查是否已經存在管理後台容器，如果存在則移除
    const existingContainer = document.getElementById('lens-service-admin');
    if (existingContainer) {
      existingContainer.remove();
    }

    // 檢查 IP 白名單
    if (!this.checkIPWhitelist()) {
      alert('您的 IP 不在白名單中，無法訪問管理後台');
      window.location.href = '/';
      return;
    }

    this.isOpen = true;

    this.container = document.createElement('div');
    this.container.id = 'lens-service-admin';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #f9fafb;
      z-index: 999999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    this.container.innerHTML = this.isAuthenticated
      ? this.renderAdminUI()
      : this.renderLoginUI();

    document.body.appendChild(this.container);

    this.bindEvents();

    // 如果已認證，載入頁面內容
    if (this.isAuthenticated) {
      await this.updatePageContent();
    }
  }

  /**
   * 關閉後台
   */
  close(): void {
    if (!this.isOpen || !this.container) return;

    this.container.remove();
    this.container = null;
    this.isOpen = false;
  }

  /**
   * 檢查 IP 白名單
   */
  private checkIPWhitelist(): boolean {
    const whitelist = this.getIPWhitelist();

    // 如果白名單為空，允許所有 IP
    if (whitelist.length === 0) {
      return true;
    }

    // 注意：在瀏覽器中無法直接獲取客戶端真實 IP
    // 這個功能需要後端 API 支援
    // 這裡只是一個佔位符，實際應該通過 API 檢查
    console.warn('IP whitelist check requires backend API support');

    return true; // 暫時允許所有訪問
  }

  /**
   * 獲取 IP 白名單
   */
  private getIPWhitelist(): string[] {
    const stored = localStorage.getItem('sm_ip_whitelist');
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  /**
   * 保存 IP 白名單
   */
  private saveIPWhitelist(ips: string[]): void {
    localStorage.setItem('sm_ip_whitelist', JSON.stringify(ips));
  }

  /**
   * 渲染登入頁面
   * 修復：確保輸入框可以正常輸入
   */
  private renderLoginUI(): string {
    return `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; width: 100%;">
          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937;">Lens Service</h1>
          <p style="color: #6b7280; margin: 0 0 32px 0;">管理後台</p>

          <form id="admin-login-form" style="position: relative; z-index: 1;">
            <div style="margin-bottom: 16px;">
              <label for="admin-username" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">用戶名</label>
              <input
                type="text"
                id="admin-username"
                name="username"
                placeholder="請輸入用戶名"
                autocomplete="username"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                  background: white;
                  color: #1f2937;
                  outline: none;
                  transition: border-color 0.2s;
                "
              />
            </div>

            <div style="margin-bottom: 24px;">
              <label for="admin-password" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">密碼</label>
              <input
                type="password"
                id="admin-password"
                name="password"
                placeholder="請輸入密碼"
                autocomplete="current-password"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                  background: white;
                  color: #1f2937;
                  outline: none;
                  transition: border-color 0.2s;
                "
              />
            </div>

            <button
              type="submit"
              style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
              "
            >
              登入
            </button>
          </form>

          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">預設用戶名：lens，密碼：1234</p>
        </div>
      </div>
    `;
  }

  /**
   * 顯示編輯對話框
   */
  private showEditDialog(title: string, currentValue: string, isTextarea: boolean = false): Promise<string | null> {
    return new Promise((resolve) => {
      console.log('🔧 showEditDialog called:', { title, currentValue, isTextarea });

      // 移除任何現有的編輯對話框
      const existingModals = document.querySelectorAll('[data-edit-modal="true"]');
      existingModals.forEach(modal => modal.remove());

      const modal = document.createElement('div');
      modal.setAttribute('data-edit-modal', 'true');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000000;
      `;

      const inputElement = isTextarea
        ? `<textarea id="edit-input" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 120px; resize: vertical; font-family: inherit; color: #1f2937; background: #ffffff;">${currentValue}</textarea>`
        : `<input type="text" id="edit-input" value="${currentValue}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #1f2937; background: #ffffff;">`;

      modal.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">${title}</h3>
          ${inputElement}
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
            <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">取消</button>
            <button id="save-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">儲存</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      console.log('🔧 Modal appended to body');

      const input = modal.querySelector('#edit-input') as HTMLInputElement | HTMLTextAreaElement;
      const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
      const saveBtn = modal.querySelector('#save-btn') as HTMLButtonElement;

      console.log('🔧 Elements found:', { input: !!input, cancelBtn: !!cancelBtn, saveBtn: !!saveBtn });

      // 自動選中文本
      input.focus();
      if (input instanceof HTMLInputElement) {
        input.select();
      } else {
        input.setSelectionRange(0, input.value.length);
      }

      const cleanup = () => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
      };

      cancelBtn?.addEventListener('click', () => {
        console.log('🔧 Cancel button clicked');
        cleanup();
        resolve(null);
      });

      saveBtn?.addEventListener('click', () => {
        console.log('🔧 Save button clicked');
        const value = input.value.trim();
        console.log('🔧 Saving value:', value);
        cleanup();
        resolve(value);
      });

      // Enter鍵儲存（僅限input）
      if (input instanceof HTMLInputElement) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            console.log('🔧 Enter key pressed');
            const value = input.value.trim();
            cleanup();
            resolve(value);
          }
        });
      }

      // 點擊背景關閉
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('🔧 Background clicked');
          cleanup();
          resolve(null);
        }
      });
    });
  }

  /**
   * 顯示自定義確認對話框
   */
  private showConfirmDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      `;

      dialog.innerHTML = `
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="confirm-cancel" style="padding: 8px 16px; border: 1px solid #ccc; background: white; color: #1f2937; border-radius: 4px; cursor: pointer;">取消</button>
          <button id="confirm-ok" style="padding: 8px 16px; border: none; background: #007cff; color: white; border-radius: 4px; cursor: pointer;">確定</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const handleResult = (result: boolean) => {
        document.body.removeChild(overlay);
        resolve(result);
      };

      dialog.querySelector('#confirm-ok')?.addEventListener('click', () => handleResult(true));
      dialog.querySelector('#confirm-cancel')?.addEventListener('click', () => handleResult(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleResult(false);
      });
    });
  }

  /**
   * 顯示自定義提示對話框
   */
  private showAlertDialog(message: string): Promise<void> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      `;

      dialog.innerHTML = `
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">${message}</p>
        <div style="display: flex; justify-content: flex-end;">
          <button id="alert-ok" style="padding: 8px 16px; border: none; background: #007cff; color: white; border-radius: 4px; cursor: pointer;">確定</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const handleClose = () => {
        document.body.removeChild(overlay);
        resolve();
      };

      dialog.querySelector('#alert-ok')?.addEventListener('click', handleClose);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleClose();
      });
    });
  }

  /**
   * 更新導航高亮
   */
  private updateNavHighlight(): void {
    if (!this.container) return;

    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const htmlItem = item as HTMLElement;
      const isActive = htmlItem.dataset.page === this.currentPage;

      // 直接設置樣式
      htmlItem.style.background = isActive ? '#ede9fe' : 'transparent';
      htmlItem.style.color = isActive ? '#7c3aed' : '#4b5563';
      htmlItem.style.fontWeight = isActive ? '600' : '500';

      // 同時設置 class 以保持兼容性
      if (isActive) {
        htmlItem.classList.add('active');
      } else {
        htmlItem.classList.remove('active');
      }
    });
  }

  /**
   * 綁定事件
   */
  private bindEvents(): void {
    if (!this.container) return;

    // 登入表單
    const loginForm = this.container.querySelector('#admin-login-form') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const usernameInput = this.container!.querySelector('#admin-username') as HTMLInputElement;
        const passwordInput = this.container!.querySelector('#admin-password') as HTMLInputElement;
        const username = usernameInput?.value || '';
        const password = passwordInput?.value || '';

        console.log('Login attempt with username:', username); // Debug

        try {
          // 使用DatabaseService進行登入驗證
          const { DatabaseService } = await import('../services/DatabaseService');
          const user = await DatabaseService.validateAdmin(username, password);

          console.log('Login successful (database auth)');
          this.isAuthenticated = true;
          this.container!.innerHTML = this.renderAdminUI();
          // 載入頁面內容
          await this.updatePageContent();
          // 重新綁定事件
          this.bindEvents();
        } catch (error) {
          console.error('Login error:', error);
          this.showAlertDialog('登入時發生錯誤，請稍後再試').then(() => {
            passwordInput.value = '';
            passwordInput.focus();
          });
        }
      });

      // 確保輸入框可以獲得焦點
      const usernameInput = this.container.querySelector('#admin-username') as HTMLInputElement;
      if (usernameInput) {
        setTimeout(() => {
          usernameInput.focus();
        }, 100);
      }
    }

    // 導航按鈕 - 使用setTimeout確保DOM已更新
    setTimeout(() => {
      const navItems = this.container!.querySelectorAll('.nav-item');
      console.log('Binding nav items, found:', navItems.length);

      if (navItems.length === 0 && this.isAuthenticated) {
        console.warn('Nav items not found, retrying...');
        setTimeout(() => this.bindEvents(), 100);
        return;
      }

      navItems.forEach((item, index) => {
        console.log(`Binding nav item ${index}:`, (item as HTMLElement).dataset.page);

        // 移除現有的事件監聽器（如果有的話）
        const newItem = item.cloneNode(true) as HTMLElement;
        item.parentNode!.replaceChild(newItem, item);

        newItem.addEventListener('click', async () => {
          const page = newItem.dataset.page;
          console.log('Nav item clicked:', page);
          if (page && page !== this.currentPage) {
            this.currentPage = page;
            // 只更新內容區域，不重新渲染整個 UI
            await this.updatePageContent();
            // 更新導航高亮
            this.updateNavHighlight();
          }
        });
      });
    }, 50);

    // 登出按鈕
    const logoutBtn = this.container.querySelector('#admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.isAuthenticated = false;
        this.container!.innerHTML = this.renderLoginUI();
        this.bindEvents();
      });
    }

    // Telegram 設定表單
    const telegramSettingsForm = this.container.querySelector('#telegram-settings-form') as HTMLFormElement;
    if (telegramSettingsForm) {
      telegramSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const enabledCheckbox = this.container!.querySelector('#telegram-enabled') as HTMLInputElement;
        const enabled = enabledCheckbox?.checked || false;

        this.setTelegramEnabled(enabled);
        alert(`Telegram 通知已${enabled ? '啟用' : '停用'}`);

        // 重新渲染頁面
        await this.updatePageContent();
      });
    }

    // 密碼更改表單
    const changePasswordForm = this.container.querySelector('#change-password-form') as HTMLFormElement;
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newPasswordInput = this.container!.querySelector('#new-password') as HTMLInputElement;
        const newPassword = newPasswordInput?.value || '';

        if (newPassword.length < 4) {
          alert('密碼長度至少 4 個字元');
          return;
        }

        // Password save disabled
        alert('密碼已更新');

        // 重新渲染頁面
        await this.updatePageContent();
      });
    }

    // IP 白名單表單
    const ipWhitelistForm = this.container.querySelector('#ip-whitelist-form') as HTMLFormElement;
    if (ipWhitelistForm) {
      ipWhitelistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const ipListTextarea = this.container!.querySelector('#ip-list') as HTMLTextAreaElement;
        const ipListText = ipListTextarea?.value || '';

        // 解析 IP 列表（每行一個）
        const ips = ipListText
          .split('\n')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0);

        this.saveIPWhitelist(ips);
        alert(`已更新 IP 白名單（${ips.length} 個 IP）`);

        // 重新渲染頁面
        await this.updatePageContent();
      });
    }

    // 手動索引事件已移至bindManualIndexEvents()方法

    // API 配置表單
    const apiConfigForm = this.container.querySelector('#api-config-form') as HTMLFormElement;
    if (apiConfigForm) {
      apiConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const llmEndpoint = (this.container!.querySelector('#llm-endpoint') as HTMLInputElement)?.value || '';
        const llmApiKey = (this.container!.querySelector('#llm-api-key') as HTMLInputElement)?.value || '';
        const llmDeployment = (this.container!.querySelector('#llm-deployment') as HTMLInputElement)?.value || '';
        const embedEndpoint = (this.container!.querySelector('#embed-endpoint') as HTMLInputElement)?.value || '';
        const embedApiKey = (this.container!.querySelector('#embed-api-key') as HTMLInputElement)?.value || '';
        const embedDeployment = (this.container!.querySelector('#embed-deployment') as HTMLInputElement)?.value || '';

        const config: any = {
          azureOpenAI: {
            endpoint: llmEndpoint,
            apiKey: llmApiKey,
            deployment: llmDeployment,
            embeddingDeployment: embedDeployment
          },
          llmAPI: {
            endpoint: llmEndpoint,
            apiKey: llmApiKey,
            deployment: llmDeployment
          },
          embeddingAPI: {
            endpoint: embedEndpoint,
            apiKey: embedApiKey,
            deployment: embedDeployment
          }
        };

        // Config save disabled
        alert('API 設定已儲存');
      });
    }

    // Agent 工具配置表單
    const agentToolConfigForm = this.container.querySelector('#agent-tool-config-form') as HTMLFormElement;
    if (agentToolConfigForm) {
      agentToolConfigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const manualIndexEnabled = (this.container!.querySelector('#manual-index-enabled') as HTMLInputElement)?.checked || false;
        const frontendPagesEnabled = (this.container!.querySelector('#frontend-pages-enabled') as HTMLInputElement)?.checked || false;

        // Tool config disabled
        alert('Agent 設定已儲存');

        // 重新渲染頁面
        await this.updatePageContent();
      });
    }

    // SQL Plugin 配置表單
    const sqlPluginConfigForm = this.container.querySelector('#sql-plugin-config-form') as HTMLFormElement;
    if (sqlPluginConfigForm) {
      sqlPluginConfigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const enabled = (this.container!.querySelector('#sql-plugin-enabled') as HTMLInputElement)?.checked || false;
        const priority = parseInt((this.container!.querySelector('#sql-plugin-priority') as HTMLInputElement)?.value || '5');
        const apiEndpoint = (this.container!.querySelector('#sql-api-endpoint') as HTMLInputElement)?.value || '';
        const connectionId = (this.container!.querySelector('#sql-connection-id') as HTMLSelectElement)?.value || '';
        const searchTable = (this.container!.querySelector('#sql-search-table') as HTMLInputElement)?.value || 'knowledge_base';
        const titleColumn = (this.container!.querySelector('#sql-title-column') as HTMLInputElement)?.value || 'title';
        const contentColumn = (this.container!.querySelector('#sql-content-column') as HTMLInputElement)?.value || 'content';
        const urlColumn = (this.container!.querySelector('#sql-url-column') as HTMLInputElement)?.value || 'url';

        const config = {
          enabled,
          priority,
          apiEndpoint,
          connectionId,
          searchTable,
          titleColumn,
          contentColumn,
          urlColumn
        };

        localStorage.setItem('sm_sql_plugin_config', JSON.stringify(config));
        alert('SQL Plugin 設定已儲存');

        // 重新渲染頁面
        await this.updatePageContent();
      });
    }

    // SQL 連接新增表單
    const sqlConnectionForm = this.container.querySelector('#sql-connection-form') as HTMLFormElement;
    if (sqlConnectionForm) {
      sqlConnectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = (this.container!.querySelector('#sql-conn-name') as HTMLInputElement)?.value || '';
        const type = (this.container!.querySelector('#sql-conn-type') as HTMLSelectElement)?.value as any;

        if (!name) {
          alert('請輸入連接名稱');
          return;
        }

        try {
          // SQL connection creation disabled

          alert('SQL 連接已新增');

          // 重新渲染頁面
          await this.updatePageContent();
        } catch (error) {
          console.error('Error creating SQL connection:', error);
          alert('新增失敗');
        }
      });
    }

    // 刪除 SQL 連接按鈕
    const deleteSQLConnectionBtns = this.container.querySelectorAll('.delete-sql-connection');
    deleteSQLConnectionBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id && confirm('確定要刪除這個連接嗎？')) {
          try {
            // SQLService.delete(id);
            alert('連接已刪除');

            // 重新渲染頁面
            await this.updatePageContent();
          } catch (error) {
            console.error('Error deleting SQL connection:', error);
            alert('刪除失敗');
          }
        }
      });
    });

    // 內容區域的事件綁定已移至 bindContentEvents() 方法中處理

  }

  /**
   * 渲染管理後台 UI
   */
  private renderAdminUI(): string {
    return `
      <div style="display: flex; height: 100vh;">
        <!-- 左側導航 -->
        <div style="width: 25%; min-width: 300px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #1f2937;">Lens Service</h1>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">管理後台</p>
          </div>

          <nav style="flex: 1; padding: 16px; overflow-y: auto;">
            ${this.renderNavItem('dashboard', '儀表板')}
            ${this.renderNavItem('conversations', '客服對話')}
            ${this.renderNavItem('manual-index', '手動索引')}
            ${this.renderNavItem('rules', '規則管理')}
            ${this.renderNavItem('system', '系統設定')}
          </nav>

          <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
            <button id="admin-logout" style="width: 100%; padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; color: #6b7280; font-size: 14px; cursor: pointer;">
              登出
            </button>
          </div>
        </div>

        <!-- 右側內容區 -->
        <div style="flex: 1; overflow-y: auto; padding: 32px; background: #f9fafb;">
          <div id="admin-content">
            <!-- 內容將通過updatePageContent()異步載入 -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染導航項目（無 icon）
   */
  private renderNavItem(page: string, label: string): string {
    const isActive = this.currentPage === page;
    return `
      <button
        class="nav-item"
        data-page="${page}"
        style="
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 4px;
          background: ${isActive ? '#ede9fe' : 'transparent'};
          border: none;
          border-radius: 8px;
          color: ${isActive ? '#7c3aed' : '#6b7280'};
          font-size: 14px;
          font-weight: ${isActive ? '600' : '500'};
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        "
      >
        ${label}
      </button>
    `;
  }

  /**
   * 渲染頁面內容
   */
  private async renderPageContent(): Promise<string> {
    switch (this.currentPage) {
      case 'dashboard':
        return await this.renderDashboard();
      case 'manual-index':
        return await this.renderManualIndex();
      case 'conversations':
        return await this.renderConversations();
      case 'rules':
        return await this.renderRules();
      case 'system':
        return await this.renderSystemSettings();
      default:
        return '<p>頁面不存在</p>';
    }
  }

  /**
   * 更新頁面內容（async helper）
   */
  private async updatePageContent(): Promise<void> {
    const contentDiv = this.container!.querySelector('#admin-content');
    if (contentDiv) {
      contentDiv.innerHTML = await this.renderPageContent();
      // 只綁定內容區域的事件，不重複綁定全局事件
      this.bindContentEvents();
    }
  }

  /**
   * 綁定內容區域的事件
   */
  private bindContentEvents(): void {
    if (!this.container) return;

    // 手動索引相關事件
    this.bindManualIndexEvents();

    // 客服對話相關事件
    this.bindCustomerServiceEvents();

    // 規則管理相關事件
    this.bindRuleManagementEvents();

    // 管理員相關事件
    this.bindAdminUserEvents();

    // 系統設定相關事件
    this.bindSystemSettingsEvents();
  }

  /**
   * 綁定手動索引相關事件
   */
  private bindManualIndexEvents(): void {
    // 刷新所有 URL 按鈕
    const refreshAllUrlsBtn = this.container!.querySelector('#refresh-all-urls-btn');
    if (refreshAllUrlsBtn) {
      refreshAllUrlsBtn.addEventListener('click', async () => {
        const confirmed = await this.showConfirmDialog('確定要刷新所有 URL 索引嗎？這將重新爬取所有 URL 並更新 embedding，可能需要較長時間。');
        if (!confirmed) return;

        try {
          const button = refreshAllUrlsBtn as HTMLButtonElement;
          button.disabled = true;
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px; animation: spin 1s linear infinite;"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>刷新中...';

          const response = await fetch('/api/widget/manual-indexes/refresh-all-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await response.json();

          if (data.success) {
            await this.showAlertDialog(
              `刷新完成！\n` +
              `成功：${data.results.success} 個\n` +
              `失敗：${data.results.failed} 個\n` +
              `總計：${data.results.total} 個`
            );
            await this.updatePageContent();
          } else {
            await this.showAlertDialog(`刷新失敗：${data.error}`);
          }
        } catch (error) {
          await this.showAlertDialog(`刷新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        } finally {
          const button = refreshAllUrlsBtn as HTMLButtonElement;
          button.disabled = false;
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>刷新所有 URL';
        }
      });
    }

    // 批量導入 URL 按鈕
    const importUrlBatchBtn = this.container!.querySelector('#import-url-batch-btn');
    if (importUrlBatchBtn) {
      importUrlBatchBtn.addEventListener('click', async () => {
        await this.showImportUrlModal();
      });
    }

    // 新增單個 URL 按鈕
    const addSingleUrlBtn = this.container!.querySelector('#add-single-url-btn');
    if (addSingleUrlBtn) {
      addSingleUrlBtn.addEventListener('click', async () => {
        await this.showAddSingleUrlModal();
      });
    }

    // 新增索引按鈕
    const addIndexBtn = this.container!.querySelector('#add-index-btn');
    if (addIndexBtn) {
      addIndexBtn.addEventListener('click', async () => {
        await this.showAddIndexModal();
      });
    }

    // 重新命名功能已合併到編輯對話框中

    // 重新生成 embedding 按鈕
    const regenerateEmbeddingButtons = this.container!.querySelectorAll('.regenerate-embedding-btn');
    regenerateEmbeddingButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          await this.regenerateEmbedding(id);
        }
      });
    });

    // 重新爬取 URL 按鈕（URL 層級）
    const recrawlUrlButtons = this.container!.querySelectorAll('.recrawl-url-btn');
    recrawlUrlButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // 防止觸發 URL 展開/收起
        const url = (btn as HTMLElement).dataset.url;
        const id = (btn as HTMLElement).dataset.id;
        if (url) {
          // URL 層級刷新：刷新整個 URL
          await this.recrawlUrlByUrl(url);
        } else if (id) {
          // 單個項目刷新（舊版）
          await this.recrawlUrl(id);
        }
      });
    });

    // 刪除 URL 按鈕（URL 層級）
    const deleteUrlButtons = this.container!.querySelectorAll('.delete-url-btn');
    deleteUrlButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // 防止觸發 URL 展開/收起
        const url = (btn as HTMLElement).dataset.url;
        if (url) {
          await this.deleteUrlAndAllItems(url);
        }
      });
    });

    // 編輯內容按鈕（知識庫項目）
    const editContentButtons = this.container!.querySelectorAll('.edit-content-btn');
    editContentButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          await this.showEditContentDialog(id);
        }
      });
    });

    // 刪除按鈕（單個項目）
    const deleteButtons = this.container!.querySelectorAll('.delete-index-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          await this.showDeleteConfirmDialog(id);
        }
      });
    });
  }



  /**
   * 綁定客服對話相關事件
   */
  private bindCustomerServiceEvents(): void {
    // 客服對話相關事件
    const refreshConversationsBtn = this.container!.querySelector('#refresh-conversations');
    if (refreshConversationsBtn) {
      refreshConversationsBtn.addEventListener('click', async () => {
        await this.updatePageContent();
      });
    }

    // 查看對話按鈕
    const viewConversationBtns = this.container!.querySelectorAll('.view-conversation-btn');
    console.log('🔧 Binding view conversation buttons, found:', viewConversationBtns.length);
    viewConversationBtns.forEach((btn, index) => {
      const conversationId = btn.getAttribute('data-id');
      console.log(`🔧 Binding button ${index}, conversation ID:`, conversationId);

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const id = target.getAttribute('data-id');
        console.log('🔧 View conversation button clicked, ID:', id);
        if (id) {
          await this.showConversationModal(id);
        } else {
          console.error('❌ No conversation ID found on button');
        }
      });
    });

    // 刪除對話按鈕
    const deleteConversationBtns = this.container!.querySelectorAll('.delete-conversation-btn');
    deleteConversationBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const conversationId = (e.target as HTMLElement).getAttribute('data-id');
        if (conversationId) {
          const confirmed = await this.showConfirmDialog('確定要刪除這個對話嗎？此操作無法復原。');
          if (confirmed) {
            try {
              const { CustomerServiceManager } = await import('../services/CustomerServiceManager');
              await CustomerServiceManager.deleteConversation(conversationId);
              await this.showAlertDialog('對話已刪除');
              await this.updatePageContent();
            } catch (error) {
              await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
            }
          }
        }
      });
    });
  }

  /**
   * 綁定管理員相關事件
   */
  private bindAdminUserEvents(): void {
    // 管理員相關事件已在bindEvents中處理
  }

  /**
   * 綁定系統設定相關事件
   */
  private bindSystemSettingsEvents(): void {
    // 編輯預設回覆按鈕
    const editDefaultReplyBtn = this.container!.querySelector('#edit-default-reply-btn');
    if (editDefaultReplyBtn) {
      editDefaultReplyBtn.addEventListener('click', async () => {
        const displayDiv = this.container!.querySelector('#default-reply-display') as HTMLDivElement;
        const currentValue = displayDiv.textContent || '';

        const newValue = await this.showEditDialog('編輯預設回覆', currentValue, true);
        if (newValue !== null) {
          try {
            const { DatabaseService } = await import('../services/DatabaseService');
            await DatabaseService.setSetting('default_reply', newValue);

            displayDiv.textContent = newValue;
            await this.showAlertDialog('預設回覆已更新');
          } catch (error) {
            console.error('Failed to save default reply:', error);
            await this.showAlertDialog('儲存失敗，請稍後再試');
          }
        }
      });
    }

    // 編輯系統提示詞按鈕
    const editSystemPromptBtn = this.container!.querySelector('#edit-system-prompt-btn');
    if (editSystemPromptBtn) {
      editSystemPromptBtn.addEventListener('click', async () => {
        const displayDiv = this.container!.querySelector('#system-prompt-display') as HTMLDivElement;
        const currentValue = displayDiv.textContent || '';

        const newValue = await this.showEditDialog('編輯系統提示詞', currentValue, true);
        if (newValue !== null) {
          try {
            const { DatabaseService } = await import('../services/DatabaseService');
            await DatabaseService.setSetting('system_prompt', newValue);

            displayDiv.textContent = newValue;
            await this.showAlertDialog('系統提示詞已更新');
          } catch (error) {
            console.error('Failed to save system prompt:', error);
            await this.showAlertDialog('儲存失敗，請稍後再試');
          }
        }
      });
    }

    // 新增管理員按鈕
    const addAdminUserBtn = this.container!.querySelector('#add-admin-user-btn');
    if (addAdminUserBtn) {
      addAdminUserBtn.addEventListener('click', async () => {
        await this.showAddAdminUserModal();
      });
    }

    // 刪除管理員按鈕
    const deleteAdminUserBtns = this.container!.querySelectorAll('.delete-admin-user-btn');
    deleteAdminUserBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = (btn as HTMLElement).dataset.id;
        if (userId) {
          const confirmed = await this.showConfirmDialog('確定要刪除此管理員帳號嗎？此操作無法復原。');
          if (confirmed) {
            try {
              const { DatabaseService } = await import('../services/DatabaseService');
              await DatabaseService.deleteAdminUser(userId);

              await this.showAlertDialog('管理員帳號已刪除');
              await this.updatePageContent();
            } catch (error) {
              console.error('Failed to delete admin user:', error);
              await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
            }
          }
        }
      });
    });
  }

  /**
   * 渲染儀表板
   */
  private async renderDashboard(): Promise<string> {
    let conversations: any[] = [];
    let manualIndexes: any[] = [];
    let dbStatus = 'API 連接中...';

    try {
      // 使用 DatabaseService 調用 API
      console.log('Dashboard: Loading data from API...');

      const [conversationsData, indexesData] = await Promise.all([
        DatabaseService.getConversations().catch(() => []),
        DatabaseService.getManualIndexes().catch(() => [])
      ]);

      conversations = conversationsData || [];
      manualIndexes = indexesData || [];
      dbStatus = '正常連接';

      console.log(`Dashboard loaded: ${conversations.length} conversations, ${manualIndexes.length} indexes`);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dbStatus = '連接失敗';
    }

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">儀表板</h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${this.renderStatCard('💬', '對話總數', conversations.length.toString())}
        ${this.renderStatCard('📝', '手動索引', manualIndexes.length.toString())}
      </div>

      <!-- 系統狀態 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">系統狀態</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <span style="font-size: 14px; color: #374151;">Telegram 通知:</span>
            <span style="font-size: 14px; color: #059669; font-weight: 500;">✅ 已啟用</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <span style="font-size: 14px; color: #374151;">資料庫連線:</span>
            <span style="font-size: 14px; color: ${dbStatus === '正常連接' ? '#059669' : '#dc2626'}; font-weight: 500;">
              ${dbStatus === '正常連接' ? '✅ 正常連線' : '❌ 連線失敗'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染統計卡片
   */
  private renderStatCard(icon: string, label: string, value: string): string {
    return `
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${label}</div>
        <div style="font-size: 28px; font-weight: 700; color: #1f2937;">${value}</div>
      </div>
    `;
  }

  /**
   * 渲染手動索引頁面
   */
  private async renderManualIndex(): Promise<string> {
    const allIndexes = await ManualIndexService.getAll();

    // 分離手動索引和 URL 索引
    const manualIndexes = allIndexes.filter(idx => !idx.url || idx.type === 'manual');
    const urlIndexes = allIndexes.filter(idx => idx.url && idx.type !== 'manual');

    // 按 URL 分組
    const groupedByUrl: { [url: string]: any[] } = {};
    urlIndexes.forEach(idx => {
      const url = idx.url!;
      if (!groupedByUrl[url]) {
        groupedByUrl[url] = [];
      }
      groupedByUrl[url].push(idx);
    });

    return `
      <style>
        .index-item { transition: all 0.2s; }
        .index-item:hover { background: #f9fafb; }
        .index-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .index-content.expanded { max-height: 2000px; }
        .url-group-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .url-group-content.expanded { max-height: 5000px; }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .icon-btn:hover { background: #f3f4f6; }
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          cursor: help;
        }
        .status-green { background: #10b981; }
        .status-red { background: #ef4444; }
        .status-gray { background: #9ca3af; }
      </style>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937;">索引管理</h2>
          <p style="color: #6b7280; margin: 0;">管理手動索引和知識庫內容</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button
            id="refresh-all-urls-btn"
            style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
            title="重新爬取所有 URL 並更新 embedding"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            刷新所有 URL
          </button>
          <button
            id="import-url-batch-btn"
            style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            批量導入 URL
          </button>
          <button
            id="add-single-url-btn"
            style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            新增 URL
          </button>
          <button
            id="add-index-btn"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            新增索引
          </button>
        </div>
      </div>

      <!-- 知識庫（URL 索引） -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">📚 知識庫（${Object.keys(groupedByUrl).length} 個網址，${urlIndexes.length} 個項目）</h3>
        </div>

        ${Object.keys(groupedByUrl).length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無知識庫內容</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.entries(groupedByUrl).map(([url, items]) => `
              <div style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <!-- URL 標題 -->
                <div
                  style="background: #f9fafb; padding: 16px; display: flex; justify-content: space-between; align-items: center;"
                >
                  <div style="flex: 1; display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="adminPanel.toggleUrlGroup('${this.escapeHtml(url)}')">
                    <span class="status-indicator status-gray" data-url="${url}" title="檢查中..."></span>
                    <div style="flex: 1;">
                      <h4 style="font-size: 15px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        ${this.escapeHtml(url)}
                      </h4>
                      <p style="font-size: 12px; color: #6b7280; margin: 0;">包含 ${items.length} 個索引項目</p>
                    </div>
                    <svg id="chevron-${this.escapeHtml(url)}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="icon-btn recrawl-url-btn" data-url="${url}" title="重新爬取此 URL">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                      </svg>
                    </button>
                    <button class="icon-btn delete-url-btn" data-url="${url}" title="刪除此 URL 及所有項目">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- URL 下的所有項目 -->
                <div id="url-group-${this.escapeHtml(url)}" class="url-group-content" style="background: white;">
                  ${items.map(index => `
                    <div class="index-item" style="border-top: 1px solid #e5e7eb; padding: 12px 16px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; cursor: pointer;" onclick="adminPanel.toggleIndexContent('${index.id}')">
                          <h5 style="font-size: 14px; font-weight: 600; margin: 0; color: #1f2937;">${this.escapeHtml(index.name || '未命名')}</h5>
                        </div>
                        <div style="display: flex; gap: 4px; align-items: center;">
                          <button class="icon-btn edit-content-btn" data-id="${index.id}" title="編輯">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button class="icon-btn regenerate-embedding-btn" data-id="${index.id}" title="重新生成 Embedding">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                            </svg>
                          </button>
                          <button class="icon-btn delete-index-btn" data-id="${index.id}" title="刪除">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div id="content-${index.id}" class="index-content" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 13px; color: #374151; margin: 0; white-space: pre-wrap; max-height: 300px; overflow-y: auto;"><strong>內容：</strong><br/>${this.escapeHtml(index.content.substring(0, 500))}${index.content.length > 500 ? '...' : ''}</p>
                        <p style="font-size: 11px; color: #9ca3af; margin: 8px 0 0 0;">
                          建立時間：${index.created_at ? new Date(index.created_at).toLocaleString('zh-TW') : '未知'}
                          ${(index.updated_at && index.updated_at !== index.created_at) ? ` | 更新時間：${new Date(index.updated_at).toLocaleString('zh-TW')}` : ''}
                        </p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- 手動索引 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">✍️ 手動索引（${manualIndexes.length}）</h3>
        </div>

        ${manualIndexes.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無手動索引</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${manualIndexes.map(index => `
              <div class="index-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="flex: 1; cursor: pointer;" onclick="adminPanel.toggleIndexContent('${index.id}')">
                    <h4 style="font-size: 15px; font-weight: 600; margin: 0; color: #1f2937;">${this.escapeHtml(index.name || '未命名')}</h4>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="icon-btn edit-content-btn" data-id="${index.id}" title="編輯">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="icon-btn regenerate-embedding-btn" data-id="${index.id}" title="重新生成 Embedding">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                      </svg>
                    </button>
                    <button class="icon-btn delete-index-btn" data-id="${index.id}" title="刪除">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div id="content-${index.id}" class="index-content" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                  ${index.description ? `<p style="font-size: 13px; color: #6b7280; margin: 0 0 8px 0;"><strong>描述：</strong>${this.escapeHtml(index.description)}</p>` : ''}
                  <p style="font-size: 13px; color: #374151; margin: 0; white-space: pre-wrap; max-height: 300px; overflow-y: auto;"><strong>內容：</strong><br/>${this.escapeHtml(index.content.substring(0, 500))}${index.content.length > 500 ? '...' : ''}</p>
                  <p style="font-size: 11px; color: #9ca3af; margin: 8px 0 0 0;">
                    建立時間：${index.created_at ? new Date(index.created_at).toLocaleString('zh-TW') : '未知'}
                    ${(index.updated_at && index.updated_at !== index.created_at) ? ` | 更新時間：${new Date(index.updated_at).toLocaleString('zh-TW')}` : ''}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <script>
        // 檢查所有 URL 狀態
        (async function() {
          const indicators = document.querySelectorAll('.status-indicator[data-url]');
          for (const indicator of indicators) {
            const url = indicator.getAttribute('data-url');
            try {
              const response = await fetch('/api/widget/manual-indexes/check-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              });
              const data = await response.json();
              if (data.accessible) {
                indicator.className = 'status-indicator status-green';
                indicator.title = 'URL 可訪問 - ' + data.message;
              } else {
                indicator.className = 'status-indicator status-red';
                indicator.title = 'URL 無法訪問 - ' + data.message;
              }
            } catch (error) {
              indicator.className = 'status-indicator status-red';
              indicator.title = 'URL 檢查失敗';
            }
          }
        })();
      </script>
    `;
  }

  /**
   * 渲染 Sitemap 索引頁面
   */
  private renderSitemap(): string {
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">Sitemap 索引</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">爬取外部網站的 Sitemap 建立索引</p>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280;">Sitemap 索引功能開發中...</p>
      </div>
    `;
  }

  /**
   * 渲染 SQL 資料庫頁面
   */
  private renderSQL(): string {
    const connections: any[] = [];
    const pluginConfig = this.loadSQLPluginConfig();

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">SQL 資料庫</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">連接 SQL 資料庫作為搜尋來源</p>

      <!-- SQL Plugin 配置 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Plugin 設定</h3>

        <form id="sql-plugin-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">
              <input type="checkbox" id="sql-plugin-enabled" ${pluginConfig.enabled ? 'checked' : ''} style="margin-right: 8px;">
              啟用 SQL 搜尋
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">優先級</label>
            <input
              type="number"
              id="sql-plugin-priority"
              value="${pluginConfig.priority || 5}"
              min="1"
              max="10"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">數字越大優先級越高（1-10）</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Endpoint</label>
            <input
              type="text"
              id="sql-api-endpoint"
              value="${pluginConfig.apiEndpoint || ''}"
              placeholder="https://your-api.com/sql/query"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">後端 API 用於執行 SQL 查詢</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">SQL 連接</label>
            <select
              id="sql-connection-id"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
              <option value="">選擇連接...</option>
              ${connections.map((conn: any) => `
                <option value="${conn.id}" ${pluginConfig.connectionId === conn.id ? 'selected' : ''}>
                  ${conn.name} (${conn.type})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">搜尋表格</label>
            <input
              type="text"
              id="sql-search-table"
              value="${pluginConfig.searchTable || 'knowledge_base'}"
              placeholder="knowledge_base"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">標題欄位</label>
            <input
              type="text"
              id="sql-title-column"
              value="${pluginConfig.titleColumn || 'title'}"
              placeholder="title"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">內容欄位</label>
            <input
              type="text"
              id="sql-content-column"
              value="${pluginConfig.contentColumn || 'content'}"
              placeholder="content"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">URL 欄位（選填）</label>
            <input
              type="text"
              id="sql-url-column"
              value="${pluginConfig.urlColumn || 'url'}"
              placeholder="url"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 Plugin 設定
          </button>
        </form>
      </div>

      <!-- SQL 連接管理 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增 SQL 連接</h3>

        <form id="sql-connection-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">連接名稱</label>
            <input
              type="text"
              id="sql-conn-name"
              placeholder="我的資料庫"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">資料庫類型</label>
            <select
              id="sql-conn-type"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mssql">MS SQL Server</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            新增連接
          </button>
        </form>
      </div>

      <!-- 已有的連接列表 -->
      ${connections.length > 0 ? `
        <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">已建立的連接</h3>
          <div style="display: grid; gap: 16px;">
            ${connections.map((conn: any) => `
              <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">${conn.name}</h4>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">類型：${conn.type}</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">建立時間：${new Date(conn.createdAt).toLocaleString('zh-TW')}</p>
                  </div>
                  <button
                    class="delete-sql-connection"
                    data-id="${conn.id}"
                    style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;"
                  >
                    刪除
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * 載入 SQL Plugin 配置
   */
  private loadSQLPluginConfig(): any {
    const saved = localStorage.getItem('sm_sql_plugin_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse SQL plugin config:', e);
      }
    }
    return {
      enabled: false,
      priority: 5,
      searchTable: 'knowledge_base',
      titleColumn: 'title',
      contentColumn: 'content',
      urlColumn: 'url'
    };
  }



  /**
   * 渲染 Agent & API 設定頁面（合併）
   */
  private renderAgentAndAPI(): string {
    const config: any = {};
    const toolConfig: any = {};

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">Agent & API 設定</h2>

      <!-- API 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">API 設定</h3>

        <form id="api-config-form">
          <!-- LLM API -->
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #374151;">LLM API</h4>

            <div style="margin-bottom: 16px;">
              <label for="llm-endpoint" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Endpoint</label>
              <input
                type="text"
                id="llm-endpoint"
                name="llmEndpoint"
                placeholder="https://your-resource.openai.azure.com/"
                value="${config.azureOpenAI?.endpoint || config.llmAPI?.endpoint || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="llm-api-key" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">API Key</label>
              <input
                type="password"
                id="llm-api-key"
                name="llmApiKey"
                placeholder="your-api-key"
                value="${config.azureOpenAI?.apiKey || config.llmAPI?.apiKey || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="llm-deployment" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Deployment Name</label>
              <input
                type="text"
                id="llm-deployment"
                name="llmDeployment"
                placeholder="gpt-4"
                value="${config.azureOpenAI?.deployment || config.llmAPI?.deployment || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>
          </div>

          <!-- Embedding API -->
          <div style="margin-bottom: 24px;">
            <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #374151;">Embedding API</h4>

            <div style="margin-bottom: 16px;">
              <label for="embed-endpoint" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Endpoint</label>
              <input
                type="text"
                id="embed-endpoint"
                name="embedEndpoint"
                placeholder="https://your-resource.openai.azure.com/"
                value="${config.embeddingAPI?.endpoint || config.azureOpenAI?.endpoint || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="embed-api-key" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">API Key</label>
              <input
                type="password"
                id="embed-api-key"
                name="embedApiKey"
                placeholder="your-api-key"
                value="${config.embeddingAPI?.apiKey || config.azureOpenAI?.apiKey || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label for="embed-deployment" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Deployment Name</label>
              <input
                type="text"
                id="embed-deployment"
                name="embedDeployment"
                placeholder="text-embedding-3-small"
                value="${config.embeddingAPI?.deployment || config.azureOpenAI?.embeddingDeployment || ''}"
                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
              />
            </div>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 API 設定
          </button>
        </form>
      </div>

      <!-- Agent Tool 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Agent 工具設定</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">選擇 Agent 可以使用的搜尋工具</p>

        <form id="agent-tool-config-form">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="manualIndex" ${toolConfig?.manualIndex.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">手動索引</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋手動新增的索引內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="frontendPages" ${toolConfig?.frontendPages.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">前端頁面</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋當前網站的頁面內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="sitemap" ${toolConfig?.sitemap.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">Sitemap 索引</div>
                <div style="font-size: 13px; color: #6b7280;">搜尋外部網站的 Sitemap 內容</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="checkbox" name="sqlDatabase" ${toolConfig?.sqlDatabase.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <div style="font-weight: 500; color: #1f2937;">SQL 資料庫</div>
                <div style="font-size: 13px; color: #6b7280;">查詢 SQL 資料庫內容</div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            style="margin-top: 16px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存工具設定
          </button>
        </form>
      </div>
    `;
  }





  /**
   * 檢查是否有 Telegram 配置
   */
  private hasTelegramConfig(): boolean {
    const telegramConfig = (window as any).SM_TELEGRAM_CONFIG;
    return !!(telegramConfig && telegramConfig.botToken && telegramConfig.chatId);
  }

  /**
   * 獲取 Telegram 啟用狀態
   */
  private getTelegramEnabled(): boolean {
    const enabled = localStorage.getItem('telegram_enabled');
    // 默認啟用 Telegram 通知
    return enabled !== 'false';
  }

  /**
   * 設置 Telegram 啟用狀態
   */
  private setTelegramEnabled(enabled: boolean): void {
    localStorage.setItem('telegram_enabled', enabled.toString());
  }

  /**
   * 顯示編輯索引模態框
   */
  private async showEditIndexModal(id: string): Promise<void> {
    const index = await ManualIndexService.getById(id);
    if (!index) {
      await this.showAlertDialog('找不到該索引');
      return;
    }

    // 創建模態框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">編輯索引</h3>

        <form id="edit-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="edit-index-name"
              value="${index.name || index.name || ''}"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">描述</label>
            <input
              type="text"
              id="edit-index-description"
              value="${index.description || ''}"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">內容</label>
            <textarea
              id="edit-index-content"
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical; color: #1f2937; background: #ffffff;"
            >${index.content}</textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-edit-btn"
              style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    const form = modal.querySelector('#edit-index-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-edit-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = (modal.querySelector('#edit-index-name') as HTMLInputElement).value;
      const description = (modal.querySelector('#edit-index-description') as HTMLInputElement).value;
      const content = (modal.querySelector('#edit-index-content') as HTMLTextAreaElement).value;

      if (!name || !content) {
        await this.showAlertDialog('請填寫名稱和內容');
        return;
      }

      try {
        await ManualIndexService.update(id, { title: name, description, content, url: '' });
        await this.showAlertDialog('索引已更新');

        // 關閉模態框
        document.body.removeChild(modal);

        // 重新渲染頁面
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 顯示新增索引模態框
   */
  private async showAddIndexModal(): Promise<void> {
    // 創建模態框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增索引</h3>

        <form id="add-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
              名稱 <span style="color: #ef4444;">*</span>
            </label>
            <input
              type="text"
              id="add-index-name"
              placeholder="例如：產品介紹"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
              描述 <span style="color: #ef4444;">*</span> <span style="color: #6b7280; font-weight: 400; font-size: 12px;">(AI 搜尋用的)</span>
            </label>
            <input
              type="text"
              id="add-index-description"
              placeholder="簡短描述這個索引的內容，用於 AI 向量搜尋"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">URL（選填）</label>
            <input
              type="url"
              id="add-index-url"
              placeholder="https://example.com/page"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
              內容 <span style="color: #ef4444;">*</span>
            </label>
            <textarea
              id="add-index-content"
              placeholder="輸入索引內容..."
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical; color: #1f2937; background: #ffffff;"
            ></textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-add-btn"
              style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              新增索引
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    const form = modal.querySelector('#add-index-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-add-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = (modal.querySelector('#add-index-name') as HTMLInputElement).value;
      const description = (modal.querySelector('#add-index-description') as HTMLInputElement).value;
      const url = (modal.querySelector('#add-index-url') as HTMLInputElement).value;
      const content = (modal.querySelector('#add-index-content') as HTMLTextAreaElement).value;

      if (!name || !description || !content) {
        await this.showAlertDialog('請填寫名稱、描述和內容（必填欄位）');
        return;
      }

      try {
        await ManualIndexService.create({ title: name, description, content, url: url || undefined });
        await this.showAlertDialog('索引已新增');

        // 關閉模態框
        document.body.removeChild(modal);

        // 重新渲染頁面
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`新增失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 顯示導入 URL 模態框
   */
  private async showImportUrlModal(): Promise<void> {
    // 創建模態框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">導入 URL</h3>
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0;">
          上傳包含 URL 列表的 txt 文件（一行一個 URL），系統會自動抓取內容、切分 chunk 並生成 embedding。
        </p>

        <form id="import-url-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
              選擇 URL 文件 <span style="color: #ef4444;">*</span>
            </label>
            <input
              type="file"
              id="url-file-input"
              accept=".txt"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; color: #1f2937; background: #ffffff;"
            />
            <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">
              支持 .txt 文件，每行一個 URL
            </p>
          </div>

          <div id="import-progress" style="display: none; margin-bottom: 16px;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px;">
              <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;">
                正在處理：<span id="progress-text">準備中...</span>
              </p>
              <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div id="progress-bar" style="background: #10b981; height: 100%; width: 0%; transition: width 0.3s;"></div>
              </div>
              <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">
                <span id="progress-detail"></span>
              </p>
            </div>
          </div>

          <div id="import-result" style="display: none; margin-bottom: 16px;">
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px;">
              <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 500;">
                ✅ 導入完成
              </p>
              <p style="font-size: 12px; color: #166534; margin: 8px 0 0 0;">
                <span id="result-detail"></span>
              </p>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button
              type="button"
              id="cancel-import-btn"
              style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              id="submit-import-btn"
              style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              開始導入
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    const form = modal.querySelector('#import-url-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-import-btn') as HTMLButtonElement;
    const submitBtn = modal.querySelector('#submit-import-btn') as HTMLButtonElement;
    const fileInput = modal.querySelector('#url-file-input') as HTMLInputElement;
    const progressDiv = modal.querySelector('#import-progress') as HTMLDivElement;
    const progressText = modal.querySelector('#progress-text') as HTMLSpanElement;
    const progressBar = modal.querySelector('#progress-bar') as HTMLDivElement;
    const progressDetail = modal.querySelector('#progress-detail') as HTMLSpanElement;
    const resultDiv = modal.querySelector('#import-result') as HTMLDivElement;
    const resultDetail = modal.querySelector('#result-detail') as HTMLSpanElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const file = fileInput.files?.[0];
      if (!file) {
        await this.showAlertDialog('請選擇文件');
        return;
      }

      try {
        // 禁用按鈕
        submitBtn.disabled = true;
        submitBtn.textContent = '處理中...';
        cancelBtn.disabled = true;

        // 顯示進度
        progressDiv.style.display = 'block';
        resultDiv.style.display = 'none';

        // 讀取文件
        progressText.textContent = '讀取文件...';
        progressBar.style.width = '10%';

        const text = await file.text();
        const urls = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));

        if (urls.length === 0) {
          await this.showAlertDialog('文件中沒有找到有效的 URL');
          return;
        }

        progressText.textContent = `找到 ${urls.length} 個 URL，開始處理...`;
        progressBar.style.width = '20%';

        // 調用 API 批量導入
        const response = await DatabaseService.importUrlsBatch(urls);

        // 更新進度
        progressBar.style.width = '100%';
        progressText.textContent = '處理完成！';
        progressDetail.textContent = `成功：${response.results.success} | 失敗：${response.results.failed} | 總索引：${response.results.totalIndexes}`;

        // 顯示結果
        setTimeout(() => {
          progressDiv.style.display = 'none';
          resultDiv.style.display = 'block';
          resultDetail.textContent = `成功處理 ${response.results.success} 個 URL，創建了 ${response.results.totalIndexes} 個索引`;

          // 啟用關閉按鈕
          cancelBtn.disabled = false;
          cancelBtn.textContent = '關閉';
          submitBtn.style.display = 'none';

          // 重新渲染頁面
          this.updatePageContent();
        }, 1000);

      } catch (error) {
        await this.showAlertDialog(`導入失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        submitBtn.disabled = false;
        submitBtn.textContent = '開始導入';
        cancelBtn.disabled = false;
        progressDiv.style.display = 'none';
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal && !cancelBtn.disabled) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 顯示刪除確認對話框
   */
  private async showDeleteConfirmDialog(id: string): Promise<void> {
    const index = await ManualIndexService.getById(id);
    if (!index) {
      await this.showAlertDialog('找不到該索引');
      return;
    }

    const confirmed = await this.showConfirmDialog(`確定要刪除索引「${index.name || index.name || '未命名'}」嗎？此操作無法復原。`);
    if (confirmed) {
      try {
        await ManualIndexService.delete(id);
        await this.showAlertDialog('索引已刪除');
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }
  }







  /**
   * 渲染客服對話頁面
   */
  private async renderConversations(): Promise<string> {
    try {
      const { CustomerServiceManager } = await import('../services/CustomerServiceManager');
      const conversations = await CustomerServiceManager.getAllConversations();

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #1f2937;">客服對話管理</h2>
          <div style="display: flex; gap: 12px;">
            <button id="refresh-conversations" style="
              padding: 10px 20px;
              background: #f3f4f6;
              color: #374151;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
            ">🔄 刷新</button>
          </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          ${conversations.length === 0 ? `
            <div style="padding: 48px; text-align: center; color: #6b7280;">
              <p style="font-size: 16px; margin: 0;">目前沒有對話記錄</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">對話ID</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">用戶ID</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">訊息數</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">狀態</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">開始時間</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${conversations.slice().reverse().map((conv: any) => {
                    // 處理資料庫返回的數據結構（使用 any 類型以支持 snake_case）
                    const conversationId = conv.conversation_id || conv.conversationId || conv.id;
                    const userId = conv.user_id || conv.userId || 'undefined';
                    const messages = Array.isArray(conv.messages) ? conv.messages : [];
                    const status = conv.status || 'active';
                    const createdAt = conv.created_at || conv.createdAt || conv.startedAt;

                    return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-family: monospace; font-size: 12px;">${conversationId.substring(0, 8)}...</td>
                      <td style="padding: 16px; color: #1f2937;">${userId}</td>
                      <td style="padding: 16px; color: #1f2937;">${messages.length}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${status === 'active' ? '#dcfce7' : '#f3f4f6'};
                          color: ${status === 'active' ? '#166534' : '#374151'};
                        ">${status === 'active' ? '進行中' : '已結束'}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(createdAt).toLocaleString()}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="view-conversation-btn" data-id="${conversationId}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">查看</button>
                          <button class="delete-conversation-btn" data-id="${conversationId}" style="
                            padding: 6px 12px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">刪除</button>
                        </div>
                      </td>
                    </tr>
                  `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error('Failed to render conversations:', error);
      return `
        <div style="padding: 24px; text-align: center; color: #ef4444;">
          <p>載入對話記錄失敗：${error instanceof Error ? error.message : '未知錯誤'}</p>
        </div>
      `;
    }
  }

  /**
   * 渲染管理員用戶頁面 (已棄用 - AdminUserManager 已移除)
   */
  private async renderAdminUsers(): Promise<string> {
    try {
      // AdminUserManager has been removed
      const adminUsers: any[] = [];

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #1f2937;">管理員帳號管理</h2>
          <button id="add-admin-user-btn" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">+ 新增管理員</button>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          ${adminUsers.length === 0 ? `
            <div style="padding: 48px; text-align: center; color: #6b7280;">
              <p style="font-size: 16px; margin: 0;">目前沒有管理員帳號</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">用戶名</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">角色</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">狀態</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">創建時間</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">最後登錄</th>
                    <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${adminUsers.map((user: any) => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 16px; color: #1f2937; font-weight: 500;">${user.username}</td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${user.username === 'admin' ? '#fef3c7' : '#dbeafe'};
                          color: ${user.username === 'admin' ? '#92400e' : '#1e40af'};
                        ">${user.username === 'admin' ? '超級管理員' : '管理員'}</span>
                      </td>
                      <td style="padding: 16px;">
                        <span style="
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: 500;
                          background: ${user.is_active ? '#dcfce7' : '#fee2e2'};
                          color: ${user.is_active ? '#166534' : '#dc2626'};
                        ">${user.is_active ? '啟用' : '停用'}</span>
                      </td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${new Date(user.created_at).toLocaleString()}</td>
                      <td style="padding: 16px; color: #6b7280; font-size: 14px;">${user.last_login ? new Date(user.last_login).toLocaleString() : '從未登錄'}</td>
                      <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                          <button class="edit-admin-user-btn" data-id="${user.id}" style="
                            padding: 6px 12px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                          ">編輯</button>
                          ${user.username !== 'lens' ? `
                            <button class="delete-admin-user-btn" data-id="${user.id}" style="
                              padding: 6px 12px;
                              background: #ef4444;
                              color: white;
                              border: none;
                              border-radius: 6px;
                              font-size: 12px;
                              cursor: pointer;
                            ">刪除</button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error('Failed to render admin users:', error);
      return `
        <div style="padding: 24px; text-align: center; color: #ef4444;">
          <p>載入管理員列表失敗：${error instanceof Error ? error.message : '未知錯誤'}</p>
        </div>
      `;
    }
  }



  /**
   * 渲染規則管理頁面
   */
  private async renderRules(): Promise<string> {
    const { RuleStorageService } = await import('../services/RuleStorageService');
    const rules = RuleStorageService.getRules();

    const rulesHTML = rules.length === 0
      ? '<p style="text-align: center; color: #6b7280; padding: 40px;">目前沒有任何規則</p>'
      : rules.map(rule => `
        <div class="rule-card" style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                /${rule.name}
                ${rule.isActive ? '<span style="margin-left: 8px; padding: 2px 8px; background: #10b981; color: white; font-size: 11px; border-radius: 4px; font-weight: 500;">啟用</span>' : '<span style="margin-left: 8px; padding: 2px 8px; background: #6b7280; color: white; font-size: 11px; border-radius: 4px; font-weight: 500;">停用</span>'}
              </h3>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">${rule.displayName || '-'}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="edit-rule-btn" data-rule-id="${rule.id}" style="
                padding: 6px 12px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: background 0.2s;
              " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                編輯
              </button>
              <button class="delete-rule-btn" data-rule-id="${rule.id}" style="
                padding: 6px 12px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: background 0.2s;
              " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                刪除
              </button>
            </div>
          </div>

          ${rule.description ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;">${rule.description}</p>` : ''}

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 13px;">
              <div>
                <span style="color: #6b7280; font-weight: 500;">Temperature:</span>
                <span style="color: #1f2937; margin-left: 4px;">${rule.temperature || 0.7}</span>
              </div>
              <div>
                <span style="color: #6b7280; font-weight: 500;">Max Tokens:</span>
                <span style="color: #1f2937; margin-left: 4px;">${rule.maxTokens || 2000}</span>
              </div>
            </div>

            ${rule.searchTools && rule.searchTools.length > 0 ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6b7280;">搜尋工具 (${rule.searchTools.length})</p>
                ${rule.searchTools.map(tool => `
                  <div style="background: #f9fafb; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 500; color: #1f2937;">${tool.name}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${tool.urls.length} URLs</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');

    return `
      <div style="max-width: 1200px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1f2937;">規則管理</h2>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">管理 AI 對話規則與搜尋工具配置</p>
          </div>
          <button id="add-rule-btn" style="
            padding: 10px 20px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">
            + 新增規則
          </button>
        </div>

        <div id="rules-list">
          ${rulesHTML}
        </div>
      </div>
    `;
  }

  /**
   * 渲染系統設定頁面
   */
  private async renderSystemSettings(): Promise<string> {
    let settings: any = {};
    let adminUsers: any[] = [];

    try {
      const { DatabaseService } = await import('../services/DatabaseService');
      const [settingsData, adminUsersData] = await Promise.all([
        DatabaseService.getSettings().catch(() => ({})),
        DatabaseService.getAdminUsers().catch(() => [])
      ]);

      settings = settingsData;
      adminUsers = adminUsersData;
    } catch (error) {
      console.error('Failed to load system settings:', error);
    }

    const defaultReply = settings['default_reply'] || '';
    const systemPrompt = settings['system_prompt'] || '';

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">系統設定</h2>

      <!-- 系統設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">基本設定</h3>

        <form id="system-settings-form">
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #374151; font-weight: 500;">無法回答時的固定回覆</label>
              <button
                type="button"
                id="edit-default-reply-btn"
                style="background: #3b82f6; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.background='#2563eb'"
                onmouseout="this.style.background='#3b82f6'"
              >
                編輯
              </button>
            </div>
            <div
              id="default-reply-display"
              style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; font-size: 14px; min-height: 60px; white-space: pre-wrap; color: #1f2937;"
            >${defaultReply}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #374151; font-weight: 500;">LLM系統提示詞</label>
              <button
                type="button"
                id="edit-system-prompt-btn"
                style="background: #3b82f6; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.background='#2563eb'"
                onmouseout="this.style.background='#3b82f6'"
              >
                編輯
              </button>
            </div>
            <div
              id="system-prompt-display"
              style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; font-size: 14px; min-height: 80px; white-space: pre-wrap; color: #1f2937;"
            >${systemPrompt}</div>
          </div>

        </form>
      </div>

      <!-- 管理員帳號 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0; color: #1f2937;">管理員帳號（${adminUsers.length}）</h3>
          <button
            id="add-admin-user-btn"
            style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
          >
            + 新增管理員
          </button>
        </div>

        ${adminUsers.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無管理員帳號</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${adminUsers.map(user => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${user.username}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">${user.email || '無Email'}</p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0 0;">
                      建立時間：${new Date(user.createdAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button
                      class="delete-admin-user-btn"
                      data-id="${user.id}"
                      style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  /**
   * 顯示新增管理員模態框
   */
  private async showAddAdminUserModal(): Promise<void> {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin: 0 0 16px 0; color: #1f2937;">新增管理員</h3>

        <form id="add-admin-user-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">用戶名</label>
            <input
              type="text"
              id="add-admin-username"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入用戶名"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">密碼</label>
            <input
              type="password"
              id="add-admin-password"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入密碼"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Email（選填）</label>
            <input
              type="email"
              id="add-admin-email"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
              placeholder="請輸入Email"
            />
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-add-admin-btn"
              style="padding: 10px 20px; background: #f3f4f6; color: #374151; border: none; border-radius: 8px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer;"
            >
              新增管理員
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    const form = modal.querySelector('#add-admin-user-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-add-admin-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = (modal.querySelector('#add-admin-username') as HTMLInputElement).value;
      const password = (modal.querySelector('#add-admin-password') as HTMLInputElement).value;
      const email = (modal.querySelector('#add-admin-email') as HTMLInputElement).value;

      try {
        const { DatabaseService } = await import('../services/DatabaseService');
        await DatabaseService.createAdminUser(username, password, email);

        document.body.removeChild(modal);
        await this.showAlertDialog('管理員帳號已新增');
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`新增失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 顯示對話詳情模態框
   */
  private async showConversationModal(conversationId: string): Promise<void> {
    try {
      const { CustomerServiceManager } = await import('../services/CustomerServiceManager');
      const conversation: any = await CustomerServiceManager.getConversationById(conversationId);

      if (!conversation) {
        await this.showAlertDialog('找不到該對話記錄');
        return;
      }

      // 處理資料庫返回的數據結構（使用 any 類型以支持 snake_case）
      const convId = conversation.conversation_id || conversation.conversationId || conversation.id;
      const userId = conversation.user_id || conversation.userId || 'undefined';

      // 解析 messages 欄位（可能是 JSON 字串或陣列）
      let messages = [];
      if (typeof conversation.messages === 'string') {
        try {
          messages = JSON.parse(conversation.messages);
        } catch (e) {
          console.error('Failed to parse messages:', e);
          messages = [];
        }
      } else if (Array.isArray(conversation.messages)) {
        messages = conversation.messages;
      }

      const status = conversation.status || 'active';
      const createdAt = conversation.created_at || conversation.createdAt;
      const updatedAt = conversation.updated_at || conversation.updatedAt;

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000000;
      `;

      modal.innerHTML = `
        <div style="
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 24px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">對話詳情</h3>
            <button id="close-conversation-modal" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #6b7280;
              padding: 0;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">&times;</button>
          </div>

          <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
              <div><strong>對話ID:</strong> ${convId}</div>
              <div><strong>用戶ID:</strong> ${userId}</div>
              <div><strong>訊息數:</strong> ${messages.length}</div>
              <div><strong>狀態:</strong> ${status === 'active' ? '進行中' : '已結束'}</div>
              <div><strong>建立時間:</strong> ${createdAt ? new Date(createdAt).toLocaleString('zh-TW') : '未知'}</div>
              <div><strong>更新時間:</strong> ${updatedAt ? new Date(updatedAt).toLocaleString('zh-TW') : '未知'}</div>
            </div>
          </div>

          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">對話記錄</h4>
            ${messages.length > 0 ?
              messages.map((msg: any) => `
                <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; ${msg.role === 'user' ? 'background: #eff6ff; margin-left: 20px;' : 'background: #f0fdf4; margin-right: 20px;'}">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${msg.role === 'user' ? '👤 用戶' : '🤖 助理'}
                    <span style="font-weight: normal; color: #6b7280; font-size: 12px; margin-left: 8px;">
                      ${msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-TW') : ''}
                    </span>
                  </div>
                  <div style="color: #1f2937; line-height: 1.5;">${msg.content || ''}</div>
                </div>
              `).join('') :
              '<p style="color: #6b7280; text-align: center; padding: 20px;">此對話暫無訊息記錄</p>'
            }
          </div>

          <div style="margin-bottom: 16px; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">客服回覆</h4>
            <textarea id="customer-service-reply" style="
              width: 100%;
              min-height: 80px;
              padding: 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              color: #1f2937;
              background: #ffffff;
            " placeholder="輸入客服回覆..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="send-customer-service-reply" style="
              padding: 10px 20px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">發送回覆</button>
            <button id="close-conversation-modal-btn" style="
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
            ">關閉</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // 綁定關閉事件
      const closeBtn = modal.querySelector('#close-conversation-modal');
      const closeBtnBottom = modal.querySelector('#close-conversation-modal-btn');
      const sendReplyBtn = modal.querySelector('#send-customer-service-reply');
      const replyTextarea = modal.querySelector('#customer-service-reply') as HTMLTextAreaElement;

      const closeModal = () => {
        document.body.removeChild(modal);
      };

      closeBtn?.addEventListener('click', closeModal);
      closeBtnBottom?.addEventListener('click', closeModal);

      // 發送客服回覆
      sendReplyBtn?.addEventListener('click', async () => {
        const replyContent = replyTextarea?.value.trim();
        if (!replyContent) {
          await this.showAlertDialog('請輸入回覆內容');
          return;
        }

        try {
          const { CustomerServiceManager } = await import('../services/CustomerServiceManager');
          const success = await CustomerServiceManager.addCustomerServiceReply(
            conversationId,
            replyContent,
            '客服'
          );

          if (success) {
            await this.showAlertDialog('回覆已發送');
            closeModal();
            await this.updatePageContent();
          } else {
            await this.showAlertDialog('發送失敗，請稍後再試');
          }
        } catch (error) {
          console.error('Failed to send reply:', error);
          await this.showAlertDialog(`發送失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      });

      // 點擊背景關閉
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

    } catch (error) {
      console.error('Error showing conversation modal:', error);
      await this.showAlertDialog('載入對話詳情失敗');
    }
  }

  /**
   * 渲染知識庫管理頁面
   */
  private async renderKnowledgeBase(): Promise<string> {
    try {
      const files = await KnowledgeBaseService.getFiles();

      return `
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #1f2937;">知識庫管理</h2>
            <div style="display: flex; gap: 12px;">
              <button onclick="adminPanel.showAddUrlDialog()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                ➕ 新增 URL
              </button>
              <button onclick="adminPanel.showBatchImportDialog()" style="padding: 10px 20px; background: #8b5cf6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                📋 批次匯入
              </button>
              <button onclick="adminPanel.refreshAllKnowledge()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                🔄 全部更新
              </button>
              <button onclick="adminPanel.removeInvalidKnowledge()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                🗑️ 刪除失效
              </button>
            </div>
          </div>

          <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">名稱</th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">類型</th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">狀態</th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">最後更新</th>
                  <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">索引數</th>
                  <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">操作</th>
                </tr>
              </thead>
              <tbody>
                ${files.length === 0 ? `
                  <tr>
                    <td colspan="6" style="padding: 48px; text-align: center; color: #9ca3af;">
                      <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                      <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">還沒有任何知識來源</div>
                      <div style="font-size: 14px;">點擊上方按鈕開始新增</div>
                    </td>
                  </tr>
                ` : files.map(file => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px;">
                      <div style="font-size: 14px; font-weight: 500; color: #1f2937; margin-bottom: 4px;">${this.escapeHtml(file.name)}</div>
                      ${file.url ? `<div style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;">${this.escapeHtml(file.url)}</div>` : ''}
                    </td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #4b5563;">
                      ${KnowledgeBaseService.getFileTypeText(file.file_type)}
                    </td>
                    <td style="padding: 12px 16px; font-size: 14px;">
                      ${KnowledgeBaseService.getStatusText(file.status)}
                      ${file.metadata?.error ? `<div style="font-size: 12px; color: #ef4444; margin-top: 4px;">${this.escapeHtml(file.metadata?.error)}</div>` : ''}
                    </td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #6b7280;">
                      ${KnowledgeBaseService.formatTime(file.updated_at)}
                    </td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #6b7280;">
                      ${0 || 0}
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                      <button onclick="adminPanel.refreshKnowledgeFile('${file.id}')" style="padding: 6px 12px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px;" title="更新">
                        🔄
                      </button>
                      <button onclick="adminPanel.deleteKnowledgeFile('${file.id}')" style="padding: 6px 12px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="刪除">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering knowledge base:', error);
      return `
        <div style="padding: 24px;">
          <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; color: #dc2626;">
            ❌ 載入知識庫失敗：${error instanceof Error ? error.message : '未知錯誤'}
          </div>
        </div>
      `;
    }
  }

  /**
   * 顯示新增 URL 對話框
   */
  async showAddUrlDialog(): Promise<void> {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">新增 URL</h3>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">URL</label>
          <input type="text" id="url-input" placeholder="https://example.com/document.pdf" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">檔案類型</label>
          <select id="file-type-input" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
            <option value="">自動偵測</option>
            <option value="webpage">網頁</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
            <option value="image">圖片</option>
            <option value="text">純文字</option>
          </select>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱（選填）</label>
          <input type="text" id="name-input" placeholder="自動從 URL 提取" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">取消</button>
          <button id="add-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">新增</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const urlInput = modal.querySelector('#url-input') as HTMLInputElement;
    const fileTypeInput = modal.querySelector('#file-type-input') as HTMLSelectElement;
    const nameInput = modal.querySelector('#name-input') as HTMLInputElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    const addBtn = modal.querySelector('#add-btn') as HTMLButtonElement;

    urlInput.focus();

    const cleanup = () => {
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }
    };

    cancelBtn.addEventListener('click', cleanup);

    addBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) {
        await this.showAlertDialog('請輸入 URL');
        return;
      }

      try {
        await KnowledgeBaseService.addUrl(
          url,
          fileTypeInput.value || undefined,
          nameInput.value.trim() || undefined
        );
        cleanup();
        await this.showAlertDialog('已新增，正在處理中...');
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`新增失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  }

  /**
   * 顯示批次匯入對話框
   */
  async showBatchImportDialog(): Promise<void> {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; max-width: 600px; width: 90%;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">批次匯入 URL</h3>

        <div style="margin-bottom: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 13px; color: #4b5563;">
          <div style="font-weight: 600; margin-bottom: 8px;">格式說明：</div>
          <div>• 每行一個 URL</div>
          <div>• 或使用 Tab 分隔：URL [Tab] 類型 [Tab] 名稱</div>
          <div style="margin-top: 8px; font-family: monospace; background: white; padding: 8px; border-radius: 4px;">
            https://example.com/doc1.pdf<br>
            https://example.com/page.html	webpage	官網首頁
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">URL 列表</label>
          <textarea id="urls-input" placeholder="貼上 URL 列表..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 200px; resize: vertical; font-family: monospace; box-sizing: border-box;"></textarea>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">取消</button>
          <button id="import-btn" style="padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;">匯入</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const urlsInput = modal.querySelector('#urls-input') as HTMLTextAreaElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    const importBtn = modal.querySelector('#import-btn') as HTMLButtonElement;

    urlsInput.focus();

    const cleanup = () => {
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }
    };

    cancelBtn.addEventListener('click', cleanup);

    importBtn.addEventListener('click', async () => {
      const text = urlsInput.value.trim();
      if (!text) {
        await this.showAlertDialog('請輸入 URL 列表');
        return;
      }

      try {
        const urls = KnowledgeBaseService.parseBatchImportText(text);
        if (urls.length === 0) {
          await this.showAlertDialog('沒有找到有效的 URL');
          return;
        }

        await KnowledgeBaseService.batchAddUrls(urls);
        cleanup();
        await this.showAlertDialog(`已匯入 ${urls.length} 個 URL，正在處理中...`);
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`匯入失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  }

  /**
   * 更新單一知識檔案
   */
  async refreshKnowledgeFile(id: string): Promise<void> {
    try {
      await KnowledgeBaseService.refreshFile(id);
      await this.showAlertDialog('已開始重新處理');
      await this.updatePageContent();
    } catch (error) {
      await this.showAlertDialog(`更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 刪除知識檔案
   */
  async deleteKnowledgeFile(id: string): Promise<void> {
    const confirmed = await this.showConfirmDialog('確定要刪除這個檔案嗎？');
    if (!confirmed) return;

    try {
      await KnowledgeBaseService.deleteFile(id);
      await this.showAlertDialog('已刪除');
      await this.updatePageContent();
    } catch (error) {
      await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 全部更新
   */
  async refreshAllKnowledge(): Promise<void> {
    const confirmed = await this.showConfirmDialog('確定要重新處理所有檔案嗎？');
    if (!confirmed) return;

    try {
      await KnowledgeBaseService.refreshAll();
      await this.showAlertDialog('已開始重新處理所有檔案');
      await this.updatePageContent();
    } catch (error) {
      await this.showAlertDialog(`更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 刪除所有失效的檔案
   */
  async removeInvalidKnowledge(): Promise<void> {
    const confirmed = await this.showConfirmDialog('確定要刪除所有失效的檔案嗎？');
    if (!confirmed) return;

    try {
      await KnowledgeBaseService.removeInvalidUrls();
      await this.showAlertDialog('已刪除所有失效檔案');
      await this.updatePageContent();
    } catch (error) {
      await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * Toggle index content visibility
   */
  toggleIndexContent(id: string): void {
    const content = document.getElementById(`content-${id}`);
    if (content) {
      content.classList.toggle('expanded');
    }
  }

  /**
   * Toggle URL group visibility
   */
  toggleUrlGroup(url: string): void {
    const content = document.getElementById(`url-group-${url}`);
    const chevron = document.getElementById(`chevron-${url}`);
    if (content) {
      content.classList.toggle('expanded');
      if (chevron) {
        if (content.classList.contains('expanded')) {
          chevron.style.transform = 'rotate(180deg)';
        } else {
          chevron.style.transform = 'rotate(0deg)';
        }
      }
    }
  }

  /**
   * 顯示新增單個 URL 模態框
   */
  private async showAddSingleUrlModal(): Promise<void> {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 500px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增 URL</h3>
        <form id="add-single-url-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">URL</label>
            <input
              type="url"
              id="single-url-input"
              placeholder="https://example.com"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-single-url-btn"
              style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              導入
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('#add-single-url-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-single-url-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url = (modal.querySelector('#single-url-input') as HTMLInputElement).value;

      if (!url) {
        await this.showAlertDialog('請輸入 URL');
        return;
      }

      try {
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        submitBtn.disabled = true;
        submitBtn.textContent = '導入中...';

        const response = await fetch('/api/widget/manual-indexes/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (data.success) {
          const chunksCreated = data.indexes?.length || data.totalChunks || 0;
          await this.showAlertDialog(`成功導入 ${chunksCreated} 個 chunks`);
          document.body.removeChild(modal);
          await this.updatePageContent();
        } else {
          await this.showAlertDialog(`導入失敗：${data.error}`);
          submitBtn.disabled = false;
          submitBtn.textContent = '導入';
        }
      } catch (error) {
        await this.showAlertDialog(`導入失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 顯示重新命名模態框
   */
  private async showRenameIndexModal(id: string): Promise<void> {
    const index = await ManualIndexService.getById(id);
    if (!index) {
      await this.showAlertDialog('找不到該索引');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 500px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">重新命名</h3>
        <form id="rename-index-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">名稱</label>
            <input
              type="text"
              id="rename-index-name"
              value="${this.escapeHtml(index.name)}"
              required
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              type="button"
              id="cancel-rename-btn"
              style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              取消
            </button>
            <button
              type="submit"
              style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('#rename-index-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-rename-btn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = (modal.querySelector('#rename-index-name') as HTMLInputElement).value;

      if (!name) {
        await this.showAlertDialog('請輸入名稱');
        return;
      }

      try {
        await ManualIndexService.update(id, { title: name });
        await this.showAlertDialog('已更新');
        document.body.removeChild(modal);
        await this.updatePageContent();
      } catch (error) {
        await this.showAlertDialog(`更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 重新生成 embedding
   */
  private async regenerateEmbedding(id: string): Promise<void> {
    const confirmed = await this.showConfirmDialog('確定要重新生成 embedding 嗎？');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/widget/manual-indexes/regenerate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        await this.showAlertDialog('Embedding 已重新生成');
        await this.updatePageContent();
      } else {
        await this.showAlertDialog(`重新生成失敗：${data.error}`);
      }
    } catch (error) {
      await this.showAlertDialog(`重新生成失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 重新爬取 URL（單個項目）
   */
  private async recrawlUrl(id: string): Promise<void> {
    const confirmed = await this.showConfirmDialog('確定要重新爬取這個 URL 嗎？這將刪除現有的所有 chunks 並重新導入。');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/widget/manual-indexes/recrawl-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        await this.showAlertDialog(`重新爬取成功！創建了 ${data.chunksCreated} 個 chunks`);
        await this.updatePageContent();
      } else {
        await this.showAlertDialog(`重新爬取失敗：${data.error}`);
      }
    } catch (error) {
      await this.showAlertDialog(`重新爬取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 重新爬取 URL（URL 層級 - 刷新整個 URL）
   */
  private async recrawlUrlByUrl(url: string): Promise<void> {
    const confirmed = await this.showConfirmDialog(`確定要重新爬取 "${url}" 嗎？這將刪除該 URL 下的所有項目並重新導入。`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/widget/manual-indexes/recrawl-url-by-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        await this.showAlertDialog(`重新爬取成功！創建了 ${data.chunksCreated} 個 chunks`);
        await this.updatePageContent();
      } else {
        await this.showAlertDialog(`重新爬取失敗：${data.error}`);
      }
    } catch (error) {
      await this.showAlertDialog(`重新爬取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 刪除 URL 及其下所有項目
   */
  private async deleteUrlAndAllItems(url: string): Promise<void> {
    const confirmed = await this.showConfirmDialog(`確定要刪除 "${url}" 及其下所有項目嗎？此操作無法復原。`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/widget/manual-indexes/delete-by-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        await this.showAlertDialog(`成功刪除 ${data.deletedCount} 個項目`);
        await this.updatePageContent();
      } else {
        await this.showAlertDialog(`刪除失敗：${data.error}`);
      }
    } catch (error) {
      await this.showAlertDialog(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 顯示編輯對話框（完整編輯：名稱、描述、URL、內容）
   */
  private async showEditContentDialog(id: string): Promise<void> {
    try {
      // 獲取當前項目
      const response = await fetch(`/api/widget/manual-indexes/${id}`);
      const index = await response.json();

      if (!index) {
        await this.showAlertDialog('找不到該項目');
        return;
      }

      const isKnowledgeBase = index.url || index.type === 'url';

      // 創建對話框
      const dialog = document.createElement('div');
      dialog.id = 'edit-dialog-overlay';
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      `;

      dialog.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 24px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
          <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">編輯索引項目</h3>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">項目名稱：</label>
            <input type="text" id="edit-name-input" value="${this.escapeHtml(index.name || '')}" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>

          ${!isKnowledgeBase ? `
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">描述（用於 Embedding）：</label>
            <textarea id="edit-description-textarea" style="width: 100%; min-height: 100px; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${this.escapeHtml(index.description || '')}</textarea>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">手動索引使用描述來生成 embedding</p>
          </div>
          ` : ''}

          ${isKnowledgeBase && index.url ? `
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">URL：</label>
            <div style="padding: 10px 12px; background: #f3f4f6; border-radius: 6px; font-size: 14px; color: #6b7280; word-break: break-all;">${this.escapeHtml(index.url)}</div>
          </div>
          ` : ''}

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">內容：</label>
            <textarea id="edit-content-textarea" style="width: 100%; min-height: 300px; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; resize: vertical; line-height: 1.5;">${this.escapeHtml(index.content || '')}</textarea>
            ${isKnowledgeBase ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">知識庫使用內容來生成 embedding</p>` : ''}
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;">
            <button id="cancel-edit-btn" style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">取消</button>
            <button id="save-edit-btn" style="padding: 10px 20px; border: none; background: #10b981; color: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">儲存變更</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // 綁定事件
      const nameInput = dialog.querySelector('#edit-name-input') as HTMLInputElement;
      const descriptionTextarea = dialog.querySelector('#edit-description-textarea') as HTMLTextAreaElement;
      const contentTextarea = dialog.querySelector('#edit-content-textarea') as HTMLTextAreaElement;
      const cancelBtn = dialog.querySelector('#cancel-edit-btn');
      const saveBtn = dialog.querySelector('#save-edit-btn');

      // 取消按鈕
      cancelBtn?.addEventListener('click', () => {
        const overlay = document.getElementById('edit-dialog-overlay');
        if (overlay) {
          document.body.removeChild(overlay);
        }
      });

      // 儲存按鈕
      saveBtn?.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        const newContent = contentTextarea.value.trim();
        const newDescription = descriptionTextarea ? descriptionTextarea.value.trim() : null;

        if (!newName) {
          await this.showAlertDialog('項目名稱不能為空');
          return;
        }

        if (!newContent) {
          await this.showAlertDialog('內容不能為空');
          return;
        }

        try {
          const updateData: any = {
            name: newName,
            content: newContent,
          };

          // 手動索引才需要 description
          if (!isKnowledgeBase && newDescription !== null) {
            updateData.description = newDescription;
          }

          const updateResponse = await fetch(`/api/widget/manual-indexes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });

          if (updateResponse.ok) {
            await this.showAlertDialog('更新成功！Embedding 已自動重新生成。');
            const overlay = document.getElementById('edit-dialog-overlay');
            if (overlay) {
              document.body.removeChild(overlay);
            }
            await this.updatePageContent();
          } else {
            const errorData = await updateResponse.json();
            await this.showAlertDialog(`更新失敗：${errorData.error || '未知錯誤'}`);
          }
        } catch (error) {
          await this.showAlertDialog(`更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      });

      // 點擊背景關閉
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          const overlay = document.getElementById('edit-dialog-overlay');
          if (overlay) {
            document.body.removeChild(overlay);
          }
        }
      });
    } catch (error) {
      await this.showAlertDialog(`載入項目失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 綁定規則管理相關事件
   */
  private bindRuleManagementEvents(): void {
    // 新增規則按鈕
    const addRuleBtn = this.container!.querySelector('#add-rule-btn');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', async () => {
        await this.showRuleModal();
      });
    }

    // 編輯規則按鈕
    const editButtons = this.container!.querySelectorAll('.edit-rule-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const ruleId = (btn as HTMLElement).dataset.ruleId;
        if (ruleId) {
          await this.showRuleModal(ruleId);
        }
      });
    });

    // 刪除規則按鈕
    const deleteButtons = this.container!.querySelectorAll('.delete-rule-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const ruleId = (btn as HTMLElement).dataset.ruleId;
        if (ruleId) {
          const confirmed = await this.showConfirmDialog('確定要刪除這個規則嗎？');
          if (confirmed) {
            const { RuleStorageService } = await import('../services/RuleStorageService');
            RuleStorageService.deleteRule(ruleId);
            await this.updatePageContent();
          }
        }
      });
    });
  }

  /**
   * 顯示規則編輯/新增對話框
   */
  private async showRuleModal(ruleId?: string): Promise<void> {
    const { RuleStorageService } = await import('../services/RuleStorageService');

    // 獲取現有規則（如果是編輯模式）
    const existingRule = ruleId ? RuleStorageService.getRuleById(ruleId) : null;

    const modalHTML = `
      <div id="rule-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 700; color: #1f2937;">
            ${existingRule ? '編輯規則' : '新增規則'}
          </h2>

          <form id="rule-form">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                規則名稱 (用於 /rule_name)
              </label>
              <input
                type="text"
                id="rule-name"
                value="${existingRule?.name || ''}"
                placeholder="例如: financial"
                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                required
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                顯示名稱
              </label>
              <input
                type="text"
                id="rule-display-name"
                value="${existingRule?.displayName || ''}"
                placeholder="例如: 財務分析專家"
                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
              />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                描述
              </label>
              <textarea
                id="rule-description"
                placeholder="簡短描述這個規則的用途"
                rows="2"
                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical;"
              >${existingRule?.description || ''}</textarea>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                System Prompt (AI 角色設定)
              </label>
              <textarea
                id="rule-persona"
                placeholder="例如: 你是一個專業的財務分析師..."
                rows="4"
                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical;"
                required
              >${existingRule?.persona || ''}</textarea>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                輸出格式指示
              </label>
              <textarea
                id="rule-output-format"
                placeholder="例如: 請以條列式回答，包含關鍵數據與分析..."
                rows="3"
                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; resize: vertical;"
                required
              >${existingRule?.outputFormat || ''}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                  Temperature
                </label>
                <input
                  type="number"
                  id="rule-temperature"
                  value="${existingRule?.temperature || 0.7}"
                  min="0"
                  max="2"
                  step="0.1"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="rule-max-tokens"
                  value="${existingRule?.maxTokens || 2000}"
                  min="100"
                  max="10000"
                  step="100"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                />
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; font-size: 14px; font-weight: 500; color: #374151;">
                <input
                  type="checkbox"
                  id="rule-is-active"
                  ${existingRule?.isActive !== false ? 'checked' : ''}
                  style="margin-right: 8px; width: 16px; height: 16px;"
                />
                啟用此規則
              </label>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
              <button
                type="button"
                id="cancel-rule-btn"
                style="padding: 10px 20px; background: #f3f4f6; border: none; border-radius: 8px; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer;"
              >
                取消
              </button>
              <button
                type="submit"
                style="padding: 10px 20px; background: #7c3aed; border: none; border-radius: 8px; color: white; font-size: 14px; font-weight: 500; cursor: pointer;"
              >
                ${existingRule ? '更新' : '建立'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // 插入模態框到 body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // 綁定事件
    const form = document.getElementById('rule-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-rule-btn');
    const modal = document.getElementById('rule-modal');

    cancelBtn?.addEventListener('click', () => {
      modalContainer.remove();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ruleData = {
        name: (document.getElementById('rule-name') as HTMLInputElement).value.trim(),
        displayName: (document.getElementById('rule-display-name') as HTMLInputElement).value.trim(),
        description: (document.getElementById('rule-description') as HTMLTextAreaElement).value.trim(),
        persona: (document.getElementById('rule-persona') as HTMLTextAreaElement).value.trim(),
        outputFormat: (document.getElementById('rule-output-format') as HTMLTextAreaElement).value.trim(),
        temperature: parseFloat((document.getElementById('rule-temperature') as HTMLInputElement).value),
        maxTokens: parseInt((document.getElementById('rule-max-tokens') as HTMLInputElement).value),
        isActive: (document.getElementById('rule-is-active') as HTMLInputElement).checked,
      };

      if (existingRule) {
        // 更新現有規則
        RuleStorageService.updateRule(ruleId!, ruleData);
      } else {
        // 創建新規則
        RuleStorageService.saveRule(ruleData);
      }

      modalContainer.remove();
      await this.updatePageContent();
    });
  }
}


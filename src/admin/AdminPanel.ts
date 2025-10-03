import { StorageService } from '../services/StorageService';
import { ConversationService } from '../services/ConversationService';
import { ManualIndexService } from '../services/ManualIndexService';
import { SitemapService } from '../services/SitemapService';
import { SQLService } from '../services/SQLService';

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
  private handleRouteChange(): void {
    const path = window.location.pathname;

    if (path === '/lens-service' || path.startsWith('/lens-service/')) {
      this.open();
    } else if (this.isOpen) {
      this.close();
    }
  }

  /**
   * 打開後台
   */
  open(): void {
    if (this.isOpen) return;

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
          // 調用 API 驗證登入
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Login successful:', data);

            this.isAuthenticated = true;
            this.container!.innerHTML = this.renderAdminUI();
            this.bindEvents(); // 重新綁定事件
          } else {
            const error = await response.json();
            alert(error.error || '登入失敗');
            passwordInput.value = '';
            passwordInput.focus();
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('登入失敗，請稍後再試');
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

    // 導航按鈕
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = (item as HTMLElement).dataset.page;
        if (page) {
          this.currentPage = page;
          const contentDiv = this.container!.querySelector('#admin-content');
          if (contentDiv) {
            contentDiv.innerHTML = this.renderPageContent();
          }
          // 重新渲染整個 UI 以更新導航高亮
          this.container!.innerHTML = this.renderAdminUI();
          this.bindEvents();
        }
      });
    });

    // 登出按鈕
    const logoutBtn = this.container.querySelector('#admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.isAuthenticated = false;
        this.container!.innerHTML = this.renderLoginUI();
        this.bindEvents();
      });
    }

    // 密碼更改表單
    const changePasswordForm = this.container.querySelector('#change-password-form') as HTMLFormElement;
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newPasswordInput = this.container!.querySelector('#new-password') as HTMLInputElement;
        const newPassword = newPasswordInput?.value || '';

        if (newPassword.length < 4) {
          alert('密碼長度至少 4 個字元');
          return;
        }

        StorageService.saveAdminPassword(newPassword);
        alert('密碼已更新');

        // 重新渲染頁面
        const contentDiv = this.container!.querySelector('#admin-content');
        if (contentDiv) {
          contentDiv.innerHTML = this.renderPageContent();
          this.bindEvents(); // 重新綁定事件
        }
      });
    }

    // IP 白名單表單
    const ipWhitelistForm = this.container.querySelector('#ip-whitelist-form') as HTMLFormElement;
    if (ipWhitelistForm) {
      ipWhitelistForm.addEventListener('submit', (e) => {
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
        const contentDiv = this.container!.querySelector('#admin-content');
        if (contentDiv) {
          contentDiv.innerHTML = this.renderPageContent();
          this.bindEvents(); // 重新綁定事件
        }
      });
    }

    // 手動索引新增表單
    const addManualIndexForm = this.container.querySelector('#add-manual-index-form') as HTMLFormElement;
    if (addManualIndexForm) {
      addManualIndexForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const nameInput = this.container!.querySelector('#index-name') as HTMLInputElement;
        const descInput = this.container!.querySelector('#index-description') as HTMLInputElement;
        const contentInput = this.container!.querySelector('#index-content') as HTMLTextAreaElement;

        const name = nameInput?.value || '';
        const description = descInput?.value || '';
        const content = contentInput?.value || '';

        if (!name || !content) {
          alert('請填寫名稱和內容');
          return;
        }

        try {
          ManualIndexService.create({ name, description, content });
          alert('索引已新增');

          // 重新渲染頁面
          const contentDiv = this.container!.querySelector('#admin-content');
          if (contentDiv) {
            contentDiv.innerHTML = this.renderPageContent();
            this.bindEvents();
          }
        } catch (error) {
          alert(`新增失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      });
    }

    // 刪除索引按鈕
    const deleteIndexBtns = this.container.querySelectorAll('.delete-index-btn');
    deleteIndexBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id && confirm('確定要刪除這個索引嗎？')) {
          try {
            ManualIndexService.delete(id);
            alert('索引已刪除');

            // 重新渲染頁面
            const contentDiv = this.container!.querySelector('#admin-content');
            if (contentDiv) {
              contentDiv.innerHTML = this.renderPageContent();
              this.bindEvents();
            }
          } catch (error) {
            alert(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
          }
        }
      });
    });

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

        StorageService.saveConfig(config);
        alert('API 設定已儲存');
      });
    }

    // Agent 工具配置表單
    const agentToolConfigForm = this.container.querySelector('#agent-tool-config-form') as HTMLFormElement;
    if (agentToolConfigForm) {
      agentToolConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const manualIndexEnabled = (this.container!.querySelector('#manual-index-enabled') as HTMLInputElement)?.checked || false;
        const frontendPagesEnabled = (this.container!.querySelector('#frontend-pages-enabled') as HTMLInputElement)?.checked || false;

        const toolConfig = StorageService.loadAgentToolConfig();
        if (toolConfig) {
          toolConfig.manualIndex.enabled = manualIndexEnabled;
          toolConfig.frontendPages.enabled = frontendPagesEnabled;

          StorageService.saveAgentToolConfig(toolConfig);
          alert('Agent 設定已儲存');

          // 重新渲染頁面
          const contentDiv = this.container!.querySelector('#admin-content');
          if (contentDiv) {
            contentDiv.innerHTML = this.renderPageContent();
            this.bindEvents();
          }
        }
      });
    }

    // SQL Plugin 配置表單
    const sqlPluginConfigForm = this.container.querySelector('#sql-plugin-config-form') as HTMLFormElement;
    if (sqlPluginConfigForm) {
      sqlPluginConfigForm.addEventListener('submit', (e) => {
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
        const contentDiv = this.container!.querySelector('#admin-content');
        if (contentDiv) {
          contentDiv.innerHTML = this.renderPageContent();
          this.bindEvents();
        }
      });
    }

    // SQL 連接新增表單
    const sqlConnectionForm = this.container.querySelector('#sql-connection-form') as HTMLFormElement;
    if (sqlConnectionForm) {
      sqlConnectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = (this.container!.querySelector('#sql-conn-name') as HTMLInputElement)?.value || '';
        const type = (this.container!.querySelector('#sql-conn-type') as HTMLSelectElement)?.value as any;

        if (!name) {
          alert('請輸入連接名稱');
          return;
        }

        try {
          SQLService.create({
            name,
            type,
            host: 'localhost',
            port: 3306,
            database: 'mydb',
            username: 'user',
            password: 'password',
            queryTemplate: 'SELECT * FROM {table} WHERE {conditions}',
            resultMapping: {
              titleField: 'title',
              contentField: 'content',
              urlField: 'url'
            }
          });

          alert('SQL 連接已新增');

          // 重新渲染頁面
          const contentDiv = this.container!.querySelector('#admin-content');
          if (contentDiv) {
            contentDiv.innerHTML = this.renderPageContent();
            this.bindEvents();
          }
        } catch (error) {
          console.error('Error creating SQL connection:', error);
          alert('新增失敗');
        }
      });
    }

    // 刪除 SQL 連接按鈕
    const deleteSQLConnectionBtns = this.container.querySelectorAll('.delete-sql-connection');
    deleteSQLConnectionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id && confirm('確定要刪除這個連接嗎？')) {
          try {
            SQLService.delete(id);
            alert('連接已刪除');

            // 重新渲染頁面
            const contentDiv = this.container!.querySelector('#admin-content');
            if (contentDiv) {
              contentDiv.innerHTML = this.renderPageContent();
              this.bindEvents();
            }
          } catch (error) {
            console.error('Error deleting SQL connection:', error);
            alert('刪除失敗');
          }
        }
      });
    });
  }

  /**
   * 渲染管理後台 UI
   */
  private renderAdminUI(): string {
    return `
      <div style="display: flex; height: 100vh;">
        <!-- 左側導航 -->
        <div style="width: 250px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
          <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #1f2937;">Lens Service</h1>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">管理後台</p>
          </div>

          <nav style="flex: 1; padding: 16px; overflow-y: auto;">
            ${this.renderNavItem('dashboard', '儀表板')}
            ${this.renderNavItem('manual-index', '手動索引')}
            ${this.renderNavItem('conversations', '客服記錄')}
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
            ${this.renderPageContent()}
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
  private renderPageContent(): string {
    switch (this.currentPage) {
      case 'dashboard':
        return this.renderDashboard();
      case 'manual-index':
        return this.renderManualIndex();
      case 'conversations':
        return this.renderConversations();
      case 'system':
        return this.renderSystemSettings();
      default:
        return '<p>頁面不存在</p>';
    }
  }

  /**
   * 渲染儀表板
   */
  private renderDashboard(): string {
    const conversations = ConversationService.getAllConversations();
    const manualIndexes = ManualIndexService.getAll();
    const toolConfig = StorageService.loadAgentToolConfig();

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">儀表板</h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${this.renderStatCard('💬', '對話總數', conversations.length.toString())}
        ${this.renderStatCard('📝', '手動索引', manualIndexes.length.toString())}
      </div>

      <!-- Agent 設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">Agent 設定</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">配置 Agent 使用的搜尋工具</p>

        <form id="agent-tool-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="manual-index-enabled" ${toolConfig?.manualIndex?.enabled ? 'checked' : ''} style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 14px; color: #374151; font-weight: 500;">啟用手動索引搜尋</span>
            </label>
            <p style="margin: 4px 0 0 26px; font-size: 12px; color: #6b7280;">搜尋手動新增的索引內容</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="frontend-pages-enabled" ${toolConfig?.frontendPages?.enabled ? 'checked' : ''} style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 14px; color: #374151; font-weight: 500;">啟用前端頁面搜尋</span>
            </label>
            <p style="margin: 4px 0 0 26px; font-size: 12px; color: #6b7280;">搜尋當前網站的所有頁面內容</p>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存設定
          </button>
        </form>
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
  private renderManualIndex(): string {
    const indexes = ManualIndexService.getAll();

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">手動索引</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">手動新增索引內容供 Agent 搜尋</p>

      <!-- 新增索引表單 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">新增索引</h3>

        <form id="add-manual-index-form">
          <div style="margin-bottom: 16px;">
            <label for="index-name" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">名稱</label>
            <input
              type="text"
              id="index-name"
              name="name"
              placeholder="例如：產品介紹"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label for="index-description" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">描述</label>
            <input
              type="text"
              id="index-description"
              name="description"
              placeholder="簡短描述這個索引的內容"
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label for="index-content" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">內容</label>
            <textarea
              id="index-content"
              name="content"
              placeholder="輸入索引內容..."
              rows="8"
              required
              style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #1f2937; resize: vertical;"
            ></textarea>
          </div>

          <button
            type="submit"
            style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            新增索引
          </button>
        </form>
      </div>

      <!-- 索引列表 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">已建立的索引（${indexes.length}）</h3>

        ${indexes.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無索引</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${indexes.map(index => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${index.name}</h4>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">${index.description || '無描述'}</p>
                  </div>
                  <button
                    class="delete-index-btn"
                    data-id="${index.id}"
                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"
                  >
                    刪除
                  </button>
                </div>
                <p style="font-size: 13px; color: #9ca3af; margin: 8px 0 0 0;">
                  ${index.content.substring(0, 150)}${index.content.length > 150 ? '...' : ''}
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
                  建立時間：${new Date(index.createdAt).toLocaleString('zh-TW')}
                </p>
              </div>
            `).join('')}
          </div>
        `}
      </div>
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
    const connections = SQLService.getAll();
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
              ${connections.map(conn => `
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
            ${connections.map(conn => `
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
   * 渲染客服記錄頁面
   */
  private renderConversations(): string {
    const conversations = ConversationService.getAllConversations();

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">客服記錄</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">查看所有用戶對話記錄</p>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">統計資訊</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">總對話數</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${conversations.length}</div>
          </div>
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">總訊息數</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}</div>
          </div>
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">活躍用戶</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${new Set(conversations.map(c => c.userId)).size}</div>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">對話列表</h3>

        ${conversations.length === 0 ? `
          <p style="color: #9ca3af; text-align: center; padding: 32px 0;">尚無對話記錄</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${conversations.slice().reverse().map(conv => {
              const lastMessage = conv.messages[conv.messages.length - 1];
              const messageCount = conv.messages.length;
              const userMessages = conv.messages.filter(m => m.role === 'user').length;
              const assistantMessages = conv.messages.filter(m => m.role === 'assistant').length;

              return `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='#7c3aed'; this.style.boxShadow='0 4px 6px rgba(124, 58, 237, 0.1)'"
                     onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'"
                     onclick="this.querySelector('.conversation-details').style.display = this.querySelector('.conversation-details').style.display === 'none' ? 'block' : 'none'">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                      <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">
                        對話 ID: ${(conv.conversationId || conv.id).substring(0, 8)}...
                      </h4>
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        用戶 ID: ${conv.userId.substring(0, 8)}...
                      </p>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 12px; color: #9ca3af;">
                        ${new Date(conv.createdAt || conv.startedAt).toLocaleString('zh-TW')}
                      </div>
                      <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                        ${messageCount} 則訊息
                      </div>
                    </div>
                  </div>

                  <div style="padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 12px;">
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">最後訊息：</div>
                    <div style="font-size: 14px; color: #1f2937;">
                      ${lastMessage ? (lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')) : '無訊息'}
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                    <span>👤 用戶: ${userMessages}</span>
                    <span>🤖 助手: ${assistantMessages}</span>
                    <span>📅 ${new Date(conv.updatedAt || conv.lastMessageAt).toLocaleDateString('zh-TW')}</span>
                  </div>

                  <!-- 對話詳情（預設隱藏） -->
                  <div class="conversation-details" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #1f2937;">完整對話記錄</h5>
                    <div style="max-height: 400px; overflow-y: auto;">
                      ${conv.messages.map(msg => `
                        <div style="margin-bottom: 12px; padding: 12px; background: ${msg.role === 'user' ? '#ede9fe' : '#f3f4f6'}; border-radius: 6px;">
                          <div style="font-size: 12px; font-weight: 600; color: ${msg.role === 'user' ? '#7c3aed' : '#6b7280'}; margin-bottom: 4px;">
                            ${msg.role === 'user' ? '👤 用戶' : '🤖 助手'} - ${new Date(msg.timestamp).toLocaleString('zh-TW')}
                          </div>
                          <div style="font-size: 14px; color: #1f2937; white-space: pre-wrap;">
                            ${msg.content}
                          </div>
                          ${msg.sources && msg.sources.length > 0 ? `
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">參考來源：</div>
                              ${msg.sources.map((source, idx) => `
                                <div style="font-size: 12px; color: #7c3aed; margin-top: 2px;">
                                  [${idx + 1}] ${source.title}
                                </div>
                              `).join('')}
                            </div>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  /**
   * 渲染 Agent & API 設定頁面（合併）
   */
  private renderAgentAndAPI(): string {
    const config = StorageService.loadConfig() || {};
    const toolConfig = StorageService.loadAgentToolConfig();

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
   * 渲染系統設定頁面（包含密碼和 IP 白名單）
   */
  private renderSystemSettings(): string {
    const currentPassword = StorageService.loadAdminPassword();
    const ipWhitelist = this.getIPWhitelist();

    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">系統設定</h2>

      <!-- 密碼設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">管理員密碼</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">當前密碼：${currentPassword}</p>

        <form id="change-password-form">
          <div style="margin-bottom: 16px;">
            <label for="new-password" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">新密碼</label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              placeholder="請輸入新密碼"
              autocomplete="new-password"
              style="
                width: 100%;
                max-width: 400px;
                padding: 10px 14px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
                background: white;
                color: #1f2937;
                outline: none;
              "
              required
            />
          </div>

          <button
            type="submit"
            style="
              padding: 10px 20px;
              background: #7c3aed;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            更新密碼
          </button>
        </form>
      </div>

      <!-- IP 白名單設定 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">IP 白名單</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">限制可以訪問管理後台的 IP 地址</p>

        <div style="margin-bottom: 16px;">
          <p style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">當前白名單：</p>
          <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #4b5563;">
            ${ipWhitelist.length > 0 ? ipWhitelist.join('<br>') : '（空白 - 允許所有 IP）'}
          </div>
        </div>

        <form id="ip-whitelist-form">
          <div style="margin-bottom: 16px;">
            <label for="ip-list" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">IP 列表（每行一個）</label>
            <textarea
              id="ip-list"
              name="ipList"
              placeholder="例如：&#10;192.168.1.1&#10;10.0.0.1"
              rows="5"
              style="
                width: 100%;
                max-width: 400px;
                padding: 10px 14px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                font-family: monospace;
                box-sizing: border-box;
                background: white;
                color: #1f2937;
                outline: none;
                resize: vertical;
              "
            >${ipWhitelist.join('\n')}</textarea>
          </div>

          <button
            type="submit"
            style="
              padding: 10px 20px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            更新白名單
          </button>
        </form>
      </div>
    `;
  }

  /**
   * 渲染資料庫管理頁面
   */
  private renderDatabaseManagement(): string {
    return `
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #1f2937;">資料庫管理</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">配置服務用資料庫，用於存儲對話記錄和索引數據</p>

      <!-- 說明 -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #1e40af;">💡 重要說明</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <li>此處配置的資料庫用於<strong>存儲服務數據</strong>（對話記錄、手動索引等）</li>
          <li>與「SQL 資料庫」頁面的配置不同，該頁面用於 Agent 搜尋外部資料</li>
          <li>由於瀏覽器安全限制，需要提供一個<strong>後端 API</strong>來連接資料庫</li>
          <li>API 需要支援基本的 CRUD 操作（創建、讀取、更新、刪除）</li>
        </ul>
      </div>

      <!-- API 配置 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">後端 API 配置</h3>

        <form id="database-api-config-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Base URL</label>
            <input
              type="text"
              id="db-api-url"
              placeholder="https://your-api.com/api"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">後端 API 的基礎 URL</p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">API Key（選填）</label>
            <input
              type="password"
              id="db-api-key"
              placeholder="your-api-key"
              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;"
            >
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">如果 API 需要認證，請提供 API Key</p>
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            儲存 API 配置
          </button>
        </form>
      </div>

      <!-- Schema 驗證 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">資料庫 Schema 驗證</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">驗證資料庫是否包含所需的表格和欄位</p>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #374151;">必需的表格</h4>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">1. conversations（對話記錄）</h5>
            <div style="font-family: monospace; font-size: 13px; color: #6b7280; line-height: 1.6;">
              - id (VARCHAR/UUID, PRIMARY KEY)<br>
              - user_id (VARCHAR)<br>
              - conversation_id (VARCHAR)<br>
              - messages (JSON/TEXT)<br>
              - created_at (TIMESTAMP)<br>
              - updated_at (TIMESTAMP)
            </div>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">2. manual_indexes（手動索引）</h5>
            <div style="font-family: monospace; font-size: 13px; color: #6b7280; line-height: 1.6;">
              - id (VARCHAR/UUID, PRIMARY KEY)<br>
              - name (VARCHAR)<br>
              - description (TEXT)<br>
              - content (TEXT)<br>
              - keywords (JSON/TEXT)<br>
              - fingerprint (TEXT)<br>
              - created_at (TIMESTAMP)<br>
              - updated_at (TIMESTAMP)
            </div>
          </div>
        </div>

        <button
          id="verify-schema-btn"
          style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
        >
          驗證 Schema
        </button>

        <div id="schema-verification-result" style="margin-top: 16px; display: none;"></div>
      </div>

      <!-- API 端點說明 -->
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">後端 API 端點要求</h3>
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">您的後端 API 需要實現以下端點：</p>

        <div style="font-family: monospace; font-size: 13px; background: #f9fafb; padding: 16px; border-radius: 8px; line-height: 1.8;">
          <div style="margin-bottom: 12px;">
            <strong style="color: #10b981;">GET</strong> <span style="color: #1f2937;">/conversations</span><br>
            <span style="color: #6b7280; font-size: 12px;">獲取所有對話記錄</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/conversations</span><br>
            <span style="color: #6b7280; font-size: 12px;">創建新對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #f59e0b;">PUT</strong> <span style="color: #1f2937;">/conversations/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">更新對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #ef4444;">DELETE</strong> <span style="color: #1f2937;">/conversations/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">刪除對話</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #10b981;">GET</strong> <span style="color: #1f2937;">/manual-indexes</span><br>
            <span style="color: #6b7280; font-size: 12px;">獲取所有手動索引</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/manual-indexes</span><br>
            <span style="color: #6b7280; font-size: 12px;">創建新索引</span>
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #ef4444;">DELETE</strong> <span style="color: #1f2937;">/manual-indexes/:id</span><br>
            <span style="color: #6b7280; font-size: 12px;">刪除索引</span>
          </div>

          <div>
            <strong style="color: #3b82f6;">POST</strong> <span style="color: #1f2937;">/verify-schema</span><br>
            <span style="color: #6b7280; font-size: 12px;">驗證資料庫 Schema</span>
          </div>
        </div>
      </div>
    `;
  }
}


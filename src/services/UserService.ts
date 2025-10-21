/**
 * 用戶管理服務
 * 不再使用 localStorage 存儲 user_id
 * 完全依賴 JWT token 進行身份驗證
 */
export class UserService {
  /**
   * 檢查是否已登入（檢查是否有 JWT token）
   */
  static isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * 清除認證資訊（登出時調用）
   */
  static clearAuth(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('auth_token');
  }
}


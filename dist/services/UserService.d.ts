/**
 * 用戶管理服務
 * 不再使用 localStorage 存儲 user_id
 * 完全依賴 JWT token 進行身份驗證
 */
export declare class UserService {
    /**
     * 檢查是否已登入（檢查是否有 JWT token）
     */
    static isAuthenticated(): boolean;
    /**
     * 清除認證資訊（登出時調用）
     */
    static clearAuth(): void;
}

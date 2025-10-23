/**
 * 管理員用戶管理服務
 */
export interface AdminUser {
    id: string;
    username: string;
    password: string;
    email: string;
    created_at: number;
    last_login?: number;
    is_active: boolean;
}
export declare class AdminUserManager {
    /**
     * 獲取所有管理員用戶
     */
    static getAllAdminUsers(): Promise<AdminUser[]>;
    /**
     * 創建新的管理員用戶
     */
    static createAdminUser(username: string, password: string, email: string): Promise<boolean>;
    /**
     * 更新管理員用戶
     */
    static updateAdminUser(id: string, updates: Partial<Pick<AdminUser, 'username' | 'password' | 'is_active' | 'last_login'>>): Promise<boolean>;
    /**
     * 刪除管理員用戶
     */
    static deleteAdminUser(id: string): Promise<boolean>;
    /**
     * 驗證管理員登錄
     */
    static validateAdminLogin(username: string, password: string): Promise<AdminUser | null>;
    /**
     * 更改密碼
     */
    static changePassword(id: string, newPassword: string): Promise<boolean>;
}

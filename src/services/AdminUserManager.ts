import { DatabaseService } from './DatabaseService';

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

export class AdminUserManager {
  /**
   * 獲取所有管理員用戶
   */
  static async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const users = await DatabaseService.getAdminUsers();
      return users.map(user => ({
        id: user.id.toString(),
        username: user.username,
        password: '', // 不返回密碼
        email: user.email,
        created_at: new Date(user.created_at).getTime(),
        is_active: true
      }));
    } catch (error) {
      console.error('Failed to load admin users:', error);
      return [];
    }
  }

  /**
   * 創建新的管理員用戶
   */
  static async createAdminUser(
    username: string,
    password: string,
    email: string
  ): Promise<boolean> {
    try {
      await DatabaseService.createAdminUser(username, password, email);
      return true;
    } catch (error) {
      console.error('Failed to create admin user:', error);
      return false;
    }
  }

  /**
   * 更新管理員用戶
   */
  static async updateAdminUser(
    id: string,
    updates: Partial<Pick<AdminUser, 'username' | 'password' | 'is_active' | 'last_login'>>
  ): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3002/admin-users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to update admin user:', error);
      return false;
    }
  }

  /**
   * 刪除管理員用戶
   */
  static async deleteAdminUser(id: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3002/admin-users/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete admin user:', error);
      return false;
    }
  }

  /**
   * 驗證管理員登錄
   */
  static async validateAdminLogin(username: string, password: string): Promise<AdminUser | null> {
    try {
      const user = await DatabaseService.validateAdmin(username, password);

      if (user) {
        return {
          id: user.id.toString(),
          username: user.username,
          password: '', // 不返回密碼
          email: user.email,
          created_at: Date.now(),
          last_login: Date.now(),
          is_active: true
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to validate admin login:', error);
      return null;
    }
  }

  /**
   * 更改密碼
   */
  static async changePassword(id: string, newPassword: string): Promise<boolean> {
    return await this.updateAdminUser(id, { password: newPassword });
  }
}

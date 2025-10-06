/**
 * 管理員用戶管理服務
 */

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'super_admin';
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
      const response = await fetch('http://localhost:3002/admin-users');
      if (!response.ok) {
        return [];
      }
      const users = await response.json();
      return Array.isArray(users) ? users : [];
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
    role: 'admin' | 'super_admin' = 'admin'
  ): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3002/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          role,
          created_at: Date.now(),
          is_active: true
        })
      });
      return response.ok;
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
    updates: Partial<Pick<AdminUser, 'username' | 'password' | 'role' | 'is_active' | 'last_login'>>
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
      const response = await fetch('http://localhost:3002/admin-users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const user = await response.json();
      
      // 更新最後登錄時間
      await this.updateAdminUser(user.id, { last_login: Date.now() });
      
      return user;
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

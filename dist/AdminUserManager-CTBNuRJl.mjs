import { D as a } from "./index-Diqxx1Dy.mjs";
class o {
  /**
   * 獲取所有管理員用戶
   */
  static async getAllAdminUsers() {
    try {
      return (await a.getAdminUsers()).map((e) => ({
        id: e.id.toString(),
        username: e.username,
        password: "",
        // 不返回密碼
        email: e.email,
        created_at: new Date(e.created_at).getTime(),
        is_active: !0
      }));
    } catch (r) {
      return console.error("Failed to load admin users:", r), [];
    }
  }
  /**
   * 創建新的管理員用戶
   */
  static async createAdminUser(r, e, t) {
    try {
      return await a.createAdminUser(r, e, t), !0;
    } catch (s) {
      return console.error("Failed to create admin user:", s), !1;
    }
  }
  /**
   * 更新管理員用戶
   */
  static async updateAdminUser(r, e) {
    try {
      return (await fetch(`http://localhost:3002/admin-users/${r}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(e)
      })).ok;
    } catch (t) {
      return console.error("Failed to update admin user:", t), !1;
    }
  }
  /**
   * 刪除管理員用戶
   */
  static async deleteAdminUser(r) {
    try {
      return (await fetch(`http://localhost:3002/admin-users/${r}`, {
        method: "DELETE"
      })).ok;
    } catch (e) {
      return console.error("Failed to delete admin user:", e), !1;
    }
  }
  /**
   * 驗證管理員登錄
   */
  static async validateAdminLogin(r, e) {
    try {
      const t = await a.validateAdmin(r, e);
      return t ? {
        id: t.id.toString(),
        username: t.username,
        password: "",
        // 不返回密碼
        email: t.email,
        created_at: Date.now(),
        last_login: Date.now(),
        is_active: !0
      } : null;
    } catch (t) {
      return console.error("Failed to validate admin login:", t), null;
    }
  }
  /**
   * 更改密碼
   */
  static async changePassword(r, e) {
    return await this.updateAdminUser(r, { password: e });
  }
}
export {
  o as AdminUserManager
};

class n {
  /**
   * 獲取所有管理員用戶
   */
  static async getAllAdminUsers() {
    try {
      const e = await fetch("http://localhost:3002/admin-users");
      if (!e.ok)
        return [];
      const t = await e.json();
      return Array.isArray(t) ? t : [];
    } catch (e) {
      return console.error("Failed to load admin users:", e), [];
    }
  }
  /**
   * 創建新的管理員用戶
   */
  static async createAdminUser(e, t, r = "admin") {
    try {
      return (await fetch("http://localhost:3002/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: e,
          password: t,
          role: r,
          created_at: Date.now(),
          is_active: !0
        })
      })).ok;
    } catch (s) {
      return console.error("Failed to create admin user:", s), !1;
    }
  }
  /**
   * 更新管理員用戶
   */
  static async updateAdminUser(e, t) {
    try {
      return (await fetch(`http://localhost:3002/admin-users/${e}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(t)
      })).ok;
    } catch (r) {
      return console.error("Failed to update admin user:", r), !1;
    }
  }
  /**
   * 刪除管理員用戶
   */
  static async deleteAdminUser(e) {
    try {
      return (await fetch(`http://localhost:3002/admin-users/${e}`, {
        method: "DELETE"
      })).ok;
    } catch (t) {
      return console.error("Failed to delete admin user:", t), !1;
    }
  }
  /**
   * 驗證管理員登錄
   */
  static async validateAdminLogin(e, t) {
    try {
      const r = await fetch("http://localhost:3002/admin-users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: e, password: t })
      });
      if (!r.ok)
        return null;
      const s = await r.json();
      return await this.updateAdminUser(s.id, { last_login: Date.now() }), s;
    } catch (r) {
      return console.error("Failed to validate admin login:", r), null;
    }
  }
  /**
   * 更改密碼
   */
  static async changePassword(e, t) {
    return await this.updateAdminUser(e, { password: t });
  }
}
export {
  n as AdminUserManager
};

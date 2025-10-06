class c {
  /**
   * 獲取所有對話列表
   */
  static async getAllConversations() {
    try {
      const { DatabaseService: e } = await import("./index-CrbqMu4c.mjs").then((a) => a.a);
      await e.initializePool();
      const t = await e.getConversations();
      return Array.isArray(t) ? t : [];
    } catch (e) {
      return console.error("Failed to load conversations:", e), [];
    }
  }
  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(e) {
    try {
      const { DatabaseService: t } = await import("./index-CrbqMu4c.mjs").then((a) => a.a);
      return await t.initializePool(), await t.getConversation(e);
    } catch (t) {
      return console.error("Failed to load conversation:", t), null;
    }
  }
  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(e, t, a = "客服") {
    try {
      const { DatabaseService: r } = await import("./index-CrbqMu4c.mjs").then((s) => s.a);
      await r.initializePool();
      const o = await r.getConversation(e);
      if (!o)
        return !1;
      const n = {
        id: Date.now().toString(),
        role: "assistant",
        content: t,
        timestamp: Date.now(),
        metadata: {
          isCustomerService: !0,
          agentName: a
        }
      };
      return o.messages.push(n), await r.saveConversation(e, o.user_id || "unknown", o.messages), !0;
    } catch (r) {
      return console.error("Failed to add customer service reply:", r), !1;
    }
  }
  /**
   * 刪除對話
   */
  static async deleteConversation(e) {
    try {
      return (await fetch(`http://localhost:3002/conversations/${e}`, {
        method: "DELETE"
      })).ok;
    } catch (t) {
      return console.error("Failed to delete conversation:", t), !1;
    }
  }
  /**
   * 標記對話為已處理
   */
  static async markConversationAsHandled(e) {
    try {
      return (await fetch(`http://localhost:3002/conversations/${e}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "handled",
          handledAt: Date.now()
        })
      })).ok;
    } catch (t) {
      return console.error("Failed to mark conversation as handled:", t), !1;
    }
  }
  /**
   * 獲取待處理的對話數量
   */
  static async getPendingConversationsCount() {
    try {
      return (await this.getAllConversations()).filter((t) => t.status === "active").length;
    } catch (e) {
      return console.error("Failed to get pending conversations count:", e), 0;
    }
  }
}
export {
  c as CustomerServiceManager
};

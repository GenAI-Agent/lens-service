class l {
  /**
   * 獲取所有對話列表
   */
  static async getAllConversations() {
    try {
      const { DatabaseService: t } = await import("./index-BA0MUUOJ.mjs").then((r) => r.a);
      await t.initializePool();
      const e = await t.getConversations();
      return Array.isArray(e) ? e : [];
    } catch (t) {
      return console.error("Failed to load conversations:", t), [];
    }
  }
  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(t) {
    try {
      const { DatabaseService: e } = await import("./index-BA0MUUOJ.mjs").then((r) => r.a);
      return await e.initializePool(), await e.getConversation(t);
    } catch (e) {
      return console.error("Failed to load conversation:", e), null;
    }
  }
  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(t, e, r = "客服") {
    try {
      const { DatabaseService: s } = await import("./index-BA0MUUOJ.mjs").then((n) => n.a);
      await s.initializePool();
      const a = await s.getConversation(t);
      if (!a)
        return !1;
      let o = [];
      if (typeof a.messages == "string")
        try {
          o = JSON.parse(a.messages);
        } catch (n) {
          console.error("Failed to parse messages:", n), o = [];
        }
      else Array.isArray(a.messages) && (o = a.messages);
      const i = {
        id: Date.now().toString(),
        role: "assistant",
        content: e,
        timestamp: Date.now(),
        metadata: {
          isCustomerService: !0,
          agentName: r
        }
      };
      return o.push(i), await s.saveConversation(t, a.user_id || "unknown", o), !0;
    } catch (s) {
      return console.error("Failed to add customer service reply:", s), !1;
    }
  }
  /**
   * 刪除對話
   */
  static async deleteConversation(t) {
    try {
      return (await fetch(`http://localhost:3002/conversations/${t}`, {
        method: "DELETE"
      })).ok;
    } catch (e) {
      return console.error("Failed to delete conversation:", e), !1;
    }
  }
  /**
   * 標記對話為已處理
   */
  static async markConversationAsHandled(t) {
    try {
      return (await fetch(`http://localhost:3002/conversations/${t}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "handled",
          handledAt: Date.now()
        })
      })).ok;
    } catch (e) {
      return console.error("Failed to mark conversation as handled:", e), !1;
    }
  }
  /**
   * 獲取待處理的對話數量
   */
  static async getPendingConversationsCount() {
    try {
      return (await this.getAllConversations()).filter((e) => e.status === "active").length;
    } catch (t) {
      return console.error("Failed to get pending conversations count:", t), 0;
    }
  }
}
export {
  l as CustomerServiceManager
};

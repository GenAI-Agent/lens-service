class a {
  /**
   * 獲取所有對話列表
   */
  static async getAllConversations() {
    try {
      const e = await fetch("http://localhost:3002/conversations");
      if (!e.ok)
        return [];
      const t = await e.json();
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
      const t = await fetch(`http://localhost:3002/conversations/${e}`);
      return t.ok ? await t.json() : null;
    } catch (t) {
      return console.error("Failed to load conversation:", t), null;
    }
  }
  /**
   * 添加客服回覆到對話
   */
  static async addCustomerServiceReply(e, t, r = "客服") {
    try {
      const o = {
        role: "assistant",
        content: t,
        timestamp: Date.now(),
        metadata: {
          isCustomerService: !0,
          agentName: r
        }
      };
      return (await fetch(`http://localhost:3002/conversations/${e}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(o)
      })).ok;
    } catch (o) {
      return console.error("Failed to add customer service reply:", o), !1;
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
  a as CustomerServiceManager
};

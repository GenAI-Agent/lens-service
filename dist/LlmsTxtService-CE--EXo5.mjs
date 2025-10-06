var m = Object.defineProperty;
var p = (i, t, n) => t in i ? m(i, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : i[t] = n;
var a = (i, t, n) => p(i, typeof t != "symbol" ? t + "" : t, n);
import { D as x } from "./index-CNCJijjG.mjs";
class r {
  // chunk 之間的重疊字符數
  /**
   * 獲取並處理 llms.txt 內容
   */
  static async getLlmsTxtChunks() {
    try {
      const t = await x.getSetting("llms_txt_url");
      if (!t)
        return console.log("No llms.txt URL configured"), [];
      const n = Date.now();
      if (this.cache && this.cache.url === t && n - this.cache.timestamp < this.CACHE_DURATION)
        return console.log("Using cached llms.txt chunks"), this.cache.chunks;
      console.log("Fetching llms.txt from:", t);
      const c = await fetch(t);
      if (!c.ok)
        throw new Error(`Failed to fetch llms.txt: ${c.status}`);
      const e = await c.text();
      console.log("Fetched llms.txt content, length:", e.length);
      const h = this.splitIntoChunks(e);
      return console.log("Split into", h.length, "chunks"), this.cache = {
        url: t,
        content: e,
        chunks: h,
        timestamp: n
      }, h;
    } catch (t) {
      return console.error("Error fetching llms.txt:", t), [];
    }
  }
  /**
   * 將文本切分成 chunks（帶重疊）
   */
  static splitIntoChunks(t) {
    const n = [];
    let c = 0;
    for (; c < t.length; ) {
      const e = Math.min(c + this.CHUNK_SIZE, t.length), h = t.substring(c, e);
      n.push(h), c += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }
    return n;
  }
  /**
   * 搜索相關的 chunks（使用簡單的文字匹配）
   */
  static async searchChunks(t) {
    const n = await this.getLlmsTxtChunks();
    if (n.length === 0)
      return [];
    const c = [], e = t.toLowerCase(), h = e.match(/[\u4e00-\u9fa5]/g) || [], f = e.match(/[a-z]+/g) || [], C = [...h, ...f.filter((s) => s.length > 1)];
    n.forEach((s, o) => {
      const g = s.toLowerCase();
      let l = 0;
      g.includes(e) && (l += 20), C.forEach((k) => {
        g.includes(k) && (l += 2);
      }), l > 0 && c.push({ chunk: s, context: "", score: l, index: o });
    }), c.sort((s, o) => o.score - s.score);
    const u = c.slice(0, 5);
    return u.forEach((s) => {
      const o = [];
      s.index > 0 && o.push(n[s.index - 1]), o.push(s.chunk), s.index < n.length - 1 && o.push(n[s.index + 1]), s.context = o.join(`
...
`);
    }), u.map((s) => ({ chunk: s.chunk, context: s.context, score: s.score }));
  }
  /**
   * 清除緩存
   */
  static clearCache() {
    this.cache = null;
  }
}
a(r, "cache", null), a(r, "CACHE_DURATION", 36e5), // 1 小時
a(r, "CHUNK_SIZE", 500), // 每個 chunk 的字符數
a(r, "CHUNK_OVERLAP", 100);
export {
  r as LlmsTxtService
};

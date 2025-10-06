var f = Object.defineProperty;
var C = (r, t, s) => t in r ? f(r, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : r[t] = s;
var a = (r, t, s) => C(r, typeof t != "symbol" ? t + "" : t, s);
import { D as d } from "./index-BA0MUUOJ.mjs";
class u {
  // chunk 之間的重疊字符數
  /**
   * 獲取並處理 llms.txt 內容
   */
  static async getLlmsTxtChunks() {
    try {
      const t = await d.getSetting("llms_txt_url");
      if (!t)
        return console.log("No llms.txt URL configured"), [];
      const s = Date.now();
      if (this.cache && this.cache.url === t && s - this.cache.timestamp < this.CACHE_DURATION)
        return console.log("Using cached llms.txt chunks"), this.cache.chunks;
      console.log("Fetching llms.txt from:", t);
      const e = await fetch(t);
      if (!e.ok)
        throw new Error(`Failed to fetch llms.txt: ${e.status}`);
      const c = await e.text();
      console.log("Fetched llms.txt content, length:", c.length);
      const h = this.splitIntoChunks(c);
      return console.log("Split into", h.length, "chunks"), this.cache = {
        url: t,
        content: c,
        chunks: h,
        timestamp: s
      }, h;
    } catch (t) {
      return console.error("Error fetching llms.txt:", t), [];
    }
  }
  /**
   * 將文本切分成 chunks（帶重疊）
   */
  static splitIntoChunks(t) {
    const s = [];
    let e = 0;
    for (; e < t.length; ) {
      const c = Math.min(e + this.CHUNK_SIZE, t.length), h = t.substring(e, c);
      s.push(h), e += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }
    return s;
  }
  /**
   * 提取中文字符和英文單詞作為關鍵字
   */
  static extractKeywords(t) {
    const s = t.toLowerCase(), e = s.match(/[\u4e00-\u9fa5]/g) || [], c = s.match(/[a-z]{2,}/g) || [], h = s.match(/\d+/g) || [];
    return [...e, ...c, ...h];
  }
  /**
   * 計算 BM25 分數
   */
  static calculateBM25Score(t, s, e, c = 1.5, h = 0.75) {
    if (s.length === 0) return 0;
    let g = 0;
    const l = s.length;
    for (const i of t) {
      const n = s.filter((k) => k === i).length;
      if (n === 0) continue;
      const o = n * (c + 1), m = n + c * (1 - h + h * (l / e));
      g += o / m;
    }
    return g;
  }
  /**
   * 搜索相關的 chunks（使用 BM25 算法）
   */
  static async searchChunks(t) {
    const s = await this.getLlmsTxtChunks();
    if (s.length === 0)
      return [];
    console.log("🔍 LlmsTxtService.searchChunks() called with query:", t);
    const e = this.extractKeywords(t);
    console.log("🔍 Query keywords:", e);
    const c = s.map((n) => this.extractKeywords(n)), h = c.reduce((n, o) => n + o.length, 0) / c.length, l = s.map((n, o) => {
      const m = c[o], k = this.calculateBM25Score(e, m, h);
      return {
        chunk: n,
        context: "",
        score: k,
        index: o
      };
    }).filter((n) => n.score > 0).sort((n, o) => o.score - n.score);
    console.log("🔍 LlmsTxtService found", l.length, "matching chunks"), l.length > 0 && console.log("🔍 Top chunk score:", l[0].score.toFixed(2));
    const i = l.slice(0, 5);
    return i.forEach((n) => {
      const o = [];
      n.index > 0 && o.push(s[n.index - 1]), o.push(n.chunk), n.index < s.length - 1 && o.push(s[n.index + 1]), n.context = o.join(`
...
`);
    }), i.map((n) => ({ chunk: n.chunk, context: n.context, score: n.score }));
  }
  /**
   * 清除緩存
   */
  static clearCache() {
    this.cache = null;
  }
}
a(u, "cache", null), a(u, "CACHE_DURATION", 36e5), // 1 小時
a(u, "CHUNK_SIZE", 500), // 每個 chunk 的字符數
a(u, "CHUNK_OVERLAP", 100);
export {
  u as LlmsTxtService
};

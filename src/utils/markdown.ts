/**
 * 簡單的 Markdown 渲染器
 * 支援基本的 Markdown 語法
 */
export class MarkdownRenderer {
  /**
   * 將 Markdown 文本轉換為 HTML
   */
  static render(markdown: string): string {
    if (!markdown) return '';
    
    let html = markdown;
    
    // 處理代碼塊 (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || '';
      return `<pre style="background: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; border-left: 4px solid #6366f1;"><code class="language-${language}" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.4;">${this.escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 處理行內代碼 (`)
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return `<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; color: #e11d48;">${this.escapeHtml(code)}</code>`;
    });
    
    // 處理標題
    html = html.replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 16px 0 8px 0; color: #1f2937;">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 20px 0 10px 0; color: #1f2937;">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 12px 0; color: #1f2937;">$1</h1>');
    
    // 處理粗體
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>');
    
    // 處理斜體
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // 處理連結
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #6366f1; text-decoration: none; border-bottom: 1px solid #6366f1;">$1</a>');
    
    // 處理無序列表
    html = html.replace(/^[\s]*[-*+] (.*)$/gm, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 20px; list-style-type: disc;">$1</ul>');
    
    // 處理有序列表
    html = html.replace(/^[\s]*\d+\. (.*)$/gm, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>)/s, '<ol style="margin: 12px 0; padding-left: 20px;">$1</ol>');
    
    // 處理引用
    html = html.replace(/^> (.*)$/gm, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 12px 0; color: #6b7280; font-style: italic;">$1</blockquote>');
    
    // 處理分隔線
    html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">');
    
    // 處理換行
    html = html.replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6; color: #374151;">');
    html = html.replace(/\n/g, '<br>');
    
    // 包裝在段落中
    if (!html.startsWith('<')) {
      html = `<p style="margin: 12px 0; line-height: 1.6; color: #374151;">${html}</p>`;
    }
    
    return html;
  }
  
  /**
   * 轉義 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

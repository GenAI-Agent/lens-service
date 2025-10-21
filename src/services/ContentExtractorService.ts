/**
 * ContentExtractorService
 * 智能網頁內容提取和結構化切 Chunk 服務
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// PDF 處理（動態導入）
let pdfParse: any = null;
try {
  // pdf-parse is a CommonJS module
  const pdfParseModule = require('pdf-parse');

  // Handle different module structures
  if (typeof pdfParseModule === 'function') {
    // Direct function export
    pdfParse = pdfParseModule;
  } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
    // ES module with default export
    pdfParse = pdfParseModule.default;
  } else if (pdfParseModule.PDFParse) {
    // Class-based export
    const PDFParseClass = pdfParseModule.PDFParse;
    pdfParse = async (buffer: Buffer) => {
      const parser = new PDFParseClass();
      return await parser.parse(buffer);
    };
  } else {
    console.warn('pdf-parse module structure not recognized:', Object.keys(pdfParseModule));
  }
} catch (e) {
  console.warn('pdf-parse not available, PDF processing will be limited:', e);
}

interface ExtractedContent {
  title: string;
  description: string;
  keywords: string[];
  content: string;
  metadata: {
    url: string;
    fileType: string;
    author?: string;
    publishDate?: string;
    [key: string]: any;
  };
}

interface ContentChunk {
  name: string;
  description: string;
  content: string;
  metadata: {
    chunk: number;
    totalChunks: number;
    headingPath: string[];
    originalUrl: string;
    fileType: string;
  };
}

interface DocumentNode {
  type: 'heading' | 'paragraph' | 'list' | 'blockquote';
  level?: number; // For headings: 1-6
  text: string;
  children?: DocumentNode[];
}

export class ContentExtractorService {
  private readonly MAX_CHUNK_SIZE = 2000;
  private readonly MIN_CHUNK_SIZE = 500;

  /**
   * 從 URL 提取內容
   */
  async extractFromUrl(url: string): Promise<ExtractedContent> {
    const fileType = this.detectFileType(url);

    try {
      const response = await axios.get(url, {
        responseType: fileType === 'pdf' ? 'arraybuffer' : 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      switch (fileType) {
        case 'pdf':
          return await this.extractFromPDF(response.data, url);
        case 'html':
          return this.extractFromHTML(response.data, url);
        case 'txt':
          return this.extractFromText(response.data, url);
        default:
          return this.extractFromText(response.data, url);
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }

  /**
   * 檢測文件類型
   */
  private detectFileType(url: string): string {
    const urlLower = url.toLowerCase();

    if (urlLower.endsWith('.pdf') || urlLower.includes('arxiv.org/pdf')) {
      return 'pdf';
    }
    if (urlLower.endsWith('.txt')) {
      return 'txt';
    }
    if (urlLower.endsWith('.html') || urlLower.endsWith('.htm')) {
      return 'html';
    }

    // Default to HTML for web pages
    return 'html';
  }

  /**
   * 從 HTML 提取內容（使用 Cheerio）
   */
  private extractFromHTML(html: string, url: string): ExtractedContent {
    const $ = cheerio.load(html);

    // 移除不需要的元素
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();

    // 提取 metadata
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    const keywordsStr = $('meta[name="keywords"]').attr('content') || '';
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);

    const author = $('meta[name="author"]').attr('content') || 
                   $('meta[property="article:author"]').attr('content');

    const publishDate = $('meta[property="article:published_time"]').attr('content') || 
                       $('meta[name="publish-date"]').attr('content');

    // 提取主要內容
    let mainContent = '';
    
    // 嘗試找到主要內容區域
    const mainSelectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '#content'];
    let $main = null;
    
    for (const selector of mainSelectors) {
      $main = $(selector).first();
      if ($main.length > 0) break;
    }

    if (!$main || $main.length === 0) {
      $main = $('body');
    }

    // 提取文本內容
    mainContent = $main.text();

    // 清理內容
    mainContent = this.cleanText(mainContent);

    return {
      title,
      description: description || title,
      keywords,
      content: mainContent,
      metadata: {
        url,
        fileType: 'html',
        author,
        publishDate,
      },
    };
  }

  /**
   * 從 PDF 提取內容
   */
  private async extractFromPDF(buffer: Buffer, url: string): Promise<ExtractedContent> {
    if (!pdfParse) {
      throw new Error('PDF parsing is not available. Please install pdf-parse package.');
    }

    try {
      const data = await pdfParse(buffer);

      const title = data.info?.Title || 'PDF Document';
      const author = data.info?.Author;
      const content = this.cleanText(data.text);

      // 從內容的前幾行提取描述
      const lines = content.split('\n').filter(l => l.trim());
      const description = lines.slice(0, 3).join(' ').substring(0, 200);

      return {
        title,
        description,
        keywords: [],
        content,
        metadata: {
          url,
          fileType: 'pdf',
          author,
          pages: data.numpages,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * 從純文本提取內容
   */
  private extractFromText(text: string, url: string): ExtractedContent {
    const content = this.cleanText(text);
    const lines = content.split('\n').filter(l => l.trim());
    
    // 使用第一行作為標題
    const title = lines[0]?.substring(0, 100) || 'Text Document';
    
    // 使用前幾行作為描述
    const description = lines.slice(0, 3).join(' ').substring(0, 200);

    return {
      title,
      description,
      keywords: [],
      content,
      metadata: {
        url,
        fileType: 'txt',
      },
    };
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // 統一換行符
      .replace(/\n{3,}/g, '\n\n') // 移除多餘空行
      .replace(/[ \t]+/g, ' ') // 移除多餘空格
      .trim();
  }

  /**
   * 結構化切 Chunk
   */
  async chunkContent(extracted: ExtractedContent): Promise<ContentChunk[]> {
    const { title, description, content, metadata } = extracted;

    // 解析文檔結構
    const documentTree = this.parseDocumentStructure(content);

    // 按結構切分
    const chunks = this.splitByStructure(documentTree, title);

    // 生成 ContentChunk 對象
    return chunks.map((chunk, index) => ({
      name: chunks.length > 1 ? `${title} (Part ${index + 1}/${chunks.length})` : title,
      description: `${description} - ${chunk.headingPath.join(' > ')}`,
      content: chunk.content,
      metadata: {
        chunk: index + 1,
        totalChunks: chunks.length,
        headingPath: chunk.headingPath,
        originalUrl: metadata.url,
        fileType: metadata.fileType,
      },
    }));
  }

  /**
   * 解析文檔結構
   */
  private parseDocumentStructure(content: string): DocumentNode[] {
    const lines = content.split('\n');
    const nodes: DocumentNode[] = [];
    let currentParagraph = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        // 空行，結束當前段落
        if (currentParagraph) {
          nodes.push({
            type: 'paragraph',
            text: currentParagraph.trim(),
          });
          currentParagraph = '';
        }
        continue;
      }

      // 檢測標題（簡單啟發式：短行、全大寫、或以 # 開頭）
      const isHeading = this.isLikelyHeading(trimmed);
      
      if (isHeading) {
        // 結束當前段落
        if (currentParagraph) {
          nodes.push({
            type: 'paragraph',
            text: currentParagraph.trim(),
          });
          currentParagraph = '';
        }

        // 添加標題
        const level = this.detectHeadingLevel(trimmed);
        nodes.push({
          type: 'heading',
          level,
          text: trimmed.replace(/^#+\s*/, ''), // 移除 markdown 標記
        });
      } else {
        // 累積段落
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      }
    }

    // 添加最後的段落
    if (currentParagraph) {
      nodes.push({
        type: 'paragraph',
        text: currentParagraph.trim(),
      });
    }

    return nodes;
  }

  /**
   * 檢測是否像標題
   */
  private isLikelyHeading(text: string): boolean {
    // Markdown 標題
    if (/^#{1,6}\s/.test(text)) return true;

    // 短行（少於 80 字）且不以標點結尾
    if (text.length < 80 && !/[.!?。！？]$/.test(text)) {
      // 全大寫或首字母大寫
      if (text === text.toUpperCase() || /^[A-Z]/.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 檢測標題層級
   */
  private detectHeadingLevel(text: string): number {
    const match = text.match(/^(#{1,6})\s/);
    if (match) {
      return match[1].length;
    }

    // 根據文本特徵推測層級
    if (text === text.toUpperCase()) return 1;
    if (text.length < 30) return 2;
    return 3;
  }

  /**
   * 按結構切分（改進版：確保每個 chunk 都包含完整的標題層級）
   */
  private splitByStructure(
    nodes: DocumentNode[],
    rootTitle: string
  ): Array<{ content: string; headingPath: string[] }> {
    const chunks: Array<{ content: string; headingPath: string[] }> = [];
    let currentChunk = '';
    let currentHeadings: string[] = [rootTitle];
    let headingStack: Array<{ level: number; text: string }> = [];

    // 用於重建標題層級的函數
    const rebuildHeadingContext = (): string => {
      return headingStack.map(h => h.text).join('\n\n') + '\n\n';
    };

    for (const node of nodes) {
      if (node.type === 'heading') {
        // 更新標題堆疊
        const level = node.level || 1;

        // 移除更深層級的標題
        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }

        headingStack.push({ level, text: node.text });
        currentHeadings = [rootTitle, ...headingStack.map(h => h.text)];

        // 如果當前 chunk 太大，切分
        if (currentChunk.length > this.MAX_CHUNK_SIZE) {
          chunks.push({
            content: currentChunk.trim(),
            headingPath: [...currentHeadings],
          });
          // 重新開始新 chunk，包含完整的標題層級
          currentChunk = rebuildHeadingContext();
        }

        // 添加標題到 chunk
        currentChunk += `${node.text}\n\n`;
      } else if (node.type === 'paragraph') {
        const newContent = currentChunk + node.text + '\n\n';

        // 如果添加這段會超過大小限制
        if (newContent.length > this.MAX_CHUNK_SIZE && currentChunk.length > this.MIN_CHUNK_SIZE) {
          chunks.push({
            content: currentChunk.trim(),
            headingPath: [...currentHeadings],
          });
          // 重新開始新 chunk，包含完整的標題層級
          currentChunk = rebuildHeadingContext() + node.text + '\n\n';
        } else {
          currentChunk = newContent;
        }
      }
    }

    // 添加最後的 chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        headingPath: [...currentHeadings],
      });
    }

    return chunks;
  }
}


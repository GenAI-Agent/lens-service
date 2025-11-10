// import { prisma } from '../lib/prisma'; // Removed: Using API mode
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface KnowledgeFile {
  id: string;
  name: string;
  file_type: string;
  url?: string;
  status: 'pending' | 'processing' | 'active' | 'error' | 'invalid';
  created_at: Date;
  updated_at: Date;
  last_check?: Date;
  metadata?: any;
}

interface TextChunk {
  content: string;
  index: number;
}

/**
 * Knowledge Base Service
 * 處理 URL 知識庫管理，支持文本切塊和 Hybrid Search
 */
export class KnowledgeBaseService {
  private static readonly CHUNK_SIZE = 500;
  private static readonly CHUNK_OVERLAP = 50;

  private static generateFingerprint(content: string): string {
    return Buffer.from(content).toString('base64').substring(0, 64);
  }

  private static detectFileType(url: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.pdf')) return 'pdf';
    if (urlLower.endsWith('.docx') || urlLower.endsWith('.doc')) return 'docx';
    if (urlLower.endsWith('.xlsx') || urlLower.endsWith('.xls')) return 'excel';
    if (urlLower.endsWith('.csv')) return 'csv';
    if (urlLower.endsWith('.txt')) return 'text';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
    if (urlLower.match(/\.(mp4|avi|mov|wmv)$/)) return 'video';
    return 'webpage';
  }

  private static splitIntoChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);
      const chunk = text.substring(startIndex, endIndex);
      
      chunks.push({
        content: chunk.trim(),
        index: chunkIndex,
      });

      startIndex += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
      chunkIndex++;
    }

    return chunks.filter(chunk => chunk.content.length > 0);
  }

  private static async generateEmbedding(text: string): Promise<number[]> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;

    if (!endpoint || !apiKey || !deployment) {
      throw new Error('Azure OpenAI configuration missing');
    }

    const url = endpoint + '/openai/deployments/' + deployment + '/embeddings?api-version=2023-05-15';

    const response = await axios.post(
      url,
      { input: text.substring(0, 8000) },
      { headers: { 'Content-Type': 'application/json', 'api-key': apiKey } }
    );

    return response.data.data[0].embedding;
  }

  private static async fetchURLContent(url: string, fileType: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (fileType === 'webpage' || fileType === 'text') {
      if (typeof response.data === 'string') {
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header').remove();
        const text = $('body').text().trim();
        return text.replace(/\s+/g, ' ').substring(0, 50000);
      }
      return response.data.substring(0, 50000);
    }

    return '[' + fileType.toUpperCase() + ' file: ' + url + ']';
  }

  private static async processURL(id: string, url: string, fileType: string): Promise<void> {
    try {
      // API-based URL processing not implemented
      // This service is designed to work with external API endpoints
      console.warn('processURL not yet implemented in API mode');
      return;
    } catch (error) {
      console.error('Error processing URL: ' + url, error);
    }
  }

  /**
   * Add a URL to the knowledge base
   * Note: This method requires API backend implementation
   */
  static async addUrl(url: string, fileType?: string, name?: string): Promise<KnowledgeFile> {
    throw new Error('API-based URL addition not implemented. Please use backend API.');
  }

  /**
   * Get all files from the knowledge base
   * Note: This method requires API backend implementation
   */
  static async getFiles(): Promise<KnowledgeFile[]> {
    console.warn('getFiles not implemented in API mode');
    return [];
  }

  /**
   * Delete a file from the knowledge base
   * Note: This method requires API backend implementation
   */
  static async deleteFile(id: string): Promise<void> {
    console.warn('deleteFile not implemented in API mode');
  }

  /**
   * Remove invalid URLs from the knowledge base
   * Note: This method requires API backend implementation
   */
  static async removeInvalidUrls(): Promise<number> {
    console.warn('removeInvalidUrls not implemented in API mode');
    return 0;
  }

  /**
   * Refresh a file in the knowledge base
   * Note: This method requires API backend implementation
   */
  static async refreshFile(id: string): Promise<void> {
    console.warn('refreshFile not implemented in API mode');
  }

  static async batchAddUrls(urls: string[]): Promise<KnowledgeFile[]> {
    const results: KnowledgeFile[] = [];

    for (const url of urls) {
      try {
        const file = await this.addUrl(url.trim());
        results.push(file);
      } catch (error) {
        console.error('Error adding URL: ' + url, error);
      }
    }

    return results;
  }

  static parseBatchImportText(text: string): string[] {
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  static async refreshAll(): Promise<void> {
    const files = await this.getFiles();
    for (const file of files) {
      if (file.url) {
        await this.refreshFile(file.id).catch(console.error);
      }
    }
  }

  static getFileTypeText(fileType: string): string {
    const types: Record<string, string> = {
      webpage: '網頁',
      pdf: 'PDF',
      docx: 'Word',
      excel: 'Excel',
      csv: 'CSV',
      text: '文字',
      image: '圖片',
      video: '影片',
    };
    return types[fileType] || fileType;
  }

  static getStatusText(status: string): string {
    const statuses: Record<string, string> = {
      pending: '<span style="color: #f59e0b;">⏳ 等待處理</span>',
      processing: '<span style="color: #3b82f6;">⚙️ 處理中</span>',
      active: '<span style="color: #10b981;">✅ 正常</span>',
      error: '<span style="color: #ef4444;">❌ 錯誤</span>',
      invalid: '<span style="color: #6b7280;">⚠️ 失效</span>',
    };
    return statuses[status] || `<span style="color: #6b7280;">${status}</span>`;
  }

  static formatTime(date: Date): string {
    return new Date(date).toLocaleString('zh-TW');
  }
}


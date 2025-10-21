import { HybridSearchService } from './HybridSearchService';
import { DatabaseService } from './DatabaseService';
import axios from 'axios';

export interface ManualIndex {
  id: string;
  name: string;
  description?: string;
  content: string;
  url?: string;
  type: string;
  file_type?: string;
  status?: string;
  last_check?: Date;
  keywords?: any;
  fingerprint: string;
  metadata?: any;
  created_at?: Date;
  updated_at?: Date;
}

export class ManualIndexService {
  private static generateFingerprint(text: string): string {
    return Buffer.from(text).toString('base64').substring(0, 64);
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
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      }
    );

    return response.data.data[0].embedding;
  }

  static async getAll(): Promise<ManualIndex[]> {
    return await DatabaseService.getManualIndexes();
  }

  static async getAllURLs(): Promise<ManualIndex[]> {
    const indexes = await DatabaseService.getManualIndexes();
    return indexes.filter((index: ManualIndex) => index.type === 'url');
  }

  static async getById(id: string): Promise<ManualIndex | null> {
    const indexes = await DatabaseService.getManualIndexes();
    return indexes.find((index: ManualIndex) => index.id === id) || null;
  }

  static async create(data: {
    title: string;
    content: string;
    url?: string;
    description?: string;
  }): Promise<ManualIndex> {
    await DatabaseService.createManualIndex(
      data.title,
      data.description || '',
      data.content,
      data.url
    );

    // Return the created index (fetch it back)
    const indexes = await DatabaseService.getManualIndexes();
    const created = indexes.find((index: ManualIndex) => index.name === data.title);
    if (!created) {
      throw new Error('Failed to create manual index');
    }
    return created;
  }

  static async update(
    id: string,
    data: { title?: string; content?: string; url?: string; description?: string }
  ): Promise<ManualIndex | null> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Manual index not found');
    }

    await DatabaseService.updateManualIndex(
      id,
      data.title || existing.name,
      data.description || existing.description || '',
      data.content || existing.content,
      data.url || existing.url
    );

    return await this.getById(id);
  }

  static async delete(id: string): Promise<boolean> {
    await DatabaseService.deleteManualIndex(id);
    return true;
  }

  static async search(query: string, limit: number = 3, minScore: number = 0.15): Promise<any[]> {
    console.log(`🔍 ManualIndexService.search() using Hybrid Search (limit=${limit}, minScore=${minScore})`);
    const results = await HybridSearchService.search({ query, limit, minScore });
    console.log('✅ Found', results.length, 'results');
    return results;
  }
}

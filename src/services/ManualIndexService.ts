import { DatabaseService } from './DatabaseService';

export class ManualIndexService {
  static async getAll(): Promise<any[]> {
    try {
      return await DatabaseService.getManualIndexes();
    } catch (e) {
      console.error('Failed to get manual indexes:', e);
      return [];
    }
  }
  
  static async getById(id: string): Promise<any | null> {
    const indexes = await this.getAll();
    return indexes.find(idx => idx.id.toString() === id) || null;
  }
  
  static async create(data: { title: string; content: string; url?: string; description?: string; }): Promise<any> {
    try {
      await DatabaseService.createManualIndex(data.title, data.description || '', data.content, data.url || '', []);
      console.log('Created manual index:', data.title);
      return { success: true };
    } catch (error) {
      console.error('Failed to create manual index:', error);
      throw error;
    }
  }

  static async update(id: string, data: { title?: string; content?: string; url?: string; description?: string; }): Promise<any | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) return null;
      await DatabaseService.updateManualIndex(
        id,
        data.title || existing.name,
        data.description !== undefined ? data.description : (existing.description || ''),
        data.content || existing.content,
        data.url !== undefined ? data.url : existing.url,
        []
      );
      console.log('Updated manual index:', id);
      return { success: true };
    } catch (error) {
      console.error('Failed to update manual index:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await DatabaseService.deleteManualIndex(id);
      console.log('Deleted manual index:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete manual index:', error);
      return false;
    }
  }
  
  static async search(query: string): Promise<any[]> {
    try {
      console.log('🔍 ManualIndexService.search() called with query:', query);
      const indexes = await this.getAll();
      console.log('🔍 ManualIndexService.getAll() returned:', indexes.length, 'indexes');
      if (indexes.length > 0) {
        console.log('🔍 First index:', indexes[0]);
      }
      if (!query.trim()) return indexes;
      const queryLower = query.toLowerCase();
      console.log('🔍 Query (lowercase):', queryLower);
      const results = indexes.filter(index => {
        const title = (index.title || index.name || '').toLowerCase();
        const description = (index.description || '').toLowerCase();
        const content = (index.content || '').toLowerCase();
        console.log('🔍 Checking index:', { title, description: description.substring(0, 30), content: content.substring(0, 30) });
        console.log('🔍 title.includes(queryLower):', title.includes(queryLower));
        console.log('🔍 description.includes(queryLower):', description.includes(queryLower));
        console.log('🔍 content.includes(queryLower):', content.includes(queryLower));
        const matches = title.includes(queryLower) || description.includes(queryLower) || content.includes(queryLower);
        console.log('🔍 Matches:', matches);
        if (matches) {
          console.log('🔍 Match found:', { title, description: description.substring(0, 50) });
        }
        return matches;
      });
      console.log('🔍 ManualIndexService.search() returning:', results.length, 'results');
      return results;
    } catch (error) {
      console.error('Failed to search manual indexes:', error);
      return [];
    }
  }
}

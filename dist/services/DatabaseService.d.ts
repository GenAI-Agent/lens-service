export declare class DatabaseService {
    private static initialized;
    static initializePool(): Promise<void>;
    static query(sql: string, params?: any[]): Promise<any[]>;
    static initializeTables(): Promise<void>;
    private static apiCall;
    static getSettings(): Promise<any>;
    static getSetting(key: string): Promise<string | null>;
    static setSetting(key: string, value: string): Promise<void>;
    static getAdminUsers(): Promise<any[]>;
    static validateAdmin(username: string, password: string): Promise<any | null>;
    static createAdminUser(username: string, password: string, email: string): Promise<void>;
    static deleteAdminUser(id: string): Promise<void>;
    static getManualIndexes(): Promise<any[]>;
    static createManualIndex(name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void>;
    static updateManualIndex(id: string, name: string, description: string, content: string, url?: string, keywords?: string[]): Promise<void>;
    static deleteManualIndex(id: string): Promise<void>;
    static generateAllEmbeddings(): Promise<any>;
    static importUrlsBatch(urls: string[]): Promise<any>;
    static getUserOrders(userId?: string): Promise<any[]>;
    static getUserSubscriptions(userId?: string): Promise<any[]>;
    static saveConversation(conversation_id: string, user_id: string, messages: any[]): Promise<void>;
    static getConversation(conversation_id: string): Promise<any | null>;
    static getAllConversations(): Promise<any[]>;
    static getConversations(): Promise<any[]>;
    static deleteConversation(conversation_id: string): Promise<void>;
    static getConversationsByUserId(user_id: string): Promise<any[]>;
}

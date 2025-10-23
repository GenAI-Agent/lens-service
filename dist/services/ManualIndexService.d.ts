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
export declare class ManualIndexService {
    private static generateFingerprint;
    private static generateEmbedding;
    static getAll(): Promise<ManualIndex[]>;
    static getAllURLs(): Promise<ManualIndex[]>;
    static getById(id: string): Promise<ManualIndex | null>;
    static create(data: {
        title: string;
        content: string;
        url?: string;
        description?: string;
    }): Promise<ManualIndex>;
    static update(id: string, data: {
        title?: string;
        content?: string;
        url?: string;
        description?: string;
    }): Promise<ManualIndex | null>;
    static delete(id: string): Promise<boolean>;
    static search(query: string, limit?: number, minScore?: number): Promise<any[]>;
}

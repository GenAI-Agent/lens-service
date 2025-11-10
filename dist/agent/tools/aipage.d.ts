/**
 * AI Page Generation Tools
 * 包含 AI 頁面生成相關的所有工具和服務
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
interface AIPageData {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
}
export declare function saveAIPage(pageId: string, title: string, content: string): Promise<void>;
/**
 * 將 AI 頁面資料儲存到資料庫 (透過 API)
 */
export declare function saveAIPageToDB(pageId: string, title: string, template: string, books: any[], bannerImageUrl: string | null): Promise<void>;
/**
 * 從資料庫讀取 AI 頁面資料 (透過 API)
 */
export declare function getAIPageFromDB(pageId: string): Promise<any>;
export declare function getAIPage(pageId: string): Promise<AIPageData | null>;
export declare function listAIPages(): Promise<AIPageData[]>;
export declare function initAIPageTools(config?: {
    templatesDir?: string;
    fluxApiUrl?: string;
    aipagesOutputDir?: string;
}): void;
export declare const generateAIPageTool: DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    template: z.ZodEnum<{
        "neon-gradient-style": "neon-gradient-style";
        "magazine-style": "magazine-style";
        "social-feed-style": "social-feed-style";
        "comic-pop-style": "comic-pop-style";
    }>;
    books: z.ZodArray<z.ZodObject<{
        book_id: z.ZodString;
        title: z.ZodString;
        author: z.ZodString;
        price: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        rating: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>, {
    title: string;
    template: "neon-gradient-style" | "magazine-style" | "social-feed-style" | "comic-pop-style";
    books: {
        book_id: string;
        title: string;
        author: string;
        price: string;
        imageUrl: string;
        description?: string | undefined;
        rating?: string | undefined;
    }[];
}, {
    title: string;
    template: "neon-gradient-style" | "magazine-style" | "social-feed-style" | "comic-pop-style";
    books: {
        book_id: string;
        title: string;
        author: string;
        price: string;
        imageUrl: string;
        description?: string | undefined;
        rating?: string | undefined;
    }[];
}, string>;
export declare const aipageTools: DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    template: z.ZodEnum<{
        "neon-gradient-style": "neon-gradient-style";
        "magazine-style": "magazine-style";
        "social-feed-style": "social-feed-style";
        "comic-pop-style": "comic-pop-style";
    }>;
    books: z.ZodArray<z.ZodObject<{
        book_id: z.ZodString;
        title: z.ZodString;
        author: z.ZodString;
        price: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        rating: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>, {
    title: string;
    template: "neon-gradient-style" | "magazine-style" | "social-feed-style" | "comic-pop-style";
    books: {
        book_id: string;
        title: string;
        author: string;
        price: string;
        imageUrl: string;
        description?: string | undefined;
        rating?: string | undefined;
    }[];
}, {
    title: string;
    template: "neon-gradient-style" | "magazine-style" | "social-feed-style" | "comic-pop-style";
    books: {
        book_id: string;
        title: string;
        author: string;
        price: string;
        imageUrl: string;
        description?: string | undefined;
        rating?: string | undefined;
    }[];
}, string>[];
export { getAIPage as getAIPageContent };

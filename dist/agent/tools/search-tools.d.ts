import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from "../../types";
export declare function initSearchTools(config: ServiceModulerConfig): void;
/**
 * Tool: 搜尋內部內容 (頁面、AI Page、商品等)
 */
export declare const searchInternalContentTool: DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    contentTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        article: "article";
        product: "product";
        ai_page: "ai_page";
        static_page: "static_page";
    }>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        keyword: "keyword";
        semantic: "semantic";
        hybrid: "hybrid";
    }>>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
    mode: "keyword" | "semantic" | "hybrid";
    contentTypes?: ("article" | "product" | "ai_page" | "static_page")[] | undefined;
}, {
    query: string;
    contentTypes?: ("article" | "product" | "ai_page" | "static_page")[] | undefined;
    limit?: number | undefined;
    mode?: "keyword" | "semantic" | "hybrid" | undefined;
}, string>;
/**
 * Tool: 取得特定內容的完整資訊
 */
export declare const getContentDetailTool: DynamicStructuredTool<z.ZodObject<{
    contentId: z.ZodString;
}, z.core.$strip>, {
    contentId: string;
}, {
    contentId: string;
}, string>;
export declare const searchTools: (DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    contentTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        article: "article";
        product: "product";
        ai_page: "ai_page";
        static_page: "static_page";
    }>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        keyword: "keyword";
        semantic: "semantic";
        hybrid: "hybrid";
    }>>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
    mode: "keyword" | "semantic" | "hybrid";
    contentTypes?: ("article" | "product" | "ai_page" | "static_page")[] | undefined;
}, {
    query: string;
    contentTypes?: ("article" | "product" | "ai_page" | "static_page")[] | undefined;
    limit?: number | undefined;
    mode?: "keyword" | "semantic" | "hybrid" | undefined;
}, string> | DynamicStructuredTool<z.ZodObject<{
    contentId: z.ZodString;
}, z.core.$strip>, {
    contentId: string;
}, {
    contentId: string;
}, string>)[];

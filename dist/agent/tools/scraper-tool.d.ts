import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * Tool: 爬取網頁內容（單個或多個）
 *
 * 整合單個和批次爬取功能
 */
export declare const scrapeWebTool: DynamicStructuredTool<z.ZodObject<{
    urls: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    extractMode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        article: "article";
        full: "full";
    }>>>;
}, z.core.$strip>, {
    urls: string | string[];
    extractMode: "article" | "full";
}, {
    urls: string | string[];
    extractMode?: "article" | "full" | undefined;
}, string>;
export declare const scraperTools: DynamicStructuredTool<z.ZodObject<{
    urls: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    extractMode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        article: "article";
        full: "full";
    }>>>;
}, z.core.$strip>, {
    urls: string | string[];
    extractMode: "article" | "full";
}, {
    urls: string | string[];
    extractMode?: "article" | "full" | undefined;
}, string>[];

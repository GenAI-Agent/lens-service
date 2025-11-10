import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * ========================================
 * Web Scraper Tools - 整合網頁爬取功能
 * ========================================
 *
 * 包含：
 * 1. 通用網頁爬取工具 (scrape_web)
 * 2. Taaze 熱門書籍爬取工具 (search_popular_books)
 */
/**
 * Tool: 爬取網頁內容（單個或多個）
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
/**
 * Tool: 搜尋熱門書籍
 */
export declare const searchPopularBooksTool: DynamicStructuredTool<z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    limit: number;
}, {
    limit?: number | undefined;
}, string>;
export declare const webScraperTools: (DynamicStructuredTool<z.ZodObject<{
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
}, string> | DynamicStructuredTool<z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    limit: number;
}, {
    limit?: number | undefined;
}, string>)[];

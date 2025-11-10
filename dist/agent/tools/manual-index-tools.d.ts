import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * Manual Index 搜尋工具
 *
 * 使用向量搜尋 + BM25 的混合搜尋系統
 * 從 TzAI_web 的 manual_indexes 資料表中搜尋相關內容
 */
/**
 * Tool: 搜尋 Manual Index 內容
 *
 * 這是主要的知識庫搜尋工具，應該優先使用
 */
export declare const searchManualIndexTool: DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    minScore: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
    minScore: number;
}, {
    query: string;
    limit?: number | undefined;
    minScore?: number | undefined;
}, string>;
export declare const manualIndexTools: DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    minScore: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
    minScore: number;
}, {
    query: string;
    limit?: number | undefined;
    minScore?: number | undefined;
}, string>[];

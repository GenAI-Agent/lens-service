import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from '../../types';
export declare function initSearchTools(config: ServiceModulerConfig): void;
/**
 * Tool: 搜尋客服資料庫 (Manual Index)
 *
 * 這是主要的客服知識庫搜尋工具，應該優先使用
 * 使用向量搜尋 + BM25 的混合搜尋系統
 */
export declare const searchCustomerServiceDataTool: DynamicStructuredTool<z.ZodObject<{
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
/**
 * Tool: 搜尋商品 (靜態頁面、AI Pages、商品等)
 */
export declare const searchProductsTool: DynamicStructuredTool<z.ZodObject<{
    keywords: z.ZodArray<z.ZodString>;
    categories: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keywords: string[];
    limit: number;
    categories?: string[] | null | undefined;
}, {
    keywords: string[];
    categories?: string[] | null | undefined;
    limit?: number | undefined;
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
}, string> | DynamicStructuredTool<z.ZodObject<{
    keywords: z.ZodArray<z.ZodString>;
    categories: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keywords: string[];
    limit: number;
    categories?: string[] | null | undefined;
}, {
    keywords: string[];
    categories?: string[] | null | undefined;
    limit?: number | undefined;
}, string> | DynamicStructuredTool<z.ZodObject<{
    contentId: z.ZodString;
}, z.core.$strip>, {
    contentId: string;
}, {
    contentId: string;
}, string>)[];

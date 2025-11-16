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
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keywords: string[];
    limit: number;
}, {
    keywords: string[];
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
/**
 * Tool: 搜尋暢銷書
 *
 * 專門搜尋已索引的暢銷書籍（來自 books_bestsellers.jsonl）
 */
export declare const searchBestsellersTool: DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
}, {
    query: string;
    limit?: number | undefined;
}, string>;
/**
 * Tool: 搜尋79折優惠書籍
 *
 * 專門搜尋已索引的79折優惠書籍（來自 books_79_discount.jsonl）
 */
export declare const search79DiscountBooksTool: DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
}, {
    query: string;
    limit?: number | undefined;
}, string>;
/**
 * Tool: 關鍵字搜尋書籍
 *
 * 使用 BM25 純關鍵字搜尋（不使用語意向量）
 * 搜尋範圍：書名、作者、出版社
 */
export declare const keywordSearchBooksTool: DynamicStructuredTool<z.ZodObject<{
    keyword: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keyword: string;
    limit: number;
}, {
    keyword: string;
    limit?: number | undefined;
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
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keywords: string[];
    limit: number;
}, {
    keywords: string[];
    limit?: number | undefined;
}, string> | DynamicStructuredTool<z.ZodObject<{
    contentId: z.ZodString;
}, z.core.$strip>, {
    contentId: string;
}, {
    contentId: string;
}, string> | DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    limit: number;
}, {
    query: string;
    limit?: number | undefined;
}, string> | DynamicStructuredTool<z.ZodObject<{
    keyword: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    keyword: string;
    limit: number;
}, {
    keyword: string;
    limit?: number | undefined;
}, string>)[];

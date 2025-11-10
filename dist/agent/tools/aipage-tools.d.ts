import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from "../../types";
export declare function initAIPageTools(config: ServiceModulerConfig): void;
/**
 * Tool: 管理 AI Page（生成、更新、刪除）
 *
 * AI Page 用於在對話過程中生成精美的視覺化內容，增強用戶體驗。
 * 使用場景：書籍推薦列表、搜尋結果展示、訂單詳情、資料比較表格等。
 *
 * 這不是獨立功能，而是輔助對話的增強工具。
 */
export declare const manageAIPageTool: DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<{
        delete: "delete";
        update: "update";
        create: "create";
    }>;
    title: z.ZodOptional<z.ZodString>;
    htmlContent: z.ZodOptional<z.ZodString>;
    pageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    action: "delete" | "update" | "create";
    title?: string | undefined;
    htmlContent?: string | undefined;
    pageId?: string | undefined;
}, {
    action: "delete" | "update" | "create";
    title?: string | undefined;
    htmlContent?: string | undefined;
    pageId?: string | undefined;
}, string>;
/**
 * 取得 AI Page 內容（透過 API）
 */
export declare function getAIPageContent(pageId: string): Promise<any | null>;
/**
 * 列出所有 AI Page（透過 API）
 */
export declare function listAIPages(): Promise<Array<{
    pageId: string;
    createdAt: string;
}>>;
export declare const aipageTools: DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<{
        delete: "delete";
        update: "update";
        create: "create";
    }>;
    title: z.ZodOptional<z.ZodString>;
    htmlContent: z.ZodOptional<z.ZodString>;
    pageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    action: "delete" | "update" | "create";
    title?: string | undefined;
    htmlContent?: string | undefined;
    pageId?: string | undefined;
}, {
    action: "delete" | "update" | "create";
    title?: string | undefined;
    htmlContent?: string | undefined;
    pageId?: string | undefined;
}, string>[];

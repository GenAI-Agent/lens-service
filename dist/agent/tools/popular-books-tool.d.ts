import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
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
export declare const popularBooksTools: DynamicStructuredTool<z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    limit: number;
}, {
    limit?: number | undefined;
}, string>[];

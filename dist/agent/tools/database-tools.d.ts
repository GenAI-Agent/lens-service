import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from '../../types';
/**
 * 初始化資料庫連線池
 */
export declare function initDatabaseTools(config: ServiceModulerConfig, userId?: string): void;
/**
 * Tool: 查詢資料
 */
export declare const findRecordsTool: DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    orderBy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
    limit: number;
    orderBy?: string | undefined;
}, {
    tableName: string;
    conditions?: Record<string, any> | undefined;
    limit?: number | undefined;
    orderBy?: string | undefined;
}, string>;
/**
 * Tool: 新增資料
 */
export declare const createRecordTool: DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    data: Record<string, any>;
}, {
    tableName: string;
    data: Record<string, any>;
}, string>;
/**
 * Tool: 更新資料
 */
export declare const updateRecordTool: DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodRecord<z.ZodString, z.ZodAny>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
    data: Record<string, any>;
}, {
    tableName: string;
    conditions: Record<string, any>;
    data: Record<string, any>;
}, string>;
/**
 * Tool: 刪除資料
 */
export declare const deleteRecordTool: DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
}, {
    tableName: string;
    conditions: Record<string, any>;
}, string>;
export declare const databaseTools: (DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    orderBy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
    limit: number;
    orderBy?: string | undefined;
}, {
    tableName: string;
    conditions?: Record<string, any> | undefined;
    limit?: number | undefined;
    orderBy?: string | undefined;
}, string> | DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    data: Record<string, any>;
}, {
    tableName: string;
    data: Record<string, any>;
}, string> | DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodRecord<z.ZodString, z.ZodAny>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
    data: Record<string, any>;
}, {
    tableName: string;
    conditions: Record<string, any>;
    data: Record<string, any>;
}, string> | DynamicStructuredTool<z.ZodObject<{
    tableName: z.ZodString;
    conditions: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>, {
    tableName: string;
    conditions: Record<string, any>;
}, {
    tableName: string;
    conditions: Record<string, any>;
}, string>)[];

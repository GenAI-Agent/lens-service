import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ServiceModulerConfig } from '../../types';
export declare function initTelegramTools(config: ServiceModulerConfig): void;
/**
 * Tool: 發送 Telegram 通知
 * 整合客服通知與物流通知功能
 */
export declare const sendNotificationTool: DynamicStructuredTool<z.ZodObject<{
    notifyType: z.ZodEnum<{
        customer_service: "customer_service";
        logistics: "logistics";
    }>;
    userQuery: z.ZodOptional<z.ZodString>;
    questionType: z.ZodOptional<z.ZodEnum<{
        knowledge_gap: "knowledge_gap";
        sensitive_request: "sensitive_request";
        technical_error: "technical_error";
        other: "other";
    }>>;
    userId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        low: "low";
        high: "high";
        normal: "normal";
        critical: "critical";
    }>>;
    subject: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    requestType: z.ZodOptional<z.ZodEnum<{
        delete: "delete";
        other: "other";
        address_change: "address_change";
        shipping_method_change: "shipping_method_change";
        delivery_date_change: "delivery_date_change";
        item_change: "item_change";
    }>>;
    details: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    notifyType: "customer_service" | "logistics";
    userQuery?: string | undefined;
    questionType?: "knowledge_gap" | "sensitive_request" | "technical_error" | "other" | undefined;
    userId?: string | undefined;
    priority?: "low" | "high" | "normal" | "critical" | undefined;
    subject?: string | undefined;
    orderNumber?: string | undefined;
    requestType?: "delete" | "other" | "address_change" | "shipping_method_change" | "delivery_date_change" | "item_change" | undefined;
    details?: string | undefined;
}, {
    notifyType: "customer_service" | "logistics";
    userQuery?: string | undefined;
    questionType?: "knowledge_gap" | "sensitive_request" | "technical_error" | "other" | undefined;
    userId?: string | undefined;
    priority?: "low" | "high" | "normal" | "critical" | undefined;
    subject?: string | undefined;
    orderNumber?: string | undefined;
    requestType?: "delete" | "other" | "address_change" | "shipping_method_change" | "delivery_date_change" | "item_change" | undefined;
    details?: string | undefined;
}, string>;
export declare const telegramTools: DynamicStructuredTool<z.ZodObject<{
    notifyType: z.ZodEnum<{
        customer_service: "customer_service";
        logistics: "logistics";
    }>;
    userQuery: z.ZodOptional<z.ZodString>;
    questionType: z.ZodOptional<z.ZodEnum<{
        knowledge_gap: "knowledge_gap";
        sensitive_request: "sensitive_request";
        technical_error: "technical_error";
        other: "other";
    }>>;
    userId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        low: "low";
        high: "high";
        normal: "normal";
        critical: "critical";
    }>>;
    subject: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    requestType: z.ZodOptional<z.ZodEnum<{
        delete: "delete";
        other: "other";
        address_change: "address_change";
        shipping_method_change: "shipping_method_change";
        delivery_date_change: "delivery_date_change";
        item_change: "item_change";
    }>>;
    details: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    notifyType: "customer_service" | "logistics";
    userQuery?: string | undefined;
    questionType?: "knowledge_gap" | "sensitive_request" | "technical_error" | "other" | undefined;
    userId?: string | undefined;
    priority?: "low" | "high" | "normal" | "critical" | undefined;
    subject?: string | undefined;
    orderNumber?: string | undefined;
    requestType?: "delete" | "other" | "address_change" | "shipping_method_change" | "delivery_date_change" | "item_change" | undefined;
    details?: string | undefined;
}, {
    notifyType: "customer_service" | "logistics";
    userQuery?: string | undefined;
    questionType?: "knowledge_gap" | "sensitive_request" | "technical_error" | "other" | undefined;
    userId?: string | undefined;
    priority?: "low" | "high" | "normal" | "critical" | undefined;
    subject?: string | undefined;
    orderNumber?: string | undefined;
    requestType?: "delete" | "other" | "address_change" | "shipping_method_change" | "delivery_date_change" | "item_change" | undefined;
    details?: string | undefined;
}, string>[];

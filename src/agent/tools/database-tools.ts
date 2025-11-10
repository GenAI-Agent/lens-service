import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Pool } from "pg";
import type { ServiceModulerConfig } from '../../types';

/**
 * PostgreSQL 資料庫操作工具
 * 直接使用 pg 進行 SQL 操作
 */

let pool: Pool | null = null;
let currentConfig: ServiceModulerConfig | null = null;
let currentUserId: string | null = null; // 儲存當前用戶ID

/**
 * 初始化資料庫連線池
 */
export function initDatabaseTools(config: ServiceModulerConfig, userId?: string) {
  currentConfig = config;
  currentUserId = userId || null; // 儲存用戶ID

  if (pool) {
    pool.end();
    pool = null;
  }

  if (config.database) {
    if (config.database.url) {
      // 使用連接 URL
      pool = new Pool({
        connectionString: config.database.url,
      });
    } else {
      // 使用分離的參數
      pool = new Pool({
        host: config.database.host || 'localhost',
        port: config.database.port || 5432,
        database: config.database.database || '',
        user: config.database.user || '',
        password: config.database.password || '',
      });
    }

    console.log('[DatabaseTools] PostgreSQL pool initialized');
  }
}

/**
 * 獲取資料庫連線池
 */
function getPool(): Pool {
  if (!pool) {
    throw new Error("Database not configured. Please provide database configuration.");
  }
  return pool;
}

// inspect_database tool 已移除
// Agent 應該從 system prompt 中的 database-schema.json 資訊來了解表結構
// 不應直接查詢 information_schema，避免洩漏完整的資料庫結構

/**
 * Tool: 查詢資料
 */
export const findRecordsTool = new DynamicStructuredTool({
  name: "find_records",
  description: `查詢資料表中的記錄。

**重要使用規則**：
- 用戶查詢訂單時，自動使用系統傳入的 userId（不要要求用戶提供）
- conditions 使用 JSON 格式，例如 {"cust_id": "GL_123", "status_flg": "10"}
- 支援模糊搜尋，使用 LIKE，例如 {"prod_name": "%書%"}`,
  schema: z.object({
    tableName: z.string().describe("資料表名稱"),
    conditions: z.record(z.string(), z.any()).default({}).describe("查詢條件 (JSON格式)"),
    limit: z.number().optional().default(10).describe("限制返回筆數"),
    orderBy: z.string().optional().describe("排序欄位，例如 'created_at DESC'"),
  }),
  func: async ({ tableName, conditions, limit = 10, orderBy }) => {
    try {
      const db = getPool();

      // 確保 conditions 一定是物件（雙重保險）
      const safeConditions = conditions || {};

      // 🔒 安全檢查：敏感表格強制用戶隔離
      if (tableName === 'order_mas') {
        if (!currentUserId) {
          console.error('[DatabaseTools] ⚠️ SECURITY: No userId available for order_mas query!');
          return JSON.stringify({
            success: false,
            error: '安全錯誤：無法確認用戶身份，無法查詢訂單',
            tableName,
          });
        }

        // 強制注入 cust_id，不管 Agent 有沒有傳
        safeConditions.cust_id = currentUserId;
        console.log(`[DatabaseTools] 🔒 AUTO-INJECTED cust_id: ${currentUserId}`);
      }

      if (tableName === 'User') {
        if (!currentUserId) {
          console.error('[DatabaseTools] ⚠️ SECURITY: No userId available for User query!');
          return JSON.stringify({
            success: false,
            error: '安全錯誤：無法確認用戶身份，無法查詢用戶資料',
            tableName,
          });
        }

        // 強制注入 id 或 email，只能查看自己的資料
        if (!safeConditions.id && !safeConditions.email) {
          safeConditions.id = currentUserId;
        }
        console.log(`[DatabaseTools] 🔒 AUTO-INJECTED User id filter: ${currentUserId}`);
      }

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(safeConditions)) {
        if (typeof value === 'string' && value.includes('%')) {
          // LIKE 查詢
          whereClauses.push(`${key} LIKE $${paramIndex}`);
          values.push(value);
        } else {
          // 等於查詢
          whereClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0
        ? 'WHERE ' + whereClauses.join(' AND ')
        : '';

      const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';

      const query = `
        SELECT * FROM ${tableName}
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex}
      `;

      values.push(limit);

      console.log('[DatabaseTools] Executing query:', query);
      console.log('[DatabaseTools] Query values:', values);

      const result = await db.query(query, values);

      return JSON.stringify({
        success: true,
        tableName,
        records: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error('[DatabaseTools] Find records error:', error);
      return JSON.stringify({
        success: false,
        error: error.message,
        tableName,
      });
    }
  },
});

/**
 * Tool: 新增資料
 */
export const createRecordTool = new DynamicStructuredTool({
  name: "create_record",
  description: "在資料表中新增一筆記錄",
  schema: z.object({
    tableName: z.string().describe("資料表名稱"),
    data: z.record(z.string(), z.any()).describe("要新增的資料 (JSON格式)"),
  }),
  func: async ({ tableName, data }) => {
    try {
      const db = getPool();

      // 🔒 安全檢查：限制新增操作
      if (tableName === 'order_item') {
        // order_item 不允許直接新增，必須透過訂單系統
        console.error('[DatabaseTools] ⚠️ SECURITY: Direct INSERT to order_item is not allowed!');
        return JSON.stringify({
          success: false,
          error: '安全錯誤：訂單明細不允許直接新增，請透過訂單系統操作',
          tableName,
        });
      }

      if (tableName === 'User') {
        // User 表通常由 NextAuth 管理，不應該直接插入
        console.error('[DatabaseTools] ⚠️ SECURITY: Direct INSERT to User table is not recommended!');
        return JSON.stringify({
          success: false,
          error: '安全錯誤：用戶帳戶由系統管理，不允許直接新增',
          tableName,
        });
      }

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      console.log('[DatabaseTools] Inserting record:', query);
      console.log('[DatabaseTools] Insert values:', values);

      const result = await db.query(query, values);

      return JSON.stringify({
        success: true,
        tableName,
        record: result.rows[0],
        message: '記錄新增成功',
      });
    } catch (error: any) {
      console.error('[DatabaseTools] Create record error:', error);

      // 發送通知給客服
      return JSON.stringify({
        success: false,
        error: error.message,
        tableName,
        message: '新增失敗，請使用 notify_customer_service 通知客服',
      });
    }
  },
});

/**
 * Tool: 更新資料
 */
export const updateRecordTool = new DynamicStructuredTool({
  name: "update_record",
  description: "更新資料表中的記錄",
  schema: z.object({
    tableName: z.string().describe("資料表名稱"),
    conditions: z.record(z.string(), z.any()).describe("更新條件 (JSON格式)，例如 {\"order_id\": \"ORD123\"}"),
    data: z.record(z.string(), z.any()).describe("要更新的資料 (JSON格式)"),
  }),
  func: async ({ tableName, conditions, data }) => {
    try {
      const db = getPool();

      // 🔒 安全檢查：敏感表格強制用戶隔離
      const safeConditions = { ...conditions };

      if (tableName === 'order_mas') {
        if (!currentUserId) {
          console.error('[DatabaseTools] ⚠️ SECURITY: No userId available for order_mas update!');
          return JSON.stringify({
            success: false,
            error: '安全錯誤：無法確認用戶身份，無法更新訂單',
            tableName,
          });
        }

        // 強制注入 cust_id 到 WHERE 條件，確保只能修改自己的訂單
        safeConditions.cust_id = currentUserId;
        console.log(`[DatabaseTools] 🔒 AUTO-INJECTED cust_id for UPDATE: ${currentUserId}`);

        // 檢查是否試圖修改主鍵或用戶ID（這些是真正不應該修改的）
        const prohibitedFields = ['pk_no', 'cust_id'];
        const attemptedFields = Object.keys(data);
        const violations = attemptedFields.filter(f => prohibitedFields.includes(f));

        if (violations.length > 0) {
          console.error(`[DatabaseTools] ⚠️ SECURITY: Attempt to update prohibited fields: ${violations.join(', ')}`);
          return JSON.stringify({
            success: false,
            error: `安全錯誤：不允許修改以下欄位：${violations.join(', ')}（主鍵或用戶ID）`,
            tableName,
          });
        }

        // 允許修改其他所有欄位（包括地址、配送方式、備註等）
        console.log(`[DatabaseTools] ✅ Allowed UPDATE fields:`, Object.keys(data));
      }

      if (tableName === 'User') {
        if (!currentUserId) {
          console.error('[DatabaseTools] ⚠️ SECURITY: No userId available for User update!');
          return JSON.stringify({
            success: false,
            error: '安全錯誤：無法確認用戶身份，無法更新用戶資料',
            tableName,
          });
        }

        // 強制注入 id 到 WHERE 條件，只能修改自己的資料
        if (!safeConditions.id && !safeConditions.email) {
          safeConditions.id = currentUserId;
        }
        console.log(`[DatabaseTools] 🔒 AUTO-INJECTED User id for UPDATE: ${currentUserId}`);
      }

      if (tableName === 'order_item') {
        // order_item 允許修改，但需要同時通知物流
        console.warn('[DatabaseTools] ⚠️ WARNING: Updating order_item - should notify logistics!');

        // 檢查是否有訂單編號關聯，確保只能修改有權限的訂單項目
        if (!safeConditions.mas_no && !safeConditions.pk_no) {
          return JSON.stringify({
            success: false,
            error: '安全錯誤：修改訂單明細時必須指定 mas_no 或 pk_no',
            tableName,
          });
        }
      }

      // 構建 SET 子句
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(data)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      for (const [key, value] of Object.entries(safeConditions)) {
        whereClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const query = `
        UPDATE ${tableName}
        SET ${setClauses.join(', ')}
        WHERE ${whereClauses.join(' AND ')}
        RETURNING *
      `;

      console.log('[DatabaseTools] Updating record:', query);
      console.log('[DatabaseTools] Update values:', values);

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return JSON.stringify({
          success: false,
          tableName,
          message: '找不到符合條件的記錄',
        });
      }

      return JSON.stringify({
        success: true,
        tableName,
        records: result.rows,
        count: result.rows.length,
        message: `成功更新 ${result.rows.length} 筆記錄`,
      });
    } catch (error: any) {
      console.error('[DatabaseTools] Update record error:', error);

      return JSON.stringify({
        success: false,
        error: error.message,
        tableName,
        message: '更新失敗，請使用 notify_customer_service 通知客服',
      });
    }
  },
});

/**
 * Tool: 刪除資料
 */
export const deleteRecordTool = new DynamicStructuredTool({
  name: "delete_record",
  description: "刪除資料表中的記錄（請謹慎使用）",
  schema: z.object({
    tableName: z.string().describe("資料表名稱"),
    conditions: z.record(z.string(), z.any()).describe("刪除條件 (JSON格式)"),
  }),
  func: async ({ tableName, conditions }) => {
    try {
      const db = getPool();

      // 🔒 安全檢查：嚴格限制刪除操作
      // 根據 database-schema.json，DELETE 是 dangerous_operation
      const protectedTables = ['User', 'order_mas', 'order_item'];

      if (protectedTables.includes(tableName)) {
        console.error(`[DatabaseTools] ⚠️ SECURITY: DELETE operation blocked on protected table: ${tableName}`);
        return JSON.stringify({
          success: false,
          error: `安全錯誤：不允許刪除 ${tableName} 表的記錄，請聯繫客服處理`,
          tableName,
        });
      }

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(conditions)) {
        whereClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const query = `
        DELETE FROM ${tableName}
        WHERE ${whereClauses.join(' AND ')}
        RETURNING *
      `;

      console.log('[DatabaseTools] Deleting record:', query);
      console.log('[DatabaseTools] Delete values:', values);

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return JSON.stringify({
          success: false,
          tableName,
          message: '找不到符合條件的記錄',
        });
      }

      return JSON.stringify({
        success: true,
        tableName,
        deletedRecords: result.rows,
        count: result.rows.length,
        message: `成功刪除 ${result.rows.length} 筆記錄`,
      });
    } catch (error: any) {
      console.error('[DatabaseTools] Delete record error:', error);

      return JSON.stringify({
        success: false,
        error: error.message,
        tableName,
        message: '刪除失敗，請使用 notify_customer_service 通知客服',
      });
    }
  },
});

export const databaseTools = [
  findRecordsTool,
  createRecordTool,
  updateRecordTool,
  deleteRecordTool,
];

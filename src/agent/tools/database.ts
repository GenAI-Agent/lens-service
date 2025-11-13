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
  description: `Queries records from a database table with optional filtering, sorting, and limit.

Use this tool when you need to retrieve data from any table in the database. The database schema is provided in the system prompt - refer to it to understand available tables and their columns.

Examples:
- Find recent orders: {"tableName": "order_mas", "limit": 5, "orderBy": "created_at DESC"}
- Search by condition: {"tableName": "product_mas", "conditions": {"category": "books"}}
- Pattern matching: {"tableName": "product_mas", "conditions": {"name": "%心理學%"}}`,
  schema: z.object({
    tableName: z.string().describe("The name of the database table to query"),
    conditions: z.record(z.string(), z.any()).default({}).describe("Filter conditions as JSON object. Use '%' wildcards for LIKE matching. Example: {\"status\": \"active\", \"name\": \"%search%\"}"),
    limit: z.number().optional().default(10).describe("Maximum number of records to return (default: 10)"),
    orderBy: z.string().optional().describe("Sort column with direction. Example: 'created_at DESC' or 'price ASC'"),
  }),
  func: async ({ tableName, conditions, limit = 10, orderBy }) => {
    try {
      const db = getPool();

      // 確保 conditions 一定是物件
      const safeConditions = conditions || {};

      // ⚠️ 測試模式：移除所有安全限制
      console.log(`[DatabaseTools] 🔓 TEST MODE: No security restrictions on ${tableName}`);

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(safeConditions)) {
        if (typeof value === 'string' && value.includes('%')) {
          // LIKE 查詢
          whereClauses.push(`"${key}" LIKE $${paramIndex}`);
          values.push(value);
        } else {
          // 等於查詢
          whereClauses.push(`"${key}" = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0
        ? 'WHERE ' + whereClauses.join(' AND ')
        : '';

      const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';

      const query = `
        SELECT * FROM "${tableName}"
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
  description: `Creates a new record in a database table.

Use this tool to insert new data into any table. The database schema in the system prompt shows which columns are required vs optional for each table.

Example: Insert a new product record with title, price, and category fields.`,
  schema: z.object({
    tableName: z.string().describe("The name of the database table where the record will be inserted"),
    data: z.record(z.string(), z.any()).describe("The record data as a JSON object. Keys are column names, values are the data to insert. Example: {\"title\": \"Book Name\", \"price\": 299, \"category\": \"psychology\"}"),
  }),
  func: async ({ tableName, data }) => {
    try {
      const db = getPool();

      // ⚠️ 測試模式：移除所有安全限制
      console.log(`[DatabaseTools] 🔓 TEST MODE: Allowing INSERT to ${tableName}`);

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const quotedColumns = columns.map(col => `"${col}"`).join(', ');

      const query = `
        INSERT INTO "${tableName}" (${quotedColumns})
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
  description: `Updates existing records in a database table that match the specified conditions.

Use this tool to modify existing data in any table. Specify which records to update using the conditions parameter, and what changes to make using the data parameter.

Example: Update the status of all pending orders to confirmed.`,
  schema: z.object({
    tableName: z.string().describe("The name of the database table containing records to update"),
    conditions: z.record(z.string(), z.any()).describe("Filter conditions to select which records to update. JSON object format. Example: {\"id\": 123} or {\"status\": \"pending\"}"),
    data: z.record(z.string(), z.any()).describe("The updated field values as a JSON object. Example: {\"status\": \"confirmed\", \"updated_at\": \"2024-01-01\"}"),
  }),
  func: async ({ tableName, conditions, data }) => {
    try {
      const db = getPool();

      // ⚠️ 測試模式：移除所有安全限制
      console.log(`[DatabaseTools] 🔓 TEST MODE: Allowing UPDATE to ${tableName}`);
      const safeConditions = { ...conditions };

      // 構建 SET 子句
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(data)) {
        setClauses.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      for (const [key, value] of Object.entries(safeConditions)) {
        whereClauses.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const query = `
        UPDATE "${tableName}"
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
  description: `Deletes records from a database table that match the specified conditions.

Use this tool carefully to remove data from any table. Always specify precise conditions to avoid accidentally deleting unintended records.

Example: Delete a cancelled order by its ID.`,
  schema: z.object({
    tableName: z.string().describe("The name of the database table from which to delete records"),
    conditions: z.record(z.string(), z.any()).describe("Filter conditions to select which records to delete. JSON object format. Be specific to avoid unintended deletions. Example: {\"id\": 123} or {\"status\": \"cancelled\", \"created_at\": \"2024-01-01\"}"),
  }),
  func: async ({ tableName, conditions }) => {
    try {
      const db = getPool();

      // ⚠️ 測試模式：移除所有安全限制
      console.log(`[DatabaseTools] 🔓 TEST MODE: Allowing DELETE from ${tableName}`);

      // 構建 WHERE 子句
      const whereClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(conditions)) {
        whereClauses.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      const query = `
        DELETE FROM "${tableName}"
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

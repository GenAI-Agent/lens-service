/**
 * Lens Service v3 - Database Service
 *
 * PostgreSQL database service with connection pooling,
 * transaction support, and pgvector integration.
 */

import { Pool, PoolClient, QueryResult, QueryConfig } from 'pg';
import type {
  DatabaseConfig,
  QueryResult as LensQueryResult,
  MutationResult,
  QueryOptions,
  InsertOptions,
  UpdateOptions,
  DeleteOptions,
  PoolStatus,
  TransactionContext,
} from '@lens-service/shared';
import { generateId } from '@lens-service/shared';

export interface DatabaseServiceOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export class DatabaseService {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(options: DatabaseServiceOptions) {
    this.pool = new Pool({
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      ssl: options.ssl,
      max: options.maxConnections ?? 20,
      idleTimeoutMillis: options.idleTimeoutMs ?? 30000,
      connectionTimeoutMillis: options.connectionTimeoutMs ?? 10000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('[DatabaseService] Unexpected pool error:', err);
    });
  }

  /**
   * Initialize the database connection and verify connectivity
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connection
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('[DatabaseService] Database connection established');

        // Enable pgvector extension if available
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('[DatabaseService] pgvector extension enabled');

        this.initialized = true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query
   */
  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<LensQueryResult<T>> {
    const start = Date.now();

    try {
      const result = await this.pool.query(sql, params);
      const durationMs = Date.now() - start;

      return {
        success: true,
        data: result.rows as T[],
        count: result.rowCount ?? 0,
        queryInfo: {
          sql,
          params,
          durationMs,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[DatabaseService] Query error:', message);

      return {
        success: false,
        data: [],
        count: 0,
        error: message,
        queryInfo: {
          sql,
          params,
          durationMs: Date.now() - start,
        },
      };
    }
  }

  /**
   * Execute a SELECT query with options
   */
  async select<T = Record<string, unknown>>(
    options: QueryOptions
  ): Promise<LensQueryResult<T>> {
    const { tableName, columns, conditions, orderBy, limit, offset, joins } = options;

    // Build SELECT clause
    const selectColumns = columns?.length ? columns.join(', ') : '*';

    // Build FROM clause with joins
    let fromClause = tableName;
    if (joins?.length) {
      for (const join of joins) {
        fromClause += ` ${join.type} JOIN ${join.table} ON ${tableName}.${join.on.sourceColumn} = ${join.table}.${join.on.targetColumn}`;
      }
    }

    // Build WHERE clause
    const { whereClause, params } = this.buildWhereClause(conditions);

    // Build ORDER BY clause
    let orderClause = '';
    if (orderBy?.length) {
      orderClause = ` ORDER BY ${orderBy.map((o) => `${o.column} ${o.direction}`).join(', ')}`;
    }

    // Build LIMIT/OFFSET clause
    let limitClause = '';
    if (limit !== undefined) {
      limitClause = ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    if (offset !== undefined) {
      limitClause += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    const sql = `SELECT ${selectColumns} FROM ${fromClause}${whereClause}${orderClause}${limitClause}`;

    return this.query<T>(sql, params);
  }

  /**
   * Insert a record
   */
  async insert<T = Record<string, unknown>>(
    options: InsertOptions
  ): Promise<MutationResult<T>> {
    const { tableName, data, returning } = options;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    let sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (returning?.length) {
      sql += ` RETURNING ${returning.join(', ')}`;
    }

    try {
      const result = await this.pool.query(sql, values);

      return {
        success: true,
        affectedRows: result.rowCount ?? 0,
        data: result.rows[0] as T,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        affectedRows: 0,
        error: message,
      };
    }
  }

  /**
   * Update records
   */
  async update<T = Record<string, unknown>>(
    options: UpdateOptions
  ): Promise<MutationResult<T>> {
    const { tableName, data, conditions, returning } = options;

    const setClauses: string[] = [];
    const params: unknown[] = [];

    // Build SET clause
    Object.entries(data).forEach(([key, value], index) => {
      setClauses.push(`${key} = $${index + 1}`);
      params.push(value);
    });

    // Build WHERE clause
    const { whereClause, params: whereParams } = this.buildWhereClause(
      conditions,
      params.length
    );
    params.push(...whereParams);

    let sql = `UPDATE ${tableName} SET ${setClauses.join(', ')}${whereClause}`;

    if (returning?.length) {
      sql += ` RETURNING ${returning.join(', ')}`;
    }

    try {
      const result = await this.pool.query(sql, params);

      return {
        success: true,
        affectedRows: result.rowCount ?? 0,
        data: result.rows[0] as T,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        affectedRows: 0,
        error: message,
      };
    }
  }

  /**
   * Delete records
   */
  async delete<T = Record<string, unknown>>(
    options: DeleteOptions
  ): Promise<MutationResult<T>> {
    const { tableName, conditions, returning } = options;

    const { whereClause, params } = this.buildWhereClause(conditions);

    let sql = `DELETE FROM ${tableName}${whereClause}`;

    if (returning?.length) {
      sql += ` RETURNING ${returning.join(', ')}`;
    }

    try {
      const result = await this.pool.query(sql, params);

      return {
        success: true,
        affectedRows: result.rowCount ?? 0,
        data: result.rows[0] as T,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        affectedRows: 0,
        error: message,
      };
    }
  }

  /**
   * Execute a vector similarity search
   */
  async vectorSearch<T = Record<string, unknown>>(
    tableName: string,
    vectorColumn: string,
    queryVector: number[],
    options: {
      topK?: number;
      minScore?: number;
      distanceMetric?: 'cosine' | 'euclidean' | 'inner_product';
      selectColumns?: string[];
      conditions?: Record<string, unknown>;
    } = {}
  ): Promise<LensQueryResult<T & { similarity: number }>> {
    const {
      topK = 10,
      minScore,
      distanceMetric = 'cosine',
      selectColumns = ['*'],
      conditions,
    } = options;

    // Build distance operator based on metric
    const distanceOperators: Record<string, string> = {
      cosine: '<=>',       // 1 - cosine similarity
      euclidean: '<->',    // L2 distance
      inner_product: '<#>', // negative inner product
    };
    const operator = distanceOperators[distanceMetric];

    // Convert to vector string
    const vectorStr = `[${queryVector.join(',')}]`;

    // Build similarity score expression
    // For cosine, we convert distance to similarity (1 - distance)
    const similarityExpr =
      distanceMetric === 'cosine'
        ? `1 - (${vectorColumn} ${operator} '${vectorStr}'::vector)`
        : distanceMetric === 'inner_product'
        ? `-(${vectorColumn} ${operator} '${vectorStr}'::vector)`
        : `1 / (1 + (${vectorColumn} ${operator} '${vectorStr}'::vector))`;

    // Build WHERE clause
    const { whereClause, params } = this.buildWhereClause(conditions);

    // Add minimum score filter
    let scoreFilter = '';
    if (minScore !== undefined) {
      scoreFilter = whereClause
        ? ` AND ${similarityExpr} >= $${params.length + 1}`
        : ` WHERE ${similarityExpr} >= $${params.length + 1}`;
      params.push(minScore);
    }

    const sql = `
      SELECT ${selectColumns.join(', ')}, ${similarityExpr} as similarity
      FROM ${tableName}
      ${whereClause}${scoreFilter}
      ORDER BY ${vectorColumn} ${operator} '${vectorStr}'::vector
      LIMIT $${params.length + 1}
    `;
    params.push(topK);

    return this.query<T & { similarity: number }>(sql, params);
  }

  /**
   * Execute operations within a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient, context: TransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const context: TransactionContext = {
      id: generateId('txn'),
      startedAt: new Date(),
      queries: [],
    };

    try {
      await client.query('BEGIN');

      const result = await callback(client, context);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool status
   */
  getPoolStatus(): PoolStatus {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.initialized = false;
    console.log('[DatabaseService] Connection pool closed');
  }

  /**
   * Build WHERE clause from conditions object
   */
  private buildWhereClause(
    conditions?: Record<string, unknown>,
    paramOffset: number = 0
  ): { whereClause: string; params: unknown[] } {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { whereClause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: unknown[] = [];

    Object.entries(conditions).forEach(([key, value], index) => {
      const paramIndex = paramOffset + index + 1;

      if (value === null) {
        clauses.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
        clauses.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle operators like { $gt: 10, $lt: 100 }
        const ops = value as Record<string, unknown>;
        Object.entries(ops).forEach(([op, opValue]) => {
          const sqlOp = this.getSqlOperator(op);
          clauses.push(`${key} ${sqlOp} $${paramOffset + params.length + 1}`);
          params.push(opValue);
        });
      } else {
        clauses.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
    });

    return {
      whereClause: ` WHERE ${clauses.join(' AND ')}`,
      params,
    };
  }

  /**
   * Convert operator shorthand to SQL operator
   */
  private getSqlOperator(op: string): string {
    const operators: Record<string, string> = {
      $eq: '=',
      $ne: '!=',
      $gt: '>',
      $gte: '>=',
      $lt: '<',
      $lte: '<=',
      $like: 'LIKE',
      $ilike: 'ILIKE',
    };
    return operators[op] ?? '=';
  }

  /**
   * Create DatabaseService from environment variables
   */
  static fromEnv(): DatabaseService {
    return new DatabaseService({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      database: process.env.DATABASE_NAME || 'lens_service',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
    });
  }
}

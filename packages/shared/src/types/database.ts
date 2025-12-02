/**
 * Lens Service v3 - Database Types
 */

// ============================================================================
// Schema Registry Types
// ============================================================================

export interface TableSchema {
  name: string;
  description: string;
  userIdColumn?: string;  // For automatic user isolation
  columns: Record<string, ColumnSchema>;
  permissions: TablePermissions;
  relationships?: TableRelationship[];
  indexes?: TableIndex[];
}

export interface ColumnSchema {
  type: ColumnType;
  description: string;
  nullable: boolean;
  readable: boolean;
  writable: boolean;
  searchable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyRef?: ForeignKeyRef;
  defaultValue?: unknown;
  examples?: string[];
  validValues?: string[];  // For enum-like columns
}

export type ColumnType =
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'boolean'
  | 'timestamp'
  | 'date'
  | 'json'
  | 'jsonb'
  | 'vector'
  | 'uuid';

export interface ForeignKeyRef {
  table: string;
  column: string;
}

export interface TablePermissions {
  select: boolean | string;  // true, false, or SQL condition
  insert: boolean;
  update: string[];          // List of updatable columns
  delete: boolean;
}

export interface TableRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  description?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'ivfflat' | 'hnsw';
  unique?: boolean;
}

// ============================================================================
// Query Types
// ============================================================================

export interface QueryOptions {
  tableName: string;
  columns?: string[];
  conditions?: Record<string, unknown>;
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  joins?: JoinClause[];
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: {
    sourceColumn: string;
    targetColumn: string;
  };
}

export interface QueryResult<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
  queryInfo?: {
    sql: string;
    params: unknown[];
    durationMs: number;
  };
}

// ============================================================================
// Mutation Types
// ============================================================================

export interface InsertOptions {
  tableName: string;
  data: Record<string, unknown>;
  returning?: string[];
}

export interface UpdateOptions {
  tableName: string;
  data: Record<string, unknown>;
  conditions: Record<string, unknown>;
  returning?: string[];
}

export interface DeleteOptions {
  tableName: string;
  conditions: Record<string, unknown>;
  returning?: string[];
}

export interface MutationResult<T = Record<string, unknown>> {
  success: boolean;
  affectedRows: number;
  data?: T;
  error?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionContext {
  id: string;
  startedAt: Date;
  queries: TransactionQuery[];
}

export interface TransactionQuery {
  sql: string;
  params: unknown[];
  executedAt: Date;
  durationMs: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface QueryValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedQuery?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// Connection Pool Types
// ============================================================================

export interface PoolStatus {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}

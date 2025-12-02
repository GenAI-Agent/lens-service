/**
 * Lens Service v3 - Schema Registry
 *
 * Manages database schema metadata for safe, dynamic SQL generation.
 * Provides information about tables, columns, permissions, and relationships
 * that agents can use to construct valid queries.
 */

import type {
  TableSchema,
  ColumnSchema,
  ColumnType,
  TablePermissions,
  TableRelationship,
  QueryValidationResult,
  ValidationError,
  ValidationWarning,
} from '@lens-service/shared';
import { DatabaseService } from './database-service';
import * as fs from 'fs';
import * as path from 'path';

export interface SchemaRegistryOptions {
  schemaPath?: string;  // Path to schema JSON file
  autoLoad?: boolean;   // Auto-load schema on init
}

export class SchemaRegistry {
  private schemas: Map<string, TableSchema> = new Map();
  private schemaPath?: string;
  private initialized: boolean = false;

  constructor(options: SchemaRegistryOptions = {}) {
    this.schemaPath = options.schemaPath;

    if (options.autoLoad && this.schemaPath) {
      this.loadFromFile(this.schemaPath);
    }
  }

  /**
   * Load schema from JSON file
   */
  loadFromFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const schemas = JSON.parse(content) as TableSchema[];

      schemas.forEach((schema) => {
        this.registerTable(schema);
      });

      console.log(`[SchemaRegistry] Loaded ${schemas.length} table schemas from ${filePath}`);
      this.initialized = true;
    } catch (error) {
      console.error('[SchemaRegistry] Failed to load schema file:', error);
      throw error;
    }
  }

  /**
   * Register a table schema
   */
  registerTable(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
    console.log(`[SchemaRegistry] Registered table: ${schema.name}`);
  }

  /**
   * Get schema for a table
   */
  getTableSchema(tableName: string): TableSchema | undefined {
    return this.schemas.get(tableName);
  }

  /**
   * Get all registered table names
   */
  getTableNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get all table schemas
   */
  getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Check if a table exists in the registry
   */
  hasTable(tableName: string): boolean {
    return this.schemas.has(tableName);
  }

  /**
   * Get readable columns for a table
   */
  getReadableColumns(tableName: string): string[] {
    const schema = this.schemas.get(tableName);
    if (!schema) return [];

    return Object.entries(schema.columns)
      .filter(([_, col]) => col.readable)
      .map(([name]) => name);
  }

  /**
   * Get writable columns for a table
   */
  getWritableColumns(tableName: string): string[] {
    const schema = this.schemas.get(tableName);
    if (!schema) return [];

    return Object.entries(schema.columns)
      .filter(([_, col]) => col.writable)
      .map(([name]) => name);
  }

  /**
   * Get searchable columns for a table
   */
  getSearchableColumns(tableName: string): string[] {
    const schema = this.schemas.get(tableName);
    if (!schema) return [];

    return Object.entries(schema.columns)
      .filter(([_, col]) => col.searchable)
      .map(([name]) => name);
  }

  /**
   * Get the user ID column for a table (for automatic filtering)
   */
  getUserIdColumn(tableName: string): string | undefined {
    return this.schemas.get(tableName)?.userIdColumn;
  }

  /**
   * Get table relationships
   */
  getRelationships(tableName: string): TableRelationship[] {
    return this.schemas.get(tableName)?.relationships ?? [];
  }

  /**
   * Check if SELECT is allowed on a table
   */
  canSelect(tableName: string): boolean {
    const schema = this.schemas.get(tableName);
    if (!schema) return false;
    return schema.permissions.select !== false;
  }

  /**
   * Check if INSERT is allowed on a table
   */
  canInsert(tableName: string): boolean {
    return this.schemas.get(tableName)?.permissions.insert ?? false;
  }

  /**
   * Check if UPDATE is allowed on a table
   */
  canUpdate(tableName: string, column: string): boolean {
    const schema = this.schemas.get(tableName);
    if (!schema) return false;
    return schema.permissions.update.includes(column);
  }

  /**
   * Check if DELETE is allowed on a table
   */
  canDelete(tableName: string): boolean {
    return this.schemas.get(tableName)?.permissions.delete ?? false;
  }

  /**
   * Validate a query against the schema
   */
  validateQuery(
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    columns?: string[],
    userId?: string
  ): QueryValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if table exists
    const schema = this.schemas.get(tableName);
    if (!schema) {
      errors.push({
        code: 'TABLE_NOT_FOUND',
        message: `Table '${tableName}' not found in schema registry`,
      });
      return { isValid: false, errors, warnings };
    }

    // Check operation permission
    switch (operation) {
      case 'SELECT':
        if (!this.canSelect(tableName)) {
          errors.push({
            code: 'SELECT_NOT_ALLOWED',
            message: `SELECT operation not allowed on table '${tableName}'`,
          });
        }
        break;

      case 'INSERT':
        if (!this.canInsert(tableName)) {
          errors.push({
            code: 'INSERT_NOT_ALLOWED',
            message: `INSERT operation not allowed on table '${tableName}'`,
          });
        }
        break;

      case 'UPDATE':
        if (columns) {
          const disallowedColumns = columns.filter((col) => !this.canUpdate(tableName, col));
          if (disallowedColumns.length > 0) {
            errors.push({
              code: 'UPDATE_NOT_ALLOWED',
              message: `UPDATE not allowed on columns: ${disallowedColumns.join(', ')}`,
              field: disallowedColumns.join(', '),
            });
          }
        }
        break;

      case 'DELETE':
        if (!this.canDelete(tableName)) {
          errors.push({
            code: 'DELETE_NOT_ALLOWED',
            message: `DELETE operation not allowed on table '${tableName}'`,
          });
        }
        break;
    }

    // Validate columns exist and are readable/writable
    if (columns) {
      for (const column of columns) {
        const colSchema = schema.columns[column];

        if (!colSchema) {
          errors.push({
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${column}' not found in table '${tableName}'`,
            field: column,
          });
          continue;
        }

        if (operation === 'SELECT' && !colSchema.readable) {
          errors.push({
            code: 'COLUMN_NOT_READABLE',
            message: `Column '${column}' is not readable`,
            field: column,
          });
        }

        if (['INSERT', 'UPDATE'].includes(operation) && !colSchema.writable) {
          errors.push({
            code: 'COLUMN_NOT_WRITABLE',
            message: `Column '${column}' is not writable`,
            field: column,
          });
        }
      }
    }

    // Check if user isolation is required
    if (schema.userIdColumn && !userId) {
      warnings.push({
        code: 'USER_ISOLATION_REQUIRED',
        message: `Table '${tableName}' requires user isolation via '${schema.userIdColumn}'`,
        suggestion: `Add a condition on '${schema.userIdColumn}' to filter by user`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate a description of available tables for LLM context
   */
  generateSchemaDescription(): string {
    const descriptions: string[] = [];

    for (const schema of this.schemas.values()) {
      const lines: string[] = [
        `## Table: ${schema.name}`,
        `Description: ${schema.description}`,
        '',
        '### Columns:',
      ];

      for (const [colName, col] of Object.entries(schema.columns)) {
        const flags: string[] = [];
        if (col.isPrimaryKey) flags.push('PK');
        if (col.isForeignKey) flags.push('FK');
        if (!col.nullable) flags.push('NOT NULL');
        if (col.searchable) flags.push('searchable');

        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        lines.push(`- ${colName} (${col.type})${flagStr}: ${col.description}`);

        if (col.validValues) {
          lines.push(`  Valid values: ${col.validValues.join(', ')}`);
        }
        if (col.examples) {
          lines.push(`  Examples: ${col.examples.join(', ')}`);
        }
      }

      // Add permission info
      lines.push('');
      lines.push('### Permissions:');
      lines.push(`- SELECT: ${schema.permissions.select === true ? 'allowed' : schema.permissions.select === false ? 'denied' : 'conditional'}`);
      lines.push(`- INSERT: ${schema.permissions.insert ? 'allowed' : 'denied'}`);
      lines.push(`- UPDATE: ${schema.permissions.update.length > 0 ? `allowed (${schema.permissions.update.join(', ')})` : 'denied'}`);
      lines.push(`- DELETE: ${schema.permissions.delete ? 'allowed' : 'denied'}`);

      // Add relationships
      if (schema.relationships && schema.relationships.length > 0) {
        lines.push('');
        lines.push('### Relationships:');
        for (const rel of schema.relationships) {
          lines.push(`- ${rel.type}: ${rel.targetTable} via ${rel.sourceColumn} → ${rel.targetColumn}`);
        }
      }

      descriptions.push(lines.join('\n'));
    }

    return descriptions.join('\n\n---\n\n');
  }

  /**
   * Generate a compact schema summary for token efficiency
   */
  generateCompactSchema(): string {
    const tables: string[] = [];

    for (const schema of this.schemas.values()) {
      const cols = Object.entries(schema.columns)
        .filter(([_, c]) => c.readable)
        .map(([name, c]) => `${name}:${c.type}`)
        .join(',');

      tables.push(`${schema.name}(${cols})`);
    }

    return tables.join('\n');
  }

  /**
   * Build a safe WHERE clause condition with user isolation
   */
  buildUserIsolationCondition(
    tableName: string,
    userId: string
  ): Record<string, unknown> | null {
    const userIdColumn = this.getUserIdColumn(tableName);
    if (!userIdColumn) return null;

    return { [userIdColumn]: userId };
  }

  /**
   * Create SchemaRegistry from environment
   */
  static fromEnv(): SchemaRegistry {
    const schemaPath = process.env.DATABASE_SCHEMA_PATH;

    return new SchemaRegistry({
      schemaPath,
      autoLoad: !!schemaPath,
    });
  }
}

// Default schema definitions for common tables
export const DEFAULT_SCHEMAS: TableSchema[] = [
  {
    name: 'orders',
    description: 'Customer orders with items and shipping information',
    userIdColumn: 'user_id',
    columns: {
      id: {
        type: 'uuid',
        description: 'Unique order identifier',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
        isPrimaryKey: true,
      },
      user_id: {
        type: 'varchar',
        description: 'User who placed the order',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      status: {
        type: 'varchar',
        description: 'Order status',
        nullable: false,
        readable: true,
        writable: true,
        searchable: true,
        validValues: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      },
      total_amount: {
        type: 'decimal',
        description: 'Total order amount',
        nullable: false,
        readable: true,
        writable: false,
        searchable: false,
      },
      shipping_address: {
        type: 'jsonb',
        description: 'Shipping address details',
        nullable: true,
        readable: true,
        writable: true,
        searchable: false,
      },
      created_at: {
        type: 'timestamp',
        description: 'Order creation timestamp',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      updated_at: {
        type: 'timestamp',
        description: 'Last update timestamp',
        nullable: false,
        readable: true,
        writable: false,
        searchable: false,
      },
    },
    permissions: {
      select: true,
      insert: false,
      update: ['status', 'shipping_address'],
      delete: false,
    },
    relationships: [
      {
        type: 'one-to-many',
        targetTable: 'order_items',
        sourceColumn: 'id',
        targetColumn: 'order_id',
        description: 'Items in this order',
      },
    ],
  },
  {
    name: 'subscriptions',
    description: 'User subscription plans and status',
    userIdColumn: 'user_id',
    columns: {
      id: {
        type: 'uuid',
        description: 'Unique subscription identifier',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
        isPrimaryKey: true,
      },
      user_id: {
        type: 'varchar',
        description: 'Subscriber user ID',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      plan_name: {
        type: 'varchar',
        description: 'Subscription plan name',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      status: {
        type: 'varchar',
        description: 'Subscription status',
        nullable: false,
        readable: true,
        writable: true,
        searchable: true,
        validValues: ['active', 'paused', 'cancelled', 'expired'],
      },
      next_billing_date: {
        type: 'date',
        description: 'Next billing date',
        nullable: true,
        readable: true,
        writable: false,
        searchable: true,
      },
      created_at: {
        type: 'timestamp',
        description: 'Subscription start date',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
    },
    permissions: {
      select: true,
      insert: false,
      update: ['status'],
      delete: false,
    },
  },
  {
    name: 'products',
    description: 'Product catalog with inventory information',
    columns: {
      id: {
        type: 'uuid',
        description: 'Unique product identifier',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
        isPrimaryKey: true,
      },
      name: {
        type: 'varchar',
        description: 'Product name',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      description: {
        type: 'text',
        description: 'Product description',
        nullable: true,
        readable: true,
        writable: false,
        searchable: true,
      },
      price: {
        type: 'decimal',
        description: 'Product price',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      category: {
        type: 'varchar',
        description: 'Product category',
        nullable: true,
        readable: true,
        writable: false,
        searchable: true,
      },
      in_stock: {
        type: 'boolean',
        description: 'Whether product is in stock',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
      },
      content_vector: {
        type: 'vector',
        description: 'Content embedding vector for semantic search',
        nullable: true,
        readable: false,
        writable: false,
        searchable: false,
      },
      usage_vector: {
        type: 'vector',
        description: 'Usage embedding vector for co-retrieval',
        nullable: true,
        readable: false,
        writable: false,
        searchable: false,
      },
    },
    permissions: {
      select: true,
      insert: false,
      update: [],
      delete: false,
    },
  },
  {
    name: 'manual_indexes',
    description: 'Knowledge base articles and documentation',
    columns: {
      id: {
        type: 'uuid',
        description: 'Unique document identifier',
        nullable: false,
        readable: true,
        writable: false,
        searchable: true,
        isPrimaryKey: true,
      },
      name: {
        type: 'varchar',
        description: 'Document title',
        nullable: false,
        readable: true,
        writable: true,
        searchable: true,
      },
      description: {
        type: 'text',
        description: 'Brief description',
        nullable: true,
        readable: true,
        writable: true,
        searchable: true,
      },
      content: {
        type: 'text',
        description: 'Full document content',
        nullable: false,
        readable: true,
        writable: true,
        searchable: true,
      },
      url: {
        type: 'varchar',
        description: 'Source URL',
        nullable: true,
        readable: true,
        writable: true,
        searchable: false,
      },
      keywords: {
        type: 'jsonb',
        description: 'Search keywords',
        nullable: true,
        readable: true,
        writable: true,
        searchable: true,
      },
      content_vector: {
        type: 'vector',
        description: 'Content embedding vector',
        nullable: true,
        readable: false,
        writable: false,
        searchable: false,
      },
      usage_vector: {
        type: 'vector',
        description: 'Usage embedding vector for co-retrieval',
        nullable: true,
        readable: false,
        writable: false,
        searchable: false,
      },
    },
    permissions: {
      select: true,
      insert: true,
      update: ['name', 'description', 'content', 'url', 'keywords'],
      delete: true,
    },
  },
];

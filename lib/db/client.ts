/**
 * Database Client Configuration
 *
 * This file sets up the connection to the Neon PostgreSQL database.
 * Uses connection pooling for better performance.
 */

import { neon } from '@neondatabase/serverless';

// Lazy-initialized database connection
let _sql: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Export sql as a proxy that lazy-loads the connection
export const sql = new Proxy(
  function() {} as any,
  {
    get(target, prop) {
      const conn = getConnection();
      const value = (conn as any)[prop];
      if (typeof value === 'function') {
        return value.bind(conn);
      }
      return value;
    },
    apply(target, thisArg, args) {
      const conn = getConnection();
      return (conn as any)(...args);
    },
  }
) as ReturnType<typeof neon>;

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW() as time`;
    console.log('✓ Database connected successfully at:', result[0].time);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

/**
 * Get database version
 */
export async function getDatabaseVersion(): Promise<string> {
  try {
    const result = await sql`SELECT version()`;
    return result[0].version;
  } catch (error) {
    console.error('Failed to get database version:', error);
    throw error;
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )
    `;
    return result[0].exists;
  } catch (error) {
    console.error(`Failed to check if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * List all tables in the database
 */
export async function listTables(): Promise<string[]> {
  try {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return result.map((row: any) => row.table_name);
  } catch (error) {
    console.error('Failed to list tables:', error);
    return [];
  }
}

export default sql;

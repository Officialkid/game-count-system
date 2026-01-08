/**
 * Database Connection Client
 * Server-only PostgreSQL connection with pooling
 * 
 * Environment Variable Required:
 * - DATABASE_URL (Render internal PostgreSQL URL, contains .internal)
 */

import { Pool } from 'pg';

/**
 * Ensure a single global Pool instance (Next.js dev hot-reload safe)
 */
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var pgPoolChecked: boolean | undefined;
}

if (typeof window !== 'undefined') {
  throw new Error('Database client can only be used on the server side');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required (use Render internal Database URL)');
}

// Create or reuse a single shared Pool
const pool = globalThis.pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render requires SSL; disable cert verification within Render's network
  ssl: { rejectUnauthorized: false },
  // Safe pool limits for Render
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Cache the pool on the global object to reuse across requests and hot reloads
if (!globalThis.pgPool) {
  globalThis.pgPool = pool;
}

// Test connection on startup (single-run, clear logs, fatal on failure)
if (!globalThis.pgPoolChecked) {
  globalThis.pgPoolChecked = true;
  void pool
    .query('SELECT 1')
    .then(() => {
      console.log('DATABASE CONNECTED');
    })
    .catch((err) => {
      console.error('DATABASE FAILED', err);
      throw err; // Fatal: surface error to crash process
    });
}

/**
 * Query helper with automatic error handling
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed', { text, duration, rows: result.rowCount });
    }
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

/**
 * Transaction helper
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
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
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close all connections (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;

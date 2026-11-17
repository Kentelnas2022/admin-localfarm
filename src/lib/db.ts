import mysql from 'mysql2/promise';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const isRemoteDb =
  process.env.DB_HOST &&
  process.env.DB_HOST !== '127.0.0.1' &&
  process.env.DB_HOST !== 'localhost';

let pool: mysql.Pool | null = null;
let mysqlUnavailable = false;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'localfarm',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl:
        process.env.DB_SSL === 'true' || (isRemoteDb && process.env.DB_SSL !== 'false')
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
  return pool;
}

/**
 * Maps MySQL queries to Supabase PostgREST queries when MySQL is offline.
 */
async function executeOnSupabase<T = any>(sql: string, params: any[] = []): Promise<T> {
  const cleanSql = sql.replace(/`/g, '').trim();

  // Handle DDL (CREATE TABLE, ALTER TABLE, TRUNCATE) silently
  if (/^(CREATE|ALTER|TRUNCATE)\s+/i.test(cleanSql)) {
    return [] as unknown as T;
  }

  // Detect Table Name
  const tableMatch = cleanSql.match(/(?:FROM|INTO|UPDATE)\s+([a-zA-Z0-9_]+)/i);
  let tableName = tableMatch ? tableMatch[1].toLowerCase() : '';
  if (tableName === 'users') tableName = 'profiles';

  // 1. SELECT COUNT queries
  if (/^SELECT\s+COUNT\(\*\)\s+as\s+([a-zA-Z0-9_]+)/i.test(cleanSql)) {
    const aliasMatch = cleanSql.match(/^SELECT\s+COUNT\(\*\)\s+as\s+([a-zA-Z0-9_]+)/i);
    const countAlias = aliasMatch ? aliasMatch[1] : 'count';
    const { count } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    return [{ [countAlias]: count || 0 }] as unknown as T;
  }

  // 2. Simple SELECT queries
  if (/^SELECT/i.test(cleanSql)) {
    let queryBuilder = supabaseAdmin.from(tableName).select('*');

    // Simple WHERE id = ?
    const whereIdMatch = cleanSql.match(/WHERE\s+id\s*=\s*\?/i);
    if (whereIdMatch && params.length > 0) {
      queryBuilder = queryBuilder.eq('id', params[0]);
    }

    // WHERE email = ?
    const whereEmailMatch = cleanSql.match(/WHERE\s+email\s*=\s*\?/i);
    if (whereEmailMatch && params.length > 0) {
      queryBuilder = queryBuilder.eq('email', params[0]);
    }

    // LIMIT
    const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      queryBuilder = queryBuilder.limit(parseInt(limitMatch[1], 10));
    }

    const { data, error } = await queryBuilder;
    if (error) {
      console.warn(`Supabase query warning on table ${tableName}:`, error.message);
      return [] as unknown as T;
    }
    return (data || []) as unknown as T;
  }

  // 3. Simple INSERT queries
  if (/^INSERT\s+INTO/i.test(cleanSql)) {
    const colsMatch = cleanSql.match(/\(([^)]+)\)\s+VALUES\s*\(([^)]+)\)/i);
    if (colsMatch) {
      const cols = colsMatch[1].split(',').map(c => c.trim());
      const row: Record<string, any> = {};
      cols.forEach((col, idx) => {
        if (idx < params.length) {
          row[col] = params[idx];
        }
      });
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .insert(row)
        .select();

      if (error) {
        console.warn(`Supabase insert warning on table ${tableName}:`, error.message);
      }
      return { insertId: data?.[0]?.id || 1, affectedRows: 1 } as unknown as T;
    }
  }

  // 4. Simple DELETE queries
  if (/^DELETE\s+FROM/i.test(cleanSql)) {
    const whereId = cleanSql.match(/WHERE\s+id\s*=\s*\?/i);
    if (whereId && params.length > 0) {
      const { error } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', params[0]);
      if (error) console.warn(`Supabase delete warning:`, error.message);
      return { affectedRows: 1 } as unknown as T;
    }
  }

  return [] as unknown as T;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  // If MySQL was already marked unavailable, route directly to Supabase
  if (mysqlUnavailable) {
    return executeOnSupabase<T>(sql, params);
  }

  try {
    const [results] = await getPool().execute(sql, params);
    return results as T;
  } catch (error: any) {
    // If MySQL is down (ECONNREFUSED or connect timeout), route to Supabase
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'PROTOCOL_CONNECTION_LOST' ||
      error.code === 'ETIMEDOUT'
    ) {
      mysqlUnavailable = true;
      return executeOnSupabase<T>(sql, params);
    }
    throw error;
  }
}

export default pool;

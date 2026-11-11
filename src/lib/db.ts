import mysql from 'mysql2/promise';

const isRemoteDb =
  process.env.DB_HOST &&
  process.env.DB_HOST !== '127.0.0.1' &&
  process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'localfarm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl:
    process.env.DB_SSL === 'true' || (isRemoteDb && process.env.DB_SSL !== 'false')
      ? { rejectUnauthorized: false }
      : undefined,
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;

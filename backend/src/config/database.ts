import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

const isProduction = ENV.NODE_ENV === 'production';
const requiresSsl = isProduction || ENV.DATABASE_URL.includes('render.com');

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

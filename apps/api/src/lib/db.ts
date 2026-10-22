import 'dotenv/config';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
export const query = <T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, values: unknown[] = []) => pool.query<T>(sql, values);

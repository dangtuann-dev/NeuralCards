import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// fetchConnectionCache is now always true and no longer needs to be set

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === 'development' });

export type DB = typeof db;
export { schema };

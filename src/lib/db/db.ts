import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';

export function getDB(env: { DB: D1Database }): DrizzleD1Database {
	if (!env || !env.DB) {
		throw new Error('D1 Database binding is missing in the environment variables');
	}
	return drizzle(env.DB);
}

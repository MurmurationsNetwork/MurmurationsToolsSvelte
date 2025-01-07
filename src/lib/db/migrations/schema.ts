import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: int().primaryKey({ autoIncrement: true }),
	cuid: text().notNull(),
	email_hash: text().notNull(),
	ipfs: text(),
	ipns: text(),
	last_login: int({ mode: 'timestamp' }).notNull(),
	password: text().notNull(),
	created_at: int({ mode: 'timestamp' }).notNull(),
	updated_at: int({ mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
	id: int().primaryKey({ autoIncrement: true }),
	session_token: text().notNull(),
	email_hash: text().notNull(),
	created_at: int({ mode: 'timestamp' }).notNull()
});

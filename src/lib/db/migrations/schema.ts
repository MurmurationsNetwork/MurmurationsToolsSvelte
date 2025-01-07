import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
	'users',
	{
		id: int().primaryKey({ autoIncrement: true }),
		cuid: text().notNull(),
		email_hash: text().notNull(),
		ipfs: text(),
		ipns: text(),
		last_login: int({ mode: 'timestamp' }).notNull(),
		password: text().notNull(),
		profiles: text().notNull()
	},
	(t) => [index('users_cuid_index').on(t.cuid)]
);

export const sessions = sqliteTable('sessions', {
	id: int().primaryKey({ autoIncrement: true }),
	session_token: text().notNull(),
	email_hash: text().notNull(),
	created_at: int({ mode: 'timestamp' }).notNull()
});

export const profiles = sqliteTable(
	'profiles',
	{
		id: int().primaryKey({ autoIncrement: true }),
		cuid: text().notNull(),
		ipfs: text(),
		linked_schemas: text(),
		node_id: text(),
		title: text(),
		profile: text(),
		last_updated: int({ mode: 'timestamp' }).notNull()
	},
	(t) => [index('profiles_cuid_index').on(t.cuid)]
);

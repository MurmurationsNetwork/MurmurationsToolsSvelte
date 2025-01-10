import { sql } from 'drizzle-orm';
import { foreignKey, index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
	'users',
	{
		id: int().primaryKey({ autoIncrement: true }),
		cuid: text().notNull().unique(),
		email: text().notNull().unique(),
		password: text().notNull(),
		last_login: int({ mode: 'timestamp' }).notNull(),
		created_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updated_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull()
	},
	(t) => [index('users_id_index').on(t.id), index('users_cuid_index').on(t.cuid)]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: int().primaryKey({ autoIncrement: true }),
		session_token: text().notNull().unique(),
		user_id: int().notNull(),
		created_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updated_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull()
	},
	(t) => [foreignKey({ columns: [t.user_id], foreignColumns: [users.id] })]
);

export const profiles = sqliteTable(
	'profiles',
	{
		id: int().primaryKey({ autoIncrement: true }),
		cuid: text().notNull().unique(),
		user_id: int().notNull(),
		linked_schemas: text(),
		title: text(),
		profile: text(),
		node_id: text(),
		last_updated: int({ mode: 'timestamp' }).notNull(),
		created_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updated_at: int({ mode: 'timestamp' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull()
	},
	(t) => [
		index('profiles_id_index').on(t.id),
		index('profiles_cuid_index').on(t.cuid),
		index('profiles_user_id_index').on(t.user_id),
		foreignKey({ columns: [t.user_id], foreignColumns: [users.id] })
	]
);

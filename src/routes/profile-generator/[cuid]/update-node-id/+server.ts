import { getDB } from '$lib/db/db';
import { profiles } from '$lib/db/migrations/schema';
import { jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';

// Update node_id for a profile
export const PUT: RequestHandler = async ({
	request,
	params,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { cuid } = params;
		const { node_id } = await request.json();

		if (!cuid || !node_id) {
			return jsonError('Missing required fields', 400);
		}

		const userId = locals.user?.id;

		if (!userId) {
			return jsonError('Please log in first', 401);
		}

		const db = getDB(platform.env);

		const updateResult = await db
			.update(profiles)
			.set({ node_id, updated_at: sql`CURRENT_TIMESTAMP` })
			.where(and(eq(profiles.cuid, cuid), eq(profiles.user_id, userId)))
			.run();

		if (updateResult.rowCount === 0) {
			return jsonError('Profile not found', 404);
		}

		return json({ success: true, message: 'Node ID updated successfully' });
	} catch (err) {
		console.error(`Profile update failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

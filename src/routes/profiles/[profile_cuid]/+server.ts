import { getDB } from '$lib/db/db';
import { profiles } from '$lib/db/migrations/schema';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({
	params,
	platform = { env: { DB: {} as D1Database } }
}) => {
	const { profile_cuid } = params;

	if (!profile_cuid) {
		return json({ success: false, error: 'Profile CUID is required' }, { status: 400 });
	}

	const db = getDB(platform.env);

	try {
		const profile = await db
			.select()
			.from(profiles)
			.where(eq(profiles.cuid, profile_cuid))
			.limit(1);

		if (profile.length === 0) {
			return json({ success: false, error: 'Profile not found' }, { status: 404 });
		}

		const parsedProfile = JSON.parse(profile[0].profile ?? '{}');

		return json(parsedProfile);
	} catch (err) {
		console.error('Error fetching profile:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

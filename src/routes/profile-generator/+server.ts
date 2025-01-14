import { getDB } from '$lib/db/db';
import { profiles } from '$lib/db/migrations/schema';
import { validateProfile } from '$lib/server/server-utils';
import type { Profile } from '$lib/types/Profile';
import { jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

// Get all profiles
export const GET: RequestHandler = async ({
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		// Check if the user is authenticated
		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		const userId = locals.user.id;

		if (!userId) {
			return jsonError('Please log in first', 401);
		}

		const db = getDB(platform.env);

		const profilesList = await db.select().from(profiles).where(eq(profiles.user_id, userId)).all();

		for (const profile of profilesList) {
			profile.linked_schemas = JSON.parse(profile.linked_schemas || '[]');
			profile.profile = JSON.parse(profile.profile || '{}');
		}

		// Return the profiles as JSON
		return json({ profiles: profilesList });
	} catch (err) {
		console.error(`Failed to fetch user profiles: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

// Save a single profile
export const POST: RequestHandler = async ({
	request,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const profile = await request.json();
		const userId = locals.user?.id;

		if (!profile || !userId) {
			return jsonError('Missing required fields', 400);
		}

		// Validate the profile before saving
		const validationResponse = await validateProfile(profile?.profile);
		if (!validationResponse.success) {
			if (typeof validationResponse.errors === 'string') {
				return json({ success: false, errors: validationResponse.errors }, { status: 500 });
			}
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		await saveProfile(profile, userId, platform);

		return json({ success: true });
	} catch (err) {
		console.error(`Profile save failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function saveProfile(
	profile: Profile,
	userId: number,
	platform: { env: { DB: D1Database } }
): Promise<void> {
	const db = getDB(platform.env);

	try {
		await db
			.insert(profiles)
			.values({
				cuid: profile.cuid,
				user_id: userId,
				linked_schemas: JSON.stringify(profile.linked_schemas),
				node_id: null,
				title: profile.title,
				profile: profile.profile,
				last_updated: new Date(profile.last_updated)
			})
			.run();
	} catch (err) {
		console.error('Failed to save profile', err);
		throw err;
	}
}

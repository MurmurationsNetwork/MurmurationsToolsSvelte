import { getDB } from '$lib/db/db';
import { profiles, users } from '$lib/db/migrations/schema';
import { validateProfile } from '$lib/server/server-utils';
import type { Profile } from '$lib/types/Profile';
import { jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';

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

		const email_hash = locals.user.email_hash;

		// Validate the email_hash
		if (!email_hash) {
			return jsonError('Missing email_hash parameter', 400);
		}

		const db = getDB(platform.env);

		// Find the user and their profiles
		const user = await db
			.select({
				profiles: users.profiles
			})
			.from(users)
			.where(eq(users.email_hash, email_hash))
			.limit(1);

		if (user.length === 0) {
			return jsonError('User not found', 404);
		}

		const profileCuids = JSON.parse(user[0].profiles) || [];

		const profilesList = await db
			.select()
			.from(profiles)
			.where(inArray(profiles.cuid, profileCuids))
			.all();

		for (const profile of profilesList) {
			profile.ipfs = JSON.parse(profile.ipfs || '[]');
			profile.linked_schemas = JSON.parse(profile.linked_schemas || '[]');
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
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const profile = await request.json();

		if (!profile) {
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

		await saveProfile(profile, platform);

		return json({ success: true });
	} catch (err) {
		console.error(`Profile save failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function saveProfile(profile: Profile, platform: { env: { DB: D1Database } }): Promise<void> {
	const db = getDB(platform.env);

	try {
		await db
			.insert(profiles)
			.values({
				cuid: profile.cuid,
				ipfs: JSON.stringify(profile.ipfs),
				linked_schemas: JSON.stringify(profile.linked_schemas),
				node_id: null,
				title: profile.title,
				profile: profile.profile,
				last_updated: new Date(profile.last_updated)
			})
			.run();
	} catch (error) {
		console.error('Failed to save profile', error);
		throw error;
	}
}

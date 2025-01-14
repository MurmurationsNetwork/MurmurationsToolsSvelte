import { getDB } from '$lib/db/db';
import { profiles } from '$lib/db/migrations/schema';
import { validateProfile } from '$lib/server/server-utils';
import type { Profile } from '$lib/types/Profile';
import { jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({
	params,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { cuid } = params;

		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		if (!cuid) {
			return jsonError('Missing required fields or user not authenticated', 400);
		}

		const profile = await getProfileByCuid(cuid, locals.user.id, platform);

		if (!profile) {
			return jsonError('Profile not found', 404);
		}

		return json({ success: true, profile });
	} catch (err) {
		console.error(`Failed to get profile: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function getProfileByCuid(
	cuid: string,
	userId: number,
	platform: { env: { DB: D1Database } }
): Promise<Profile | null> {
	const db = getDB(platform.env);

	try {
		const profile = await db
			.select()
			.from(profiles)
			.where(and(eq(profiles.cuid, cuid), eq(profiles.user_id, userId)))
			.limit(1);

		if (profile.length === 0) {
			return null;
		}

		return {
			cuid: profile[0].cuid,
			linked_schemas: parseStringArray(profile[0].linked_schemas),
			title: profile[0].title,
			profile: profile[0].profile ? JSON.parse(profile[0].profile) : {},
			node_id: profile[0].node_id || '',
			last_updated: profile[0].last_updated.getTime()
		} as Profile;
	} catch (err) {
		console.error('Failed to get profile', err);
		throw err;
	}
}

function parseStringArray(json: string | null): string[] {
	try {
		const parsed = JSON.parse(json || '[]');
		if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
			return parsed;
		}
		return [];
	} catch {
		console.warn('Failed to parse linked_schemas as string[]');
		return [];
	}
}

// Update profile data
export const PATCH: RequestHandler = async ({
	params,
	request,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { cuid } = params;
		const { title, last_updated, profile } = await request.json();

		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		if (!cuid || !title || !last_updated || !profile) {
			return jsonError('Missing required fields', 400);
		}

		// Validate the profile before updating
		const validationResponse = await validateProfile(profile);
		if (!validationResponse.success) {
			if (typeof validationResponse.errors === 'string') {
				return jsonError(validationResponse.errors, 500);
			}
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		const isUpdated = await updateProfile(
			cuid,
			title,
			last_updated,
			profile,
			locals.user.id,
			platform
		);

		if (!isUpdated) {
			return jsonError('Failed to update profile', 404);
		}

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (err) {
		console.error(`Profile update failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function updateProfile(
	cuid: string,
	title: string,
	lastUpdated: number,
	profile: string,
	userId: number,
	platform: { env: { DB: D1Database } }
): Promise<boolean> {
	const db = getDB(platform.env);

	try {
		const updateResult = await db
			.update(profiles)
			.set({
				title,
				last_updated: new Date(lastUpdated),
				profile,
				updated_at: sql`CURRENT_TIMESTAMP`
			})
			.where(and(eq(profiles.cuid, cuid), eq(profiles.user_id, userId)))
			.run();

		if (updateResult.rowCount === 0) {
			console.log('Failed to update profile');
			return false;
		}

		return true;
	} catch (err) {
		console.error('Failed to update profile', err);
		throw err;
	}
}

// Delete profile from user's profiles
export const DELETE: RequestHandler = async ({
	params,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { cuid } = params;
		const userId = locals.user?.id;

		if (!cuid || !userId) {
			return jsonError('Missing cuid or user not authenticated', 400);
		}

		const isDeleted = await deleteProfile(userId, cuid, platform);

		if (!isDeleted) {
			return jsonError('Failed to delete profile', 404);
		}

		return json({ success: true, message: 'Profile deleted successfully' });
	} catch (err) {
		console.error(`Profile deletion failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function deleteProfile(
	userId: number,
	profileCuid: string,
	platform: { env: { DB: D1Database } }
): Promise<boolean> {
	const db = getDB(platform.env);

	try {
		const deleteResult = await db
			.delete(profiles)
			.where(and(eq(profiles.cuid, profileCuid), eq(profiles.user_id, userId)))
			.run();

		if (deleteResult.rowCount === 0) {
			console.error('Failed to delete profile from profiles collection');
			return false;
		}

		console.log('Profile deleted successfully');
		return true;
	} catch (err) {
		console.error('Failed to delete profile', err);
		throw err;
	}
}

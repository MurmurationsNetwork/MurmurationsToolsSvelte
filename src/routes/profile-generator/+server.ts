import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import type { Profile } from '$lib/types/profile';
import { validateProfile } from '$lib/server/server-utils';

// Get all profiles
export const GET: RequestHandler = async ({ locals }) => {
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

		const db = await connectToDatabase();

		// Find the user and their profiles
		const user = await db.collection('users').findOne({ email_hash });

		if (!user) {
			return jsonError('User not found', 404);
		}

		const profileCuids = user.profiles || [];

		const profiles = await db
			.collection('profiles')
			.find({ cuid: { $in: profileCuids } })
			.toArray();

		await closeDatabaseConnection();

		// Return the profiles as JSON
		return json({ profiles });
	} catch (err) {
		console.error(`Failed to fetch user profiles: ${err}`);
		return jsonError('Internal server error', 500);
	}
};

// Save a single profile
export const POST: RequestHandler = async ({ request }) => {
	try {
		const profile = await request.json();

		if (!profile) {
			return jsonError('Missing required fields', 400);
		}

		// Validate the profile before saving
		const validationResponse = await validateProfile(profile?.profile);
		if (!validationResponse.success) {
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		await saveProfile(profile);

		return json({ success: true });
	} catch (err) {
		console.error(`Profile save failed: ${err}`);
		return jsonError('Internal server error', 500);
	}
};

async function saveProfile(profile: Profile): Promise<void> {
	const db = await connectToDatabase();

	try {
		await db.collection('profiles').insertOne({
			...profile,
			last_updated: Date.now()
		});
	} catch (error) {
		console.error('Error saving profile:', error);
		throw error;
	} finally {
		await closeDatabaseConnection();
	}
}

const jsonError = (error: string, status: number) => json({ success: false, error }, { status });

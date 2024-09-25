import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import type { Profile } from '$lib/types/profile';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const profile = await request.json();

		if (!profile) {
			return jsonError('Missing required fields', 400);
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

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		const { profileCuid } = await request.json();

		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		if (!profileCuid) {
			return jsonError('Missing required fields or user not authenticated', 400);
		}

		await updateUserProfiles(locals.user.email_hash, profileCuid);

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (err) {
		console.error(`Profile update failed: ${err}`);
		return jsonError('Internal server error', 500);
	}
};

async function updateUserProfiles(emailHash: string, profileCuid: string): Promise<void> {
	const db = await connectToDatabase();

	try {
		const result = await db
			.collection('users')
			.updateOne({ email_hash: emailHash }, { $addToSet: { profiles: profileCuid } });

		if (result.matchedCount === 0) {
			throw new Error('User not found');
		}

		if (result.modifiedCount === 0) {
			console.log('Profile CUID already exists in user profiles');
		}
	} catch (error) {
		console.error('Error updating user profiles:', error);
		throw error;
	} finally {
		await closeDatabaseConnection();
	}
}

const jsonError = (error: string, status: number) => json({ success: false, error }, { status });

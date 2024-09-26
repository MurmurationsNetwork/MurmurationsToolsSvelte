import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import type { Profile } from '$lib/types/profile';

// Define the GET handler
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

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { profile_cuid, node_id } = await request.json();

		if (!profile_cuid || !node_id) {
			return jsonError('Missing required fields', 400);
		}

		const db = await connectToDatabase();

		const result = await db
			.collection('profiles')
			.updateOne({ cuid: profile_cuid }, { $set: { node_id } });

		if (result.matchedCount === 0) {
			return jsonError('Profile not found', 404);
		}

		return json({ success: true, message: 'Node ID updated successfully' });
	} catch (err) {
		console.error(`Profile update failed: ${err}`);
		return jsonError('Internal server error', 500);
	} finally {
		await closeDatabaseConnection();
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		const { cuid } = await request.json();
		const email_hash = locals.user?.email_hash;

		if (!cuid || !email_hash) {
			return jsonError('Missing cuid or user not authenticated', 400);
		}

		const isDeleted = await deleteProfile(email_hash, cuid);

		if (!isDeleted) {
			return jsonError('Failed to delete profile', 404);
		}

		return json({ success: true, message: 'Profile deleted successfully' });
	} catch (err) {
		console.error(`Profile deletion failed: ${err}`);
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

async function deleteProfile(emailHash: string, profileCuid: string): Promise<boolean> {
	const db = await connectToDatabase();

	try {
		const user = await db.collection('users').findOne({ email_hash: emailHash });

		if (!user || !user.profiles || !user.profiles.includes(profileCuid)) {
			console.log("Profile not found in user's profiles");
			return false;
		}

		const updateResult = await db
			.collection('users')
			.updateOne({ email_hash: emailHash }, { $pull: { profiles: profileCuid } });

		if (updateResult.modifiedCount === 0) {
			console.log("Failed to remove profile from user's profiles");
			return false;
		}

		const deleteResult = await db.collection('profiles').deleteOne({ cuid: profileCuid });

		if (deleteResult.deletedCount === 0) {
			console.log('Failed to delete profile from profiles collection');
			return false;
		}

		console.log('Profile deleted successfully');
		return true;
	} catch (error) {
		console.error('Error deleting profile:', error);
		throw error;
	} finally {
		await closeDatabaseConnection();
	}
}

const jsonError = (error: string, status: number) => json({ success: false, error }, { status });

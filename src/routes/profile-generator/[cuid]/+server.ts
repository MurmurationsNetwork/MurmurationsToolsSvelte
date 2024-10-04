import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';

// Update profile to user's profiles
export const PUT: RequestHandler = async ({ params, locals }) => {
	try {
		const { cuid } = params;

		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		if (!cuid) {
			return jsonError('Missing required fields or user not authenticated', 400);
		}

		await updateUserProfiles(locals.user.email_hash, cuid);

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

		if (result.modifiedCount === 0) {
			console.log('Failed to add profile to user profiles');
		}
	} catch (error) {
		console.error('Error updating user profiles:', error);
		throw error;
	} finally {
		await closeDatabaseConnection();
	}
}

// Delete profile from user's profiles
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { cuid } = params;
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

async function deleteProfile(emailHash: string, profileCuid: string): Promise<boolean> {
	const db = await connectToDatabase();

	try {
		const user = await db.collection('users').findOne({ email_hash: emailHash });

		if (!user || !user.profiles || !user.profiles.includes(profileCuid)) {
			console.log("Profile not found in user's profiles");
			return false;
		}

		if (Array.isArray(user.profiles)) {
			const updatedProfiles = user.profiles.filter((profile) => profile !== profileCuid);

			const updateResult = await db
				.collection('users')
				.updateOne({ email_hash: emailHash }, { $set: { profiles: updatedProfiles } });

			if (updateResult.modifiedCount === 0) {
				console.log("Failed to remove profile from user's profiles");
				return false;
			}
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

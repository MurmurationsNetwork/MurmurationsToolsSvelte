import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import type { Profile } from '$lib/types/Profile';
import { validateProfile } from '$lib/server/server-utils';
import { jsonError } from '$lib/utils';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { cuid } = params;

		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		if (!cuid) {
			return jsonError('Missing required fields or user not authenticated', 400);
		}

		const profile = await getProfileByCuid(cuid);

		if (!profile) {
			return jsonError('Profile not found', 404);
		}

		return json({ success: true, profile });
	} catch (err) {
		console.error(`Failed to get profile: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function getProfileByCuid(cuid: string): Promise<Profile | null> {
	const db = await connectToDatabase();

	try {
		const profile = await db.collection('profiles').findOne({ cuid });

		if (!profile) {
			return null;
		}

		return {
			cuid: profile.cuid,
			ipfs: profile.ipfs,
			last_updated: profile.last_updated,
			linked_schemas: profile.linked_schemas,
			created_at: profile.created_at,
			updated_at: profile.updated_at,
			node_id: profile.node_id,
			profile: profile.profile,
			title: profile.title
		} as Profile;
	} finally {
		await closeDatabaseConnection();
	}
}

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

		const isUpdated = await updateUserProfiles(locals.user.email_hash, cuid);
		if (!isUpdated) {
			return jsonError('Failed to update profile', 404);
		}

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (err) {
		console.error(`User's profile update failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

async function updateUserProfiles(emailHash: string, profileCuid: string): Promise<boolean> {
	const db = await connectToDatabase();

	try {
		const result = await db
			.collection('users')
			.updateOne({ email_hash: emailHash }, { $addToSet: { profiles: profileCuid } });

		if (result.modifiedCount === 0) {
			console.error('Failed to add profile to user profiles');
			return false;
		}
		return true;
	} finally {
		await closeDatabaseConnection();
	}
}

// Update profile data
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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
				return json({ success: false, errors: validationResponse.errors }, { status: 500 });
			}
			return json({ success: false, errors: validationResponse.errors }, { status: 422 });
		}

		const isUpdated = await updateProfile(cuid, title, last_updated, profile);

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
	profile: string
): Promise<boolean> {
	const db = await connectToDatabase();

	try {
		const updateResult = await db.collection('profiles').updateOne(
			{ cuid },
			{
				$set: {
					title,
					last_updated: lastUpdated,
					profile
				}
			}
		);

		if (updateResult.modifiedCount === 0) {
			console.log('Failed to update profile');
			return false;
		}

		return true;
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
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
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
			console.error('Failed to delete profile from profiles collection');
			return false;
		}

		console.log('Profile deleted successfully');
		return true;
	} finally {
		await closeDatabaseConnection();
	}
}

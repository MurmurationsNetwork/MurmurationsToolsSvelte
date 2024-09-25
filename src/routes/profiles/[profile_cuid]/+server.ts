import { json, type RequestHandler } from '@sveltejs/kit';
import { connectToDatabase, closeDatabaseConnection } from '$lib/db';

export const GET: RequestHandler = async ({ params }) => {
	const { profile_cuid } = params;

	if (!profile_cuid) {
		return json({ success: false, error: 'Profile CUID is required' }, { status: 400 });
	}

	const db = await connectToDatabase();

	try {
		const profile = await db.collection('profiles').findOne({ cuid: profile_cuid });

		if (!profile) {
			return json({ success: false, error: 'Profile not found' }, { status: 404 });
		}

		const parsedProfile = JSON.parse(profile.profile);

		return json(parsedProfile);
	} catch (error) {
		console.error('Error fetching profile:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	} finally {
		await closeDatabaseConnection();
	}
};

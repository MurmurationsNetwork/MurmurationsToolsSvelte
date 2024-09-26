import { json, type RequestHandler } from '@sveltejs/kit';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';

// Update node_id for a profile
export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		const { cuid } = params;
		const { node_id } = await request.json();

		if (!cuid || !node_id) {
			return jsonError('Missing required fields', 400);
		}

		const db = await connectToDatabase();

		const result = await db.collection('profiles').updateOne({ cuid: cuid }, { $set: { node_id } });

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

const jsonError = (error: string, status: number) => json({ success: false, error }, { status });

import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
	} catch (error) {
		console.error('Error checking DB status:', error);
		return new Response(JSON.stringify({ status: 'down' }), { status: 500 });
	} finally {
		await closeDatabaseConnection();
	}
};

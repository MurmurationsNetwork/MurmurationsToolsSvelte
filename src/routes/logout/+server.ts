import { PUBLIC_ENV } from '$env/static/public';
import { connectToDatabase } from '$lib/db';
import { json, type RequestHandler } from '@sveltejs/kit';
import { serialize } from 'cookie';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	try {
		const sessionToken = cookies.get('murmurations_tools_session');

		if (sessionToken) {
			const db = await connectToDatabase();
			await db.collection('sessions').deleteOne({ session_token: sessionToken });
		}

		const cookieHeader = serialize('murmurations_tools_session', '', {
			httpOnly: true,
			path: '/',
			expires: new Date(0),
			secure: PUBLIC_ENV === 'production'
		});

		locals.user = null;

		return json(
			{ success: true, message: 'Successful Logout' },
			{
				status: 200,
				headers: {
					'Set-Cookie': cookieHeader,
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('Logout error:', error);
		return json({ success: false, error: 'Logout failed' }, { status: 500 });
	}
};

import { PUBLIC_ENV } from '$env/static/public';
import { getDB } from '$lib/db/db';
import { sessions } from '$lib/db/migrations/schema';
import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestHandler } from '@sveltejs/kit';
import { serialize } from 'cookie';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({
	cookies,
	locals,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const sessionToken = cookies.get('murmurations_tools_session');

		if (sessionToken) {
			const db = getDB(platform.env);
			await db.delete(sessions).where(eq(sessions.session_token, sessionToken)).run();
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

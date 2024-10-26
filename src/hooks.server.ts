import type { Handle } from '@sveltejs/kit';
import { parse } from 'cookie';
import { closeDatabaseConnection, connectToDatabase } from '$lib/db';
import { isAuthenticatedStore } from '$lib/stores/isAuthenticatedStore';

export const handle: Handle = async ({ event, resolve }) => {
	const cookieHeader = event.request.headers.get('cookie') || '';
	const cookies = parse(cookieHeader);
	const sessionToken = cookies['murmurations_tools_session'];

	if (sessionToken) {
		try {
			const db = await connectToDatabase();
			const session = await db.collection('sessions').findOne({ session_token: sessionToken });

			if (session) {
				const user = await db
					.collection('users')
					.findOne(
						{ email_hash: session.email_hash },
						{ projection: { _id: 0, cuid: 1, email_hash: 1, profiles: 1 } }
					);
				event.locals.user = user as { cuid: string; email_hash: string; profiles: string[] } | null;
				isAuthenticatedStore.set(true);
			} else {
				event.locals.user = null;
				isAuthenticatedStore.set(false);
			}
		} catch (error) {
			// Logout user if MongoDB connection fails
			event.locals.user = null;
			isAuthenticatedStore.set(false);

			const loginUrl = new URL('/login', event.url.origin);
			return new Response(null, {
				status: 302,
				headers: {
					'Set-Cookie': 'murmurations_tools_session=; Path=/; HttpOnly; Max-Age=0',
					Location: loginUrl.toString()
				}
			});
		} finally {
			await closeDatabaseConnection();
		}
	}

	return resolve(event);
};

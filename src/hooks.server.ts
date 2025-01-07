import { getDB } from '$lib/db/db';
import { sessions, users } from '$lib/db/migrations/schema';
import { dbStatus } from '$lib/stores/dbStatus';
import type { D1Database } from '@cloudflare/workers-types';
import type { Handle } from '@sveltejs/kit';
import { parse } from 'cookie';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const cookieHeader = event.request.headers.get('cookie') || '';
	const cookies = parse(cookieHeader);
	const sessionToken = cookies['murmurations_tools_session'];
	const platform = event.platform ?? { env: { DB: {} as D1Database } };

	if (sessionToken) {
		try {
			const db = getDB(platform?.env);
			const session = await db
				.select()
				.from(sessions)
				.where(eq(sessions.session_token, sessionToken))
				.limit(1);
			if (session.length > 0) {
				const user = await db
					.select()
					.from(users)
					.where(eq(users.email_hash, session[0].email_hash))
					.limit(1);
				const currentUser = user[0];
				event.locals.user = {
					cuid: currentUser.cuid,
					email_hash: currentUser.email_hash,
					profiles: []
				};
				event.locals.isAuthenticated = true;
			} else {
				event.locals.user = null;
				event.locals.isAuthenticated = false;

				const loginUrl = new URL('/login', event.url.origin);
				return new Response(null, {
					status: 302,
					headers: {
						'Set-Cookie': 'murmurations_tools_session=; Path=/; HttpOnly; Max-Age=0',
						Location: loginUrl.toString()
					}
				});
			}
		} catch (err) {
			console.error(`Database connection failed: ${err}`);
			dbStatus.set(false);
			event.locals.isAuthenticated = true;
		}
	} else {
		event.locals.isAuthenticated = false;
	}

	return resolve(event);
};

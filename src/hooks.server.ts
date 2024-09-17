import type { Handle } from '@sveltejs/kit';
import { parse } from 'cookie';
import { connectToDatabase } from '$lib/db';

export const handle: Handle = async ({ event, resolve }) => {
	const cookieHeader = event.request.headers.get('cookie') || '';
	const cookies = parse(cookieHeader);
	const sessionToken = cookies.session;

	if (sessionToken) {
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
		}
	}

	return resolve(event);
};

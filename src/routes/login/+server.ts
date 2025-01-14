import { PUBLIC_ENV } from '$env/static/public';
import { getDB } from '$lib/db/db';
import { sessions, users } from '$lib/db/migrations/schema';
import { generateCuid, jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({
	request,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { email, password, loginType } = await request.json();

		if (!email || !password || !loginType) {
			return jsonError('Missing required fields', 400);
		}

		const db = getDB(platform.env);
		switch (loginType) {
			case 'register':
				return await handleRegistration(db, email, password);
			case 'login':
				return await handleLogin(db, email, password);
			default:
				return jsonError('Invalid action', 400);
		}
	} catch (err) {
		console.error(`Login/Registration failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

const handleRegistration = async (db: DrizzleD1Database, email: string, password: string) => {
	const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (existingUser.length > 0) {
		return jsonError('User already exists', 400);
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const cuid = generateCuid();

	const newUser: typeof users.$inferInsert = {
		cuid,
		email,
		password: hashedPassword,
		last_login: new Date()
	};
	const currentUser = await db.insert(users).values(newUser).returning();

	const sessionToken = await createSession(db, currentUser[0].id);

	return createSuccessResponse(cuid, sessionToken, 'Registration successful');
};

const handleLogin = async (db: DrizzleD1Database, email: string, password: string) => {
	const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
	const currentUser = user[0];
	if (!currentUser || !(await bcrypt.compare(password, currentUser.password))) {
		return jsonError('Invalid credentials', 401);
	}

	await db.update(users).set({ last_login: new Date() }).where(eq(users.id, currentUser.id)).run();
	const sessionToken = await createSession(db, currentUser.id);

	return createSuccessResponse(currentUser.cuid, sessionToken, 'Login successful');
};

const createSession = async (db: DrizzleD1Database, user_id: number) => {
	const sessionToken = uuidv4();
	await db
		.insert(sessions)
		.values({
			session_token: sessionToken,
			user_id: user_id
		})
		.run();
	return sessionToken;
};

const createSuccessResponse = (cuid: string, sessionToken: string, message: string) => {
	return new Response(JSON.stringify({ success: true, message, cuid: cuid }), {
		status: 200,
		headers: {
			'Set-Cookie': serialize('murmurations_tools_session', sessionToken, {
				httpOnly: true,
				path: '/',
				secure: PUBLIC_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7
			}),
			'Content-Type': 'application/json'
		}
	});
};

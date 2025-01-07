import { PUBLIC_ENV } from '$env/static/public';
import { getDB } from '$lib/db/db';
import { sessions, users } from '$lib/db/migrations/schema';
import { generateCuid, jsonError } from '$lib/utils';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import crypto from 'crypto';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({
	request,
	platform = { env: { DB: {} as D1Database } }
}) => {
	try {
		const { email, password, loginType } = await request.json();

		if (!email || !password || !loginType) {
			return jsonError('Missing required fields', 400);
		}

		const emailHash = crypto.createHash('sha256').update(email).digest('hex');
		const db = getDB(platform?.env);

		switch (loginType) {
			case 'register':
				return await handleRegistration(db, emailHash, password, email);
			case 'login':
				return await handleLogin(db, emailHash, password, email);
			default:
				return jsonError('Invalid action', 400);
		}
	} catch (err) {
		console.error(`Login/Registration failed: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

const handleRegistration = async (
	db: DrizzleD1Database,
	emailHash: string,
	password: string,
	email: string
) => {
	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.email_hash, emailHash))
		.limit(1);
	if (existingUser.length > 0) {
		return jsonError('User already exists', 400);
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const cuid = generateCuid();

	const newUser: typeof users.$inferInsert = {
		cuid,
		email_hash: emailHash,
		password: hashedPassword,
		ipfs: null,
		ipns: null,
		last_login: new Date(),
		profiles: JSON.stringify([])
	};
	await db.insert(users).values(newUser).run();

	const sessionToken = await createSession(db, emailHash);

	return createSuccessResponse(email, sessionToken, 'Registration successful');
};

const handleLogin = async (
	db: DrizzleD1Database,
	emailHash: string,
	password: string,
	email: string
) => {
	const user = await db.select().from(users).where(eq(users.email_hash, emailHash)).limit(1);
	const currentUser = user[0];
	if (!currentUser || !(await bcrypt.compare(password, currentUser.password))) {
		return jsonError('Invalid credentials', 401);
	}

	await db
		.update(users)
		.set({ last_login: new Date() })
		.where(eq(users.email_hash, emailHash))
		.run();
	const sessionToken = await createSession(db, emailHash);

	return createSuccessResponse(email, sessionToken, 'Login successful');
};

const createSession = async (db: DrizzleD1Database, emailHash: string) => {
	const sessionToken = uuidv4();
	await db
		.insert(sessions)
		.values({
			session_token: sessionToken,
			email_hash: emailHash,
			created_at: new Date()
		})
		.run();
	return sessionToken;
};

const createSuccessResponse = (email: string, sessionToken: string, message: string) => {
	return new Response(JSON.stringify({ success: true, message, userEmail: email }), {
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

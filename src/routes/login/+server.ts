import { PUBLIC_ENV } from '$env/static/public';
import { connectToDatabase } from '$lib/db';
import { generateCuid, jsonError } from '$lib/utils';
import type { RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import crypto from 'crypto';
import type { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password, loginType } = await request.json();

		if (!email || !password || !loginType) {
			return jsonError('Missing required fields', 400);
		}

		const emailHash = crypto.createHash('sha256').update(email).digest('hex');
		const db = await connectToDatabase();

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

const handleRegistration = async (db: Db, emailHash: string, password: string, email: string) => {
	const existingUser = await db.collection('users').findOne({ email_hash: emailHash });
	if (existingUser) {
		return jsonError('User already exists', 400);
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const cuid = generateCuid();

	const newUser = {
		cuid,
		email_hash: emailHash,
		password: hashedPassword,
		ipfs: '',
		ipns: '',
		last_login: Date.now(),
		profiles: []
	};
	await db.collection('users').insertOne(newUser);

	const sessionToken = await createSession(db, emailHash);

	return createSuccessResponse(email, sessionToken, 'Registration successful');
};

const handleLogin = async (db: Db, emailHash: string, password: string, email: string) => {
	const user = await db.collection('users').findOne({ email_hash: emailHash });
	if (!user || !(await bcrypt.compare(password, user.password))) {
		return jsonError('Invalid credentials', 401);
	}

	await db
		.collection('users')
		.updateOne({ email_hash: emailHash }, { $set: { last_login: Date.now() } });
	const sessionToken = await createSession(db, emailHash);

	return createSuccessResponse(email, sessionToken, 'Login successful');
};

const createSession = async (db: Db, emailHash: string) => {
	const sessionToken = uuidv4();
	await db.collection('sessions').insertOne({
		session_token: sessionToken,
		email_hash: emailHash,
		created_at: new Date()
	});
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

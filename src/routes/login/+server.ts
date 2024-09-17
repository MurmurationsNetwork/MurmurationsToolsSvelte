import { connectToDatabase } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import { PUBLIC_ENV } from '$env/static/public';
import { GenerateCuid } from '$lib/utils';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password, loginType } = await request.json();

		if (!email || !password || !loginType) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Hash the email using SHA256
		const emailHash = crypto.createHash('sha256').update(email).digest('hex');

		const db = await connectToDatabase();

		if (loginType === 'register') {
			// Check if the user already exists
			const existingUser = await db.collection('users').findOne({ email_hash: emailHash });
			if (existingUser) {
				return json({ success: false, error: 'User already exists' }, { status: 400 });
			}

			// Hash the password using bcrypt
			const hashedPassword = await bcrypt.hash(password, 10);

			// Generate a CUID for the user
			const cuid = GenerateCuid();

			// Create the new user object
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

			// Generate session
			const sessionToken = uuidv4();
			await db.collection('sessions').insertOne({
				session_token: sessionToken,
				email_hash: emailHash,
				created_at: new Date()
			});

			// Set the session cookie
			return new Response(
				JSON.stringify({ success: true, message: 'Registration successful', userEmail: email }),
				{
					status: 200,
					headers: {
						'Set-Cookie': serialize('session', sessionToken, {
							httpOnly: true,
							path: '/',
							secure: PUBLIC_ENV === 'production',
							maxAge: 60 * 60 * 24 * 7
						}),
						'Content-Type': 'application/json'
					}
				}
			);
		} else if (loginType === 'login') {
			const user = await db.collection('users').findOne({ email_hash: emailHash });

			if (!user || !user.password) {
				return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
			}

			const isCorrectPassword = await bcrypt.compare(password, user.password);

			if (!isCorrectPassword) {
				return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
			}

			// Generate session
			const sessionToken = uuidv4();
			await db.collection('sessions').insertOne({
				session_token: sessionToken,
				email_hash: user.email_hash,
				created_at: new Date()
			});

			await db
				.collection('users')
				.updateOne({ email_hash: emailHash }, { $set: { last_login: Date.now() } });

			return json(
				{ success: true, message: 'Login successful', userEmail: email },
				{
					status: 200,
					headers: {
						'Set-Cookie': serialize('session', sessionToken, {
							httpOnly: true,
							path: '/',
							secure: PUBLIC_ENV === 'production',
							maxAge: 60 * 60 * 24 * 7
						}),
						'Content-Type': 'application/json'
					}
				}
			);
		} else {
			return json({ success: false, error: 'Invalid action' }, { status: 400 });
		}
	} catch (err) {
		console.error(`Login/Register failed: ${err}`);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

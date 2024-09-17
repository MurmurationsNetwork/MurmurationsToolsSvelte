import { connectToDatabase } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import { PUBLIC_ENV } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		// Hash the email using SHA256
		const emailHash = crypto.createHash('sha256').update(email).digest('hex');

		const db = await connectToDatabase();
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
			sessionToken,
			email_hash: user.email_hash,
			createdAt: new Date()
		});

		await db
			.collection('users')
			.updateOne({ email_hash: emailHash }, { $set: { last_login: Date.now() } });

		return json(
			{ success: true, userEmail: email },
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
	} catch (err) {
		console.error(`Login failed: ${err}`);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';
import { env } from '$env/dynamic/private';
import { PUBLIC_ENV } from '$env/static/public';

const host = env.PRIVATE_MONGO_HOST;
const user = encodeURIComponent(env.PRIVATE_MONGO_USER);
const pass = encodeURIComponent(env.PRIVATE_MONGO_PASS);
const dbName = env.PRIVATE_MONGO_DB_NAME;
const e = PUBLIC_ENV;

if (!host || !user || !pass || !dbName || !e) {
	throw new Error('Missing environment variables for MongoDB connection');
}

let uri = `mongodb://${user}:${pass}@${host}`;

if (e !== 'local') {
	uri += '?tls=true';
}

let db: Db;

export async function connectToDatabase(): Promise<Db> {
	if (!db) {
		try {
			const client = new MongoClient(uri);
			await client.connect();
			db = client.db(dbName);
			console.log('Connected to MongoDB');
		} catch (error) {
			console.error('Failed to connect to MongoDB', error);
			throw error;
		}
	}
	return db;
}

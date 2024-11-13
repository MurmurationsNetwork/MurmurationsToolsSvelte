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

console.log('uri', uri);

if (e !== 'local') {
	uri += '?tls=true';
}

let db: Db;
let client: MongoClient;

export async function connectToDatabase(): Promise<Db> {
	if (!db) {
		try {
			// Set 3 seconds timeout for the connection
			const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
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

export async function closeDatabaseConnection(): Promise<void> {
	if (client) {
		try {
			await client.close();
			console.log('MongoDB connection closed');
		} catch (error) {
			console.error('Failed to close MongoDB connection', error);
			throw error;
		}
	}
}

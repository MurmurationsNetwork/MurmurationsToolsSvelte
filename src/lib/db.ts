import { MongoClient, Db } from 'mongodb';
import { env } from '$env/dynamic/private';

const host = env.PRIVATE_MONGO_HOST;
const user = env.PRIVATE_MONGO_USER;
const pass = env.PRIVATE_MONGO_PASS;
const dbName = env.PRIVATE_MONGO_DB_NAME;

if (!host || !user || !pass || !dbName) {
	throw new Error('Missing environment variables for MongoDB connection');
}

const uri = `mongodb://${user}:${pass}@${host}/${dbName}?authSource=admin`;

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

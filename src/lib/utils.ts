import cuid from 'cuid';
import { json } from '@sveltejs/kit';

export const generateCuid = (): string => {
	return cuid();
};

export const jsonError = (error: string, status: number) =>
	json({ success: false, error }, { status });

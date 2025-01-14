import { init } from '@paralleldrive/cuid2';
import { json } from '@sveltejs/kit';

const createId = init({
	length: 25
});

export const generateCuid = (): string => {
	return createId();
};

export const jsonError = (error: string, status: number): Response =>
	json({ success: false, error }, { status });

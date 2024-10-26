import { PUBLIC_INDEX_URL } from '$env/static/public';
import { jsonError } from '$lib/utils';

interface ErrorSource {
	pointer: string;
}

interface ValidationError {
	status: number;
	source: ErrorSource;
	title: string;
	detail: string;
}
export async function validateProfile(
	profile: string
): Promise<{ success: boolean; errors?: ValidationError[] | string }> {
	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: profile
		});

		if (!response.ok) {
			const errorResponse = await response.json();
			const errorData: ValidationError[] = errorResponse.errors || [];
			return { success: false, errors: errorData };
		}

		return { success: true };
	} catch (error) {
		console.error('Fetch failed:', error);
		return {
			success: false,
			errors: 'Unable to connect to Index service, please contact the administrator.'
		};
	}
}

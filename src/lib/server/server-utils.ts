import { PUBLIC_INDEX_URL } from '$env/static/public';

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
	} catch (err) {
		console.error('Fetch failed:', err);
		return {
			success: false,
			errors: 'Unable to connect to the Index service, please try again in a few minutes'
		};
	}
}

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
): Promise<{ success: boolean; errors?: ValidationError[] }> {
	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: profile
		});

		if (response.status === 400) {
			const errorData: { errors: ValidationError[] } = await response.json();
			return { success: false, errors: errorData.errors };
		} else if (!response.ok) {
			const errorData: ValidationError[] = await response.json();
			return { success: false, errors: errorData };
		}

		return { success: true };
	} catch (error) {
		console.error('Error validating profile:', error);
		return {
			success: false,
			errors: [
				{
					status: 500,
					source: { pointer: '' },
					title: 'Internal validation error',
					detail: String(error)
				}
			]
		};
	}
}

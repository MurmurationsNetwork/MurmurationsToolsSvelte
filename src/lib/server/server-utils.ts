import { PUBLIC_INDEX_URL } from '$env/static/public';

export async function validateProfile(profile: any): Promise<{ success: boolean; errors?: any }> {
	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(profile)
		});

		if (response.status === 400) {
			const errorData = await response.json();
			return { success: false, errors: errorData.errors };
		} else if (!response.ok) {
			const errorData = await response.json();
			return { success: false, errors: errorData };
		}

		return { success: true };
	} catch (error) {
		console.error('Error validating profile:', error);
		return { success: false, errors: 'Internal validation error' };
	}
}

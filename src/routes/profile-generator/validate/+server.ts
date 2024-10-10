import { json, type RequestHandler } from '@sveltejs/kit';
import { PUBLIC_INDEX_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (response.status === 400) {
			const errorData = await response.json();
			return json({ success: false, errors: errorData.errors }, { status: response.status });
		} else if (!response.ok) {
			const errorData = await response.json();
			return json({ success: false, errors: errorData }, { status: response.status });
		}

		return json({ success: true, status: response.status });
	} catch (error) {
		console.error('Error validating profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

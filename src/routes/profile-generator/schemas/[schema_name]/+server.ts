import { PUBLIC_LIBRARY_URL } from '$env/static/public';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { schema_name } = params;
		if (!schema_name) {
			// Return error if schema_name is missing
			return json({ error: 'Missing schema_name' }, { status: 400 });
		}

		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/schemas/${schema_name}`);

		if (response.ok) {
			const data = await response.json();
			return json(data);
		} else {
			// Log error if fetching status fails
			console.error('Failed to fetch status:', response.statusText);
			return json({ status: 'unknown' }, { status: response.status });
		}
	} catch (error) {
		// Log error if there is an exception
		console.error('Error fetching status:', error);
		return json({ status: 'unknown' }, { status: 500 });
	}
};

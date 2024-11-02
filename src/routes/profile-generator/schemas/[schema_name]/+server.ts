import { PUBLIC_LIBRARY_URL } from '$env/static/public';
import { jsonError } from '$lib/utils';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { schema_name } = params;
		if (!schema_name) {
			return jsonError('Missing schema_name', 400);
		}

		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/schemas/${schema_name}`);
		const data = await response.json();

		if (response.ok) {
			return json(data);
		} else {
			console.error('Failed to fetch status:', response.statusText);
			return json(data, { status: response.status });
		}
	} catch (error) {
		console.error('Error fetching status:', error);
		return jsonError(
			'Unable to connect to the Library service, please try again in a few minutes',
			500
		);
	}
};

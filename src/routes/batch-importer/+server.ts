import { json, type RequestHandler } from '@sveltejs/kit';
import { jsonError } from '$lib/utils';
import { PUBLIC_DATA_PROXY_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return jsonError('Authentication required', 401);
		}

		const cuid = locals.user.cuid;

		// Validate the cuid
		if (!cuid) {
			return jsonError('Missing user ID', 400);
		}

		console.log('cuid', cuid);

		const response = await fetch(`${PUBLIC_DATA_PROXY_URL}/v1/batch/user?user_id=${cuid}`);
		console.log('url:', `${PUBLIC_DATA_PROXY_URL}/v1/batch/user?user_id=${cuid}`);
		if (!response.ok) {
			return jsonError('Failed to fetch batches data', response.status);
		}

		const data = await response.json();

		return json({ data: data?.data });
	} catch (err) {
		console.error(`Failed to fetch data: ${err}`);
		return jsonError('Unable to connect to the database, please try again in a few minutes', 500);
	}
};

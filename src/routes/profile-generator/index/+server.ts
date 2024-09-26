import { json, type RequestHandler } from '@sveltejs/kit';
import { PUBLIC_INDEX_URL, PUBLIC_TOOLS_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const node_id = url.searchParams.get('node_id');
		if (!node_id) {
			return json({ error: 'Missing node_id' }, { status: 400 });
		}

		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes/${node_id}`);

		if (response.ok) {
			const data = await response.json();
			return json({ status: data.data.status });
		} else {
			console.error('Failed to fetch status:', response.statusText);
			return json({ status: 'unknown' }, { status: response.status });
		}
	} catch (error) {
		console.error('Error fetching status:', error);
		return json({ status: 'unknown' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { cuid } = await request.json();

		if (!cuid) {
			return json({ error: 'Missing cuid' }, { status: 400 });
		}

		const profileUrl = `${PUBLIC_TOOLS_URL}/profiles/${cuid}`;

		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ profile_url: profileUrl })
		});

		if (!response.ok) {
			const errorData = await response.json();
			return json(
				{ error: errorData.error || 'Error posting profile to index' },
				{ status: response.status }
			);
		}

		const result = await response.json();
		return json({ node_id: result.data.node_id });
	} catch (error) {
		console.error('Error posting profile to index:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

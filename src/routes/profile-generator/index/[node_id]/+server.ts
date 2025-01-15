import { json, type RequestHandler } from '@sveltejs/kit';
import {
	PUBLIC_ENV,
	PUBLIC_INDEX_URL,
	PUBLIC_TOOLS_URL,
	PUBLIC_LOCAL_TOOLS_URL
} from '$env/static/public';
import { jsonError } from '$lib/utils';

// Get the status of a profile in the index
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { node_id } = params;
		if (!node_id) {
			return jsonError('Missing node_id', 400);
		}

		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes/${node_id}`);

		const data = await response.json();
		if (response.ok) {
			return json({ status: data.data.status });
		} else {
			console.error('Failed to fetch status:', response.statusText);
			return json(data, { status: response.status });
		}
	} catch (err) {
		console.error('Error fetching status:', err);
		return jsonError(
			'Unable to connect to the Index service, please try again in a few minutes',
			500
		);
	}
};

// Post a profile to the index
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { node_id } = params;

		if (!node_id) {
			return jsonError('Missing cuid', 400);
		}

		let profileUrl = `${PUBLIC_TOOLS_URL}/profiles/${node_id}`;

		// Due to external URLs being inaccessible within k8s, causing the Index Service to fail to read the profile correctly.
		// If the environment is local, use the PUBLIC_LOCAL_TOOLS_URL, which is usually the internal k8s URL.
		if (PUBLIC_ENV === 'local') {
			profileUrl = `${PUBLIC_LOCAL_TOOLS_URL}/profiles/${node_id}`;
		}

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
	} catch (err) {
		console.error('Error posting profile to index:', err);
		return jsonError(
			'Unable to connect to the Index service, please try again in a few minutes',
			500
		);
	}
};

// Delete a profile from the index
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { node_id } = params;

		if (!node_id) {
			return jsonError('Missing node_id', 400);
		}

		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes/${node_id}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			const errorData = await response.json();
			return jsonError(errorData.error || 'Error deleting profile from index', response.status);
		}

		return json({ success: true, message: 'Profile successfully deleted from index' });
	} catch (err) {
		console.error('Error deleting profile from index:', err);
		return jsonError(
			'Unable to connect to the Index service, please try again in a few minutes',
			500
		);
	}
};

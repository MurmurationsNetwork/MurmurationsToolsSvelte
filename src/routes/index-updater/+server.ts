import { json, type RequestHandler } from '@sveltejs/kit';
import { PUBLIC_INDEX_URL } from '$env/static/public';
import crypto from 'crypto';

export const GET: RequestHandler = async ({ url }) => {
	const profileUrl = url.searchParams.get('url');

	if (!profileUrl) {
		return json({ error: 'Missing profile URL' }, { status: 400 });
	}

	const nodeId = crypto.createHash('sha256').update(profileUrl).digest('hex');

	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes/${nodeId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const data = await response.json();

		return json(data);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
		console.error(errorMessage);
		return json(
			{ error: 'The index service is currently not available. Please try again in a few minutes.' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const { profile_url: profileUrl } = await request.json();

	if (!profileUrl) {
		return json({ error: 'Missing profile URL' }, { status: 400 });
	}

	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes-sync`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ profile_url: profileUrl })
		});
		const data = await response.json();

		return json(data);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
		console.error(errorMessage);
		return json(
			{ error: 'The index service is currently not available. Please try again in a few minutes.' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { profile_url: profileUrl } = await request.json();

	if (!profileUrl) {
		return json({ error: 'Missing profile URL' }, { status: 400 });
	}

	const nodeId = crypto.createHash('sha256').update(profileUrl).digest('hex');

	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes/${nodeId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const data = await response.json();

		if (!response.ok) {
			return json(data, { status: response.status });
		}

		return json(data);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
		console.error(errorMessage);
		return json(
			{ error: 'The index service is currently not available. Please try again in a few minutes.' },
			{ status: 500 }
		);
	}
};

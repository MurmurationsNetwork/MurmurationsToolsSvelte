import { json, type RequestHandler } from '@sveltejs/kit';
import { PUBLIC_INDEX_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
	const params = Object.fromEntries(url.searchParams.entries());
	let searchParams = '';

	if (params?.schema && params.schema !== 'all') {
		searchParams += 'schema=' + params.schema;
	}
	if (params?.name) searchParams += '&name=' + params.name;
	if (params?.tags) searchParams += '&tags=' + params.tags;
	if (params?.primary_url) searchParams += '&primary_url=' + params.primary_url;
	if (params?.last_updated) searchParams += '&last_updated=' + params.last_updated;
	if (params?.lat) searchParams += '&lat=' + params.lat;
	if (params?.lon) searchParams += '&lon=' + params.lon;
	if (params?.range) searchParams += '&range=' + params.range;
	if (params?.locality) searchParams += '&locality=' + params.locality;
	if (params?.region) searchParams += '&region=' + params.region;
	if (params?.country) searchParams += '&country=' + params.country;
	if (params?.status) searchParams += '&status=' + params.status;
	if (params?.page_size) searchParams += '&page_size=' + params.page_size;

	const tags_filter = params?.tags_filter ? params.tags_filter : 'or';
	const tags_exact = params?.tags_exact ? params.tags_exact : 'false';
	searchParams += '&tags_filter=' + tags_filter + '&tags_exact=' + tags_exact;

	if (params?.page) searchParams += '&page=' + params.page;

	try {
		const response = await fetch(`${PUBLIC_INDEX_URL}/v2/nodes?${searchParams}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 400) {
			const data = await response.json();
			return json({ error: data?.errors?.[0]?.detail }, { status: 400 });
		}

		if (!response.ok && response.status !== 400) {
			const data = await response.json();
			return json(data, { status: response.status });
		}

		const nodes = await response.json();

		return json({
			data: nodes?.data,
			links: nodes?.links,
			meta: nodes?.meta,
			status: response.status
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
		console.error(`Failed to load nodes: ${errorMessage}`);
		return json({ error: `Failed to load nodes: ${errorMessage}` }, { status: 500 });
	}
};

import type { PageServerLoad } from './$types';
import { PUBLIC_LIBRARY_URL } from '$env/static/public';

interface Schema {
	title: string;
	description: string;
	name: string;
	url: string;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const allSchemas = await getSchemas(fetch);
	const schemasList = allSchemas
		.filter((s: string) => {
			return !s.startsWith('default-v');
		})
		.filter((s: string) => {
			return !s.startsWith('test_schema-v');
		});

	return { schemasList };
};

const getSchemas = async (fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => {
	if (!PUBLIC_LIBRARY_URL) {
		console.error('PUBLIC_LIBRARY_URL is not defined');
		return [];
	}

	try {
		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/schemas`);
		if (!response.ok) {
			console.error(`Get Schema Error, status: ${response.status}`);
			return [];
		}
		const result = await response.json();
		return result.data.map((schema: Schema) => schema.name);
	} catch (error) {
		console.error(error);
		return [];
	}
};

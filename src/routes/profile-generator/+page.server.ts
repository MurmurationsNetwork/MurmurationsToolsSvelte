import type { PageServerLoad } from './$types';
import { PUBLIC_LIBRARY_URL } from '$env/static/public';

interface Schema {
	title: string;
	description: string;
	name: string;
	url: string;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const { schemas, error } = await getSchemas(fetch);
	const schemasList = schemas
		.filter((s: string) => {
			return !s.startsWith('default-v');
		})
		.filter((s: string) => {
			return !s.startsWith('test_schema-v');
		});

	return { schemasList, errorMessage: error };
};

const getSchemas = async (fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => {
	if (!PUBLIC_LIBRARY_URL) {
		return { schemas: [], error: 'PUBLIC_LIBRARY_URL is not defined' };
	}

	try {
		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/schemas`);
		if (!response.ok) {
			const errorMessage = `Unable to connect to the Library service, please try again in a few minutes. Status Code: ${response.status}`;
			return { schemas: [], error: errorMessage };
		}
		const result = await response.json();
		return { schemas: result.data.map((schema: Schema) => schema.name), error: null };
	} catch (error) {
		console.error('Error fetching schemas:', error);
		return {
			schemas: [],
			error: `Unable to connect to the Library service, please try again in a few minutes: ${JSON.stringify(error)}`
		};
	}
};

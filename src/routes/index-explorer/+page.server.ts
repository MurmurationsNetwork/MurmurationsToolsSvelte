import type { PageServerLoad } from './$types';
import { PUBLIC_LIBRARY_URL } from '$env/static/public';

interface Schema {
	title: string;
	description: string;
	name: string;
	url: string;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const { schemas, schemasError } = await getSchemas(fetch);
	const { countries, countriesError } = await getCountries(fetch);

	const schemasList = schemas
		.filter((s: string) => {
			return !s.startsWith('default-v');
		})
		.filter((s: string) => {
			return !s.startsWith('test_schema-v');
		});

	const errorMessage = schemasError || countriesError;

	return { schemasList, countries, errorMessage };
};

const getSchemas = async (fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => {
	if (!PUBLIC_LIBRARY_URL) {
		return { schemas: [], schemasError: 'PUBLIC_LIBRARY_URL is not defined' };
	}

	try {
		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/schemas`);
		if (!response.ok) {
			const errorMessage = `Unable to connect to the Library service, please try again in a few minutes. Status Code: ${response.status}`;
			return { schemas: [], schemasError: errorMessage };
		}
		const result = await response.json();
		return { schemas: result.data.map((schema: Schema) => schema.name), schemasError: null };
	} catch (error) {
		if (error instanceof Error) {
			return {
				schemas: [],
				schemasError: `Unable to connect to the Library service, please try again in a few minutes: ${error?.message || 'Unknown error'}`
			};
		}

		const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
		console.error('Error fetching schemas:', errorDetails);
		return {
			schemas: [],
			schemasError: `Unable to connect to the Library service, please try again in a few minutes: ${errorDetails}`
		};
	}
};

const getCountries = async (
	fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
) => {
	if (!PUBLIC_LIBRARY_URL) {
		return { countries: [], countriesError: 'PUBLIC_LIBRARY_URL is not defined' };
	}

	try {
		const response = await fetch(`${PUBLIC_LIBRARY_URL}/v2/countries`);
		if (!response.ok) {
			const errorMessage = `Unable to connect to the Library service, please try again in a few minutes. Status Code: ${response.status}`;
			return { countries: [], countriesError: errorMessage };
		}
		const result = await response.json();
		const countries = Object.keys(result);
		return { countries, countriesError: null };
	} catch (error) {
		if (error instanceof Error) {
			return {
				countries: [],
				countriesError: `Unable to connect to the Library service, please try again in a few minutes: ${error?.message || 'Unknown error'}`
			};
		}

		const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
		console.error('Error fetching countries:', errorDetails);
		return {
			countries: [],
			countriesError: `Unable to connect to the Library service, please try again in a few minutes: ${errorDetails}`
		};
	}
};

import type { PageServerLoad } from './$types';
import { PUBLIC_LIBRARY_URL } from '$env/static/public';

interface Schema {
	title: string;
	description: string;
	name: string;
	url: string;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const serverStorage: { [key: string]: string } = {};
	const storedSchemas = serverStorage['schemas'];
	const storedCountries = serverStorage['countries'];

	let schemas, countries;
	let errorMessage = null;

	// If there is no data in serverStorage, fetch it from the server
	// Otherwise, return the data from serverStorage and start background update to enhance performance
	if (storedSchemas && storedCountries) {
		schemas = JSON.parse(storedSchemas);
		countries = JSON.parse(storedCountries);

		// Start background update
		(async () => {
			const [{ schemas: newSchemas, schemasError }, { countries: newCountries, countriesError }] =
				await Promise.all([getSchemas(fetch), getCountries(fetch)]);

			if (!schemasError && !countriesError) {
				serverStorage['schemas'] = JSON.stringify(newSchemas);
				serverStorage['countries'] = JSON.stringify(newCountries);
			} else {
				console.error('Background update error:', schemasError || countriesError);
			}
		})();
	} else {
		const [{ schemas: newSchemas, schemasError }, { countries: newCountries, countriesError }] =
			await Promise.all([getSchemas(fetch), getCountries(fetch)]);

		if (!schemasError && !countriesError) {
			serverStorage['schemas'] = JSON.stringify(newSchemas);
			serverStorage['countries'] = JSON.stringify(newCountries);
		} else {
			errorMessage = schemasError || countriesError;
		}

		schemas = newSchemas || [];
		countries = newCountries || [];
	}

	const schemasList = schemas.filter(
		(s: string) => !s.startsWith('default-v') && !s.startsWith('test_schema-v')
	);

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

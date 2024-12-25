import type { PageLoad } from './$types';

export const load: PageLoad = ({ url, data }) => {
	return {
		loadSearchParams: url.searchParams,
		schemasList: data.schemasList,
		countries: data.countries,
		errorMessage: data.errorMessage
	};
};

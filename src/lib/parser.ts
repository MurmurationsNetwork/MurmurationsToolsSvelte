import type { RetrievedSchema, Schema } from '$lib/types/Schema';

export const ParseRef = async (schemaName: string | string[]): Promise<Schema | null> => {
	const url = `profile-generator/schemas`;

	try {
		const schemaNames = Array.isArray(schemaName)
			? schemaName
			: schemaName.split(',').map((name) => name.trim());

		return await parseSchemas(url, schemaNames);
	} catch (err) {
		console.error(`Schema Parse error: ${err}`);
		return null;
	}
};

const parseSchemas = async (url: string, schemaNames: string[]): Promise<Schema | null> => {
	if (schemaNames.length === 0) {
		return null;
	}

	const schemas = await Promise.all(schemaNames.map((name) => retrieveSchema(url, name)));

	// Filter out null values
	const filteredSchemas = schemas.filter((schema) => schema !== null) as RetrievedSchema[];

	if (filteredSchemas.length === 0) {
		return null;
	}

	const mergedSchema: Schema = {
		$schema: filteredSchemas[0].$schema,
		type: 'object',
		properties: {},
		required: [],
		metadata: {
			schema: []
		}
	};

	filteredSchemas.forEach((schema) => {
		Object.assign(mergedSchema.properties, schema.properties);
		mergedSchema.required = Array.from(new Set(mergedSchema.required.concat(schema.required)));
		mergedSchema.metadata.schema.push(schema.metadata.schema.name);
	});

	return mergedSchema;
};

async function retrieveSchema(url: string, schemaName: string): Promise<RetrievedSchema | null> {
	const schemaUrl = `${url}/${schemaName}`;

	try {
		const response = await fetch(schemaUrl);
		if (!response.ok) {
			console.error(`Get Schema Error, status: ${response.status}`);
			return null;
		}
		return await response.json();
	} catch (error) {
		console.error(`Error fetching schema: ${error}`);
		return null;
	}
}

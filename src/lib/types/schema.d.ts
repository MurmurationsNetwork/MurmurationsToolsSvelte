export interface Schema {
	$schema: string;
	type: string;
	properties: { [key: string]: Field };
	required: string[];
	metadata: {
		schema: string[];
	};
}

export interface RetrievedSchema extends Omit<Schema, 'metadata'> {
	metadata: {
		schema: {
			name: string;
		};
	};
}

export interface Field {
	type: 'string' | 'number' | 'array' | 'object' | 'boolean';
	title?: string;
	description?: string;
	enum?: string[];
	enumNames?: string[];
	properties?: Record<string, Field>;
	items?: Field;
	required?: string[];
}

export interface Profile {
	cuid: string;
	linked_schemas: string[];
	title: string;
	profile: string; // JSON string
	node_id: string;
	last_updated: number;
}

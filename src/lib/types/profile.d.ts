export interface Profile {
	cuid: string;
	ipfs: string[];
	last_updated: number;
	linked_schemas: string[];
	node_id: string;
	profile: string; // JSON string
	title: string;
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		user: {
			cuid: string;
			email_hash: string;
			profiles: string[];
		} | null;
		isAuthenticated: boolean;
	}
	// interface PageData {}
	// interface Error {}
	// interface Platform {}
}

declare global {
	interface Window {
		goatcounter: {
			count: (options: { path: (p: string) => string; title: string; event: boolean }) => void;
		};
	}
}

export {};

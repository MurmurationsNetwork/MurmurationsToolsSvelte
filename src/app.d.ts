// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				cuid: string;
				email_hash: string;
				profiles: string[];
			} | null;
			isAuthenticated: boolean;
		}
		// interface PageData {}
		interface Platform {
			env: {
				DB: D1Database;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}

	interface Window {
		goatcounter: {
			count: (options: { path: (p: string) => string; title: string; event: boolean }) => void;
		};
	}
}

export {};

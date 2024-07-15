import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

/**
 * Represents the schema(s) selected for the current profile.
 */
export const schemasSelected: Writable<string[]> = writable([]);

/**
 * Represents the current profile being edited.
 */
export const currentProfile: Writable<Record<string, unknown>> = writable({});

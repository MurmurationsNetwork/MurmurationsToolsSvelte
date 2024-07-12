import { writable } from "svelte/store";

/**
 * Represents the schemas selected for the current profile.
 * @type {import('svelte/store').Writable<string[]>}
 */
export const schemasSelected = writable([]);

/**
 * Represents the current profile being edited.
 * @type {import('svelte/store').Writable<{}>}
 */
export const currentProfile = writable({});

import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

/**
 * Represents the current profile being edited.
 */
export const currentProfile: Writable<Record<string, unknown>> = writable({});

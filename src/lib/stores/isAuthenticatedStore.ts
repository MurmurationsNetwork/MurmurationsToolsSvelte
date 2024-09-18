import { writable } from 'svelte/store';

export const isAuthenticatedStore = writable<boolean>(false);

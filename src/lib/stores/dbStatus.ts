import { writable } from 'svelte/store';

export const dbStatus = writable<boolean>(true);

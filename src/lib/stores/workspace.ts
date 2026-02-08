import { writable } from 'svelte/store';

export const workspaceContent = writable<string>('');

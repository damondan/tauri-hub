// src/lib/persistence.ts

import { invoke } from '@tauri-apps/api/core';
import { todosByDate, commandItems } from '$lib/stores/general';
import { get } from 'svelte/store';

interface UserData {
	todos: Record<string, any>;
	commands: Record<string, any>;
}

let saveTimeout: number | null = null;

// Auto-save with debounce (500ms after last change)
export function scheduleSave() {
	if (saveTimeout !== null) {
		clearTimeout(saveTimeout);
	}
	saveTimeout = window.setTimeout(async () => {
		await saveUserData();
	}, 500);
}

// Save todos and commands to disk
export async function saveUserData(): Promise<void> {
	try {
		const data: UserData = {
			todos: get(todosByDate),
			commands: get(commandItems)
		};
		await invoke('save_user_data', { data: JSON.stringify(data) });
		console.log('User data saved');
	} catch (error) {
		console.error('Failed to save user data:', error);
	}
}

// Load todos and commands from disk
export async function loadUserData(): Promise<void> {
	try {
		const dataStr = await invoke<string>('load_user_data');
		const data: UserData = JSON.parse(dataStr);
		
		if (data.todos) {
			todosByDate.set(data.todos);
		}
		if (data.commands) {
			commandItems.set(data.commands);
		}
		console.log('User data loaded');
	} catch (error) {
		console.error('Failed to load user data:', error);
	}
}

// Subscribe to store changes and auto-save
export function initPersistence() {
	// Subscribe to todos changes
	todosByDate.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to commands changes
	commandItems.subscribe(() => {
		scheduleSave();
	});
}

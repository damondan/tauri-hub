// src/lib/persistence.ts

import { invoke } from '@tauri-apps/api/core';
import { todosByDate, commandItems, todoField1, todoField2, projectsData, todoExpandedState, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks } from '$lib/stores/general';
import { get } from 'svelte/store';

interface UserData {
	todos: Record<string, any>;
	commands: Record<string, any>;
	projects?: Record<string, any>;
	field1?: string;
	field2?: string;
	todoExpandedState?: Record<string, boolean>;
	projectExpandedProjects?: Record<string, boolean>;
	projectExpandedSubprojects?: Record<string, boolean>;
	projectExpandedTasks?: Record<string, boolean>;
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
			commands: get(commandItems),
			projects: get(projectsData),
			field1: get(todoField1),
			field2: get(todoField2),
			todoExpandedState: get(todoExpandedState),
			projectExpandedProjects: get(projectExpandedProjects),
			projectExpandedSubprojects: get(projectExpandedSubprojects),
			projectExpandedTasks: get(projectExpandedTasks)
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
		if (data.projects) {
			projectsData.set(data.projects);
		}
		if (data.field1 !== undefined) {
			todoField1.set(data.field1);
		}
		if (data.field2 !== undefined) {
			todoField2.set(data.field2);
		}
		if (data.todoExpandedState) {
			todoExpandedState.set(data.todoExpandedState);
		}
		if (data.projectExpandedProjects) {
			projectExpandedProjects.set(data.projectExpandedProjects);
		}
		if (data.projectExpandedSubprojects) {
			projectExpandedSubprojects.set(data.projectExpandedSubprojects);
		}
		if (data.projectExpandedTasks) {
			projectExpandedTasks.set(data.projectExpandedTasks);
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

	// Subscribe to projects changes
	projectsData.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to field changes
	todoField1.subscribe(() => {
		scheduleSave();
	});

	todoField2.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to expanded state changes
	todoExpandedState.subscribe(() => {
		scheduleSave();
	});

	projectExpandedProjects.subscribe(() => {
		scheduleSave();
	});

	projectExpandedSubprojects.subscribe(() => {
		scheduleSave();
	});

	projectExpandedTasks.subscribe(() => {
		scheduleSave();
	});
}

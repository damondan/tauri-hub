// src/lib/persistence.ts

import { invoke } from '@tauri-apps/api/core';
import { todosByDate, commandItems, todoField1, todoField2, projectsData, todoExpandedState, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks, howtoData, howtoExpandedCategories, howtoExpandedSubcategories, howtoExpandedTopics, financeData, financeExpandedCategories, financeExpandedSubcategories, financeExpandedTopics } from '$lib/stores/general';
import { get } from 'svelte/store';

interface UserData {
	todos: Record<string, any>;
	commands: Record<string, any>;
	projects?: Record<string, any>;
	howto?: any[];
	finance?: any[];
	field1?: string;
	field2?: string;
	todoExpandedState?: Record<string, boolean>;
	projectExpandedProjects?: Record<string, boolean>;
	projectExpandedSubprojects?: Record<string, boolean>;
	projectExpandedTasks?: Record<string, boolean>;
	howtoExpandedCategories?: Record<string, boolean>;
	howtoExpandedSubcategories?: Record<string, boolean>;
	howtoExpandedTopics?: Record<string, boolean>;
	financeExpandedCategories?: Record<string, boolean>;
	financeExpandedSubcategories?: Record<string, boolean>;
	financeExpandedTopics?: Record<string, boolean>;
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
		howto: get(howtoData),
		finance: get(financeData),
		field1: get(todoField1),
		field2: get(todoField2),
		todoExpandedState: get(todoExpandedState),
		projectExpandedProjects: get(projectExpandedProjects),
		projectExpandedSubprojects: get(projectExpandedSubprojects),
		projectExpandedTasks: get(projectExpandedTasks),
		howtoExpandedCategories: get(howtoExpandedCategories),
		howtoExpandedSubcategories: get(howtoExpandedSubcategories),
		howtoExpandedTopics: get(howtoExpandedTopics),
		financeExpandedCategories: get(financeExpandedCategories),
		financeExpandedSubcategories: get(financeExpandedSubcategories),
		financeExpandedTopics: get(financeExpandedTopics)
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
		if (data.howto) {
			howtoData.set(data.howto);
		}
		if (data.todoExpandedState) {
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
		if (data.howtoExpandedCategories) {
			howtoExpandedCategories.set(data.howtoExpandedCategories);
		}
		if (data.howtoExpandedSubcategories) {
			howtoExpandedSubcategories.set(data.howtoExpandedSubcategories);
		}
	if (data.howtoExpandedTopics) {
		howtoExpandedTopics.set(data.howtoExpandedTopics);
	}
	if (data.finance) {
		financeData.set(data.finance);
	}
	if (data.financeExpandedCategories) {
		financeExpandedCategories.set(data.financeExpandedCategories);
	}
	if (data.financeExpandedSubcategories) {
		financeExpandedSubcategories.set(data.financeExpandedSubcategories);
	}
	if (data.financeExpandedTopics) {
		financeExpandedTopics.set(data.financeExpandedTopics);
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

	// Subscribe to howto changes
	howtoData.subscribe(() => {
		scheduleSave();
	});

	howtoExpandedCategories.subscribe(() => {
		scheduleSave();
	});

	howtoExpandedSubcategories.subscribe(() => {
		scheduleSave();
	});

	howtoExpandedTopics.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to finance changes
	financeData.subscribe(() => {
		scheduleSave();
	});

	financeExpandedCategories.subscribe(() => {
		scheduleSave();
	});

	financeExpandedSubcategories.subscribe(() => {
		scheduleSave();
	});

	financeExpandedTopics.subscribe(() => {
		scheduleSave();
	});
}

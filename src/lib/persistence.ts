// src/lib/persistence.ts

import { invoke } from '@tauri-apps/api/core';
import { todosByDate, todoField1, todoField2, todoExpandedState } from '$lib/stores/todo';
import { commandItems } from '$lib/stores/commands';
import { projectsData, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks } from '$lib/stores/projects';
import { howtoData, howtoExpandedCategories, howtoExpandedSubcategories, howtoExpandedTopics } from '$lib/stores/howto';
import { financeData, financeExpandedYears, financeExpandedMonths, financeExpandedWeeks } from '$lib/stores/finance';
import { healthData, healthExpandedYears, healthExpandedMonths, healthExpandedWeeks } from '$lib/stores/health';
import { get } from 'svelte/store';

interface UserData {
	todos: Record<string, any>;
	commands: Record<string, any>;
	projects?: Record<string, any>;
	howto?: any[];
	finance?: any[];
	health?: any[];
	field1?: string;
	field2?: string;
	todoExpandedState?: Record<string, boolean>;
	projectExpandedProjects?: Record<string, boolean>;
	projectExpandedSubprojects?: Record<string, boolean>;
	projectExpandedTasks?: Record<string, boolean>;
	howtoExpandedCategories?: Record<string, boolean>;
	howtoExpandedSubcategories?: Record<string, boolean>;
	howtoExpandedTopics?: Record<string, boolean>;
	financeExpandedYears?: Record<string, boolean>;
	financeExpandedMonths?: Record<string, boolean>;
	financeExpandedWeeks?: Record<string, boolean>;
	healthExpandedYears?: Record<string, boolean>;
	healthExpandedMonths?: Record<string, boolean>;
	healthExpandedWeeks?: Record<string, boolean>;
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
		health: get(healthData),
		field1: get(todoField1),
		field2: get(todoField2),
		todoExpandedState: get(todoExpandedState),
		projectExpandedProjects: get(projectExpandedProjects),
		projectExpandedSubprojects: get(projectExpandedSubprojects),
		projectExpandedTasks: get(projectExpandedTasks),
		howtoExpandedCategories: get(howtoExpandedCategories),
		howtoExpandedSubcategories: get(howtoExpandedSubcategories),
		howtoExpandedTopics: get(howtoExpandedTopics),
		financeExpandedYears: get(financeExpandedYears),
		financeExpandedMonths: get(financeExpandedMonths),
		financeExpandedWeeks: get(financeExpandedWeeks),
		healthExpandedYears: get(healthExpandedYears),
		healthExpandedMonths: get(healthExpandedMonths),
		healthExpandedWeeks: get(healthExpandedWeeks)
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
	if (data.financeExpandedYears) {
		financeExpandedYears.set(data.financeExpandedYears);
	}
	if (data.financeExpandedMonths) {
		financeExpandedMonths.set(data.financeExpandedMonths);
	}
	if (data.financeExpandedWeeks) {
		financeExpandedWeeks.set(data.financeExpandedWeeks);
	}
	if (data.health) {
		healthData.set(data.health);
	}
	if (data.healthExpandedYears) {
		healthExpandedYears.set(data.healthExpandedYears);
	}
	if (data.healthExpandedMonths) {
		healthExpandedMonths.set(data.healthExpandedMonths);
	}
	if (data.healthExpandedWeeks) {
		healthExpandedWeeks.set(data.healthExpandedWeeks);
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

	financeExpandedYears.subscribe(() => {
		scheduleSave();
	});

	financeExpandedMonths.subscribe(() => {
		scheduleSave();
	});

	financeExpandedWeeks.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to health changes
	healthData.subscribe(() => {
		scheduleSave();
	});

	healthExpandedYears.subscribe(() => {
		scheduleSave();
	});

	healthExpandedMonths.subscribe(() => {
		scheduleSave();
	});

	healthExpandedWeeks.subscribe(() => {
		scheduleSave();
	});
}

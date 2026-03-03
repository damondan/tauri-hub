// src/lib/persistence.ts

import { invoke } from '@tauri-apps/api/core';
import { todosByDate, todoField1, todoField2, todoExpandedState } from '$lib/stores/todo';
import { commandData, commandExpandedCategories, commandExpandedSubcategories } from '$lib/stores/commands';
import { projectsData, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks } from '$lib/stores/projects';
import { howtoData, howtoExpandedCategories, howtoExpandedSubcategories, howtoExpandedTopics } from '$lib/stores/howto';
import { financeData, financeExpandedYears, financeExpandedMonths, financeExpandedWeeks } from '$lib/stores/finance';
import { goalData, goalExpandedYears, goalExpandedMonths, goalExpandedWeeks } from '$lib/stores/goal';
import { workspaceContentA, workspaceContentB } from '$lib/stores/workspace';
import { get } from 'svelte/store';

interface UserData {
	todos: Record<string, any>;
	commands?: any[]; // New array format
	commandsOld?: Record<string, any>; // Old format (for backwards compat, will be ignored)
	projects?: Record<string, any>;
	howto?: any[];
	finance?: any[];
	goal?: any[];
	workspaceA?: string;
	workspaceB?: string;
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
	goalExpandedYears?: Record<string, boolean>;
	goalExpandedMonths?: Record<string, boolean>;
	goalExpandedWeeks?: Record<string, boolean>;
	commandExpandedCategories?: Record<string, boolean>;
	commandExpandedSubcategories?: Record<string, boolean>;
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
		commands: get(commandData),
		commandExpandedCategories: get(commandExpandedCategories),
		commandExpandedSubcategories: get(commandExpandedSubcategories),
		projects: get(projectsData),
		howto: get(howtoData),
		finance: get(financeData),
		goal: get(goalData),
		workspaceA: get(workspaceContentA),
		workspaceB: get(workspaceContentB),
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
		goalExpandedYears: get(goalExpandedYears),
		goalExpandedMonths: get(goalExpandedMonths),
		goalExpandedWeeks: get(goalExpandedWeeks)
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
		if (data.commands && Array.isArray(data.commands)) {
			commandData.set(data.commands);
		}
		if (data.commandExpandedCategories) {
			commandExpandedCategories.set(data.commandExpandedCategories);
		}
		if (data.commandExpandedSubcategories) {
			commandExpandedSubcategories.set(data.commandExpandedSubcategories);
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
	if (data.goal) {
		goalData.set(data.goal);
	}
	if (data.goalExpandedYears) {
		goalExpandedYears.set(data.goalExpandedYears);
	}
	if (data.goalExpandedMonths) {
		goalExpandedMonths.set(data.goalExpandedMonths);
	}
	if (data.goalExpandedWeeks) {
		goalExpandedWeeks.set(data.goalExpandedWeeks);
	}
	if (data.workspaceA !== undefined) {
		workspaceContentA.set(data.workspaceA);
	}
	if (data.workspaceB !== undefined) {
		workspaceContentB.set(data.workspaceB);
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
	commandData.subscribe(() => {
		scheduleSave();
	});

	commandExpandedCategories.subscribe(() => {
		scheduleSave();
	});

	commandExpandedSubcategories.subscribe(() => {
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

	// Subscribe to goal changes
	goalData.subscribe(() => {
		scheduleSave();
	});

	goalExpandedYears.subscribe(() => {
		scheduleSave();
	});

	goalExpandedMonths.subscribe(() => {
		scheduleSave();
	});

	goalExpandedWeeks.subscribe(() => {
		scheduleSave();
	});

	// Subscribe to workspace changes
	workspaceContentA.subscribe(() => {
		scheduleSave();
	});
	workspaceContentB.subscribe(() => {
		scheduleSave();
	});
}

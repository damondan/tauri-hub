// src/lib/persistence.ts
//5.8.26 - saying password is incorrect or data is corrupted. 
import { invoke } from '@tauri-apps/api/core';
import { appPersState } from '$lib/stores/state.svelte';
import { todosByDate, todoField1, todoField2, todoExpandedState } from '$lib/stores/todo';
import { commandData, commandExpandedCategories, commandExpandedSubcategories } from '$lib/stores/commands';
import { projectsData, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks } from '$lib/stores/projects';
import { howtoData, howtoExpandedCategories, howtoExpandedSubcategories, howtoExpandedTopics } from '$lib/stores/howto';
import { financeData, financeExpandedYears, financeExpandedMonths, financeExpandedWeeks } from '$lib/stores/finance';
import { calendarData } from '$lib/stores/calendar';
import {
	persGoalData, updateYearByNumberPrivateGoal, persGoalEncryptedCache, persGoalExpandedYears, persGoalExpandedMonths, persGoalExpandedWeeks, persGoalHighlights,
	migratePersGoalHighlights, persGoalHighlightEncryptedCache, migratePersGoal, persLockState, type HighlightLevel1, type PersGoalYear,
	LockState,
	type PersLockState
} from '$lib/stores/persgoal';
import { profGoalData, profGoalExpandedYears, profGoalExpandedMonths, profGoalExpandedWeeks, profGoalHighlights } from '$lib/stores/profgoal';
import { workspaceContentA, workspaceContentB } from '$lib/stores/workspace';
import { theGoalData, theGoalExpandedMonths, theGoalExpandedYears } from './stores/thegoals';
import { pass } from "$lib/stores/auth";
import { get } from 'svelte/store';
import ProfHighlights from './components/ProfHighlights.svelte';

let isHydrated = false;

export function setHydrated(value: boolean) {
	isHydrated = value;
}

interface UserData {
	todos: Record<string, any>;
	commands?: any[];
	commandsOld?: Record<string, any>;
	projects?: Record<string, any>;
	howto?: any[];
	finance?: any[];
	calendar?: any[];
	persgoalencryption?: string;                         
	profgoal?: any[],
	profhighlights?: Record<string, HighlightLevel1>;
	persgoalhighlightsencrypted?: string,         
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
	persGoalExpandedYears?: Record<string, boolean>;
	persGoalExpandedMonths?: Record<string, boolean>;
	persGoalExpandedWeeks?: Record<string, boolean>;
	profGoalExpandedYears?: Record<string, boolean>;
	profGoalExpandedMonths?: Record<string, boolean>;
	profGoalExpandedWeeks?: Record<string, boolean>;
	commandExpandedCategories?: Record<string, boolean>;
	commandExpandedSubcategories?: Record<string, boolean>;
	perslockstate: PersLockState
}

let saveTimeout: number | null = null;

// Every 1 second there is no activity on a scheduleSave for a data structure, scheduleSave is called.
//This needs to add encryptPersHighlightGoals after encryptPersGoals.
//This than calls the encryptPersGoals
export function scheduleSave() {

	if (saveTimeout !== null) {
		clearTimeout(saveTimeout);
	}
	saveTimeout = window.setTimeout(async () => {

		await encryptPersGoals();
		await saveUserData();
	}, 1000);
}

//This is called to ecrypt the PersGoal Data - takes in the persGoalData
//After this is called, persGoalEncryptedCache is set to cache that encryption
//This encrypts and caches the encryption. It does not save it to backend yet.
//GOOD DONE
export async function encryptPersGoals() {
	//Here I need to have the password and add initial text to this year.yearPrivateGoal
	console.log(`encryptPersGoals in persistence.ts`);
	const password = get(pass);

	if (get(persLockState) == LockState.UNLOCKED && get(pass)) {
		console.log(`LockState is unlocked and pass is true - before calling encryptPersGoals`);
		const persEncrypted = await invoke<string>("encrypt_highlights", {
			password,
			data: JSON.stringify(get(persGoalData))
		});
		const persHLEncrypted = await invoke<string>("encrypt_highlights", {
			password,
			data: JSON.stringify(get(persGoalHighlights))
		});

		persGoalEncryptedCache.set(persEncrypted);
		persGoalHighlightEncryptedCache.set(persHLEncrypted);
	}
}

// Save todos and commands to disk
export async function saveUserData(): Promise<void> {
	try {
		console.log(`In saveUserData an lockState is ${get(persLockState)}`);
		const data: UserData = {
			todos: get(todosByDate),
			commands: get(commandData),
			commandExpandedCategories: get(commandExpandedCategories),
			commandExpandedSubcategories: get(commandExpandedSubcategories),
			projects: get(projectsData),
			howto: get(howtoData),
			finance: get(financeData),
			calendar: get(calendarData),
			persgoalencryption: get(persGoalEncryptedCache) ?? "",
			persgoalhighlightsencrypted: get(persGoalHighlightEncryptedCache) ?? "",
			profgoal: get(profGoalData),
			profhighlights: get(profGoalHighlights),
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
			persGoalExpandedYears: get(persGoalExpandedYears),
			persGoalExpandedMonths: get(persGoalExpandedMonths),
			persGoalExpandedWeeks: get(persGoalExpandedWeeks),
			profGoalExpandedYears: get(profGoalExpandedYears),
			profGoalExpandedMonths: get(profGoalExpandedMonths),
			profGoalExpandedWeeks: get(profGoalExpandedWeeks),
			perslockstate: get(persLockState)
		};
		await invoke('save_user_data', { data: JSON.stringify(data) });
		console.log('User data saved');
	} catch (error) {
		console.error('Failed to save user data:', error);
	}
}

// For Pers, gets the data.persgoalencryption and sets persGoalEncryptionCache. This
//sets the cache so that it can than be decrypted when Pers tab is clicked. 
export async function loadUserData(): Promise<void> {
	console.log(`In loadUserData lockstate is ${get(persLockState)}`);
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
		if (data.calendar) {
			calendarData.set(data.calendar);
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
		if (data.persGoalExpandedYears) {
			persGoalExpandedYears.set(data.persGoalExpandedYears);
		}
		if (data.persGoalExpandedMonths) {
			persGoalExpandedMonths.set(data.persGoalExpandedMonths);
		}
		if (data.persGoalExpandedWeeks) {
			persGoalExpandedWeeks.set(data.persGoalExpandedWeeks);
		}
		persGoalEncryptedCache.set(data.persgoalencryption ?? "");
		persGoalHighlightEncryptedCache.set(data.persgoalhighlightsencrypted ?? "");
		persLockState.set(data.perslockstate);
		if (data.profgoal) {
			profGoalData.set(data.profgoal);
		}
		if (data.profhighlights) {
			profGoalHighlights.set(data.profhighlights);
		}
		if (data.profGoalExpandedYears) {
			profGoalExpandedYears.set(data.profGoalExpandedYears);
		}
		if (data.profGoalExpandedMonths) {
			profGoalExpandedMonths.set(data.profGoalExpandedMonths);
		}
		if (data.profGoalExpandedWeeks) {
			persGoalExpandedWeeks.set(data.profGoalExpandedWeeks);
		}
		if (data.workspaceA !== undefined) {
			workspaceContentA.set(data.workspaceA);
		}
		if (data.workspaceB !== undefined) {
			workspaceContentB.set(data.workspaceB);
		}
		console.log('User data loaded');
		console.log(`persLockState set locally with ${get(persLockState)}`);
	} catch (error) {
		console.error('Failed to load user data:', error);
	}
}

// Subscribe to store changes and auto-save
export function initPersistence() {

	// Subscribe to todos changes
	todosByDate.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to commands changes
	commandData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	commandExpandedCategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	commandExpandedSubcategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to projects changes
	projectsData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to field changes
	todoField1.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	todoField2.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to expanded state changes
	todoExpandedState.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	projectExpandedProjects.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	projectExpandedSubprojects.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	projectExpandedTasks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to howto changes
	howtoData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	howtoExpandedCategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	howtoExpandedSubcategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	howtoExpandedTopics.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to finance changes
	financeData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	calendarData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	financeExpandedYears.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	financeExpandedMonths.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	financeExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	persGoalExpandedYears.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	persGoalExpandedMonths.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	persGoalExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to goal changes
	persGoalData.subscribe(() => {
		if (!isHydrated) return;
		console.log("In ScheduleSave persGoalData");
		scheduleSave();
	});

	persGoalHighlights.subscribe(() => {
		if (!isHydrated) return;
		console.log("In ScheduleSave persGoalHighlights");
		scheduleSave();
	});

	persLockState.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to goal changes
	profGoalData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	profGoalHighlights.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	profGoalExpandedYears.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	profGoalExpandedMonths.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	profGoalExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});

	// Subscribe to workspace changes
	workspaceContentA.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});
	workspaceContentB.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave();
	});
}

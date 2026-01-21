// src/lib/stores/general.ts

import { writable } from 'svelte/store';

// Simple array of status words
export const statusWords = writable<string[]>(['home', 'alpha', 'bravo', 'charlie']);

// Todos by date
export interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
}

export const todosByDate = writable<Record<string, TodoItem[]>>({});

// Track if data has been loaded
let todosDataLoaded = false;

// Mock data for development
// const mockTodosData: Record<string, TodoItem[]> = {
// 	'2026-01-20': [
// 		{ id: '1', text: 'Review project requirements', completed: false },
// 		{ id: '2', text: 'Update documentation', completed: true },
// 		{ id: '3', text: 'Test new features', completed: false }
// 	],
// 	'2026-01-21': [
// 		{ id: '4', text: 'Team standup meeting', completed: false },
// 		{ id: '5', text: 'Code review', completed: false }
// 	],
// 	'2026-01-22': [
// 		{ id: '6', text: 'Deploy to staging', completed: false },
// 		{ id: '7', text: 'Performance testing', completed: false },
// 		{ id: '8', text: 'Bug fixes', completed: false }
// 	]
// };

const mockTodosData: Record<string, TodoItem[]> = {};

// Load todos data (only runs once)
// loadTodosData()
export const loadTodosData = () => {
	if (!todosDataLoaded) {
		todosByDate.set(mockTodosData);
		todosDataLoaded = true;
	}
};

// Force reload data (if needed)
// reloadTodosData()
export const reloadTodosData = () => {
	todosDataLoaded = false;
	loadTodosData();
};

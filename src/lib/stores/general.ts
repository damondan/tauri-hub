// src/lib/stores/general.ts

import { writable } from 'svelte/store';

// Simple array of status words
export const statusWords = writable<string[]>(['home', 'alpha', 'bravo', 'charlie']);

// ToDo header fields
export const todoField1 = writable<string>('');
export const todoField2 = writable<string>('');

// Commands
export interface CommandItemTextRow {
	id: string;
	text: string;
}

export interface CommandItem {
	id: string;
	title: string;
	rows: CommandItemTextRow[];
}

export const commandItems = writable<Record<string, CommandItem>>({});

// Todos by date
export interface TodoRow {
	id: string;
	text: string;
	completed: boolean;
	startTime?: string; // ISO 8601 timestamp
	finishTime?: string; // ISO 8601 timestamp
}

export interface TodoItem {
	id: string;
	date: string; // YYYY-MM-DD
	title: string;
	rows: TodoRow[];
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

// Helper: generate unique id
function makeId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Helper: get today as YYYY-MM-DD
// todayKey(): string
export function todayKey(): string {
	const d = new Date();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${month}-${day}`;
}

// Add a new TodoItem container
// addTodoItem(date?: string): { id: string; date: string }
export function addTodoItem(date: string = todayKey()): { id: string; date: string } {
	const id = makeId();
	todosByDate.update((map) => {
		const list = map[date] ? [...map[date]] : [];
		list.unshift({ id, date, title: '', rows: [] });
		return { ...map, [date]: list };
	});
	return { id, date };
}

// Remove a TodoItem container
// removeTodoItem(date: string, itemId: string): void
export function removeTodoItem(date: string, itemId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).filter((it) => it.id !== itemId);
		const next = { ...map } as Record<string, TodoItem[]>;
		if (nextList.length === 0) delete next[date];
		else next[date] = nextList;
		return next;
	});
}

// Update TodoItem title
// updateTodoTitle(date: string, itemId: string, title: string): void
export function updateTodoTitle(date: string, itemId: string, title: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) => (it.id === itemId ? { ...it, title } : it));
		return { ...map, [date]: nextList };
	});
}

// Add a new TodoRow under a TodoItem
// addTodoRow(date: string, itemId: string): string
export function addTodoRow(date: string, itemId: string): string {
	const rowId = makeId();
	const startTime = new Date().toISOString();
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: [...it.rows, { id: rowId, text: '', completed: false, startTime }] } : it
		);
		return { ...map, [date]: nextList };
	});
	return rowId;
}

// Update a TodoRow's text
// updateTodoRowText(date: string, itemId: string, rowId: string, text: string): void
export function updateTodoRowText(date: string, itemId: string, rowId: string, text: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: it.rows.map((r) => (r.id === rowId ? { ...r, text } : r)) } : it
		);
		return { ...map, [date]: nextList };
	});
}

// Toggle TodoRow completed state
// toggleTodoRow(date: string, itemId: string, rowId: string): void
export function toggleTodoRow(date: string, itemId: string, rowId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId
				? { ...it, rows: it.rows.map((r) => {
						if (r.id === rowId) {
							const newCompleted = !r.completed;
							// If toggling to completed, set finishTime
							const finishTime = newCompleted ? new Date().toISOString() : r.finishTime;
							return { ...r, completed: newCompleted, finishTime };
						}
						return r;
					}) }
				: it
		);
		return { ...map, [date]: nextList };
	});
}

// Delete a TodoRow
// deleteTodoRow(date: string, itemId: string, rowId: string): void
export function deleteTodoRow(date: string, itemId: string, rowId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: it.rows.filter((r) => r.id !== rowId) } : it
		);
		return { ...map, [date]: nextList };
	});
}

// ===== COMMANDS HELPERS =====

// Add a new CommandItem
// addCommandItem(): string (returns id)
export function addCommandItem(): string {
	const id = makeId();
	commandItems.update((map) => {
		return { ...map, [id]: { id, title: '', rows: [] } };
	});
	return id;
}

// Remove a CommandItem
// removeCommandItem(itemId: string): void
export function removeCommandItem(itemId: string): void {
	commandItems.update((map) => {
		const next = { ...map };
		delete next[itemId];
		return next;
	});
}

// Update CommandItem title
// updateCommandTitle(itemId: string, title: string): void
export function updateCommandTitle(itemId: string, title: string): void {
	commandItems.update((map) => {
		const item = map[itemId];
		if (!item) return map;
		return { ...map, [itemId]: { ...item, title } };
	});
}

// Add a text row to a CommandItem
// addCommandTextRow(itemId: string): string (returns row id)
export function addCommandTextRow(itemId: string): string {
	const rowId = makeId();
	commandItems.update((map) => {
		const item = map[itemId];
		if (!item) return map;
		return { ...map, [itemId]: { ...item, rows: [...item.rows, { id: rowId, text: '' }] } };
	});
	return rowId;
}

// Update a command text row
// updateCommandTextRow(itemId: string, rowId: string, text: string): void
export function updateCommandTextRow(itemId: string, rowId: string, text: string): void {
	commandItems.update((map) => {
		const item = map[itemId];
		if (!item) return map;
		const rows = item.rows.map((r) => (r.id === rowId ? { ...r, text } : r));
		return { ...map, [itemId]: { ...item, rows } };
	});
}

// Delete a command text row
// deleteCommandTextRow(itemId: string, rowId: string): void
export function deleteCommandTextRow(itemId: string, rowId: string): void {
	commandItems.update((map) => {
		const item = map[itemId];
		if (!item) return map;
		const rows = item.rows.filter((r) => r.id !== rowId);
		return { ...map, [itemId]: { ...item, rows } };
	});
}

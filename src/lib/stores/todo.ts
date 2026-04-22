import { writable } from 'svelte/store';
import { makeId, todayKey } from './general';
import { projectsData, type ProjectTask } from './projects';
// ToDo header fields
export const todoField1 = writable<string>('');
export const todoField2 = writable<string>('');

export const todoExpandedState = writable<Record<string, boolean>>({});

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

export function addTodoItem(date: string = todayKey()): { id: string; date: string } {
	const id = makeId();
	todosByDate.update((map) => {
		const list = map[date] ? [...map[date]] : [];
		list.push({ id, date, title: '', rows: [] });
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

// parseTodoTitle(title: string): { project: string; subproject: string; description: string } | null
function parseTodoTitle(title: string): { project: string; subproject: string; description: string } | null {
	const words = title.trim().split(/\s+/);
	let project = '';
	let subproject = '';
	const descriptionWords: string[] = [];

	for (const word of words) {
		if (word.startsWith('#')) {
			project = word.substring(1);
		} else if (word.startsWith('@')) {
			subproject = word.substring(1);
		} else {
			descriptionWords.push(word);
		}
	}

	if (!project || !subproject || descriptionWords.length === 0) {
		return null;
	}

	return {
		project,
		subproject,
		description: descriptionWords.join(' ')
	};
}

export function sendTodoToProjects(date: string, itemId: string): boolean {
	let success = false;
	let todoItem: TodoItem | null = null;

	// Get the TodoItem
	todosByDate.update((map) => {
		const items = map[date] ?? [];
		const item = items.find((it) => it.id === itemId);
		if (item) {
			todoItem = item;
		}
		return map;
	});

	if (!todoItem) return false;

	// TypeScript type narrowing - todoItem is now guaranteed to be TodoItem
	const item: TodoItem = todoItem;

	// Parse the title
	const parsed = parseTodoTitle(item.title);
	if (!parsed) return false;

	const { project, subproject, description } = parsed;
	const endDate = new Date().toISOString();

    	const task: ProjectTask = {
		id: item.id,
		description,
		startDate: item.date,
		endDate,
		rows: item.rows
	};

	// Add to projectsData
	projectsData.update((projects) => {
		const updatedProjects = { ...projects };

		// Ensure project exists
		if (!updatedProjects[project]) {
			updatedProjects[project] = {
				name: project,
				subprojects: {}
			};
		}

		// Ensure subproject exists
		if (!updatedProjects[project].subprojects[subproject]) {
			updatedProjects[project].subprojects[subproject] = {
				name: subproject,
				tasks: []
			};
		}

		// Add task to subproject
		updatedProjects[project].subprojects[subproject].tasks.push(task);

		success = true;
		return updatedProjects;
	});

	// Remove from todosByDate
	if (success) {
		removeTodoItem(date, itemId);
	}

	return success;
}

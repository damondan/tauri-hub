import { writable } from 'svelte/store';
import { makeId } from '$lib/stores/general'
export const commandItems = writable<Record<string, CommandItem>>({});

export interface CommandItemTextRow {
	id: string;
	text: string;
}

export interface CommandItem {
	id: string;
	title: string;
	rows: CommandItemTextRow[];
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
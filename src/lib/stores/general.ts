// src/lib/stores/general.ts

import { writable } from 'svelte/store';

// Simple array of status words
export const statusWords = writable<string[]>(['home', 'alpha', 'bravo', 'charlie']);

// ToDo header fields
export const todoField1 = writable<string>('');
export const todoField2 = writable<string>('');

// Expanded state for UI components
export const todoExpandedState = writable<Record<string, boolean>>({});
export const projectExpandedProjects = writable<Record<string, boolean>>({});
export const projectExpandedSubprojects = writable<Record<string, boolean>>({});
export const projectExpandedTasks = writable<Record<string, boolean>>({});
export const howtoExpandedCategories = writable<Record<string, boolean>>({});
export const howtoExpandedSubcategories = writable<Record<string, boolean>>({});
export const howtoExpandedTopics = writable<Record<string, boolean>>({});
export const financeExpandedYears = writable<Record<string, boolean>>({});
export const financeExpandedMonths = writable<Record<string, boolean>>({});
export const financeExpandedWeeks = writable<Record<string, boolean>>({});

// Projects
export interface ProjectTask {
	id: string;
	description: string;  // "Create Projects Tab Functionality"
	startDate: string;    // from TodoItem.date
	endDate: string;      // timestamp when Send is clicked
	rows: TodoRow[];      // the actual todo rows with their completion status
}

export interface ProjectSubproject {
	name: string;         // "TauriHub"
	tasks: ProjectTask[];
}

export interface Project {
	name: string;         // "Prog"
	subprojects: Record<string, ProjectSubproject>;  // keyed by subproject name
}

export const projectsData = writable<Record<string, Project>>({});

// HowTo
export interface HowToTask {
	id: string;
	text: string;
}

export interface HowToTopic {
	id: string;
	name: string;
	tasks: HowToTask[];
}

export interface HowToSubcategory {
	id: string;
	name: string;
	topics: HowToTopic[];
}

export interface HowToCategory {
	id: string;
	name: string;
	subcategories: HowToSubcategory[];
}

export const howtoData = writable<HowToCategory[]>([]);

// Finance
export interface FinanceEntry {
	id: string;
	addAmount: string; // User input for addition
	subAmount: string; // User input for subtraction
	description: string;
}

export interface FinanceDay {
	id: string;
	dayNumber: number; // 1-31
	dayOfWeek: string; // 'Monday', 'Tuesday', etc.
	entries: FinanceEntry[];
}

export interface FinanceWeek {
	id: string;
	weekNumber: number; // 1, 2, 3, 4, 5
	startDay: number; // First day number in week (e.g., 1, 8, 15)
	endDay: number; // Last day number in week (e.g., 7, 14, 21)
	days: FinanceDay[];
}

export interface FinanceMonth {
	id: string;
	monthNumber: number; // 1-12 (1=January, 2=February, etc.)
	discAmount: string; // Discover card amount
	discIntAmount: string; // Discover interest amount
	amerXAmount: string; // American Express amount
	amerXIntAmount: string; // American Express interest amount
	weeks: FinanceWeek[];
}

export interface FinanceYear {
	id: string;
	year: number; // 2026, 2027, etc.
	months: FinanceMonth[];
}

export const financeData = writable<FinanceYear[]>([]);

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

// ===== PROJECTS HELPERS =====

// Parse TodoItem title to extract project, subproject, and description
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

// Delete a project
// deleteProject(projectName: string): void
export function deleteProject(projectName: string): void {
	projectsData.update((projects) => {
		const next = { ...projects };
		delete next[projectName];
		return next;
	});
}

// ===== HOWTO HELPERS =====

// Add a new HowTo category
export function addHowToCategory(): string {
	const id = makeId();
	howtoData.update((categories) => [
		...categories,
		{ id, name: '', subcategories: [] }
	]);
	return id;
}

// Delete a HowTo category
export function deleteHowToCategory(categoryId: string): void {
	howtoData.update((categories) => categories.filter((c) => c.id !== categoryId));
}

// Update HowTo category name
export function updateHowToCategoryName(categoryId: string, name: string): void {
	howtoData.update((categories) =>
		categories.map((c) => (c.id === categoryId ? { ...c, name } : c))
	);
}

// Add subcategory to a category
export function addHowToSubcategory(categoryId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? { ...c, subcategories: [...c.subcategories, { id, name: '', topics: [] }] }
				: c
		)
	);
	return id;
}

// Update subcategory name
export function updateHowToSubcategoryName(categoryId: string, subcategoryId: string, name: string): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId ? { ...sub, name } : sub
						)
				  }
				: c
		)
	);
}

// Add topic to a subcategory
export function addHowToTopic(categoryId: string, subcategoryId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? { ...sub, topics: [...sub.topics, { id, name: '', tasks: [] }] }
								: sub
						)
				  }
				: c
		)
	);
	return id;
}

// Update topic name
export function updateHowToTopicName(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	name: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? {
										...sub,
										topics: sub.topics.map((topic) =>
											topic.id === topicId ? { ...topic, name } : topic
										)
								  }
								: sub
						)
				  }
				: c
		)
	);
}

// Add task to a topic
export function addHowToTask(categoryId: string, subcategoryId: string, topicId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? {
										...sub,
										topics: sub.topics.map((topic) =>
											topic.id === topicId
												? { ...topic, tasks: [...topic.tasks, { id, text: '' }] }
												: topic
										)
								  }
								: sub
						)
				  }
				: c
		)
	);
	return id;
}

// Update task text
export function updateHowToTaskText(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	taskId: string,
	text: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? {
										...sub,
										topics: sub.topics.map((topic) =>
											topic.id === topicId
												? {
														...topic,
														tasks: topic.tasks.map((task) =>
															task.id === taskId ? { ...task, text } : task
														)
												  }
												: topic
										)
								  }
								: sub
						)
				  }
				: c
		)
	);
}

// Delete task
export function deleteHowToTask(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	taskId: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? {
										...sub,
										topics: sub.topics.map((topic) =>
											topic.id === topicId
												? { ...topic, tasks: topic.tasks.filter((task) => task.id !== taskId) }
												: topic
										)
								  }
								: sub
						)
				  }
				: c
		)
	);
}

// ===== FINANCE HELPERS =====

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// getMonthName(monthNumber: number): string
export function getMonthName(monthNumber: number): string {
	return MONTH_NAMES[monthNumber - 1] || '';
}

// getDayOfWeek(year: number, month: number, day: number): string
export function getDayOfWeek(year: number, month: number, day: number): string {
	const date = new Date(year, month - 1, day);
	return DAY_NAMES[date.getDay()];
}

// getDaysInMonth(year: number, month: number): number
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

// Generate Finance structure up to a specific date
// generateFinanceStructureToDate(targetDate: Date): void
export function generateFinanceStructureToDate(targetDate: Date): void {
	const targetYear = targetDate.getFullYear();
	const targetMonth = targetDate.getMonth() + 1; // 1-12
	const targetDay = targetDate.getDate();

	financeData.update((years) => {
		const updatedYears = [...years];
		
		// Find or create year
		let yearEntry = updatedYears.find(y => y.year === targetYear);
		if (!yearEntry) {
			yearEntry = {
				id: makeId(),
				year: targetYear,
				months: []
			};
			updatedYears.push(yearEntry);
		}
		
		// Generate months up to target month
		for (let monthNum = 1; monthNum <= targetMonth; monthNum++) {
			let monthEntry = yearEntry.months.find(m => m.monthNumber === monthNum);
			if (!monthEntry) {
				monthEntry = {
					id: makeId(),
					monthNumber: monthNum,
					discAmount: '',
					discIntAmount: '',
					amerXAmount: '',
					amerXIntAmount: '',
					weeks: []
				};
				yearEntry.months.push(monthEntry);
				yearEntry.months.sort((a, b) => a.monthNumber - b.monthNumber);
			}
			
			// Determine how many days to generate for this month
			const daysInMonth = getDaysInMonth(targetYear, monthNum);
			const lastDayToGenerate = monthNum === targetMonth ? targetDay : daysInMonth;
			
			// Generate weeks and days
			for (let dayNum = 1; dayNum <= lastDayToGenerate; dayNum++) {
				const weekNum = Math.ceil(dayNum / 7);
				const startDay = (weekNum - 1) * 7 + 1;
				const endDay = Math.min(weekNum * 7, daysInMonth);
				
				// Find or create week
				let weekEntry = monthEntry.weeks.find(w => w.weekNumber === weekNum);
				if (!weekEntry) {
					weekEntry = {
						id: makeId(),
						weekNumber: weekNum,
						startDay,
						endDay,
						days: []
					};
					monthEntry.weeks.push(weekEntry);
					monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
				}
				
				// Check if day already exists
				const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
				if (!dayExists) {
					const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
					const dayEntry: FinanceDay = {
						id: makeId(),
						dayNumber: dayNum,
						dayOfWeek,
						entries: [{
							id: makeId(),
							addAmount: '',
							subAmount: '',
							description: ''
						}]
					};
					weekEntry.days.push(dayEntry);
					weekEntry.days.sort((a, b) => a.dayNumber - b.dayNumber);
				}
			}
		}
		
		return updatedYears;
	});
}

// Add entry to a specific day
// addFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string): string
export function addFinanceEntry(
	yearId: string,
	monthId: string,
	weekId: string,
	dayId: string
): string {
	const entryId = makeId();
	financeData.update((years) =>
		years.map((y) => {
			if (y.id === yearId) {
				return {
					...y,
					months: y.months.map((m) => {
						if (m.id === monthId) {
							return {
								...m,
								weeks: m.weeks.map((w) => {
									if (w.id === weekId) {
										return {
											...w,
											days: w.days.map((d) => {
												if (d.id === dayId) {
													return {
														...d,
														entries: [...d.entries, { id: entryId, addAmount: '', subAmount: '', description: '' }]
													};
												}
												return d;
											})
										};
									}
									return w;
								})
							};
						}
						return m;
					})
				};
			}
			return y;
		})
	);
	return entryId;
}

// Delete entry from a day
// deleteFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string): void
export function deleteFinanceEntry(
	yearId: string,
	monthId: string,
	weekId: string,
	dayId: string,
	entryId: string
): void {
	financeData.update((years) =>
		years.map((y) => {
			if (y.id === yearId) {
				return {
					...y,
					months: y.months.map((m) => {
						if (m.id === monthId) {
							return {
								...m,
								weeks: m.weeks.map((w) => {
									if (w.id === weekId) {
										return {
											...w,
											days: w.days.map((d) => {
												if (d.id === dayId) {
													return {
														...d,
														entries: d.entries.filter(e => e.id !== entryId)
													};
												}
												return d;
											})
										};
									}
									return w;
								})
							};
						}
						return m;
					})
				};
			}
			return y;
		})
	);
}

// Update entry field
// updateFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string, field: 'addAmount' | 'subAmount' | 'description', value: string): void
export function updateFinanceEntry(
	yearId: string,
	monthId: string,
	weekId: string,
	dayId: string,
	entryId: string,
	field: 'addAmount' | 'subAmount' | 'description',
	value: string
): void {
	financeData.update((years) =>
		years.map((y) => {
			if (y.id === yearId) {
				return {
					...y,
					months: y.months.map((m) => {
						if (m.id === monthId) {
							return {
								...m,
								weeks: m.weeks.map((w) => {
									if (w.id === weekId) {
										return {
											...w,
											days: w.days.map((d) => {
												if (d.id === dayId) {
													return {
														...d,
														entries: d.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
													};
												}
												return d;
											})
										};
									}
									return w;
								})
							};
						}
						return m;
					})
				};
			}
			return y;
		})
	);
}

// Calculate day total (sum of adds - sum of subs)
// calculateDayTotal(day: FinanceDay): number
export function calculateDayTotal(day: FinanceDay): number {
	let total = 0;
	if (day.entries) {
		for (const entry of day.entries) {
			const addVal = parseFloat(entry.addAmount) || 0;
			const subVal = parseFloat(entry.subAmount) || 0;
			total += addVal - subVal;
		}
	}
	return total;
}

// Calculate week total
// calculateWeekTotal(week: FinanceWeek): number
export function calculateWeekTotal(week: FinanceWeek): number {
	let total = 0;
	if (week.days) {
		for (const day of week.days) {
			total += calculateDayTotal(day);
		}
	}
	return total;
}

// Calculate month total
// calculateMonthTotal(month: FinanceMonth): number
export function calculateMonthTotal(month: FinanceMonth): number {
	let total = 0;
	if (month.weeks) {
		for (const week of month.weeks) {
			total += calculateWeekTotal(week);
		}
	}
	return total;
}

// Calculate year total
// calculateYearTotal(year: FinanceYear): number
export function calculateYearTotal(year: FinanceYear): number {
	let total = 0;
	if (year.months) {
		for (const month of year.months) {
			total += calculateMonthTotal(month);
		}
	}
	return total;
}

// Format amount as currency
// formatCurrency(amount: number): string
export function formatCurrency(amount: number): string {
	const sign = amount >= 0 ? '' : '-';
	const abs = Math.abs(amount);
	return `${sign}$${abs.toFixed(2)}`;
}

// Update month Disc or AmerX amount
// updateFinanceMonthAmount(yearId: string, monthId: string, field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount', value: string): void
export function updateFinanceMonthAmount(
	yearId: string,
	monthId: string,
	field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount',
	value: string
): void {
	financeData.update((years) =>
		years.map((y) => {
			if (y.id === yearId) {
				return {
					...y,
					months: y.months.map((m) => {
						if (m.id === monthId) {
							return { ...m, [field]: value };
						}
						return m;
					})
				};
			}
			return y;
		})
	);
}

// Send TodoItem to Projects and remove from todosByDate
// sendTodoToProjects(date: string, itemId: string): boolean
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

	// Parse the title
	const parsed = parseTodoTitle(todoItem.title);
	if (!parsed) return false;

	const { project, subproject, description } = parsed;
	const endDate = new Date().toISOString();

	// Create ProjectTask
	const task: ProjectTask = {
		id: todoItem.id,
		description,
		startDate: todoItem.date,
		endDate,
		rows: todoItem.rows
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

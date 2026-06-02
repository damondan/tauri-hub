import { writable } from 'svelte/store';

export type GoalMeasurementType = 'time' | 'count';

export type GoalIterationType = 'day' | 'week' | 'month';

export interface GoalEntry {
	entryId: string;
	goalId: string;

	value?: number;
	description?: string;

	isCompleted?: boolean;
	isSucceeded?: boolean;
	hasFailed?: boolean;

	createdAt?: string;
}

export interface GoalDay {
	id: string;
	dayNumber: number;
	entries: GoalEntry[];
}

export interface GoalMonth {
	id: string;
	monthNumber: number;
	days: GoalDay[];
}

export interface GoalYear {
	id: string;
	year: number;
	months: GoalMonth[];
}

export interface Goal {
	goalId: string;

	title?: string;
	description?: string;
	color?: string;

	dateStart?: string;
	dateEnd?: string;

	startAmount?: number;

	measurementType?: GoalMeasurementType;
	measurementAmount?: number;

	iterationType?: GoalIterationType;
	iterationAmount?: number;

	highLimit?: number;
	lowLimit?: number;

	maxFailuresAllowed?: number;

	isExpanded?: boolean;
	isPersisted?: boolean;

	isCompleted?: boolean;
	isSucceeded?: boolean;
	hasFailed?: boolean;
}

export interface GoalThread {
	threadId: string;

	title?: string;
	description?: string;
	color?: string;

	isExpanded?: boolean;
	isPersisted?: boolean;

	goals: Goal[];

	goalCalendar: Record<number, GoalYear>;
}

export const goalData = writable<GoalThread[]>([]);
export const goalOrder = writable<string[]>([]);

export function makeId(): string {
	return crypto.randomUUID();
}

export function createMonthDaysMap(year: number): Record<number, number> {
	const record: Record<number, number> = {};

	for (let month = 1; month <= 12; month++) {
		record[month] = new Date(year, month, 0).getDate();
	}

	return record;
}

export function createTodayDateString(): string {
	return new Date().toISOString().slice(0, 10);
}

export function createEmptyGoal(): Goal {
	return {
		goalId: makeId(),

		title: '',
		description: '',
		color: '#f59e0b',

		dateStart: createTodayDateString(),
		dateEnd: '',


		startAmount:0,

		measurementType: 'count',
		measurementAmount: 0,

		iterationType: 'day',
		iterationAmount: 1,
		
		highLimit: 0,
		lowLimit: 0,
		maxFailuresAllowed: 10,

		isExpanded: false,
		isPersisted: false,

		isCompleted: false,
		isSucceeded: false,
		hasFailed: false
	};
}

export function createEmptyGoalThread(): GoalThread {
	return {
		threadId: makeId(),

		title: '',
		description: '',
		color: '#f59e0b',

		isExpanded: true,
		isPersisted: false,

		goals: [],

		goalCalendar: {}
	};
}

export function generateTheGoalStructureToDate(targetDate: Date): void {
	const targetYear = targetDate.getFullYear();
	const record: Record<number, number> = createMonthDaysMap(targetYear);

	goalData.update((threads) => {
		return threads.map((thread) => {
			const existingYear = thread.goalCalendar[targetYear];

			const yearEntry: GoalYear = existingYear ?? {
				id: makeId(),
				year: targetYear,
				months: []
			};

			for (let monthNum = 1; monthNum <= 12; monthNum++) {
				if (!yearEntry.months[monthNum - 1]) {
					yearEntry.months[monthNum - 1] = {
						id: makeId(),
						monthNumber: monthNum,
						days: []
					};
				}

				const month = yearEntry.months[monthNum - 1];
				const numDays = record[monthNum];

				if (!month.days || month.days.length === 0) {
					month.days = Array.from({ length: numDays }, (_, i) => ({
						id: makeId(),
						dayNumber: i + 1,
						entries: []
					}));
				}

				if (month.days.length !== numDays) {
					const existingDays = month.days;

					month.days = Array.from({ length: numDays }, (_, i) => {
						return (
							existingDays[i] ?? {
								id: makeId(),
								dayNumber: i + 1,
								entries: []
							}
						);
					});
				}
			}

			return {
				...thread,
				goalCalendar: {
					...thread.goalCalendar,
					[targetYear]: yearEntry
				}
			};
		});
	});
}

export function addGoalThread(): void {
	const thread = createEmptyGoalThread();

	goalData.update((threads) => [...threads, thread]);
	goalOrder.update((order) => [...order, thread.threadId]);

	generateTheGoalStructureToDate(new Date());
}

export function deleteGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.filter((thread) => thread.threadId !== threadId);
	});

	goalOrder.update((order) => {
		return order.filter((id) => id !== threadId);
	});
}

export function toggleGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isExpanded: !thread.isExpanded
			};
		});
	});
}

export function initGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isPersisted: true,
				isExpanded: true
			};
		});
	});

	generateTheGoalStructureToDate(new Date());
}

export function updateGoalThreadField<K extends keyof GoalThread>(
	threadId: string,
	field: K,
	value: GoalThread[K]
): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				[field]: value
			};
		});
	});
}

export function addGoalToThread(threadId: string): void {
	const goal = createEmptyGoal();

	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isExpanded: true,
				goals: [...thread.goals, goal]
			};
		});
	});
}

export function deleteGoalFromThread(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.filter((goal) => goal.goalId !== goalId)
			};
		});
	});
}

export function toggleGoal(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						isExpanded: !goal.isExpanded
					};
				})
			};
		});
	});
}

export function initGoal(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						isPersisted: true,
						isExpanded: true
					};
				})
			};
		});
	});

	generateTheGoalStructureToDate(new Date());
}

export function updateGoalField<K extends keyof Goal>(
	threadId: string,
	goalId: string,
	field: K,
	value: Goal[K]
): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						[field]: value
					};
				})
			};
		});
	});
}
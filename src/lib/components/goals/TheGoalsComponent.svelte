<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import { buttonStyles } from "$lib/styles";
	import InfoModal from "$lib/components/util/InfoModal.svelte";
	import GoalEntryNode from "$lib/components/goals/GoalEntryNode.svelte";
	import GoalEntryEditor from "$lib/components/goals/GoalEntryEditor.svelte";
	import {
		logGoalToProjects,
		type ProjectTaskStatus,
	} from "$lib/stores/projects";
	import {
		goalData,
		addGoalThread,
		deleteGoalThread,
		toggleGoalThread,
		initGoalThread,
		updateGoalThreadField,
		addGoalToThread,
		deleteGoalFromThread,
		toggleGoal,
		initGoal,
		updateGoalField,
		generateTheGoalStructureToDate,
		updateGoalFailureCount,
		updateFutureConsequenceState,
		decreaseGoalFailureCount,
		goalOrder,
		type GoalMonth,
		type GoalThread,
		type Goal,
		type GoalEntry,
		updateRealGoalEntry,
	} from "$lib/stores/thegoals";

	let displayYear: number = $state(0);
	let displayMonth: number = $state(0);
	let displayDay: number = $state(0);
	let todayDate: Date = $state(new Date());
	let missingHighLimitWarnings = $state<Record<string, boolean>>({});

	//Drag and Drop
	let draggingId = $state<string | null>(null);
	function onDragStart(e: DragEvent, goalId: string) {
		draggingId = goalId;

		if (!e.dataTransfer) return;

		// fallback (browser compatibility / debugging)
		e.dataTransfer.setData("text/plain", goalId);

		e.dataTransfer.effectAllowed = "move";
	}

	function onDrop(targetGoalId: string) {
		const draggedId = draggingId;

		if (!draggedId) return;
		if (draggedId === targetGoalId) return;

		goalOrder.update((order) => {
			const updated = [...order];

			// 1. Find dragged item index
			const fromIndex = updated.indexOf(draggedId);

			if (fromIndex === -1) return order;

			// 2. Remove 1 item from updated at index fromIndex
			updated.splice(fromIndex, 1);

			// 3. Find target index (after removal!)
			const toIndex = updated.indexOf(targetGoalId);

			if (toIndex === -1) {
				// fallback: put at end
				updated.push(draggedId);
			} else {
				// insert at target position
				updated.splice(toIndex, 0, draggedId);
			}

			return updated;
		});

		draggingId = null;
	}

	//InfoModal
	let showInfoModal = $state(false);
	let infoModalTitle = $state("Notice");
	let infoModalMessage = $state("");
	let infoModalReason = $state<
		"dateEnd" | "isCompleted" | "failureCount" | ""
	>("");

	let pendingCompletedGoalData = $state<{
		thread: GoalThread;
		goal: Goal;
	} | null>(null);

	let showGoalCompletionSummaryModal = $state(false);
	let goalCompletionSummaryText = $state("");

	function closeGoalCompletionSummaryModal(): void {
		showGoalCompletionSummaryModal = false;
		goalCompletionSummaryText = "";
		pendingCompletedGoalData = null;
	}

	function completeGoalWithoutSummary(): void {
		if (!pendingCompletedGoalData) return;

		const { thread, goal } = pendingCompletedGoalData;

		showGoalCompletionSummaryModal = false;
		goalCompletionSummaryText = "";
		pendingCompletedGoalData = null;

		completeGoalAndLog(thread, goal);
	}

	function completeGoalWithSummary(): void {
		if (!pendingCompletedGoalData) return;

		const { thread, goal } = pendingCompletedGoalData;

		const completedGoal: Goal = {
			...goal,
			lastGoalEntrySummary: goalCompletionSummaryText.trim(),
		};

		showGoalCompletionSummaryModal = false;
		goalCompletionSummaryText = "";
		pendingCompletedGoalData = null;

		completeGoalAndLog(thread, completedGoal);
	}

	function openInfoModal(
		reason: "dateEnd" | "isCompleted" | "failureCount",
		title: string,
		message: string,
	): void {
		infoModalReason = reason;
		infoModalTitle = title;
		infoModalMessage = message;
		showInfoModal = true;
	}

	function closeInfoModal(): void {
		showInfoModal = false;
		infoModalTitle = "Notice";
		infoModalMessage = "";
		infoModalReason = "";
	}

	function triggerDateEndInfoModal(): void {
		openInfoModal(
			"dateEnd",
			"Last Day Reached",
			"Congratulations ! This goal has been completed. Check Completed when you are ready to log it.",
		);
	}

	function triggerGoalCompletedInfoModal(): void {
		openInfoModal(
			"isCompleted",
			"Goal Completed",
			"Congratulations ! This goal has been completed. It will be logged in the Log component.",
		);
	}

	function triggerFailureCountInfoModal(): void {
		openInfoModal(
			"failureCount",
			"Failure Count Updated",
			"Your failure count has gone down. Follow up on your excuse in the Goal Entry",
		);
	}

	function triggerFailureCountHasExcuseInfoModal(): void {
		openInfoModal(
			"failureCount",
			"Failure Count Updated",
			"Your failure count limit has gone down.",
		);
	}

	function triggerGoalFailedInfoModal(): void {
		openInfoModal(
			"failureCount",
			"Goal Failed",
			"You have reached the maximum failure rates. This goal has ended and will be logged in the Log component. Have a good day.",
		);
	}

	function getNextFailureCount(goal: Goal): number {
		const currentFailureCount = Number(goal.failureCount ?? 0);

		return Math.max(currentFailureCount - 1, 0);
	}

	function didEntryGoBelowLowLimit(
		thread: GoalThread,
		goal: Goal,
		value: number,
	): boolean {
		if (thread.measurementType === "none") return false;

		const lowLimit = Number(goal.lowLimit ?? 0);

		return value < lowLimit;
	}

	function handleFailureCountModal(
		thread: GoalThread,
		goal: Goal,
		nextFailureCount: number,
	): void {
		if (nextFailureCount <= 0) {
			failGoalAndLog(thread, goal);
			return;
		}
		if (!goal.hasExcuseOption) {
			triggerFailureCountInfoModal();
		} else {
			triggerFailureCountHasExcuseInfoModal();
		}
	}

	function handleGoalCompletedChange(
		threadId: string,
		goalId: string,
		isCompleted: boolean,
	): void {
		const thread = $goalData.find(
			(existingThread) => existingThread.threadId === threadId,
		);

		if (!thread) return;

		const goal = thread.goals.find(
			(existingGoal) => existingGoal.goalId === goalId,
		);

		if (!goal) return;

		if (isCompleted) {
			pendingCompletedGoalData = {
				thread,
				goal,
			};

			goalCompletionSummaryText = "";
			showGoalCompletionSummaryModal = true;
			return;
		}

		updateGoalField(threadId, goalId, "isCompleted", isCompleted);
	}

	function handleGoalExcuseChange(
		threadId: string,
		goalId: string,
		hasExcuseOption: boolean,
	): void {
		const thread = $goalData.find(
			(existingThread) => existingThread.threadId === threadId,
		);

		if (!thread) return;

		const goal = thread.goals.find(
			(existingGoal) => existingGoal.goalId === goalId,
		);

		if (!goal) return;

		updateGoalField(threadId, goalId, "hasExcuseOption", hasExcuseOption);
	}

	function completeGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "completed");
		triggerGoalCompletedInfoModal();
	}

	function endGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "ended");
		triggerDateEndInfoModal();
	}

	function logAndRemoveGoal(
		thread: GoalThread,
		goal: Goal,
		status: ProjectTaskStatus,
	): void {
		const wasLogged = logGoalToProjects(
			"Goals",
			goal.title ?? "",
			thread,
			goal,
			status,
		);

		if (!wasLogged) {
			openInfoModal(
				"failureCount",
				"Logging Failed",
				"This goal could not be logged. Make sure the goal title uses #Project @Subproject Description.",
			);

			return;
		}

		if (thread.goals.length <= 1) {
			deleteGoalThread(thread.threadId);
			return;
		}

		deleteGoalFromThread(thread.threadId, goal.goalId);
	}

	function failGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "failed");
		triggerGoalFailedInfoModal();
	}

	function getTodayDate(): Date {
		return todayDate;
	}

	let selectedGoalEntryData = $state<{
		thread: GoalThread;
		goal: Goal;
		entry: GoalEntry;
	} | null>(null);

	function threadHasPendingGoalForToday(thread: GoalThread): boolean {
		const year = todayDate.getFullYear();
		const monthNumber = todayDate.getMonth() + 1;
		const dayNumber = todayDate.getDate();

		const goalYear = thread.goalCalendar?.[year];
		if (!goalYear) return false;

		const goalMonth = goalYear.months.find(
			(month) => month.monthNumber === monthNumber,
		);
		if (!goalMonth) return false;

		const goalDay = goalMonth.days.find(
			(day) => day.dayNumber === dayNumber,
		);
		if (!goalDay) return false;

		return goalDay.entries.some((entry) => entry.status === "pending");
	}

	onMount(() => {
		const currentDate = getTodayDate();

		displayDay = currentDate.getDate();
		displayYear = currentDate.getFullYear();
		displayMonth = currentDate.getMonth() + 1;

		generateTheGoalStructureToDate(currentDate);
		createGoalEntriesForDate(currentDate);
	});

	function daysBetween(startDate: Date, currentDate: Date): number {
		const start = new Date(
			startDate.getFullYear(),
			startDate.getMonth(),
			startDate.getDate(),
		);

		const current = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate(),
		);

		const diffMs = current.getTime() - start.getTime();

		return Math.floor(diffMs / (1000 * 60 * 60 * 24));
	}

	function isGoalScheduledForDate(goal: Goal, date: Date): boolean {
		if (!goal.dateStart) return false;
		if (!goal.isInitialized) return false;

		const startDate = new Date(goal.dateStart + "T00:00:00");

		if (date < startDate) return false;

		if (!goal.isPersisted && goal.dateEnd) {
			const endDate = new Date(goal.dateEnd + "T00:00:00");

			if (date > endDate) return false;
		}

		const iterationAmount = Number(goal.iterationAmount ?? 1);

		if (iterationAmount <= 0) return false;

		const diffDays = daysBetween(startDate, date);

		if (goal.iterationType === "day") {
			return diffDays % iterationAmount === 0;
		}

		if (goal.iterationType === "week") {
			return diffDays % (iterationAmount * 7) === 0;
		}

		if (goal.iterationType === "month") {
			const monthDiff =
				(date.getFullYear() - startDate.getFullYear()) * 12 +
				(date.getMonth() - startDate.getMonth());

			return (
				monthDiff % iterationAmount === 0 &&
				date.getDate() === startDate.getDate()
			);
		}

		return false;
	}

	function createPendingGoalEntry(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): GoalEntry {
		return {
			entryId: crypto.randomUUID(),
			goalId: goal.goalId,
			value: getLastGoalValueBeforeDate(thread, goal, date),
			description: "",
			status: "pending",
			isCompleted: false,
			isSucceeded: false,
			hasFailed: false,
			isConsequenceActive: goal.hasExcuseOption
				? getLastConsequenceStateBeforeDate(thread, goal, date)
				: false,
			createdAt: date.toISOString().slice(0, 10),
			updatedAt: new Date().toISOString(),
		};
	}

	function createGoalEntriesForDate(date: Date): void {
		generateTheGoalStructureToDate(date);

		const yearNumber = date.getFullYear();
		const monthIndex = date.getMonth();
		const dayIndex = date.getDate() - 1;

		let shouldShowDateEndNotice = false;

		goalData.update((threads) => {
			return threads.map((thread) => {
				const year = thread.goalCalendar[yearNumber];
				if (!year) return thread;

				const month = year.months[monthIndex];
				if (!month) return thread;

				const day = month.days[dayIndex];
				if (!day) return thread;

				let didGoalStatusChange = false;

				const updatedGoals = thread.goals.map((goal) => {
					const dateEndReached = checkGoalDateEndReached(goal, date);

					if (dateEndReached && !goal.isCompleted) {
						didGoalStatusChange = true;
						shouldShowDateEndNotice = true;

						return {
							...goal,
						};
					}

					return goal;
				});

				const entriesToAdd: GoalEntry[] = [];

				for (const goal of updatedGoals) {
					if (goal.isCompleted) continue;

					if (!isGoalScheduledForDate(goal, date)) continue;

					const alreadyExists = day.entries.some(
						(entry) => entry.goalId === goal.goalId,
					);

					if (alreadyExists) continue;

					entriesToAdd.push(
						createPendingGoalEntry(thread, goal, date),
					);
				}

				const didAddEntries = entriesToAdd.length > 0;

				if (!didGoalStatusChange && !didAddEntries) {
					return thread;
				}

				if (!didAddEntries) {
					return {
						...thread,
						goals: updatedGoals,
					};
				}

				const updatedDay = {
					...day,
					entries: [...day.entries, ...entriesToAdd],
				};

				const updatedMonth = {
					...month,
					days: month.days.map((existingDay, index) =>
						index === dayIndex ? updatedDay : existingDay,
					),
				};

				const updatedYear = {
					...year,
					months: year.months.map((existingMonth, index) =>
						index === monthIndex ? updatedMonth : existingMonth,
					),
				};

				return {
					...thread,
					goals: updatedGoals,
					goalCalendar: {
						...thread.goalCalendar,
						[yearNumber]: updatedYear,
					},
				};
			});
		});

		if (shouldShowDateEndNotice) {
			triggerDateEndInfoModal();
		}
	}

	function checkGoalDateEndReached(goal: Goal, date: Date): boolean {
		if (!goal.dateEnd) return false;

		// Persisted means the goal has no end date.
		if (goal.isPersisted) return false;

		const endDate = new Date(goal.dateEnd + "T00:00:00");

		const currentDateOnly = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);

		const endDateOnly = new Date(
			endDate.getFullYear(),
			endDate.getMonth(),
			endDate.getDate(),
		);

		return currentDateOnly >= endDateOnly;
	}

	function getLastGoalValueBeforeDate(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): number {
		const targetDateString = date.toISOString().slice(0, 10);

		let lastValue = Number(goal.startAmount ?? 0);

		for (const year of Object.values(thread.goalCalendar)) {
			for (const month of year.months) {
				for (const day of month.days) {
					for (const entry of day.entries) {
						if (entry.goalId !== goal.goalId) continue;
						if (!entry.createdAt) continue;
						if (entry.createdAt >= targetDateString) continue;

						lastValue = Number(entry.value ?? lastValue);
					}
				}
			}
		}

		return lastValue;
	}

	function addGoal() {
		addGoalThread();
	}

	function openAllRows() {
		goalData.update((threads) => {
			return threads.map((thread) => ({
				...thread,
				isExpanded: true,
				goals: thread.goals.map((goal) => ({
					...goal,
					isExpanded: true,
				})),
			}));
		});
	}

	function prevMonth() {
		if (displayMonth === 1) {
			displayMonth = 12;
			displayYear--;
		} else {
			displayMonth--;
		}

		const displayedDate = new Date(displayYear, displayMonth - 1, 1);

		generateTheGoalStructureToDate(new Date(displayedDate));
	}

	function nextMonth() {
		if (displayMonth === 12) {
			displayMonth = 1;
			displayYear++;
		} else {
			displayMonth++;
		}

		const displayedDate = new Date(displayYear, displayMonth - 1, 1);

		generateTheGoalStructureToDate(new Date(displayedDate));
	}

	function getMonthName(month: number): string {
		return new Date(displayYear, month - 1, 1).toLocaleString("default", {
			month: "long",
		});
	}

	function getGoalMonth(thread: GoalThread): GoalMonth | undefined {
		return thread.goalCalendar[displayYear]?.months?.[displayMonth - 1];
	}

	function escapeDateInput(e: KeyboardEvent) {
		if (e.key === "Escape") {
			(e.currentTarget as HTMLInputElement).blur();
		}
	}

	const TIME_THREAD_AXIS_LIMIT = 8;
	const TIME_ITERATIVE_PADDING_MINUTES = 20;
	const TIME_ITERATIVE_AXIS_PADDING = TIME_ITERATIVE_PADDING_MINUTES / 60;

	const COUNT_DEFAULT_AXIS_LIMIT = 100;
	const COUNT_AXIS_PADDING = 10;

	function getTimeIterativeAxisLimit(goal: Goal | undefined): number {
		const highLimit = Number(goal?.highLimit ?? 0);

		if (!Number.isFinite(highLimit) || highLimit <= 0) {
			return TIME_THREAD_AXIS_LIMIT;
		}

		return highLimit + TIME_ITERATIVE_AXIS_PADDING;
	}

	function getCountThreadAxisLimit(thread: GoalThread): number {
		const highestHighLimit = Math.max(
			0,
			...thread.goals.map((goal) => Number(goal.highLimit ?? 0)),
		);

		if (!Number.isFinite(highestHighLimit) || highestHighLimit <= 0) {
			return COUNT_DEFAULT_AXIS_LIMIT;
		}

		return highestHighLimit + COUNT_AXIS_PADDING;
	}

	function getCountIterativeAxisLimit(goal: Goal | undefined): number {
		const highLimit = Number(goal?.highLimit ?? 0);

		if (!Number.isFinite(highLimit) || highLimit <= 0) {
			return COUNT_DEFAULT_AXIS_LIMIT;
		}

		return highLimit + COUNT_AXIS_PADDING;
	}

	function getThreadAxisLimit(thread: GoalThread): number {
		if (thread.measurementType === "none") {
			return 12;
		}

		if (thread.measurementType === "time") {
			if (thread.iterateGoalMode) {
				return getTimeIterativeAxisLimit(getActiveGoal(thread));
			}

			return TIME_THREAD_AXIS_LIMIT;
		}

		if (thread.measurementType === "count") {
			if (thread.iterateGoalMode) {
				return getCountIterativeAxisLimit(getActiveGoal(thread));
			}

			return getCountThreadAxisLimit(thread);
		}

		return COUNT_DEFAULT_AXIS_LIMIT;
	}

	function getYAxisLabels(axisLimit: number): number[] {
		return [axisLimit, axisLimit / 2, 0, -axisLimit / 2, -axisLimit];
	}

	function getYAxisSummary(thread: GoalThread, axisLimit: number): string {
		if (thread.measurementType === "time") {
			return `Y-axis: 0 to ${formatTimeAxisLabel(axisLimit)}`;
		}

		if (thread.measurementType === "count") {
			return `Y-axis: +${axisLimit} to -${axisLimit}`;
		}

		return `Y-axis: +${axisLimit} to -${axisLimit}`;
	}

	function formatTimeAxisLabel(value: number): string {
		if (!Number.isFinite(value)) return "0h";

		const sign = value < 0 ? "-" : "";
		const totalMinutes = Math.round(Math.abs(value) * 60);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		if (hours === 0) {
			return `${sign}${minutes}m`;
		}

		if (minutes === 0) {
			return `${sign}${hours}h`;
		}

		return `${sign}${hours}h ${minutes}m`;
	}

	function formatYAxisLabel(thread: GoalThread, value: number): string {
		if (thread.measurementType === "time") {
			return formatTimeAxisLabel(value);
		}

		return String(value);
	}

	function getMonthDayNumbers(thread: GoalThread): number[] {
		const month = getGoalMonth(thread);

		if (!month) return [];

		return month.days.map((day) => day.dayNumber);
	}

	function shouldShowThreadGrid(thread: GoalThread): boolean {
		return thread.goals.some((goal) => goal.isInitialized);
	}

	function getYPercent(value: number, axisLimit: number): number {
		const zeroLinePercent = 75;

		if (!axisLimit || axisLimit <= 0) return zeroLinePercent;

		if (value >= 0) {
			return zeroLinePercent - (value / axisLimit) * zeroLinePercent;
		}

		return (
			zeroLinePercent +
			(Math.abs(value) / axisLimit) * (100 - zeroLinePercent)
		);
	}

	function getXPercent(dayNumber: number, totalDays: number): number {
		return ((dayNumber - 1) / Math.max(totalDays - 1, 1)) * 100;
	}

	function getGoalStartDay(goal: Goal): number | null {
		if (!goal.dateStart) return null;

		const startDate = new Date(goal.dateStart + "T00:00:00");

		if (
			startDate.getFullYear() !== displayYear ||
			startDate.getMonth() + 1 !== displayMonth
		) {
			return null;
		}

		return startDate.getDate();
	}

	function createStartEntry(goal: Goal): GoalEntry {
		return {
			entryId: `start-${goal.goalId}`,
			goalId: goal.goalId,
			value: Number(goal.startAmount ?? 0),
			description: "Starting amount",
			status: "pending",
			isCompleted: false,
			isSucceeded: false,
			hasFailed: false,
			isConsequenceActive: false,
			createdAt: goal.dateStart ?? "",
		};
	}

	type PlottedGoalNode = {
		key: string;
		entry: GoalEntry;
		dayNumber: number;
		xPercent: number;
		yPercent: number;
		color: string;
		isPending: boolean;
	};

	function getEntryNodeColor(entry: GoalEntry, goal: Goal): string {
		if (entry.status === "pending") return "#9ca3af";
		if (entry.status === "not_done" || entry.status === "no")
			return "#ef4444";

		return goal.color ?? "#ffffff";
	}

	function getEntryLineColor(entry: GoalEntry, goal: Goal): string {
		if (entry.status === "pending") return "#9ca3af";
		if (entry.status === "not_done" || entry.status === "no")
			return "#ef4444";

		return goal.color ?? "#ffffff";
	}

	function getPlottedNodesForGoal(
		thread: GoalThread,
		goal: Goal,
		axisLimit: number,
		totalDays: number,
	): PlottedGoalNode[] {
		const nodes: PlottedGoalNode[] = [];

		const startDay = getGoalStartDay(goal);

		if (
			goal.isInitialized &&
			startDay !== null &&
			goal.startAmount !== undefined
		) {
			const startEntry = createStartEntry(goal);

			nodes.push({
				key: startEntry.entryId,
				entry: startEntry,
				dayNumber: startDay,
				xPercent: getXPercent(startDay, totalDays),
				yPercent: getYPercent(
					getGoalNodeYValue(thread, goal, Number(goal.startAmount)),
					axisLimit,
				),
				color: "#ffffff",
				isPending: false,
			});
		}

		const month = getGoalMonth(thread);

		if (!month) return nodes;

		for (const day of month.days) {
			for (const entry of day.entries) {
				if (entry.goalId !== goal.goalId) continue;

				nodes.push({
					key: entry.entryId,
					entry,
					dayNumber: day.dayNumber,
					xPercent: getXPercent(day.dayNumber, totalDays),
					yPercent: getYPercent(
						getGoalNodeYValue(
							thread,
							goal,
							Number(entry.value ?? 0),
						),
						axisLimit,
					),
					color: getEntryNodeColor(entry, goal),
					isPending: entry.status === "pending",
				});
			}
		}

		return nodes.sort((a, b) => a.dayNumber - b.dayNumber);
	}

	function getLatestPlottedNode(
		nodes: PlottedGoalNode[],
	): PlottedGoalNode | null {
		if (nodes.length === 0) return null;

		return nodes[nodes.length - 1];
	}

	function openGoalEntryEditor(
		thread: GoalThread,
		goal: Goal,
		entry: GoalEntry,
	) {
		selectedGoalEntryData = {
			thread,
			goal,
			entry,
		};
	}

	function closeGoalEntryEditor() {
		selectedGoalEntryData = null;
	}

	function handleEntryDone(
		entry: GoalEntry,
		value: number,
		description: string,
		isConsequenceActive: boolean,
		goalEntryConsequence: string,
		progressMarker: boolean,
	) {
		if (!selectedGoalEntryData) return;

		const { thread, goal } = selectedGoalEntryData;

		const lowerLimit = Number(goal.lowLimit ?? 0);

		const hasRealLowerLimit = lowerLimit !== 0;

		const recordedValue = value;

		// Only count this as below the low limit if:
		// 1. this is a measured goal
		// 2. the lowerLimit is not 0
		// 3. the recorded value actually went below the limit
		const wentBelowLowLimit =
			thread.measurementType !== "none" &&
			hasRealLowerLimit &&
			didEntryGoBelowLowLimit(thread, goal, recordedValue);

		// Consequence becomes active only when:
		// 1. it was already active
		// 2. OR the entry went below a real lower limit
		const shouldActivateConsequence =
			isConsequenceActive || wentBelowLowLimit;

		const consequenceDescription = shouldActivateConsequence
			? goalEntryConsequence
			: "";

		// "start-" entries are not normal calendar entries.
		// They represent the goal's starting amount/start value.
		// So this updates goal.startAmount instead of updating a GoalEntry.
		if (entry.entryId.startsWith("start-")) {
			updateGoalField(
				thread.threadId,
				goal.goalId,
				"startAmount",
				recordedValue,
			);

			closeGoalEntryEditor();
			return;
		}

		updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
			value: recordedValue,
			description,
			isCompleted: true,
			isSucceeded: true,
			hasFailed: false,
			status: thread.measurementType === "none" ? "yes" : "done",
			isConsequenceActive: shouldActivateConsequence,
			consequenceDescription,
			progressMarker,
		});

		if (wentBelowLowLimit) {
			const nextFailureCount = decreaseGoalFailureCount(
				thread.threadId,
				goal.goalId,
			);

			handleFailureCountModal(thread, goal, nextFailureCount);
		}

		// entry.createdAt is the timestamp for when this GoalEntry was created.
		// This condition says:
		// "Only update future consequence state if this entry has a createdAt date."
		// Without createdAt, updateFutureConsequenceState would not know which date/time
		// to use when looking for the related future consequence entry/node.
		if (entry.createdAt) {
			updateFutureConsequenceState(
				thread.threadId,
				goal.goalId,
				entry.createdAt,
				shouldActivateConsequence,
			);
		}

		closeGoalEntryEditor();
	}

	function handleEntryNotDone(
		entry: GoalEntry,
		description: string,
		isConsequenceActive: boolean,
		goalEntryConsequence: string,
		progressMarker: boolean,
	) {
		if (!selectedGoalEntryData) return;

		const { thread, goal } = selectedGoalEntryData;

		if (entry.entryId.startsWith("start-")) {
			closeGoalEntryEditor();
			return;
		}

		const wasAlreadyFailed = entry.hasFailed === true;

		updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
			description,
			isCompleted: true,
			isSucceeded: false,
			hasFailed: true,
			status: thread.measurementType === "none" ? "no" : "not_done",
			isConsequenceActive: true,
			consequenceDescription: goalEntryConsequence,
			progressMarker,
		});

		if (!wasAlreadyFailed) {
			const nextFailureCount = decreaseGoalFailureCount(
				thread.threadId,
				goal.goalId,
			);

			handleFailureCountModal(thread, goal, nextFailureCount);
		}

		closeGoalEntryEditor();
	}

	function handleEntryUpdate(
		entry: GoalEntry,
		value: number,
		description: string,
		isConsequenceActive: boolean,
		goalEntryConsequence: string,
		progressMarker: boolean,
	) {
		if (!selectedGoalEntryData) return;
		console.log(`Goal entry value is ${value}`);
		const { thread, goal } = selectedGoalEntryData;

		if (entry.entryId.startsWith("start-")) {
			closeGoalEntryEditor();
			return;
		}

		updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
			value,
			description,
			isConsequenceActive,
			consequenceDescription: goalEntryConsequence,
			progressMarker,
		});

		if (entry.createdAt) {
			updateFutureConsequenceState(
				thread.threadId,
				goal.goalId,
				entry.createdAt,
				isConsequenceActive,
			);
		}

		closeGoalEntryEditor();
	}

	function getLastConsequenceStateBeforeDate(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): boolean {
		const targetDateString = date.toISOString().slice(0, 10);

		let lastState = false;

		for (const year of Object.values(thread.goalCalendar)) {
			for (const month of year.months) {
				for (const day of month.days) {
					for (const entry of day.entries) {
						if (entry.goalId !== goal.goalId) continue;
						if (!entry.createdAt) continue;
						if (entry.createdAt >= targetDateString) continue;

						lastState = entry.isConsequenceActive ?? false;
					}
				}
			}
		}

		return lastState;
	}

	function getGoalLabelYOffset(thread: GoalThread, goal: Goal): number {
		if (thread.iterateGoalMode) {
			return 0;
		}

		const index = thread.goals.findIndex(
			(existingGoal) => existingGoal.goalId === goal.goalId,
		);

		const offsets = [0, -18, 18, -36, 36];

		return offsets[index % offsets.length];
	}

	function getActiveGoal(thread: GoalThread): Goal | undefined {
		if (thread.goals.length === 0) return undefined;

		const activeGoal = thread.goals.find(
			(goal) => goal.goalId === thread.activeGoalId,
		);

		return activeGoal ?? thread.goals[0];
	}

	function getVisibleGoalsForThread(thread: GoalThread): Goal[] {
		if (!thread.iterateGoalMode) {
			return thread.goals;
		}

		const activeGoal = getActiveGoal(thread);

		return activeGoal ? [activeGoal] : [];
	}

	function getThreadLegendGoals(thread: GoalThread): Goal[] {
		return thread.goals.filter((goal) => goal.isInitialized);
	}

	function toggleIterateGoalMode(thread: GoalThread): void {
		const firstGoalId = thread.goals[0]?.goalId ?? "";

		updateGoalThreadField(
			thread.threadId,
			"iterateGoalMode",
			!thread.iterateGoalMode,
		);

		if (!thread.iterateGoalMode && !thread.activeGoalId && firstGoalId) {
			updateGoalThreadField(thread.threadId, "activeGoalId", firstGoalId);
		}
	}

	function cycleActiveGoal(thread: GoalThread): void {
		if (thread.goals.length === 0) return;

		const currentIndex = thread.goals.findIndex(
			(goal) => goal.goalId === thread.activeGoalId,
		);

		const nextIndex =
			currentIndex === -1 || currentIndex === thread.goals.length - 1
				? 0
				: currentIndex + 1;

		const nextGoal = thread.goals[nextIndex];

		updateGoalThreadField(thread.threadId, "activeGoalId", nextGoal.goalId);
	}

	function getGoalValidationKey(threadId: string, goalId: string): string {
		return `${threadId}:${goalId}`;
	}

	function isHighLimitRequired(thread: GoalThread): boolean {
		return (
			thread.measurementType === "time" ||
			thread.measurementType === "count"
		);
	}

	function hasValidHighLimit(goal: Goal): boolean {
		const highLimit = Number(goal.highLimit ?? 0);

		return Number.isFinite(highLimit) && highLimit > 0;
	}

	function showMissingHighLimitWarning(
		threadId: string,
		goalId: string,
	): void {
		const validationKey = getGoalValidationKey(threadId, goalId);

		missingHighLimitWarnings = {
			...missingHighLimitWarnings,
			[validationKey]: true,
		};

		window.setTimeout(() => {
			missingHighLimitWarnings = {
				...missingHighLimitWarnings,
				[validationKey]: false,
			};
		}, 3000);
	}

	function shouldShowMissingHighLimitWarning(
		thread: GoalThread,
		goal: Goal,
	): boolean {
		const validationKey = getGoalValidationKey(
			thread.threadId,
			goal.goalId,
		);

		return missingHighLimitWarnings[validationKey] === true;
	}

	function handleGoalInitClick(thread: GoalThread, goal: Goal): void {
		if (isHighLimitRequired(thread) && !hasValidHighLimit(goal)) {
			showMissingHighLimitWarning(thread.threadId, goal.goalId);
			return;
		}
		if (!goal.hasExcuseOption) {
			goal.hasExcuseOption = false;
		}

		initGoal(thread.threadId, goal.goalId);
	}

	function isNoneMeasurementThread(thread: GoalThread): boolean {
		return thread.measurementType === "none";
	}

	function getNoneGoalLaneValue(thread: GoalThread, goal: Goal): number {
		const lanes = [9, 3, -3, -9];

		const index = thread.goals.findIndex(
			(existingGoal) => existingGoal.goalId === goal.goalId,
		);

		return lanes[index] ?? 0;
	}

	function getGoalNodeYValue(
		thread: GoalThread,
		goal: Goal,
		value: number,
	): number {
		if (thread.measurementType === "none") {
			return getNoneGoalLaneValue(thread, goal);
		}

		return value;
	}
</script>

<div class="mb-6 flex items-center justify-end gap-3">
	<button
		class="rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white/40 hover:bg-black/70 hover:text-white/80"
		onclick={openAllRows}
	>
		Open All
	</button>

	<button onclick={addGoal} class={buttonStyles.largeGreenButton}> + </button>
</div>

{#if $goalData.length === 0}
	<div class="text-white/70 italic">
		No goals yet. Click the green plus button and create a goal!
	</div>
{/if}

{#each $goalOrder as threadId (threadId)}
	{@const thread = $goalData.find((t) => t.threadId === threadId)}
	{#if thread}
		<div class="mb-3">
			<!-- Level 1: Goal Thread Row -->
			<div
				class="rounded-xl bg-white/10 p-3"
				ondragover={(e) => e.preventDefault()}
				ondrop={() => onDrop(thread.threadId)}
			>
				<div class="flex items-center gap-3">
					<button
						class="w-8 border text-3xl text-white {threadHasPendingGoalForToday(
							thread,
						)
							? 'border-green-400/70'
							: 'border-white/10'}"
						onclick={() => toggleGoalThread(thread.threadId)}
					>
						{thread.isExpanded ? "▼" : "▷"}
					</button>

					<input
						type="text"
						class="flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-2xl text-white placeholder-white/40"
						placeholder="Goal thread title..."
						value={thread.title}
						oninput={(e) =>
							updateGoalThreadField(
								thread.threadId,
								"title",
								(e.target as HTMLInputElement).value,
							)}
					/>

					<input
						type="text"
						class="flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-xl text-white placeholder-white/40"
						placeholder="Description..."
						value={thread.description}
						title={thread.description}
						oninput={(e) =>
							updateGoalThreadField(
								thread.threadId,
								"description",
								(e.target as HTMLInputElement).value,
							)}
					/>

					<div
						draggable="true"
						ondragstart={(e) => onDragStart(e, thread.threadId)}
						class="cursor-grab active:cursor-grabbing text-white/20 hover:text-white text-2xl"
					>
						⠿
					</div>

					<select
						class="rounded border border-white/20 bg-black/70 px-3 py-2 text-black"
						value={thread.measurementType}
						onchange={(e) =>
							updateGoalThreadField(
								thread.threadId,
								"measurementType",
								(e.target as HTMLSelectElement)
									.value as GoalThread["measurementType"],
							)}
					>
						<option value="time">Time</option>
						<option value="count">Count</option>
						<option value="none">Yes/No</option>
					</select>

					<button
						class={thread.isInitialized
							? "rounded bg-green-500/60 px-3 py-1 text-green-100 hover:bg-green-500/50"
							: "rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"}
						onclick={() => initGoalThread(thread.threadId)}
					>
						Init
					</button>

					<button
						class="rounded bg-green-600/30 px-3 py-1 text-white/50 hover:bg-green-700/80 hover:text-white"
						onclick={() => addGoalToThread(thread.threadId)}
					>
						+
					</button>

					<button
						class="rounded-lg bg-red-500/20 px-3 py-1 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
						onclick={() => deleteGoalThread(thread.threadId)}
					>
						Del
					</button>
				</div>

				{#if thread.isPersisted}
					<div class="mt-2 text-sm text-emerald-300/80">
						Thread initialized
					</div>
				{/if}
			</div>

			<!-- Level 2 and Level 3 -->
			{#if thread.isExpanded}
				<div
					class="ml-10 mr-10 mt-2 space-y-2"
					in:fly={{ x: -20, duration: 250 }}
				>
					{#if thread.goals.length === 0}
						<div
							class="rounded-lg bg-white/5 p-3 text-white/50 italic"
						>
							No goals inside this thread yet. Click the thread +
							button.
						</div>
					{/if}

					<!-- Level 2: Goal Rows -->
					{#each thread.goals as goal (goal.goalId)}
						<div class="rounded-xl bg-white/10 p-3">
							<div class="flex flex-wrap items-end gap-3">
								<button
									class="w-8 text-3xl text-white"
									onclick={() =>
										toggleGoal(
											thread.threadId,
											goal.goalId,
										)}
								>
									{goal.isExpanded ? "▼" : "▷"}
								</button>

								<div class="flex min-w-[10%] flex-1 flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Title</label
									>
									<input
										type="text"
										class="rounded border border-white/20 bg-white/5 px-3 py-2 text-xl text-white placeholder-white/40"
										placeholder="Goal title..."
										value={goal.title}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"title",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div>

								<div class="flex min-w-[30%] flex-1 flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Description</label
									>
									<input
										type="text"
										class="rounded border border-white/20 bg-white/5 px-3 py-2 text-lg text-white placeholder-white/40"
										placeholder="Goal description..."
										value={goal.description}
										title={goal.description}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"description",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div>

								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Color</label
									>
									<input
										type="color"
										class="h-10 w-12 rounded border border-white/20 bg-white/10"
										value={goal.color}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"color",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div>

								<div class="flex flex-col">
									<label class="mb-1 text-xs text-white/40"
										>Start</label
									>
									<input
										type="date"
										class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										value={goal.dateStart}
										onkeydown={escapeDateInput}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"dateStart",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div>

								<div
									class={`flex flex-col ${
										goal.isPersisted
											? "opacity-30 pointer-events-none"
											: ""
									}`}
								>
									<label class="mb-1 text-xs text-white/40"
										>End</label
									>
									<input
										type="date"
										class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										value={goal.dateEnd}
										disabled={goal.isPersisted}
										onkeydown={escapeDateInput}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"dateEnd",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div>

								<div
									class={`flex flex-col ${
										isNoneMeasurementThread(thread)
											? "opacity-30 pointer-events-none"
											: ""
									}`}
								>
									<label class="mb-1 text-xs text-white/40"
										>Start Amt</label
									>
									<input
										type="number"
										class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="Start"
										value={goal.startAmount}
										disabled={isNoneMeasurementThread(
											thread,
										)}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"startAmount",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											)}
									/>
								</div>

								<div
									class={`flex flex-col ${
										isNoneMeasurementThread(thread)
											? "opacity-30 pointer-events-none"
											: ""
									}`}
								>
									<label class="mb-1 text-xs text-white/40"
										>Goal Amt</label
									>
									<input
										type="number"
										class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="Amount"
										value={goal.measurementAmount}
										disabled={isNoneMeasurementThread(
											thread,
										)}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"measurementAmount",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											)}
									/>
								</div>

								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Iteration</label
									>
									<select
										class="rounded border border-white/20 bg-black/70 px-3 py-2 text-black"
										value={goal.iterationType}
										onchange={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"iterationType",
												(e.target as HTMLSelectElement)
													.value as Goal["iterationType"],
											)}
									>
										<option value="day">Day</option>
										<option value="week">Week</option>
										<option value="month">Month</option>
									</select>
								</div>

								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Every</label
									>
									<input
										type="number"
										class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="Every..."
										value={goal.iterationAmount}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"iterationAmount",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											)}
									/>
								</div>

								<div
									class={`flex flex-col ${
										isNoneMeasurementThread(thread)
											? "opacity-30 pointer-events-none"
											: ""
									}`}
								>
									<label class="mb-1 text-xs text-white/40"
										>Low</label
									>
									<input
										type="number"
										class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="Low"
										value={goal.lowLimit}
										disabled={isNoneMeasurementThread(
											thread,
										)}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"lowLimit",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											)}
									/>
								</div>

								<div
									class={`flex flex-col ${
										isNoneMeasurementThread(thread)
											? "opacity-30 pointer-events-none"
											: ""
									}`}
								>
									<label class="mb-1 text-xs text-white/40"
										>High</label
									>
									<input
										type="number"
										class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="High"
										value={goal.highLimit}
										disabled={isNoneMeasurementThread(
											thread,
										)}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"highLimit",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											)}
									/>
								</div>

								<div class="flex flex-col">
									<label class="mb-1 text-xs text-white/40"
										>Max Fails</label
									>
									<input
										type="number"
										class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
										placeholder="Max"
										value={goal.maxFailuresAllowed}
										oninput={(e) => {
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"maxFailuresAllowed",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											);
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"failureCount",
												Number(
													(
														e.target as HTMLInputElement
													).value,
												),
											);
										}}
									/>
								</div>

								<!-- <div
									class="flex min-w-64 max-w-[25%] flex-1 flex-col"
								>
									<label class="mb-1 text-xs text-white/40"
										>Consequence</label
									>
									<input
										type="text"
										class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40"
										placeholder="Add a consequence ?"
										value={goal.consequenceDescription}
										title={goal.consequenceDescription}
										oninput={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"consequenceDescription",
												(e.target as HTMLInputElement)
													.value,
											)}
									/>
								</div> -->

								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Is Completed</label
									>
									<label
										class="flex h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70"
									>
										<input
											type="checkbox"
											checked={goal.isCompleted}
											onchange={(e) =>
												handleGoalCompletedChange(
													thread.threadId,
													goal.goalId,
													(
														e.target as HTMLInputElement
													).checked,
												)}
										/>
										Completed
									</label>
								</div>
								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Persisting</label
									>
									<label
										class="flex h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70"
									>
										<input
											type="checkbox"
											checked={goal.isPersisted}
											onchange={(e) =>
												updateGoalField(
													thread.threadId,
													goal.goalId,
													"isPersisted",
													(
														e.target as HTMLInputElement
													).checked,
												)}
										/>
										Persisting
									</label>
								</div>
								<label
									class="flex h-10 items-center gap-3 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70 mr-10"
								>
									<input
										type="checkbox"
										class="peer sr-only"
										checked={goal.hasExcuseOption}
										onchange={(e) =>
											handleGoalExcuseChange(
												thread.threadId,
												goal.goalId,
												(e.target as HTMLInputElement)
													.checked,
											)}
									/>

									<span
										class="relative h-6 w-11 rounded-full bg-white/20 transition-colors peer-checked:bg-green-500/50
										after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform
										peer-checked:after:translate-x-5"
										title="Turn on Excuse Option for Goals"
									></span>
								</label>

								<div class="flex flex-col">
									{#if shouldShowMissingHighLimitWarning(thread, goal)}
										<div
											class="mb-1 rounded border border-red-400/40 bg-red-500/20 px-2 py-1 text-xs text-red-200"
										>
											Entering a high limit is necessary.
										</div>
									{:else}
										<label
											class="invisible mb-1 text-xs text-white/40"
										>
											Init
										</label>
									{/if}

									<button
										class={goal.isInitialized
											? "h-10 rounded bg-green-500/60 px-3 py-1 text-green-100 hover:bg-green-500/50"
											: "h-10 rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"}
										onclick={() =>
											handleGoalInitClick(thread, goal)}
									>
										Init
									</button>
								</div>

								<div class="flex flex-col">
									<label
										class="invisible mb-1 text-xs text-white/40"
										>Delete</label
									>
									<button
										class="h-10 rounded-lg bg-red-500/20 px-3 py-1 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
										onclick={() =>
											deleteGoalFromThread(
												thread.threadId,
												goal.goalId,
											)}
									>
										Del
									</button>
								</div>
							</div>
						</div>
					{/each}

					<!-- Level 3: Shared lineGrid -->
					{#if shouldShowThreadGrid(thread)}
						{@const axisLimit = getThreadAxisLimit(thread)}
						{@const dayNumbers = getMonthDayNumbers(thread)}
						{@const yAxisLabels = getYAxisLabels(axisLimit)}

						<div
							class="mt-4 rounded-xl border border-white/10 bg-black/30 p-3"
						>
							<div
								class="mb-3 flex items-center justify-between gap-4"
							>
								<button
									class="px-2 text-xl text-white hover:text-white/70"
									onclick={prevMonth}
								>
									◀
								</button>

								<div class="flex flex-col items-center gap-2">
									<div
										class="text-3xl font-semibold text-white"
									>
										{getMonthName(displayMonth)}
										{displayYear}
									</div>

									<div
										class="flex items-center gap-3 text-2xl"
									>
										<label
											class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-white/70"
										>
											<input
												type="checkbox"
												checked={thread.iterateGoalMode}
												onchange={() =>
													toggleIterateGoalMode(
														thread,
													)}
											/>

											Iterate Goal Mode
										</label>

										{#if thread.iterateGoalMode}
											<button
												class="rounded border border-white/20 bg-white/10 px-3 py-1
											text-white/70 hover:bg-white/20 hover:text-white"
												onclick={() =>
													cycleActiveGoal(thread)}
											>
												Next Goal
											</button>

											<div class="text-blue-500/60">
												Viewing:
												{getActiveGoal(thread)?.title ||
													"Untitled Goal"},
											</div>
											<div class="text-red-500/60">
												Failures Remaining:
												{getActiveGoal(thread)
													?.failureCount ?? 0},
											</div>
										{:else}
											<div class="text-white/40">
												Thread Mode: read-only overview
											</div>
										{/if}
									</div>
								</div>

								<button
									class="px-2 text-xl text-white hover:text-white/70"
									onclick={nextMonth}
								>
									▶
								</button>
							</div>

							<div
								class="mb-2 flex w-full items-center gap-4 text-md text-white/40"
							>
								<div class="shrink-0">
									{getYAxisSummary(thread, axisLimit)}
								</div>

								{#if !thread.iterateGoalMode}
									<div
										class="flex flex-1 flex-wrap items-center justify-center gap-3 text-sm text-white/70"
									>
										{#each getThreadLegendGoals(thread) as legendGoal (legendGoal.goalId)}
											<div
												class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2 py-1"
											>
												<span
													class="h-3 w-3 rounded-full border border-white/30"
													style:background-color={legendGoal.color ??
														"#ffffff"}
												></span>

												<span>
													{legendGoal.title ||
														"Untitled Goal"}
												</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<div class="grid grid-cols-[4rem_1fr] gap-2">
								<!-- Y-axis labels -->
								<div
									class="relative h-[37rem] border-r border-white/20 pr-2"
								>
									{#each yAxisLabels as label}
										<div
											class="absolute right-2 -translate-y-1/2 text-xs text-white/50"
											style:top={getYPercent(
												label,
												axisLimit,
											) + "%"}
										>
											{formatYAxisLabel(thread, label)}
										</div>
									{/each}
								</div>

								<!-- Grid area -->
								<div
									class="relative h-[37rem] border border-white/20 bg-white/5"
								>
									<!-- Horizontal grid lines -->
									{#each yAxisLabels as label}
										<div
											class="absolute left-0 w-full border-t border-white/10"
											style:top={getYPercent(
												label,
												axisLimit,
											) + "%"}
										></div>
									{/each}

									<!-- Zero line -->
									<div
										class="absolute left-0 w-full border-t-2 border-white/40"
										style:top={getYPercent(0, axisLimit) +
											"%"}
									></div>

									<!-- Vertical day lines -->
									{#each dayNumbers as dayNumber}
										<div
											class="absolute top-0 h-full border-l border-white/10"
											style:left={((dayNumber - 1) /
												Math.max(
													dayNumbers.length - 1,
													1,
												)) *
												100 +
												"%"}
										></div>
									{/each}

									<!-- Goal lines and nodes -->
									{#each getVisibleGoalsForThread(thread) as plottedGoal (plottedGoal.goalId)}
										{@const plottedNodes =
											getPlottedNodesForGoal(
												thread,
												plottedGoal,
												axisLimit,
												dayNumbers.length,
											)}
										{@const highLimitPercent = getYPercent(
											Number(plottedGoal.highLimit ?? 0),
											axisLimit,
										)}
										{@const lowLimitPercent = getYPercent(
											Number(plottedGoal.lowLimit ?? 0),
											axisLimit,
										)}
										{@const measurementAmountPercent =
											getYPercent(
												Number(
													plottedGoal.measurementAmount ??
														0,
												),
												axisLimit,
											)}
										{@const goalLabelYOffset =
											getGoalLabelYOffset(
												thread,
												plottedGoal,
											)}

										{#if thread.iterateGoalMode && thread.measurementType !== "none"}
											<!-- Goal amount guide -->
											<div
												class="pointer-events-none absolute left-0 w-full border-t border-green-500 opacity-80"
												style:top={measurementAmountPercent +
													"%"}
											></div>

											<div
												class="pointer-events-none absolute left-2 rounded bg-black/80 px-2 py-0.5 text-sm text-green-500"
												style:top={"calc(" +
													measurementAmountPercent +
													"% + " +
													goalLabelYOffset +
													"px)"}
											>
												Goal {plottedGoal.measurementAmount}
											</div>
											<!-- High limit guide -->
											<div
												class="pointer-events-none absolute left-0 w-full border-2 border-dashed opacity-60"
												style:top={highLimitPercent +
													"%"}
												style:border-color={plottedGoal.color ??
													"#ffffff"}
											></div>

											<div
												class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm"
												style:top={highLimitPercent +
													"%"}
												style:color="#ffffff"
											>
												High {plottedGoal.highLimit}
											</div>

											<!-- Low limit guide -->
											<div
												class="pointer-events-none absolute left-0 w-full border-2 border-dashed opacity-60"
												style:top={lowLimitPercent +
													"%"}
												style:border-color={plottedGoal.color ??
													"#ffffff"}
											></div>

											<div
												class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm"
												style:top={lowLimitPercent +
													"%"}
												style:color="#ffffff"
											>
												Low {plottedGoal.lowLimit}
											</div>
										{/if}
										{@const latestNode =
											getLatestPlottedNode(plottedNodes)}
										{#if latestNode}
											<!-- Latest value horizontal guide -->
											<div
												class="pointer-events-none absolute left-0 w-full"
												style:top={latestNode.yPercent +
													"%"}
											></div>

											<div
												class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm text-white"
												style:top={latestNode.yPercent +
													"%"}
											>
												{latestNode.entry.value}
											</div>
										{/if}
										<!-- Line layer -->
										<svg
											class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
										>
											{#each plottedNodes as node, index (node.key)}
												{#if index > 0}
													{@const previousNode =
														plottedNodes[index - 1]}

													{#if node.entry.isConsequenceActive}
														<line
															x1={previousNode.xPercent +
																"%"}
															y1={previousNode.yPercent +
																"%"}
															x2={node.xPercent +
																"%"}
															y2={node.yPercent +
																"%"}
															stroke={getEntryLineColor(
																node.entry,
																plottedGoal,
															)}
															stroke-width="2"
															stroke-linecap="round"
															opacity={node.isPending
																? "0.45"
																: "0.9"}
															transform="translate(0,-3)"
														/>

														<line
															x1={previousNode.xPercent +
																"%"}
															y1={previousNode.yPercent +
																"%"}
															x2={node.xPercent +
																"%"}
															y2={node.yPercent +
																"%"}
															stroke={getEntryLineColor(
																node.entry,
																plottedGoal,
															)}
															stroke-width="2"
															stroke-linecap="round"
															opacity={node.isPending
																? "0.45"
																: "0.9"}
															transform="translate(0,3)"
														/>
													{:else}
														<line
															x1={previousNode.xPercent +
																"%"}
															y1={previousNode.yPercent +
																"%"}
															x2={node.xPercent +
																"%"}
															y2={node.yPercent +
																"%"}
															stroke={getEntryLineColor(
																node.entry,
																plottedGoal,
															)}
															stroke-width="2"
															stroke-linecap="round"
															opacity={node.isPending
																? "0.45"
																: "0.9"}
														/>
													{/if}
												{/if}
											{/each}
										</svg>

										<!-- Node layer -->
										{#each plottedNodes as node (node.key)}
											{#if node.entry.progressMarker}
												<div
													class="pointer-events-none absolute top-0 h-full w-px bg-white/30"
													style:left={node.xPercent +
														"%"}
												></div>
											{/if}

											{#if thread.iterateGoalMode && thread.measurementType !== "none"}
												<div
													class="pointer-events-none absolute -translate-x-1/2 rounded bg-black/80 px-2 py-0.5 text-sm font-bold text-white/50"
													style:left={node.xPercent +
														"%"}
													style:top={"calc(" +
														node.yPercent +
														"% - 32px)"}
												>
													{node.entry.value ?? ""}
												</div>
											{/if}

											<GoalEntryNode
												entry={node.entry}
												xPercent={node.xPercent}
												yPercent={node.yPercent}
												color={node.color}
												isPending={node.isPending}
												onOpen={(entry) => {
													if (!thread.iterateGoalMode)
														return;

													openGoalEntryEditor(
														thread,
														plottedGoal,
														entry,
													);
												}}
											/>
										{/each}
									{/each}
								</div>

								<div></div>

								<!-- X-axis day labels -->
								<div class="relative h-8">
									{#each dayNumbers as dayNumber}
										<div
											class="absolute -translate-x-1/2 text-lg text-white/50"
											style:left={((dayNumber - 1) /
												Math.max(
													dayNumbers.length - 1,
													1,
												)) *
												100 +
												"%"}
										>
											{dayNumber}
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
{/each}

{#if selectedGoalEntryData}
	<GoalEntryEditor
		thread={selectedGoalEntryData.thread}
		goal={selectedGoalEntryData.goal}
		entry={selectedGoalEntryData.entry}
		onDone={handleEntryDone}
		onNotDone={handleEntryNotDone}
		onUpdate={handleEntryUpdate}
		onCancel={closeGoalEntryEditor}
	/>
{/if}
{#if showGoalCompletionSummaryModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
	>
		<div
			class="w-full max-w-lg rounded-xl border border-white/20 bg-zinc-900 p-5 text-white shadow-xl"
		>
			<div class="mb-3 text-xl font-semibold">
				Do you want to provide a summary for the completion of this
				goal?
			</div>

			<textarea
				class="mb-4 min-h-32 w-full rounded border border-white/20 bg-black/40 p-3 text-white placeholder-white/40"
				placeholder="Completion summary..."
				bind:value={goalCompletionSummaryText}
			></textarea>

			<div class="flex justify-end gap-3">
				<button
					class="rounded bg-white/10 px-4 py-2 text-white/70 hover:bg-white/20 hover:text-white"
					onclick={completeGoalWithoutSummary}
				>
					No
				</button>

				<button
					class="rounded bg-green-600/70 px-4 py-2 text-white hover:bg-green-600"
					onclick={completeGoalWithSummary}
				>
					Yes
				</button>

				<button
					class="rounded bg-red-600/50 px-4 py-2 text-white hover:bg-red-600"
					onclick={closeGoalCompletionSummaryModal}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
{#if showInfoModal}
	<InfoModal
		title={infoModalTitle}
		message={infoModalMessage}
		onClose={closeInfoModal}
	/>
{/if}

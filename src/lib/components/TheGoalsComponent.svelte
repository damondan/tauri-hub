<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import { buttonStyles } from "$lib/styles";

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
		type GoalDay,
		type GoalMonth,
		type GoalThread,
		type Goal,
	} from "$lib/stores/thegoals";

	let displayYear: number = $state(0);
	let displayMonth: number = $state(0);
	let displayDay: number = $state(0);
	let todayDate: Date = $state(new Date());

	const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	onMount(() => {
		displayDay = todayDate.getDate();
		displayYear = todayDate.getFullYear();
		displayMonth = todayDate.getMonth() + 1;

		generateTheGoalStructureToDate(todayDate);
	});

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

		generateTheGoalStructureToDate(
			new Date(displayYear, displayMonth - 1, 1),
		);
	}

	function nextMonth() {
		if (displayMonth === 12) {
			displayMonth = 1;
			displayYear++;
		} else {
			displayMonth++;
		}

		generateTheGoalStructureToDate(
			new Date(displayYear, displayMonth - 1, 1),
		);
	}

	function getMonthName(month: number): string {
		return new Date(displayYear, month - 1, 1).toLocaleString("default", {
			month: "long",
		});
	}

	function getFirstDayOfMonth(year: number, month: number): number {
		return new Date(year, month - 1, 1).getDay();
	}

	function getGoalMonth(thread: GoalThread): GoalMonth | undefined {
		return thread.goalCalendar[displayYear]?.months?.[displayMonth - 1];
	}

	function getGoalCalendarDays(thread: GoalThread): (GoalDay | null)[] {
		const month = getGoalMonth(thread);

		if (!month) return [];

		const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

		const days: (GoalDay | null)[] = [];

		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		for (const day of month.days) {
			days.push(day);
		}

		return days;
	}

	function isToday(dayNumber: number): boolean {
		return (
			displayYear === todayDate.getFullYear() &&
			displayMonth === todayDate.getMonth() + 1 &&
			dayNumber === displayDay
		);
	}

	function getGoalEntriesForDay(day: GoalDay, goalId: string) {
		return day.entries.filter((entry) => entry.goalId === goalId);
	}

	function escapeDateInput(e: KeyboardEvent) {
		if (e.key === "Escape") {
			(e.currentTarget as HTMLInputElement).blur();
		}
	}

	function roundAxisLimit(value: number): number {
		if (!value || value <= 0) return 100;

		return Math.ceil((value + 25) / 25) * 25;
	}

	function getThreadAxisLimit(thread: GoalThread): number {
		const highestHighLimit = Math.max(
			0,
			...thread.goals.map((goal) => Number(goal.highLimit ?? 0)),
		);

		return roundAxisLimit(highestHighLimit);
	}

	function getMonthDayNumbers(thread: GoalThread): number[] {
		const month = getGoalMonth(thread);

		if (!month) return [];

		return month.days.map((day) => day.dayNumber);
	}

	function getYAxisLabels(axisLimit: number): number[] {
		return [axisLimit, axisLimit / 2, 0, -axisLimit / 2, -axisLimit];
	}

	function shouldShowThreadGrid(thread: GoalThread): boolean {
		return thread.goals.some((goal) => goal.isPersisted);
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

{#each $goalData as thread (thread.threadId)}
	<div class="mb-3">
		<!-- Level 1: Goal Thread Row -->
		<div class="rounded-xl bg-white/10 p-3">
			<div class="flex items-center gap-3">
				<button
					class="w-8 text-3xl text-white"
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
					oninput={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"description",
							(e.target as HTMLInputElement).value,
						)}
				/>

				<input
					type="color"
					class="h-10 w-12 rounded border border-white/20 bg-white/10"
					value={thread.color}
					oninput={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"color",
							(e.target as HTMLInputElement).value,
						)}
				/>

				<button
					class="rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"
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

		<!-- Level 2: Goals Inside Thread -->
		{#if thread.isExpanded}
			<div
				class="ml-10 mr-10 mt-2 space-y-2"
				in:fly={{ x: -20, duration: 250 }}
			>
				{#if thread.goals.length === 0}
					<div class="rounded-lg bg-white/5 p-3 text-white/50 italic">
						No goals inside this thread yet. Click the thread +
						button.
					</div>
				{/if}

				<!-- Level 2: Individual Goal Rows -->
				{#each thread.goals as goal (goal.goalId)}
					<div class="rounded-xl bg-white/10 p-3">
						<div class="flex flex-wrap items-end gap-3">
							<button
								class="w-8 text-3xl text-white"
								onclick={() =>
									toggleGoal(thread.threadId, goal.goalId)}
							>
								{goal.isExpanded ? "▼" : "▷"}
							</button>

							<div class="flex min-w-34 flex-1 flex-col">
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

							<div class="flex min-w-64 flex-1 flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Description</label
								>
								<input
									type="text"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-lg text-white placeholder-white/40"
									placeholder="Goal description..."
									value={goal.description}
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

							<div class="flex flex-col">
								<label
									class="mb-1 text-xs text-white/50"
									>Set Goal</label
								>
								<select
									class="rounded border border-white/20 bg-black/70 px-3 py-2 text-black"
									value={goal.measurementType}
									onchange={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"measurementType",
											(e.target as HTMLSelectElement)
												.value as Goal["measurementType"],
										)}
								>
									<option value="time">Time</option>
									<option value="count">Count</option>
								</select>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white"
									>Amount</label
								>
								<input
									type="number"
									class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Amount"
									value={goal.measurementAmount}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"measurementAmount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label
									class="mb-1 text-xs text-white/50"
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
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label class="mb-1 text-xs text-white/40"
									>Starter Goal</label
								>
								<input
									type="number"
									class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="0"
									value={goal.startAmount}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"startAmount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label class="mb-1 text-xs text-white/40"
									>Low Limit</label
								>
								<input
									type="number"
									class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Low"
									value={goal.lowLimit}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"lowLimit",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label class="mb-1 text-xs text-white/40"
									>High Limit</label
								>
								<input
									type="number"
									class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="High"
									value={goal.highLimit}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"highLimit",
											Number(
												(e.target as HTMLInputElement)
													.value,
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
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"maxFailuresAllowed",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Completed</label
								>
								<label
									class="flex h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70"
								>
									<input
										type="checkbox"
										checked={goal.isCompleted}
										onchange={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"isCompleted",
												(e.target as HTMLInputElement)
													.checked,
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
												(e.target as HTMLInputElement)
													.checked,
											)}
									/>
									Persisting
								</label>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Init</label
								>
								<button
									class="h-10 rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"
									onclick={() =>
										initGoal(thread.threadId, goal.goalId)}
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

				<!-- Level 3: Shared lineGrid for this GoalThread -->
				{#if shouldShowThreadGrid(thread)}
					{@const axisLimit = getThreadAxisLimit(thread)}
					{@const dayNumbers = getMonthDayNumbers(thread)}
					{@const yAxisLabels = getYAxisLabels(axisLimit)}

					<div
						class="mt-4 rounded-xl border border-white/10 bg-black/30 p-3"
					>
						<div class="mb-3 flex items-center justify-between">
							<button
								class="px-2 text-xl text-white hover:text-white/70"
								onclick={prevMonth}
							>
								◀
							</button>

							<div class="text-3xl font-semibold text-white">
								{getMonthName(displayMonth)}
								{displayYear}
							</div>

							<button
								class="px-2 text-xl text-white hover:text-white/70"
								onclick={nextMonth}
							>
								▶
							</button>
						</div>

						<div class="mb-2 text-sm text-white/40">
							Y-axis: +{axisLimit} to -{axisLimit}
						</div>

						<div class="grid grid-cols-[4rem_1fr] gap-2">
							<!-- Y-axis labels -->
							<div
								class="relative h-[27rem] border-r border-white/20 pr-2"
							>
								{#each yAxisLabels as label}
									<div
										class="absolute right-2 -translate-y-1/2 text-xs text-white/50"
										style={`top: ${((axisLimit - label) / (axisLimit * 2)) * 100}%`}
									>
										{label}
									</div>
								{/each}
							</div>

							<!-- Grid area -->
							<div
								class="relative h-[27rem] border border-white/20 bg-white/5"
							>
								<!-- Horizontal grid lines -->
								{#each yAxisLabels as label}
									<div
										class="absolute left-0 w-full border-t border-white/10"
										style={`top: ${((axisLimit - label) / (axisLimit * 2)) * 100}%`}
									></div>
								{/each}

								<!-- Zero line -->
								<div
									class="absolute left-0 top-1/2 w-full border-t-2 border-white/40"
								></div>

								<!-- Vertical day lines -->
								{#each dayNumbers as dayNumber}
									<div
										class="absolute top-0 h-full border-l border-white/10"
										style={`left: ${
											((dayNumber - 1) /
												Math.max(
													dayNumbers.length - 1,
													1,
												)) *
											100
										}%`}
									></div>
								{/each}
							</div>

							<!-- Empty corner -->
							<div></div>

							<!-- X-axis day labels -->
							<div class="relative h-8">
								{#each dayNumbers as dayNumber}
									<div
										class="absolute -translate-x-1/2 text-xs text-white/50"
										style={`left: ${
											((dayNumber - 1) /
												Math.max(
													dayNumbers.length - 1,
													1,
												)) *
											100
										}%`}
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
{/each}

<script lang="ts">
	import type { Goal, GoalEntry, GoalThread } from "$lib/stores/thegoals";

	interface Props {
		thread: GoalThread;
		goal: Goal;
		entry: GoalEntry;
		onDone: (
			entry: GoalEntry,
			value: number,
			description: string,
			consequenceCompleted: boolean,
			entryConsequenceDescr: string,
			progressMarker: boolean,
		) => void;
		onNotDone: (
			entry: GoalEntry,
			description: string,
			consequenceCompleted: boolean,
			entryConsequenceDescr: string,
			progressMarker: boolean,
		) => void;
		onUpdate: (
			entry: GoalEntry,
			value: number,
			description: string,
			consequenceCompleted: boolean,
			entryConsequenceDescr: string,
			progressMarker: boolean,
		) => void;
		onCancel: () => void;
	}

	let { thread, goal, entry, onDone, onNotDone, onUpdate, onCancel }: Props =
		$props();

	let entryValue = $state<number>(Number(entry.value ?? 0));
	let entryDescription = $state<string>(entry.description ?? "");
	let entryConsequenceDescr = $state<string>(
		entry.consequenceDescription ?? "",
	);
	let isConsequenceActive = $state<boolean>(
		entry.isConsequenceActive ?? false,
	);
	let isMarkerOn = $state<boolean>(entry.progressMarker ?? false);

	const isNoneGoal = $derived(thread.measurementType === "none");
	const isCountGoal = $derived(thread.measurementType === "count");
	const isTimeGoal = $derived(thread.measurementType === "time");

	const question = $derived.by(() => {
		if (isCountGoal) {
			return `How many ${goal.title || "items"} did you do today?`;
		}

		if (isTimeGoal) {
			return `How long did you do ${goal.title || "this goal"} today?`;
		}

		return `Did you fulfill your goal ${goal.title || "for today"}?`;
	});
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div
		class="w-full max-w-2xl rounded-xl border border-white/20 bg-zinc-950 p-5 text-white shadow-xl"
	>
		<div class="mb-4 flex items-start justify-between gap-4">
			<div>
				<h2 class="text-2xl font-semibold">Goal Entry</h2>

				<p class="mt-1 text-white/60">
					{question}
				</p>
			</div>

			<button
				type="button"
				class="rounded bg-white/10 px-3 py-1 text-white/60 hover:bg-white/20 hover:text-white"
				onclick={onCancel}
			>
				X
			</button>
		</div>

		<div class="space-y-4">
			<div class="flex flex-col">
				<label class="mb-1 text-sm text-white/50">
					Notes/Goal Mods
				</label>

				<textarea
					rows="3"
					class="resize-none rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/30"
					placeholder="Will you be modifying goals or have any notes for today ?"
					bind:value={entryDescription}
				></textarea>
			</div>

			<div class="flex flex-col">
				<label class="mb-1 text-sm text-white/50"> Value </label>

				<input
					type="number"
					class={`rounded border border-white/20 px-3 py-2 text-white ${
						isNoneGoal
							? "cursor-not-allowed bg-white/5 opacity-30"
							: "bg-white/5"
					}`}
					placeholder={isTimeGoal
						? "Time amount..."
						: isCountGoal
							? "Count amount..."
							: "Disabled for yes/no goal"}
					bind:value={entryValue}
					disabled={isNoneGoal}
				/>
			</div>
			{#if isConsequenceActive}
				<div class="flex flex-col">
					<label class="mb-1 text-sm text-white/50"> Excuse ? </label>

					<textarea
						rows="2"
						class="resize-none rounded border border-white/20 bg-white/5 px-3 py-2 text-white/70 placeholder-white/30 h-25"
						bind:value={entryConsequenceDescr}
						placeholder="If you so choose ... type down the excuse of why you falled short in your goal, read it out loud, and than write about it. Once completed, uncheck the excuse checkbox."
					></textarea>
				</div>
			{/if}
			<div class="flex flex-row">
				{#if isConsequenceActive}
					<label
						class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70 mx-auto"
					>
						<input
							type="checkbox"
							bind:checked={isConsequenceActive}
						/>

						Excuse ?
					</label>
				{/if}
				<label
					class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70 mx-auto"
				>
					<input type="checkbox" bind:checked={isMarkerOn} />

					Set Marker?
				</label>
			</div>
		</div>

		<div class="mt-5 flex justify-center gap-3">
			<button
				type="button"
				class="rounded bg-blue-500/20 px-4 py-2 text-blue-200 hover:bg-blue-500 hover:text-white"
				onclick={() =>
					onUpdate(
						entry,
						entryValue,
						entryDescription,
						isConsequenceActive,
						entryConsequenceDescr,
						isMarkerOn,
					)}
			>
				Update
			</button>

			<button
				type="button"
				class="rounded bg-white/10 px-4 py-2 text-white/60 hover:bg-white/20 hover:text-white"
				onclick={onCancel}
			>
				Cancel
			</button>

			{#if isNoneGoal}
				<button
					type="button"
					class="rounded bg-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500 hover:text-white"
					onclick={() =>
						onNotDone(
							entry,
							entryDescription,
							true,
							entryConsequenceDescr,
							isMarkerOn,
						)}
				>
					No
				</button>

				<button
					type="button"
					class="rounded bg-emerald-500/30 px-4 py-2 text-emerald-100 hover:bg-emerald-500 hover:text-white"
					onclick={() =>
						onDone(
							entry,
							0,
							entryDescription,
							isConsequenceActive,
							entryConsequenceDescr,
							isMarkerOn,
						)}
				>
					Yes
				</button>
			{:else}
				<button
					type="button"
					class="rounded bg-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500 hover:text-white"
					onclick={() =>
						onNotDone(
							entry,
							entryDescription,
							true,
							entryConsequenceDescr,
							isMarkerOn,
						)}
				>
					Not Done
				</button>

				<button
					type="button"
					class="rounded bg-emerald-500/30 px-4 py-2 text-emerald-100 hover:bg-emerald-500 hover:text-white"
					onclick={() =>
						onDone(
							entry,
							Number(entryValue),
							entryDescription,
							isConsequenceActive,
							entryConsequenceDescr,
							isMarkerOn,
						)}
				>
					Done
				</button>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import type { GoalEntry } from "$lib/stores/thegoals";

	interface Props {
		entry: GoalEntry;
		xPercent: number;
		yPercent: number;
		hoverWidthPercent?: number;
		hoverHeightPx?: number;
		color?: string;
		isPending?: boolean;
		onOpen: (entry: GoalEntry) => void;
	}

	let {
		entry,
		xPercent,
		yPercent,
		hoverWidthPercent = 0,
		hoverHeightPx = 200,
		color = "#ffffff",
		isPending = false,
		onOpen,
	}: Props = $props();
</script>

<button
	type="button"
	class="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0"
	class:opacity-50={isPending}
	style:left={xPercent + "%"}
	style:top={yPercent + "%"}
	style:width={hoverWidthPercent > 0 ? hoverWidthPercent + "%" : "12px"}
	style:height={hoverHeightPx + "px"}
	title={[
		`${entry.description ?? "Goal entry"}`,
		entry.consequenceDescription
			? `Excuse: ${entry.consequenceDescription}`
			: null,
	]
		.filter(Boolean)
		.join("\n")}
	onclick={() => onOpen(entry)}
>
	<span
		class="pointer-events-none h-3 w-3 shrink-0 rounded-full border border-white transition-transform group-hover:scale-125"
		style:background-color={color}
	></span>
</button>

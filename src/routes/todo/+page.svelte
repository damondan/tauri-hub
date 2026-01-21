<!-- src/routes/todo/+page.svelte -->
<script lang="ts">
	import { onMount } from "svelte";
	import { todosByDate, loadTodosData } from "$lib/stores/general";

	onMount(() => {
		// Load data only on first visit
		loadTodosData();
	});
</script>

<div class="tab-content">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-4xl font-bold text-white">To Do</h1>
		<button
			class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
		>
			+
		</button>
	</div>

	{#each Object.entries($todosByDate) as [date, todos]}
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4">
			<h2 class="text-2xl font-semibold text-white mb-4">{date}</h2>
			<div class="space-y-2">
				{#each todos as todo}
					<div class="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
						<input
							type="checkbox"
							checked={todo.completed}
							class="w-5 h-5 cursor-pointer"
						/>
						<span
							class="text-white flex-1 {todo.completed
								? 'line-through opacity-60'
								: ''}"
						>
							{todo.text}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

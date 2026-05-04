<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
	import { page } from "$app/stores";

	const tabs = [
		{ path: "/", label: "Services" },
		{ path: "/finances", label: "Finance" },
		{ path: "/todo", label: "ToDo" },
		{ path: "/projects", label: "Logs" },
		{ path: "/personal", label: "Pers" },
		{ path: "/professional", label: "Prof" },
		{ path: "/thegoals", label: "Goals" },
		{ path: "/commands", label: "Commands" },
		{ path: "/howto", label: "HowTo" },
		{ path: "/notifications", label: "Notifs" },
		{ path: "/workspace_a", label: "XSpaceA" },
		{ path: "/workspace_b", label: "XSpaceB" },
	];
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2 font-mono">
	{#each tabs as tab}
		<a
			href={tab.path}
			class="px-4 py-3 rounded-t-lg font-semibold transition-all
           {$page.url.pathname === tab.path
				? 'bg-white/20 border-b-2 border-white text-white'
				: 'bg-white/5 hover:bg-white/10 text-white/30'}"
		>
			{tab.label}
		</a>
	{/each}
</nav>

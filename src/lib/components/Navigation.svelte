<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
	import { page } from "$app/stores";

	const tabs = [
		{ path: "/", label: "Services" },
		{ path: "/todo", label: "ToDo" },
		{ path: "/projects", label: "Projects" },
		{ path: "/finances", label: "Finance" },
		{ path: "/goals", label: "Goals" },
		{ path: "/howto", label: "HowTo" },
		{ path: "/commands", label: "Commands" },
		{ path: "/notifications", label: "Notifs" },
		{ path: "/status", label: "Status" },
		{ path: "/workspace", label: "Workspace" },
	];
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2">
	{#each tabs as tab}
		<a
			href={tab.path}
			class="px-4 py-3 rounded-t-lg font-semibold transition-all
           {$page.url.pathname === tab.path
				? 'bg-white/20 border-b-2 border-blue-500 text-white'
				: 'bg-white/5 hover:bg-white/10 text-white/70'}"
		>
			{tab.label}
		</a>
	{/each}
</nav>

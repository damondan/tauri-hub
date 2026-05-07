<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { isUnlocked,pass } from "$lib/stores/auth";
	import { show } from "@tauri-apps/api/app";

	let showAuthModal = $state(false);
	let passwordInput = $state("");
	let pendingRoute = $state("");

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

	function persAuth(path: string) {
		console.log("auth required for:", path);
	
		pendingRoute = path;
	
		showAuthModal = true;
	}

	function cancelAuth() {
		showAuthModal = false;
		passwordInput = "";
	}

	function submitAuth(password: string) {
	// 1. set password
	pass.set(password);

	// 2. unlock app
	isUnlocked.set(true);

	// 3. close modal
	showAuthModal = false;

	// 4. resume navigation if it exists
	if (pendingRoute) {
		goto(pendingRoute);
		pendingRoute = "";
	}
}
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2 font-mono">
	{#each tabs as tab}
		<button
			onclick={() => {
				console.log("tab:", tab.path);

				if (!$isUnlocked) {
					console.log("isUnlocked is false");

					if (tab.label === "Pers") {
						console.log("Equals Pers");
						persAuth(tab.path);
						pendingRoute = tab.path;
					}

					
				}

				console.log("about to go to goto");
				goto(tab.path);
			}}
			class="px-4 py-3 rounded-t-lg font-semibold transition-all
			{page.url.pathname === tab.path
				? 'bg-white/20 border-b-2 border-white text-white'
				: 'bg-white/5 hover:bg-white/10 text-white/30'}"
		>
			{tab.label}
		</button>
	{/each}
</nav>

{#if showAuthModal}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
	>
		<div class="bg-zinc-900 rounded-xl p-6 w-[400px] shadow-xl">
			<h2 class="text-xl font-semibold text-white mb-4">
				Enter Password
			</h2>

			<input
				type="password"
				bind:value={passwordInput}
				placeholder="Password"
				class="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white outline-none border border-zinc-700 mb-4"
			/>

			<div class="flex justify-end gap-3">
				<button
					onclick={cancelAuth}
					class="px-4 py-2 rounded-lg bg-zinc-700 text-white"
				>
					Cancel
				</button>

				<button
					onclick={() => submitAuth(passwordInput)}
					class="px-4 py-2 rounded-lg bg-blue-600 text-white"
				>
					Submit
				</button>
			</div>
		</div>
	</div>
{/if}

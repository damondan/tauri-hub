<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import {
		pass,
		authError,
		authTargetTab,
		showAuthModal,
		persAuth,
		unlockPers,
		initLoginWithEncryption,
	} from "$lib/stores/auth";
	import {
		persGoalEncryptedCache,
		persLockState,
		LockState,
	} from "$lib/stores/persgoal";
	import AuthModalComponent from "./AuthModalComponent.svelte";
	import { show } from "@tauri-apps/api/app";
	import { appPersState } from "$lib/stores/state.svelte";

	let passwordInput = $state("");
	let initialLoginText = $state("");
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

	export function cancelAuth() {
		showAuthModal.set(false);
		authTargetTab.set(null);
		authError.set(null);
	}

	export async function submitAuth(password: string) {
		console.log(`In submitAuth`);

		let success: boolean = false;
		pass.set(password);

		if (get(persLockState) == LockState.NOT_SET) {
			console.log(`initLoginWithEncryption`);
			try {
				success = await initLoginWithEncryption(password);
			} catch (e) {
				console.log(`in submitAuth and success is false`);
				return false;
			}
		}
		if (get(persLockState) == LockState.LOCKED) {
			console.log(`unlockPers`);
			try {
				success = await unlockPers(password);
			} catch (e) {
				console.log(`in submitAuth and success is false`);
				return false;
			}
		}
		if (success) {
			showAuthModal.set(false);
			const target = get(authTargetTab);
			if (target) goto(target);

			authTargetTab.set(null);
			authError.set(null);
		} else {
			authError.set("Incorrect password");
		}
	}

	function setlock(){
		persLockState.set(LockState.LOCKED);
	}
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2 font-mono">
	{#each tabs as tab}
		<button
			onclick={() => {
				console.log("tab:", tab.path);

				if (($persLockState == LockState.LOCKED || $persLockState == LockState.NOT_SET) && tab.label == "Pers")
				 {
					authTargetTab.set(tab.path);
					showAuthModal.set(true);
				}

				console.log("about to go to goto");
				goto(tab.path);
			}}
			ondblclick={() => setlock()}
			class="px-4 py-3 rounded-t-lg font-semibold transition-all
			{page.url.pathname === tab.path
				? 'bg-white/20 border-b-2 border-white text-white'
				: 'bg-white/5 hover:bg-white/10 text-white/30'}"
		>
			{tab.label}
		</button>
	{/each}
</nav>

{#if $showAuthModal}
	<AuthModalComponent bind:passwordInput {cancelAuth} {submitAuth} />

	<!-- <div
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
					onclick={() =>
						submitAuth(passwordInput, unlockPers)}
					class="px-4 py-2 rounded-lg bg-blue-600 text-white"
				>
					Submit
				</button>
			</div>
		</div>
	</div> -->
{/if}

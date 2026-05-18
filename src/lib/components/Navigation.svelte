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
		unlockPers,
		initLoginWithEncryption,
	} from "$lib/stores/auth";
	import {
		persLockState,
		LockState,
		persGoalData,
		persGoalHighlights,
	} from "$lib/stores/persgoal";
	import AuthModalComponent from "./AuthModalComponent.svelte";

	let passwordInput = $state("");

	const tabs = [
		{ path: "/", label: "Services" },
		{ path: "/finances", label: "Finance" },
		{ path: "/todo", label: "ToDo" },
		{ path: "/projects", label: "Logs" },
		{ path: "/articulate", label: "Artic" },
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
		passwordInput="";
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

	function setlock() {
		console.log(`In setLock and setting to locked`);
		persLockState.set(LockState.LOCKED);
	
		persGoalData.set([]);
		persGoalHighlights.set({});
	}
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2 font-mono">
	{#each tabs as tab}
		<button
			onclick={() => {
				console.log("tab:", tab.path);

				if (
					($persLockState == LockState.LOCKED ||
						$persLockState == LockState.NOT_SET) &&
					tab.label == "Pers"
				) {
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
{/if}

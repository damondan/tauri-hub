<script lang="ts">
    import { LockState, persLockState, type PersLockState } from "$lib/stores/persgoal";
	type Props = {
		passwordInput: string;
		cancelAuth: () => void;
		submitAuth: (password: string) => void;
	};

	let {
		passwordInput = $bindable(),
		cancelAuth,
		submitAuth
	}: Props = $props();
</script>

<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
	>
		<div class="bg-zinc-900 rounded-xl p-6 w-[400px] shadow-xl">
			<h2 class="text-xl font-semibold text-white mb-4">
				Enter Password
			</h2>

			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="password"
				bind:value={passwordInput}
				placeholder="Password"
				class="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white outline-none border border-zinc-700 mb-4"
				autofocus
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
						submitAuth(passwordInput)}
					class="px-4 py-2 rounded-lg bg-blue-600 text-white"
				>
					Submit
				</button>
			</div>
		</div>
	</div>
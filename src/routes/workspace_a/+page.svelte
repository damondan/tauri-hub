<!-- src/routes/workspace/+page.svelte -->
<script lang="ts">
	import { workspaceContentA } from '$lib/stores/workspace';
</script>

<div class="tab-content w-full min-h-screen flex flex-col font-mono">
  <h1 class="text-4xl font-bold text-green-500 mb-6">Workspace A</h1>

  <textarea
    bind:value={$workspaceContentA}
    class="flex-1 w-full resize-none outline-none p-6 bg-neutral-900 text-white font-mono text-2xl"
    placeholder="Workspace A..."
  ></textarea>
</div>

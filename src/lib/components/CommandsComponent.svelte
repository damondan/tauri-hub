<!-- src/lib/components/CommandsComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { commandItems, addCommandItem, addCommandTextRow, updateCommandTitle, updateCommandTextRow, deleteCommandTextRow, removeCommandItem } from '$lib/stores/general';
  import { resizeTextarea, setupTextareaResizeListener } from '$lib/utils/textareaResize';

  // Track which items are expanded
  let expanded: Record<string, boolean> = {};

  function toggleExpanded(itemId: string) {
    expanded[itemId] = !expanded[itemId];
  }

  // Handlers
  function handleAddTopLevel() {
    const id = addCommandItem();
    expanded[id] = true; // Auto-expand new items
  }

  function handleAddRow(itemId: string) {
    addCommandTextRow(itemId);
    // Auto-expand when adding a row
    expanded[itemId] = true;
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }

  // Setup window resize listener for textareas
  onMount(() => {
    // Initial resize of all textareas
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        if (textarea instanceof HTMLTextAreaElement) {
          resizeTextarea(textarea);
        }
      });
    }, 100);
    
    return setupTextareaResizeListener();
  });

  // Resize textareas when items are expanded
  function toggleExpandedWithResize(itemId: string) {
    toggleExpanded(itemId);
    if (expanded[itemId]) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          if (textarea instanceof HTMLTextAreaElement) {
            resizeTextarea(textarea);
          }
        });
      }, 0);
    }
  }
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Commands</h1>
  <button on:click={handleAddTopLevel} class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center">+</button>
</div>

<!-- Empty state -->
{#if Object.keys($commandItems).length === 0}
  <div class="text-white/70 italic">No commands yet. Click + to add your first Command.</div>
{/if}

<!-- Command items list -->
{#each Object.values($commandItems) as item (item.id)}
  <div class="bg-white/10 rounded-xl p-3 mb-3">
    <div class="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded p-2 -m-2" on:click={() => toggleExpandedWithResize(item.id)}>
      <!-- Expand/collapse indicator -->
      <span class="text-white text-lg w-6">{expanded[item.id] ? '▼' : '▶'}</span>

      <!-- Title input -->
      <input
        class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
        placeholder="Command Title"
        value={item.title}
        on:input={(e) => updateCommandTitle(item.id, (e.target as HTMLInputElement).value)}
        on:click|stopPropagation
      />

      <!-- Add row button -->
      <button class="bg-green-600 hover:bg-green-700 text-white text-2xl px-2 py-1 rounded" on:click|stopPropagation={() => handleAddRow(item.id)}>+
      </button>

      <!-- Delete button -->
      <div class="flex flex-col gap-1" on:click|stopPropagation>
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xl" on:click={() => removeCommandItem(item.id)}>Del</button>
      </div>
    </div>

    <!-- Text rows (only show when expanded) -->
    {#if expanded[item.id]}
    <div class="mt-3 space-y-2">
      {#each item.rows as row (row.id)}
        <div class="border border-white/30 rounded-lg p-2 flex items-start gap-3">
          <!-- Text input -->
          <textarea
            rows="1"
            class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-white text-3xl resize-none overflow-hidden leading-tight break-words whitespace-normal"
            placeholder="Enter command text..."
            value={row.text}
            on:input={(e) => {
              const target = e.target as HTMLTextAreaElement;
              updateCommandTextRow(item.id, row.id, target.value);
              // Auto-resize
              resizeTextarea(target);
            }}
          ></textarea>

          <!-- Copy / Delete (side by side) -->
          <div class="flex gap-1">
            <button class="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm" on:click={() => handleCopy(row.text)}>Copy</button>
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" on:click={() => deleteCommandTextRow(item.id, row.id)}>Del</button>
          </div>
        </div>
      {/each}
    </div>
    {/if}
  </div>
{/each}

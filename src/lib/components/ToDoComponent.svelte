<!-- src/lib/components/ToDoComponent.svelte -->
<script lang="ts">
  import { todosByDate, addTodoItem, addTodoRow, updateTodoTitle, updateTodoRowText, toggleTodoRow, deleteTodoRow, removeTodoItem, todayKey } from '$lib/stores/general';

  // Track which items are expanded
  let expanded: Record<string, boolean> = {};

  function toggleExpanded(itemId: string) {
    expanded[itemId] = !expanded[itemId];
  }

  // Handlers
  function handleAddTopLevel() {
    addTodoItem(todayKey());
  }

  function handleAddRow(date: string, itemId: string) {
    addTodoRow(date, itemId);
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
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">To Do</h1>
  <button on:click={handleAddTopLevel} class="bg-green-500 hover:bg-green-600 text-white w-12 
  h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center">+</button>
</div>

<!-- Empty state -->
{#if Object.keys($todosByDate).length === 0}
  <div class="text-white/70 italic">No todos yet. Click + to add your first To Do.</div>
{/if}

<!-- Date groups -->
{#each Object.entries($todosByDate) as [date, items]}
  <div class="mb-6">
    <h2 class="text-3xl text-white/90 mb-2">{date}</h2>

    {#each items as item (item.id)}
      <!-- TodoItem container -->
      <div class="bg-white/10 rounded-xl p-3 mb-3">
        <div class="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded p-2 -m-2" on:click={() => toggleExpanded(item.id)}>
          <!-- Expand/collapse indicator -->
          <span class="text-white text-3xl w-6">{expanded[item.id] ? '▼' : '▶'}</span>

          <!-- Date label (redundant inside group, but kept per spec) -->
          <span class="text-white/70 text-3xl">{item.date}</span>

          <!-- Add row under this container -->
          <button class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" on:click|stopPropagation={() => handleAddRow(date, item.id)}>+
          </button>

          <!-- Title input -->
          <input
            class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
            placeholder="Title"
            value={item.title}
            on:input={(e) => updateTodoTitle(date, item.id, (e.target as HTMLInputElement).value)}
            on:click|stopPropagation
          />

          <!-- Send/Delete buttons (stacked) -->
          <div class="flex flex-col gap-1" on:click|stopPropagation>
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-lg">Send</button>
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg" on:click={() => removeTodoItem(date, item.id)}>Del</button>
          </div>
        </div>

        <!-- Rows list (only show when expanded) -->
        {#if expanded[item.id]}
        <div class="mt-3 space-y-2">
          {#each item.rows as row (row.id)}
            <div class="border rounded-lg p-2 flex items-start gap-3 {row.completed ? 'border-green-500' : 'border-red-500'}">
              <!-- red circle / green check button -->
              <button class="w-7 h-7 rounded-full border-2 flex items-center justify-center {row.completed ? 'border-green-500' : 'border-red-500'}" on:click={() => toggleTodoRow(date, item.id, row.id)}>
                {#if row.completed}
                  ✅
                {:else}
                  <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                {/if}
              </button>

              <!-- Text input -->
              <textarea
                rows="1"
                class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-white text-3xl resize-none overflow-hidden leading-tight"
                placeholder="Describe the task..."
                value={row.text}
                on:input={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  updateTodoRowText(date, item.id, row.id, target.value);
                  // Auto-resize
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              ></textarea>

              <!-- Copy / Delete (side by side) -->
              <div class="flex gap-1">
                <button class="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-lg" on:click={() => handleCopy(row.text)}>Copy</button>
                <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg" on:click={() => deleteTodoRow(date, item.id, row.id)}>Del</button>
              </div>
            </div>
          {/each}
        </div>
        {/if}
      </div>
    {/each}
  </div>
{/each}

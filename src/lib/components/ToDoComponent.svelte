<!-- src/lib/components/ToDoComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { todayKey } from '$lib/stores/general';
  import { todosByDate, 
    addTodoItem, 
    addTodoRow, 
    updateTodoTitle, 
    updateTodoRowText, 
    toggleTodoRow, 
    deleteTodoRow, 
    removeTodoItem, 
    todoField1, 
    todoField2, 
    sendTodoToProjects, 
    todoExpandedState } from '$lib/stores/todo';
  import { resizeTextarea, resizeAllTextareas, setupTextareaResizeListener } from '$lib/utils/textareaResize';

  function toggleExpanded(itemId: string) {
    todoExpandedState.update(state => {
      const newState = { ...state };
      newState[itemId] = !newState[itemId];
      return newState;
    });
    // Recalculate textarea heights after expansion
    if ($todoExpandedState[itemId]) {
      setTimeout(() => {
        resizeAllTextareas();
      }, 0);
    }
  }

  // Handlers
  function handleAddTopLevel() {
    addTodoItem(todayKey());
  }

  function handleAddRow(date: string, itemId: string) {
    addTodoRow(date, itemId);
    // Auto-expand when adding a row
    todoExpandedState.update(state => ({ ...state, [itemId]: true }));
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }

  function handleSend(date: string, itemId: string, item: any) {
    // Check if all rows are completed
    console.log("**********In Send");
    if (!allRowsCompleted(item)) {
      console.log('Cannot send: not all rows are completed');
      return;
    }
    
    const success = sendTodoToProjects(date, itemId);
    if (!success) {
      console.error('Failed to send todo to projects - check title format');
    }
  }

  function allRowsCompleted(item: any): boolean {
    return item.rows.length > 0 && item.rows.every((row: any) => row.completed);
  }

  function autoResizeInput(element: HTMLInputElement) {
    const minWidth = 40; // minimum width in px
    const padding = 32; // account for padding
    element.style.width = '0';
    element.style.width = Math.max(minWidth, element.scrollWidth + padding) + 'px';
  }

  // Setup window resize listener for textareas
  onMount(() => {
    return setupTextareaResizeListener();
  });

  // Reactive effect to resize field inputs when their values change
  $effect(() => {
    // Track the store values to trigger reactivity
    const val1 = $todoField1;
    const val2 = $todoField2;
    
    const field1El = document.getElementById('field1-input') as HTMLInputElement;
    const field2El = document.getElementById('field2-input') as HTMLInputElement;
    if (field1El) autoResizeInput(field1El);
    if (field2El) autoResizeInput(field2El);
  });
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">To Do</h1>
  <div class="flex items-center gap-2">
     <textarea
      id="field1-input"
      bind:value={$todoField1}
     class="bg-white/5 border border-white rounded px-3 py-1  
         text-white text-xl leading-tight 
         placeholder-white/40 resize-none overflow-hidden text-wrap"
      style="min-width: 40rem; width: 40rem;"
      placeholder="Field 1"
    ></textarea>
    <textarea
      id="field2-input"
      bind:value={$todoField2}
     class="bg-white/5 border border-white rounded px-3 py-1  
         text-white text-xl leading-tight 
         placeholder-white/40 resize-none overflow-hidden text-wrap"
      style="min-width: 40rem; width: 40rem;"
      placeholder="Field 2"
    ></textarea>
  </div>
  <div class="flex items-center gap-2">
    <button onclick={handleAddTopLevel} class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center">+</button>
  </div>
</div>

<!-- Empty state -->
{#if Object.keys($todosByDate).length === 0}
  <div class="text-white/70 italic">No todos yet. Click + to add your first To Do.</div>
{/if}

<!-- Date groups -->
{#each Object.entries($todosByDate) as [date, items]}
  <div class="mb-6">
    <!-- <h2 class="text-3xl text-white/90 mb-2">{date}</h2> -->

    {#each items as item (item.id)}
      <!-- TodoItem container -->
      <div class="bg-white/10 rounded-xl p-3 mb-3">
        <div class="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded p-2 -m-2" 
        onclick={() => toggleExpanded(item.id)}>
          <!-- Expand/collapse indicator -->
          <span class="text-white text-3xl w-6">{$todoExpandedState[item.id] ? '▼' : '▶'}</span>

          <!-- Date label (redundant inside group, but kept per spec) -->
          <span class="text-white/70 text-3xl">{item.date}</span>

          <!-- Add row under this container -->
          <button class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" onclick={(e) => {e.stopPropagation(); handleAddRow(date, item.id);}}>+
          </button>

          <!-- Title input -->
          <input
            class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
            placeholder="Title"
            value={item.title}
            oninput={(e) => {e.stopPropagation(); updateTodoTitle(date, item.id, (e.target as HTMLInputElement).value)}}
            onclick={(e)=> e.stopPropagation}
          />

          <!-- Send/Delete buttons (stacked) -->
          <div class="flex flex-col gap-1" onclick={(e)=> e.stopPropagation}>
            <button 
              class="px-3 py-1 rounded text-lg text-white {allRowsCompleted(item) ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-blue-600/30 cursor-not-allowed'}"
              onclick={(e) => {e.stopPropagation(); handleSend(date, item.id, item);}}
            >
              Send
            </button>
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg" onclick={(e) => {e.stopPropagation(); removeTodoItem(date, item.id);}}>Del</button>
          </div>
        </div>

        <!-- Rows list (only show when expanded) -->
        {#if $todoExpandedState[item.id]}
        <div class="mt-3 space-y-2">
          {#each item.rows as row (row.id)}
            <div class="border rounded-lg p-2 flex items-start gap-3 {row.completed ? 'border-green-500' : 'border-red-500'}">
              <!-- red circle / green check button -->
              <button class="w-7 h-7 rounded-full border-2 flex items-center justify-center {row.completed ? 'border-green-500' : 'border-red-500'}" onclick={(e) => {e.stopPropagation(); toggleTodoRow(date, item.id, row.id);}}>
                {#if row.completed}
                  ✅
                {:else}
                  <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                {/if}
              </button>

              <!-- Text input -->
              <textarea
                rows="1"
                class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-white text-3xl resize-none overflow-hidden leading-tight break-words whitespace-normal"
                placeholder="Describe the task..."
                value={row.text}
                oninput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  updateTodoRowText(date, item.id, row.id, target.value);
                  // Auto-resize
                  resizeTextarea(target);
                }}
              ></textarea>

              <!-- Copy / Delete (side by side) -->
              <div class="flex gap-1">
                <button class="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-lg" onclick={(e) => {e.stopPropagation(); handleCopy(row.text);}}>Copy</button>
                <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg" onclick={(e) => {e.stopPropagation(); deleteTodoRow(date, item.id, row.id);}}>Del</button>
              </div>
            </div>
          {/each}
        </div>
        {/if}
      </div>
    {/each}
  </div>
{/each}

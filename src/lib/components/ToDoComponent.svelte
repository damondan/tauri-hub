<!-- src/lib/components/ToDoComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { todosByDate, addTodoItem, addTodoRow, updateTodoTitle, updateTodoRowText, toggleTodoRow, deleteTodoRow, removeTodoItem, todayKey, todoField1, todoField2, sendTodoToProjects, todoExpandedState } from '$lib/stores/general';
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

  // Auto-resize input fields
  let projectNameValue = $state('');

  function autoResizeInput(element: HTMLInputElement) {
    const minWidth = 40; // minimum width in px
    const padding = 32; // account for padding
    element.style.width = '0';
    element.style.width = Math.max(minWidth, element.scrollWidth + padding) + 'px';
  }

  // Parse project name and toggle words in fields (add if not present, remove if present)
  function handleOrangeButton() {
    const text = projectNameValue.trim();
    const words = text.split(/\s+/);
    
    words.forEach(word => {
      if (word.startsWith('#')) {
        // Toggle in field1
        todoField1.update(val => {
          const wordList = val.trim().split(/\s+/).filter(w => w.length > 0);
          const index = wordList.indexOf(word);
          if (index >= 0) {
            // Word exists, remove it
            wordList.splice(index, 1);
          } else {
            // Word doesn't exist, add it
            wordList.push(word);
          }
          return wordList.join(' ');
        });
      } else if (word.startsWith('@')) {
        // Toggle in field2
        todoField2.update(val => {
          const wordList = val.trim().split(/\s+/).filter(w => w.length > 0);
          const index = wordList.indexOf(word);
          if (index >= 0) {
            // Word exists, remove it
            wordList.splice(index, 1);
          } else {
            // Word doesn't exist, add it
            wordList.push(word);
          }
          return wordList.join(' ');
        });
      }
    });
    
    // Clear project name input after parsing
    projectNameValue = '';
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
    <input
      id="field1-input"
      type="text"
      bind:value={$todoField1}
      class="bg-white/5 border border-white rounded px-3 py-2 text-white text-xl placeholder-white/40"
      style="min-width: 40px; width: 40px;"
      placeholder="Field 1"
    />
    <input
      id="field2-input"
      type="text"
      bind:value={$todoField2}
      class="bg-white/5 border border-white rounded px-3 py-2 text-white text-xl placeholder-white/40"
      style="min-width: 40px; width: 40px;"
      placeholder="Field 2"
    />
  </div>
  <div class="flex items-center gap-2">
    <button on:click={handleOrangeButton} class="bg-orange-500 hover:bg-orange-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center">+</button>
    <input
      type="text"
      maxlength="20"
      size="20"
      bind:value={projectNameValue}
      class="bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
      style="width: 20ch;"
      placeholder="Project name..."
    />
    <button on:click={handleAddTopLevel} class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center">+</button>
  </div>
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
          <span class="text-white text-3xl w-6">{$todoExpandedState[item.id] ? '▼' : '▶'}</span>

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
            <button 
              class="px-3 py-1 rounded text-lg text-white {allRowsCompleted(item) ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-blue-600/30 cursor-not-allowed'}"
              on:click={() => handleSend(date, item.id, item)}
            >
              Send
            </button>
            <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg" on:click={() => removeTodoItem(date, item.id)}>Del</button>
          </div>
        </div>

        <!-- Rows list (only show when expanded) -->
        {#if $todoExpandedState[item.id]}
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
                class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-white text-3xl resize-none overflow-hidden leading-tight break-words whitespace-normal"
                placeholder="Describe the task..."
                value={row.text}
                on:input={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  updateTodoRowText(date, item.id, row.id, target.value);
                  // Auto-resize
                  resizeTextarea(target);
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

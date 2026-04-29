<!-- src/lib/components/CommandsComponent.svelte -->
<!-- CommandsComponent.svelte -->
<script lang="ts">
  import { autoResize, resizeTextarea } from '$lib/utils/textareaResize';
  import {
    commandData,
    addCommandCategory,
    deleteCommandCategory,
    updateCommandCategoryName,
    addCommandSubcategory,
    updateCommandSubcategoryName,
    deleteCommandSubcategory,
    addCommandTask,
    updateCommandTaskText,
    deleteCommandTask,
    commandExpandedCategories,
    commandExpandedSubcategories
  } from '$lib/stores/commands';

  // toggleCategory(categoryId: string): void
  function toggleCategory(categoryId: string) {
    commandExpandedCategories.update(state => ({ ...state, [categoryId]: !state[categoryId] }));
  }

  // toggleSubcategory(key: string): void
  function toggleSubcategory(key: string) {
    commandExpandedSubcategories.update(state => ({ ...state, [key]: !state[key] }));
  }

  // handleCopy(text: string): Promise<void>
  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }
</script>

<!-- Header with Add button -->
<div class="flex items-center justif>y-end mb-6">
  <button 
    on:click={() => addCommandCategory()}
    class="bg-green-500/30 hover:bg-green-600/50 text-white w-10 h-10 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
  >
    +
  </button>
</div>

<!-- Empty state -->
{#if $commandData.length === 0}
  <div class="text-white/70 italic">No commands yet. Click + to add your first category.</div>
{/if}

<!-- Categories list -->
{#each $commandData as category (category.id)}
  <div class="mb-3">
    <!-- Level 1: Category -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleCategory(category.id)}
        >
          {$commandExpandedCategories[category.id] ? '▼' : '▷'}
        </button>
        
        <input
          type="text"
          class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
          placeholder="Category name..."
          value={category.name}
          on:input={(e) => updateCommandCategoryName(category.id, (e.target as HTMLInputElement).value)}
        />
        
        <button 
          class="bg-green-600/50 hover:bg-green-600 text-white px-2 py-1 rounded"
          on:click={() => addCommandSubcategory(category.id)}
        >
          +
        </button>
        
        <button 
          class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
          on:click={() => deleteCommandCategory(category.id)}
        >
          Del
        </button>
      </div>
    </div>

    <!-- Level 2: Subcategories (only show when category expanded) -->
    {#if $commandExpandedCategories[category.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each category.subcategories as subcategory (subcategory.id)}
          {@const subKey = `${category.id}-${subcategory.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleSubcategory(subKey)}
              >
                {$commandExpandedSubcategories[subKey] ? '▼' : '▷'}
              </button>
              
              <input
                type="text"
                class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                placeholder="Subcategory name..."
                value={subcategory.name}
                on:input={(e) => updateCommandSubcategoryName(category.id, subcategory.id, (e.target as HTMLInputElement).value)}
              />
              
              <button 
                class="bg-green-600/50 hover:bg-green-700 text-white px-2 py-1 rounded"
                on:click={() => addCommandTask(category.id, subcategory.id)}
              >
                +
              </button>
              
              <button 
                class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                on:click={() => deleteCommandSubcategory(category.id, subcategory.id)}
              >
                Del
              </button>
            </div>

            <!-- Command Tasks (only show when subcategory expanded) -->
            {#if $commandExpandedSubcategories[subKey]}
              <div class="mt-3 space-y-2">
                {#each subcategory.tasks as task (task.id)}
                  <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                    <textarea
                      rows="1"
                      class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white 
                      text-3xl placeholder-white/40 resize-none overflow-hidden leading-tight"
                      placeholder="Command..."
                      value={task.text}
                      use:autoResize={task.text}
                      on:input={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                        updateCommandTaskText(category.id, subcategory.id, task.id, target.value);
                      }}
                    ></textarea>
                    
                    <button 
                      class="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-lg"
                      on:click={() => handleCopy(task.text)}
                    >
                      Copy
                    </button>
                    
                    <button 
                      class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                      on:click={() => deleteCommandTask(category.id, subcategory.id, task.id)}
                    >
                      Del
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/each}

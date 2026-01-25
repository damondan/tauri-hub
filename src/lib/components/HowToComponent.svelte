<!-- src/lib/components/HowToComponent.svelte -->
<script lang="ts">
  import {
    howtoData,
    addHowToCategory,
    deleteHowToCategory,
    updateHowToCategoryName,
    addHowToSubcategory,
    updateHowToSubcategoryName,
    addHowToTopic,
    updateHowToTopicName,
    addHowToTask,
    updateHowToTaskText,
    deleteHowToTask,
    howtoExpandedCategories,
    howtoExpandedSubcategories,
    howtoExpandedTopics
  } from '$lib/stores/general';

  function toggleCategory(categoryId: string) {
    howtoExpandedCategories.update(state => ({ ...state, [categoryId]: !state[categoryId] }));
  }

  function toggleSubcategory(key: string) {
    howtoExpandedSubcategories.update(state => ({ ...state, [key]: !state[key] }));
  }

  function toggleTopic(key: string) {
    howtoExpandedTopics.update(state => ({ ...state, [key]: !state[key] }));
  }
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">HowTo</h1>
  <button 
    on:click={() => addHowToCategory()}
    class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
  >
    +
  </button>
</div>

<!-- Empty state -->
{#if $howtoData.length === 0}
  <div class="text-white/70 italic">No HowTos yet. Click + to add your first category.</div>
{/if}

<!-- Categories list -->
{#each $howtoData as category (category.id)}
  <div class="mb-3">
    <!-- Level 1: Category -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleCategory(category.id)}
        >
          {$howtoExpandedCategories[category.id] ? '▼' : '▶'}
        </button>
        
        <input
          type="text"
          class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
          placeholder="Category name..."
          value={category.name}
          on:input={(e) => updateHowToCategoryName(category.id, (e.target as HTMLInputElement).value)}
        />
        
        <button 
          class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
          on:click={() => addHowToSubcategory(category.id)}
        >
          +
        </button>
        
        <button 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg"
          on:click={() => deleteHowToCategory(category.id)}
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Level 2: Subcategories (only show when category expanded) -->
    {#if $howtoExpandedCategories[category.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each category.subcategories as subcategory (subcategory.id)}
          {@const subKey = `${category.id}-${subcategory.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleSubcategory(subKey)}
              >
                {$howtoExpandedSubcategories[subKey] ? '▼' : '▶'}
              </button>
              
              <input
                type="text"
                class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                placeholder="Subcategory name..."
                value={subcategory.name}
                on:input={(e) => updateHowToSubcategoryName(category.id, subcategory.id, (e.target as HTMLInputElement).value)}
              />
              
              <button 
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                on:click={() => addHowToTopic(category.id, subcategory.id)}
              >
                +
              </button>
            </div>
          </div>

          <!-- Level 3: Topics (only show when subcategory expanded) -->
          {#if $howtoExpandedSubcategories[subKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each subcategory.topics as topic (topic.id)}
                {@const topicKey = `${category.id}-${subcategory.id}-${topic.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleTopic(topicKey)}
                    >
                      {$howtoExpandedTopics[topicKey] ? '▼' : '▶'}
                    </button>
                    
                    <input
                      type="text"
                      class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                      placeholder="Topic name..."
                      value={topic.name}
                      on:input={(e) => updateHowToTopicName(category.id, subcategory.id, topic.id, (e.target as HTMLInputElement).value)}
                    />
                    
                    <button 
                      class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                      on:click={() => addHowToTask(category.id, subcategory.id, topic.id)}
                    >
                      +
                    </button>
                  </div>

                  <!-- HowTo Tasks (only show when topic expanded) -->
                  {#if $howtoExpandedTopics[topicKey]}
                    <div class="mt-3 space-y-2">
                      {#each topic.tasks as task (task.id)}
                        <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                          <input
                            type="text"
                            class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                            placeholder="HowTo task..."
                            value={task.text}
                            on:input={(e) => updateHowToTaskText(category.id, subcategory.id, topic.id, task.id, (e.target as HTMLInputElement).value)}
                          />
                          
                          <button 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg"
                            on:click={() => deleteHowToTask(category.id, subcategory.id, topic.id, task.id)}
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
        {/each}
      </div>
    {/if}
  </div>
{/each}

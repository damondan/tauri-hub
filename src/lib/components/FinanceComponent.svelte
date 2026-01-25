<!-- src/lib/components/FinanceComponent.svelte -->
<script lang="ts">
  import {
    financeData,
    addFinanceCategory,
    deleteFinanceCategory,
    updateFinanceCategoryName,
    addFinanceSubcategory,
    updateFinanceSubcategoryName,
    addFinanceTopic,
    updateFinanceTopicName,
    updateFinanceWeekData,
    financeExpandedCategories,
    financeExpandedSubcategories,
    financeExpandedTopics
  } from '$lib/stores/general';

  // toggleCategory(categoryId: string): void
  function toggleCategory(categoryId: string) {
    financeExpandedCategories.update(state => ({ ...state, [categoryId]: !state[categoryId] }));
  }

  // toggleSubcategory(key: string): void
  function toggleSubcategory(key: string) {
    financeExpandedSubcategories.update(state => ({ ...state, [key]: !state[key] }));
  }

  // toggleTopic(key: string): void
  function toggleTopic(key: string) {
    financeExpandedTopics.update(state => ({ ...state, [key]: !state[key] }));
  }
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Finance</h1>
  <button 
    on:click={() => addFinanceCategory()}
    class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
  >
    +
  </button>
</div>

<!-- Empty state -->
{#if $financeData.length === 0}
  <div class="text-white/70 italic">No Finance categories yet. Click + to add your first category.</div>
{/if}

<!-- Categories list -->
{#each $financeData as category (category.id)}
  <div class="mb-3">
    <!-- Level 1: Category -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleCategory(category.id)}
        >
          {$financeExpandedCategories[category.id] ? '▼' : '▶'}
        </button>
        
        <input
          type="text"
          class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
          placeholder="Category name..."
          value={category.name}
          on:input={(e) => updateFinanceCategoryName(category.id, (e.target as HTMLInputElement).value)}
        />
        
        <button 
          class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
          on:click={() => addFinanceSubcategory(category.id)}
        >
          +
        </button>
        
        <button 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg"
          on:click={() => deleteFinanceCategory(category.id)}
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Level 2: Subcategories (only show when category expanded) -->
    {#if $financeExpandedCategories[category.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each category.subcategories as subcategory (subcategory.id)}
          {@const subKey = `${category.id}-${subcategory.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleSubcategory(subKey)}
              >
                {$financeExpandedSubcategories[subKey] ? '▼' : '▶'}
              </button>
              
              <input
                type="text"
                class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                placeholder="Subcategory name..."
                value={subcategory.name}
                on:input={(e) => updateFinanceSubcategoryName(category.id, subcategory.id, (e.target as HTMLInputElement).value)}
              />
              
              <button 
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                on:click={() => addFinanceTopic(category.id, subcategory.id)}
              >
                +
              </button>
            </div>
          </div>

          <!-- Level 3: Topics (only show when subcategory expanded) -->
          {#if $financeExpandedSubcategories[subKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each subcategory.topics as topic (topic.id)}
                {@const topicKey = `${category.id}-${subcategory.id}-${topic.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleTopic(topicKey)}
                    >
                      {$financeExpandedTopics[topicKey] ? '▼' : '▶'}
                    </button>
                    
                    <input
                      type="text"
                      class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                      placeholder="Topic name..."
                      value={topic.name}
                      on:input={(e) => updateFinanceTopicName(category.id, subcategory.id, topic.id, (e.target as HTMLInputElement).value)}
                    />
                  </div>

                  <!-- Weekday Text Areas (only show when topic expanded) -->
                  {#if $financeExpandedTopics[topicKey]}
                    <div class="mt-3 space-y-2">
                      <!-- Monday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Mon</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Monday..."
                          value={topic.weekData.mon}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'mon', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Tuesday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Tues</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Tuesday..."
                          value={topic.weekData.tues}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'tues', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Wednesday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Wed</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Wednesday..."
                          value={topic.weekData.wed}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'wed', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Thursday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Thurs</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Thursday..."
                          value={topic.weekData.thurs}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'thurs', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Friday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Fri</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Friday..."
                          value={topic.weekData.fri}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'fri', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Saturday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Sat</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Saturday..."
                          value={topic.weekData.sat}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'sat', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Sunday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Sun</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Sunday..."
                          value={topic.weekData.sun}
                          on:input={(e) => updateFinanceWeekData(category.id, subcategory.id, topic.id, 'sun', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>
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

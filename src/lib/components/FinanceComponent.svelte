<!-- src/lib/components/FinanceComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMonthName } from '$lib/stores/general';
  import {
    financeData,
    generateFinanceStructureToDate,
    addFinanceEntry,
    deleteFinanceEntry,
    updateFinanceEntry,
    updateFinanceMonthAmount,
    calculateYearTotal,
    calculateMonthTotal,
    calculateMonthFoodTotal,
    calculateMonthGasTotal,
    calculateWeekTotal,
    formatCurrency,
    financeExpandedYears,
    financeExpandedMonths,
    financeExpandedWeeks
  } from '$lib/stores/finance';

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // onMount(): void
  onMount(() => {
    // Only regenerate if data is empty or has old structure
    const today = new Date();
    const currentData = $financeData;
    
    // Check if we need to regenerate (empty or old structure without days array)
    const needsRegeneration = currentData.length === 0 || 
      (currentData[0]?.months?.[0]?.weeks?.[0] && !currentData[0].months[0].weeks[0].days);
    
    if (needsRegeneration) {
      financeData.set([]);
    }
    
    generateFinanceStructureToDate(today);
  });

  // isCurrentDay(year: number, month: number, day: number): boolean
  function isCurrentDay(yearNum: number, monthNum: number, dayNum: number): boolean {
    return yearNum === currentYear && monthNum === currentMonth && dayNum === currentDay;
  }

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    financeExpandedYears.update(state => ({ ...state, [yearId]: !state[yearId] }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    financeExpandedMonths.update(state => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    financeExpandedWeeks.update(state => ({ ...state, [key]: !state[key] }));
  }

  // extractStarredWords(week: FinanceWeek): string[]
  function extractStarredWords(week: any): string[] {
    const starredWords: string[] = [];
    if (week.days) {
      for (const day of week.days) {
        for (const entry of day.entries) {
          if (entry.description) {
            // Find all words that start with *
            const words = entry.description.split(/\s+/);
            for (const word of words) {
              if (word.startsWith('*') && word.length > 1) {
                // Remove the * and add to list if not already present
                const cleanWord = word.substring(1);
                if (!starredWords.includes(cleanWord)) {
                  starredWords.push(cleanWord);
                }
              }
            }
          }
        }
      }
    }
    return starredWords;
  }
</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Finance</h1>
</div>

<!-- Empty state -->
{#if $financeData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $financeData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleYear(year.id)}
        >
          {$financeExpandedYears[year.id] ? '▼' : '▶'}
        </button>
        
        <div class="flex-1 text-white text-3xl font-semibold">
          {year.year}
        </div>
        
        <div class="text-white text-2xl font-semibold">
          {formatCurrency(calculateYearTotal(year))}
        </div>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $financeExpandedYears[year.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each year.months as month (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleMonth(monthKey)}
              >
                {$financeExpandedMonths[monthKey] ? '▼' : '▶'}
              </button>
              
              <div class="text-white text-3xl font-semibold">
                {getMonthName(month.monthNumber)}
              </div>
              
              <!-- Spacer to push fields to center -->
              <div class="flex-1"></div>
              
              <!-- Disc Amount -->
              <div class="flex items-center gap-1">
                <label class="text-white text-xl">Disc $</label>
                <input
                  type="text"
                  class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  maxlength="5"
                  value={month.discAmount || ''}
                  on:input={(e) => updateFinanceMonthAmount(year.id, month.id, 'discAmount', (e.target as HTMLInputElement).value)}
                />
              </div>
              
              <!-- Disc Interest Amount -->
              <div class="flex items-center gap-1">
                <label class="text-white text-xl">Int $</label>
                <input
                  type="text"
                  class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-12"
                  maxlength="2"
                  value={month.discIntAmount || ''}
                  on:input={(e) => updateFinanceMonthAmount(year.id, month.id, 'discIntAmount', (e.target as HTMLInputElement).value)}
                />
              </div>
              
              <!-- AmerX Amount -->
              <div class="flex items-center gap-1">
                <label class="text-white text-xl">AmerX $</label>
                <input
                  type="text"
                  class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  maxlength="5"
                  value={month.amerXAmount || ''}
                  on:input={(e) => updateFinanceMonthAmount(year.id, month.id, 'amerXAmount', (e.target as HTMLInputElement).value)}
                />
              </div>
              
              <!-- AmerX Interest Amount -->
              <div class="flex items-center gap-1">
                <label class="text-white text-xl">Int $</label>
                <input
                  type="text"
                  class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-12"
                  maxlength="2"
                  value={month.amerXIntAmount || ''}
                  on:input={(e) => updateFinanceMonthAmount(year.id, month.id, 'amerXIntAmount', (e.target as HTMLInputElement).value)}
                />
              </div>
              
              <!-- Food Total (calculated, read-only) -->
              <div class="flex items-center gap-1 ml-8">
                <label class="text-red-500 text-xl font-semibold">Food $</label>
                <div class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20">
                  {calculateMonthFoodTotal(month).toFixed(2)}
                </div>
              </div>
              
              <!-- Gas Total (calculated, read-only) -->
              <div class="flex items-center gap-1">
                <label class="text-red-500 text-xl font-semibold">Gas $</label>
                <div class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20">
                  {calculateMonthGasTotal(month).toFixed(2)}
                </div>
              </div>
              
              <!-- Spacer to push total amount to the right -->
              <div class="flex-1"></div>
              
              <div class="text-white text-2xl font-semibold">
                {formatCurrency(calculateMonthTotal(month))}
              </div>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $financeExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const starredWords = extractStarredWords(week)}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleWeek(weekKey)}
                    >
                      {$financeExpandedWeeks[weekKey] ? '▼' : '▶'}
                    </button>
                    
                    <div class="text-white text-3xl font-semibold">
                      {week.weekNumber} Week {week.startDay}-{week.endDay}
                    </div>
                    
                    <!-- Starred words from day descriptions -->
                    {#if starredWords.length > 0}
                      <div class="flex-1 flex justify-center gap-3">
                        {#each starredWords as word}
                          <span class="text-green-500 text-2xl font-semibold">{word}</span>
                        {/each}
                      </div>
                    {:else}
                      <div class="flex-1"></div>
                    {/if}
                    
                    <div class="text-white text-2xl font-semibold">
                      {formatCurrency(calculateWeekTotal(week))}
                    </div>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $financeExpandedWeeks[weekKey] && week.days}
                    <div class="mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        <div class="bg-white/5 rounded-lg p-3 {isCurrentDay(year.year, month.monthNumber, day.dayNumber) ? 'border-2 border-green-500' : ''}">
                          <!-- Day entries -->
                          {#each day.entries as entry, entryIndex (entry.id)}
                            <div class="flex items-center gap-2 mb-2">
                              <!-- Day label (only show on first entry) -->
                              {#if entryIndex === 0}
                                <div class="text-white text-2xl font-semibold w-32">
                                  {day.dayNumber} {day.dayOfWeek}
                                </div>
                              {:else}
                                <div class="w-32"></div>
                              {/if}
                              
                              <!-- + amount -->
                              <label class="text-white text-xl w-4">+</label>
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-24"
                                placeholder="0"
                                value={entry.addAmount}
                                on:input={(e) => updateFinanceEntry(year.id, month.id, week.id, day.id, entry.id, 'addAmount', (e.target as HTMLInputElement).value)}
                              />
                              
                              <!-- - amount -->
                              <label class="text-white text-xl w-4 ml-2">-</label>
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-24"
                                placeholder="0"
                                value={entry.subAmount}
                                on:input={(e) => updateFinanceEntry(year.id, month.id, week.id, day.id, entry.id, 'subAmount', (e.target as HTMLInputElement).value)}
                              />
                              
                              <!-- Description -->
                              <input
                                type="text"
                                class="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-xl"
                                placeholder="Description..."
                                value={entry.description}
                                on:input={(e) => updateFinanceEntry(year.id, month.id, week.id, day.id, entry.id, 'description', (e.target as HTMLInputElement).value)}
                              />
                              
                              <!-- + button (first entry) or Delete button (additional entries) -->
                              {#if entryIndex === 0}
                                <button 
                                  class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-lg"
                                  on:click={() => addFinanceEntry(year.id, month.id, week.id, day.id)}
                                >
                                  +
                                </button>
                              {:else}
                                <button 
                                  class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                  on:click={() => deleteFinanceEntry(year.id, month.id, week.id, day.id, entry.id)}
                                >
                                  Del
                                </button>
                              {/if}
                            </div>
                          {/each}
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

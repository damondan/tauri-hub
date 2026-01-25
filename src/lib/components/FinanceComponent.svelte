<!-- src/lib/components/FinanceComponent.svelte -->
<script lang="ts">
  import {
    financeData,
    addFinanceYear,
    deleteFinanceYear,
    addFinanceMonth,
    addFinanceWeek,
    updateFinanceDayData,
    getMonthName,
    financeExpandedYears,
    financeExpandedMonths,
    financeExpandedWeeks
  } from '$lib/stores/general';

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
</script>

<!-- Header with Add button -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Finance</h1>
  <button 
    on:click={() => addFinanceYear()}
    class="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
  >
    +
  </button>
</div>

<!-- Empty state -->
{#if $financeData.length === 0}
  <div class="text-white/70 italic">No years yet. Click + to add a year.</div>
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
        
        <button 
          class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
          on:click={() => addFinanceMonth(year.id)}
        >
          +
        </button>
        
        <button 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg"
          on:click={() => deleteFinanceYear(year.id)}
        >
          Delete
        </button>
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
              
              <div class="flex-1 text-white text-3xl font-semibold">
                {getMonthName(month.monthNumber)}
              </div>
              
              <button 
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                on:click={() => addFinanceWeek(year.id, month.id)}
              >
                +
              </button>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $financeExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleWeek(weekKey)}
                    >
                      {$financeExpandedWeeks[weekKey] ? '▼' : '▶'}
                    </button>
                    
                    <div class="flex-1 text-white text-3xl font-semibold">
                      Week {week.weekNumber}
                    </div>
                  </div>

                  <!-- Weekday Text Areas (only show when week expanded) -->
                  {#if $financeExpandedWeeks[weekKey]}
                    <div class="mt-3 space-y-2">
                      <!-- Monday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Mon</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Monday..."
                          value={week.dayData.mon}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'mon', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Tuesday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Tues</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Tuesday..."
                          value={week.dayData.tues}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'tues', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Wednesday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Wed</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Wednesday..."
                          value={week.dayData.wed}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'wed', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Thursday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Thurs</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Thursday..."
                          value={week.dayData.thurs}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'thurs', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Friday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Fri</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Friday..."
                          value={week.dayData.fri}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'fri', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Saturday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Sat</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Saturday..."
                          value={week.dayData.sat}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'sat', (e.target as HTMLTextAreaElement).value)}
                        />
                      </div>

                      <!-- Sunday -->
                      <div class="flex items-start gap-3 bg-white/5 rounded-lg p-2">
                        <label class="text-white text-3xl font-semibold w-20">Sun</label>
                        <textarea
                          class="flex-1 bg-transparent border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40 min-h-[80px]"
                          placeholder="Sunday..."
                          value={week.dayData.sun}
                          on:input={(e) => updateFinanceDayData(year.id, month.id, week.id, 'sun', (e.target as HTMLTextAreaElement).value)}
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

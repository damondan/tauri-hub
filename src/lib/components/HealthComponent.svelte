<!-- src/lib/components/HealthComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMonthName } from '$lib/stores/general'
  import {
    healthData,
    generateHealthStructureToDate,
    addHealthEntry,
    deleteHealthEntry,
    updateHealthEntry,
    updateHealthYearGoal,
    updateHealthMonthGoal,
    updateHealthMonthFoodGoals,
    updateHealthMonthTVGoals,
    updateHealthMonthSleepGoals,
    updateHealthWeekFoodGoals,
    updateHealthWeekTVGoals,
    updateHealthWeekSleepGoals,
    updateHealthDayFoodGoals,
    updateHealthDayTVGoals,
    updateHealthDaySleepGoals,
    toggleHealthDayFoodCompleted,
    toggleHealthDayTVCompleted,
    toggleHealthDaySleepCompleted,
    healthExpandedYears,
    healthExpandedMonths,
    healthExpandedWeeks
  } from '$lib/stores/health';

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();
  
  // Dialog state
  let showFoodDialog = $state(false);
  let pendingFoodAction = $state<{yearId: string, monthId: string, weekId: string, dayId: string} | null>(null);
  let showTVDialog = $state(false);
  let pendingTVAction = $state<{yearId: string, monthId: string, weekId: string, dayId: string} | null>(null);
  let showSleepDialog = $state(false);
  let pendingSleepAction = $state<{yearId: string, monthId: string, weekId: string, dayId: string} | null>(null);

  // onMount(): void
  onMount(() => {
    // Only regenerate if data is empty or has old structure
    const today = new Date();
    const currentData = $healthData;
    
    // Check if we need to regenerate (empty or old structure without days array)
    const needsRegeneration = currentData.length === 0 || 
      (currentData[0]?.months?.[0]?.weeks?.[0] && !currentData[0].months[0].weeks[0].days);
    
    if (needsRegeneration) {
      healthData.set([]);
    }
    
    generateHealthStructureToDate(today);
  });

  // isCurrentDay(year: number, month: number, day: number): boolean
  function isCurrentDay(yearNum: number, monthNum: number, dayNum: number): boolean {
    return yearNum === currentYear && monthNum === currentMonth && dayNum === currentDay;
  }

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    healthExpandedYears.update(state => ({ ...state, [yearId]: !state[yearId] }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    healthExpandedMonths.update(state => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    healthExpandedWeeks.update(state => ({ ...state, [key]: !state[key] }));
  }

  // Auto-resize textarea based on content
  function autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-4xl font-bold text-white">Health</h1>
</div>

<!-- Empty state -->
{#if $healthData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $healthData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleYear(year.id)}
        >
          {$healthExpandedYears[year.id] ? '▼' : '▶'}
        </button>
        
        <div class="text-white text-3xl font-semibold">
          {year.year}
        </div>
        
        <!-- Year Health Goal Textarea -->
        <textarea
          class="flex-1 bg-transparent border-0 px-20 py-1 text-white text-3xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Year health goals..."
          rows="1"
          value={year.yearHealthGoal || ''}
          on:input={(e) => updateHealthYearGoal(year.id, (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $healthExpandedYears[year.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each year.months as month (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleMonth(monthKey)}
              >
                {$healthExpandedMonths[monthKey] ? '▼' : '▶'}
              </button>
              
              <div class="text-white text-3xl font-semibold">
                {getMonthName(month.monthNumber)}
              </div>
              
              <!-- Food -->
              <label class="text-red-500 text-xl font-semibold">Food</label>
              <textarea
                class="flex-1 bg-white/10 border border-red-500 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden"
                placeholder="Food goals..."
                rows="1"
                value={month.monthFoodGoals || ''}
                on:input={(e) => { autoResize(e); updateHealthMonthFoodGoals(year.id, month.id, (e.target as HTMLTextAreaElement).value); }}
              ></textarea>
              
              <!-- TV -->
              <label class="text-blue-500 text-xl font-semibold">TV</label>
              <textarea
                class="flex-1 bg-white/10 border border-blue-500 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden"
                placeholder="TV goals..."
                rows="1"
                value={month.monthTVGoals || ''}
                on:input={(e) => { autoResize(e); updateHealthMonthTVGoals(year.id, month.id, (e.target as HTMLTextAreaElement).value); }}
              ></textarea>
              
              <!-- Sleep -->
              <label class="text-purple-500 text-xl font-semibold">Sleep</label>
              <textarea
                class="flex-1 bg-white/10 border border-purple-500 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden"
                placeholder="Sleep goals..."
                rows="1"
                value={month.monthSleepGoals || ''}
                on:input={(e) => { autoResize(e); updateHealthMonthSleepGoals(year.id, month.id, (e.target as HTMLTextAreaElement).value); }}
              ></textarea>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $healthExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const allFoodCompleted = week.days && week.days.length > 0 && week.days.every(d => d.foodCompleted)}
                {@const allTVCompleted = week.days && week.days.length > 0 && week.days.every(d => d.tvCompleted)}
                {@const allSleepCompleted = week.days && week.days.length > 0 && week.days.every(d => d.sleepCompleted)}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleWeek(weekKey)}
                    >
                      {$healthExpandedWeeks[weekKey] ? '▼' : '▶'}
                    </button>
                    
                    <div class="text-white text-3xl font-semibold w-54">
                      {week.weekNumber} Week {week.startDay}-{week.endDay}
                    </div>
                    
                    <!-- Food -->
                    <label class="text-red-500 text-xl font-semibold">Food</label>
                    <textarea
                      class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {allFoodCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'border border-red-500'}"
                      placeholder="Food goals..."
                      rows="1"
                      value={week.weekFoodGoals || ''}
                      on:input={(e) => { autoResize(e); updateHealthWeekFoodGoals(year.id, month.id, week.id, (e.target as HTMLTextAreaElement).value); }}
                    ></textarea>
                    
                    <!-- TV -->
                    <label class="text-blue-500 text-xl font-semibold">TV</label>
                    <textarea
                      class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {allTVCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'border border-blue-500'}"
                      placeholder="TV goals..."
                      rows="1"
                      value={week.weekTVGoals || ''}
                      on:input={(e) => { autoResize(e); updateHealthWeekTVGoals(year.id, month.id, week.id, (e.target as HTMLTextAreaElement).value); }}
                    ></textarea>
                    
                    <!-- Sleep -->
                    <label class="text-purple-500 text-xl font-semibold">Sleep</label>
                    <textarea
                      class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {allSleepCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'border border-purple-500'}"
                      placeholder="Sleep goals..."
                      rows="1"
                      value={week.weekSleepGoals || ''}
                      on:input={(e) => { autoResize(e); updateHealthWeekSleepGoals(year.id, month.id, week.id, (e.target as HTMLTextAreaElement).value); }}
                    ></textarea>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $healthExpandedWeeks[weekKey] && week.days}
                    <div class="ml-12 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        <div class="bg-white/5 rounded-lg p-3 {isCurrentDay(year.year, month.monthNumber, day.dayNumber) ? 'border-2 border-green-500' : ''}">
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div class="text-white text-2xl font-semibold whitespace-nowrap w-68">
                              {day.dayNumber} {day.dayOfWeek}
                            </div>
                            
                            <!-- Food -->
                            <label class="text-red-500 text-xl font-semibold whitespace-nowrap">Food</label>
                            <textarea
                              class="bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden w-84 {day.foodCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'border border-red-500'}"
                              placeholder="What did you eat ?"
                              rows="1"
                              value={day.dayFoodGoals || ''}
                              on:input={(e) => { autoResize(e); updateHealthDayFoodGoals(year.id, month.id, week.id, day.id, (e.target as HTMLTextAreaElement).value); }}
                            ></textarea>
                            <button 
                              class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.foodCompleted ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'border-red-500'}" 
                              on:click={() => {
                                if (!day.foodCompleted && !day.foodRejected) {
                                  pendingFoodAction = {yearId: year.id, monthId: month.id, weekId: week.id, dayId: day.id};
                                  showFoodDialog = true;
                                } else {
                                  toggleHealthDayFoodCompleted(year.id, month.id, week.id, day.id);
                                }
                              }}
                            >
                              {#if day.foodCompleted}
                                👑
                              {:else if day.foodRejected}
                                <span class="text-red-500 text-xl font-bold">✗</span>
                              {:else}
                                <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                              {/if}
                            </button>
                            
                            <!-- TV -->
                            <label class="text-blue-500 text-xl font-semibold whitespace-nowrap">TV</label>
                            <textarea
                              class="bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden w-84 {day.tvCompleted ? 'border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'border border-blue-500'}"
                              placeholder="How much TV ?"
                              rows="1"
                              value={day.dayTVGoals || ''}
                              on:input={(e) => { autoResize(e); updateHealthDayTVGoals(year.id, month.id, week.id, day.id, (e.target as HTMLTextAreaElement).value); }}
                            ></textarea>
                            <button 
                              class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.tvCompleted ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'border-red-500'}" 
                              on:click={() => {
                                if (!day.tvCompleted && !day.tvRejected) {
                                  pendingTVAction = {yearId: year.id, monthId: month.id, weekId: week.id, dayId: day.id};
                                  showTVDialog = true;
                                } else {
                                  toggleHealthDayTVCompleted(year.id, month.id, week.id, day.id);
                                }
                              }}
                            >
                              {#if day.tvCompleted}
                                👑
                              {:else if day.tvRejected}
                                <span class="text-red-500 text-xl font-bold">✗</span>
                              {:else}
                                <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                              {/if}
                            </button>
                            
                            <!-- Sleep -->
                            <label class="text-purple-500 text-xl font-semibold whitespace-nowrap">Sleep</label>
                            <textarea
                              class="bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden w-84 {day.sleepCompleted ? 'border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'border border-purple-500'}"
                              placeholder="Approx. Sleep time ?"
                              rows="1"
                              value={day.daySleepGoals || ''}
                              on:input={(e) => { autoResize(e); updateHealthDaySleepGoals(year.id, month.id, week.id, day.id, (e.target as HTMLTextAreaElement).value); }}
                            ></textarea>
                            <button 
                              class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.sleepCompleted ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'border-red-500'}" 
                              on:click={() => {
                                if (!day.sleepCompleted && !day.sleepRejected) {
                                  pendingSleepAction = {yearId: year.id, monthId: month.id, weekId: week.id, dayId: day.id};
                                  showSleepDialog = true;
                                } else {
                                  toggleHealthDaySleepCompleted(year.id, month.id, week.id, day.id);
                                }
                              }}
                            >
                              {#if day.sleepCompleted}
                                👑
                              {:else if day.sleepRejected}
                                <span class="text-red-500 text-xl font-bold">✗</span>
                              {:else}
                                <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                              {/if}
                            </button>
                          </div>
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

<!-- Custom Food Dialog -->
{#if showFoodDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showFoodDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Food Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you honor your monthly and/or weekly Food goal?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showFoodDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingFoodAction) {
              toggleHealthDayFoodCompleted(pendingFoodAction.yearId, pendingFoodAction.monthId, pendingFoodAction.weekId, pendingFoodAction.dayId, false);
              pendingFoodAction = null;
            }
            showFoodDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingFoodAction) {
              toggleHealthDayFoodCompleted(pendingFoodAction.yearId, pendingFoodAction.monthId, pendingFoodAction.weekId, pendingFoodAction.dayId, true);
              pendingFoodAction = null;
            }
            showFoodDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom TV Dialog -->
{#if showTVDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showTVDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">TV Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you honor your monthly and/or weekly TV goal?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showTVDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingTVAction) {
              toggleHealthDayTVCompleted(pendingTVAction.yearId, pendingTVAction.monthId, pendingTVAction.weekId, pendingTVAction.dayId, false);
              pendingTVAction = null;
            }
            showTVDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingTVAction) {
              toggleHealthDayTVCompleted(pendingTVAction.yearId, pendingTVAction.monthId, pendingTVAction.weekId, pendingTVAction.dayId, true);
              pendingTVAction = null;
            }
            showTVDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Sleep Dialog -->
{#if showSleepDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showSleepDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Sleep Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you honor your monthly and/or weekly Sleep goal?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showSleepDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingSleepAction) {
              toggleHealthDaySleepCompleted(pendingSleepAction.yearId, pendingSleepAction.monthId, pendingSleepAction.weekId, pendingSleepAction.dayId, false);
              pendingSleepAction = null;
            }
            showSleepDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingSleepAction) {
              toggleHealthDaySleepCompleted(pendingSleepAction.yearId, pendingSleepAction.monthId, pendingSleepAction.weekId, pendingSleepAction.dayId, true);
              pendingSleepAction = null;
            }
            showSleepDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

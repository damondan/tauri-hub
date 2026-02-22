<!-- src/lib/components/GoalComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMonthName } from '$lib/stores/general'
  import {
    goalData,
    generateGoalStructureToDate,
    addHealthEntry,
    deleteHealthEntry,
    updateHealthEntry,
    updateHealthYearGoal,
    updateYearPrivateGoal,
    updateYearProfessionalGoal,
    updateHealthMonthGoal,
    updateMonthPrivateGoals,
    updateMonthProfessionalGoals,
    updateWeekPrivateGoals,
    updateWeekProfessionalGoals,
    updateDayPrivateGoals,
    updateDayProfessionalGoals,
    toggleDayPrivateCompleted,
    toggleDayProfessionalCompleted,
    toggleWeekPrivateCompleted,
    toggleWeekProfessionalCompleted,
    toggleMonthPrivateCompleted,
    toggleMonthProfessionalCompleted,
    goalExpandedYears,
    goalExpandedMonths,
    goalExpandedWeeks
  } from '$lib/stores/goal';

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();
  
  // Dialog state
  let showPrivateDayDialog = $state(false);
  let pendingPrivateDayAction = $state<{yearId: string, monthId: string, weekId: string, dayId: string} | null>(null);
  let showProfessionalDayDialog = $state(false);
  let pendingProfessionalDayAction = $state<{yearId: string, monthId: string, weekId: string, dayId: string} | null>(null);
  let showPrivateWeekDialog = $state(false);
  let pendingPrivateWeekAction = $state<{yearId: string, monthId: string, weekId: string} | null>(null);
  let showProfessionalWeekDialog = $state(false);
  let pendingProfessionalWeekAction = $state<{yearId: string, monthId: string, weekId: string} | null>(null);
  let showPrivateMonthDialog = $state(false);
  let pendingPrivateMonthAction = $state<{yearId: string, monthId: string} | null>(null);
  let showProfessionalMonthDialog = $state(false);
  let pendingProfessionalMonthAction = $state<{yearId: string, monthId: string} | null>(null);
  let showPrivateGoalDialog = $state(false);
  let showProfessionalGoalDialog = $state(false);
  let pendingPrivateGoalChange = $state<{yearId: string, value: string, changeCount: number} | null>(null);
  let pendingProfessionalGoalChange = $state<{yearId: string, value: string, changeCount: number} | null>(null);

  // onMount(): void
  onMount(() => {
    const today = new Date();
    // Always generate structure to ensure current date data exists
    generateGoalStructureToDate(today);
  });

  // isCurrentDay(year: number, month: number, day: number): boolean
  function isCurrentDay(yearNum: number, monthNum: number, dayNum: number): boolean {
    return yearNum === currentYear && monthNum === currentMonth && dayNum === currentDay;
  }

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    goalExpandedYears.update(state => ({ ...state, [yearId]: !state[yearId] }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    goalExpandedMonths.update(state => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    goalExpandedWeeks.update(state => ({ ...state, [key]: !state[key] }));
  }

  // Auto-resize textarea based on content
  function autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  // handlePrivateGoalClick(yearId: string, currentValue: string, changeCount: number): void
  function handlePrivateGoalClick(yearId: string, currentValue: string, changeCount: number) {
    pendingPrivateGoalChange = { yearId, value: currentValue, changeCount };
    showPrivateGoalDialog = true;
  }

  // handleProfessionalGoalClick(yearId: string, currentValue: string, changeCount: number): void
  function handleProfessionalGoalClick(yearId: string, currentValue: string, changeCount: number) {
    pendingProfessionalGoalChange = { yearId, value: currentValue, changeCount };
    showProfessionalGoalDialog = true;
  }
</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-3xl font-bold text-white">Goals</h1>
</div>

<!-- Empty state -->
{#if $goalData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $goalData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button 
          class="text-white text-3xl w-6"
          on:click={() => toggleYear(year.id)}
        >
          {$goalExpandedYears[year.id] ? '▼' : '▶'}
        </button>
        
        <div class="text-white text-3xl font-semibold">
          {year.year}
        </div>
      
        <!-- Yrly Priv. Goal -->
        <label class="text-purple-500 text-2xl font-semibold whitespace-nowrap">Yrly Priv. Goal</label>
        <textarea
          class="flex-1 bg-transparent border-0 px-5 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Private Goal"
          rows="1"
          readonly
          value={year.yearPrivateGoal || ''}
          on:click={() => handlePrivateGoalClick(year.id, year.yearPrivateGoal || '', year.yearPrivateGoalChangeCount)}
        ></textarea>
        
        <!-- Yrly Prof. Goal -->
        <label class="text-blue-500 text-2xl font-semibold whitespace-nowrap">Yrly Prof. Goal</label>
        <textarea
          class="flex-1 bg-transparent border-0 px-20 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Professional Goal"
          rows="1"
          readonly
          value={year.yearProfessionalGoal || ''}
          on:click={() => handleProfessionalGoalClick(year.id, year.yearProfessionalGoal || '', year.yearProfessionalGoalChangeCount)}
        ></textarea>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $goalExpandedYears[year.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each year.months as month (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          {@const monthBothCompleted = month.priGoalCompleted && month.proGoalCompleted}
          {@const monthBothRejected = month.priGoalRejected && month.proGoalRejected}
          {@const monthMixed = (month.priGoalCompleted || month.priGoalRejected) && 
          (month.proGoalCompleted || 
          month.proGoalRejected) && !monthBothCompleted && !monthBothRejected}
          {@const monthBorderColor = monthBothCompleted ? `border-2 border-yellow-500 
          shadow-[0_0_15px_rgba(234,179,8,0.8)]` : monthBothRejected ? `border-2 
          border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]` : monthMixed ? 
          `border-2 border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.8)]` : ''}
          <div class="bg-white/10 rounded-xl p-3 {monthBorderColor}">
            <div class="flex items-center gap-3">
              <button 
                class="text-white text-3xl w-6"
                on:click={() => toggleMonth(monthKey)}
              >
                {$goalExpandedMonths[monthKey] ? '▼' : '▶'}
              </button>
              
              <div class="text-white text-3xl font-semibold">
                {getMonthName(month.monthNumber)}
              </div>
              
              <!--Monthly Private Goals -->
              <label class="text-purple-500 text-xl font-semibold">Private</label>
              <textarea
                class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {month.priGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : month.priGoalRejected ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'border border-purple-500'}"
                placeholder="Private goals..."
                rows="1"
                value={month.monthPrivateGoals || ''}
                on:input={(e) => { autoResize(e); updateMonthPrivateGoals(year.id, month.id, (e.target as HTMLTextAreaElement).value); }}
              ></textarea>
              <button 
                class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {month.priGoalCompleted ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : month.priGoalRejected ? '' : 'border-pink-500'}"
                on:click={() => {
                  if (!month.priGoalCompleted && !month.priGoalRejected) {
                    pendingPrivateMonthAction = {yearId: year.id, monthId: month.id};
                    showPrivateMonthDialog = true;
                  } else {
                    toggleMonthPrivateCompleted(year.id, month.id);
                  }
                }}
              >
                {#if month.priGoalCompleted}
                  <span class="text-yellow-500 text-3xl font-bold">👑</span>
                {:else if month.priGoalRejected}
                  <span class="text-red-500 text-3xl font-bold">💩</span>
                {:else}
                  <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                {/if}
              </button>
              
              <!--Professional Monthly -->
              <label class="text-blue-500 text-xl font-semibold">Professional</label>
              <textarea
                class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {month.proGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : month.proGoalRejected ? '' : 'border border-blue-500'}"
                placeholder="Professional goals..."
                rows="1"
                value={month.monthProfessionalGoals || ''}
                on:input={(e) => { autoResize(e); updateMonthProfessionalGoals(year.id, month.id, (e.target as HTMLTextAreaElement).value); }}
              ></textarea>
              <button 
                class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {month.proGoalCompleted ? 'shadow-[0_0_15px_rgba(234,179,8,0.8)]' : month.proGoalRejected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'border-red-500'}"
                on:click={() => {
                  if (!month.proGoalCompleted && !month.proGoalRejected) {
                    pendingProfessionalMonthAction = {yearId: year.id, monthId: month.id};
                    showProfessionalMonthDialog = true;
                  } else {
                    toggleMonthProfessionalCompleted(year.id, month.id);
                  }
                }}
              >
                {#if month.proGoalCompleted}
                  <span class="text-yellow-500 text-3xl font-bold">👑</span>
                {:else if month.proGoalRejected}
                  <span class="text-red-500 text-3xl font-bold">💩</span>
                {:else}
                  <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                {/if}
              </button>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $goalExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const weekBothCompleted = week.priGoalCompleted && week.proGoalCompleted}
                {@const weekBothRejected = week.priGoalRejected && week.proGoalRejected}
                {@const weekMixed = (week.priGoalCompleted || week.priGoalRejected) && (week.proGoalCompleted || week.proGoalRejected) && !weekBothCompleted && !weekBothRejected}
                {@const weekBorderColor = weekBothCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : weekBothRejected ? '' : weekMixed ? 'border-2 border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.8)]' : ''}
                <div class="rounded-xl p-3 {weekBorderColor}">
                  <div class="flex items-center gap-3">
                    <button 
                      class="text-white text-3xl w-6"
                      on:click={() => toggleWeek(weekKey)}
                    >
                      {$goalExpandedWeeks[weekKey] ? '▼' : '▶'}
                    </button>
                    
                    <div class="text-white text-3xl font-semibold w-54">
                      {week.weekNumber} Week {week.startDay}-{week.endDay}
                    </div>
                    
                    <!-- Private Wkly -->
                    <label class="text-purple-500 text-xl font-semibold">Private</label>
                    <textarea
                      class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {week.priGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : week.priGoalRejected ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'border border-purple-500'}"
                      placeholder="Private goals..."
                      rows="1"
                      value={week.weekPrivateGoals || ''}
                      on:input={(e) => { autoResize(e); updateWeekPrivateGoals(year.id, month.id, week.id, (e.target as HTMLTextAreaElement).value); }}
                    ></textarea>
                    <button 
                      class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {week.priGoalCompleted ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : week.priGoalRejected ? '' : 'border-pink-500'}"
                      on:click={() => {
                        if (!week.priGoalCompleted && !week.priGoalRejected) {
                          pendingPrivateWeekAction = {yearId: year.id, monthId: month.id, weekId: week.id};
                          showPrivateWeekDialog = true;
                        } else {
                          toggleWeekPrivateCompleted(year.id, month.id, week.id);
                        }
                      }}
                    >
                      {#if week.priGoalCompleted}
                        <span class="text-yellow-500 text-3xl font-bold">👑</span>
                      {:else if week.priGoalRejected}
                        <span class="text-pink-500 text-3xl font-bold">💩</span>
                      {:else}
                        <span class="w-4 h-4 rounded-full bg-pink-500 inline-block"></span>
                      {/if}
                    </button>
                    
                    <!-- Professional -->
                    <label class="text-blue-500 text-xl font-semibold">Professional</label>
                    <textarea
                      class="flex-1 bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden {week.proGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : week.proGoalRejected ? '' : 'border border-blue-500'}"
                      placeholder="Professional goals..."
                      rows="1"
                      value={week.weekProfessionalGoals || ''}
                      on:input={(e) => { autoResize(e); updateWeekProfessionalGoals(year.id, month.id, week.id, (e.target as HTMLTextAreaElement).value); }}
                    ></textarea>
                    <button 
                      class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {week.proGoalCompleted ? 'shadow-[0_0_15px_rgba(234,179,8,0.8)]' : week.proGoalRejected ? '' : 'border-red-500'}"
                      on:click={() => {
                        if (!week.proGoalCompleted && !week.proGoalRejected) {
                          pendingProfessionalWeekAction = {yearId: year.id, monthId: month.id, weekId: week.id};
                          showProfessionalWeekDialog = true;
                        } else {
                          toggleWeekProfessionalCompleted(year.id, month.id, week.id);
                        }
                      }}
                    >
                      {#if week.proGoalCompleted}
                        <span class="text-yellow-500 text-3xl font-bold">👑</span>
                      {:else if week.proGoalRejected}
                        <span class="text-red-500 text-3xl font-bold">💩</span>
                      {:else}
                        <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                      {/if}
                    </button>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $goalExpandedWeeks[weekKey] && week.days}
                    <div class="ml-12 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        {@const bothCompleted = day.priGoalCompleted && day.proGoalCompleted}
                        {@const bothRejected = day.priGoalRejected && day.proGoalRejected}
                        {@const mixed = (day.priGoalCompleted || day.priGoalRejected) && (day.proGoalCompleted || day.proGoalRejected) && !bothCompleted && !bothRejected}
                        {@const dayBorderColor = bothCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : bothRejected ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]' : mixed ? 'border-2 border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.8)]' : isCurrentDay(year.year, month.monthNumber, day.dayNumber) ? 'border-2 border-green-500' : ''}
                        <div class="rounded-lg p-3 {dayBorderColor}">
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div class="text-white text-2xl font-semibold whitespace-nowrap w-58">
                              {day.dayNumber} {day.dayOfWeek}
                            </div>
                            
                            <!-- Private Daily -->
                            <label class="text-purple-500 text-xl font-semibold whitespace-nowrap">Private</label>
                            <textarea
                              class="bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden w-104 {day.priGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : day.priGoalRejected ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]' : 'border border-purple-500'}"
                              placeholder="Private goal"
                              rows="1"
                              value={day.dayPrivateGoals || ''}
                              on:input={(e) => { autoResize(e); updateDayPrivateGoals(year.id, month.id, week.id, day.id, (e.target as HTMLTextAreaElement).value); }}
                            ></textarea>
                            <button 
                              class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.priGoalCompleted ? 'shadow-[0_0_15px_rgba(234,179,8,0.8)]' : day.priGoalRejected ? '' : 'border-red-500'}"
                              on:click={() => {
                                if (!day.priGoalCompleted && !day.priGoalRejected) {
                                  pendingPrivateDayAction = {yearId: year.id, monthId: month.id, weekId: week.id, dayId: day.id};
                                  showPrivateDayDialog = true;
                                } else {
                                  toggleDayPrivateCompleted(year.id, month.id, week.id, day.id);
                                }
                              }}
                            >
                              {#if day.priGoalCompleted}
                                <span class="text-yellow-500 text-3xl font-bold">👑</span>
                              {:else if day.priGoalRejected}
                                <span class="text-red-500 text-3xl font-bold">💩</span>
                              {:else}
                                <span class="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
                              {/if}
                            </button>
                            
                            <!-- Professional -->
                            <label class="text-blue-500 text-xl font-semibold whitespace-nowrap">Professional</label>
                            <textarea
                              class="bg-white/10 rounded px-3 py-1 text-white text-xl resize-none overflow-hidden w-104 {day.proGoalCompleted ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : day.proGoalRejected ? 'border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]' : 'border border-blue-500'}"
                              placeholder="Professional goal"
                              rows="1"
                              value={day.dayProfessionalGoals || ''}
                              on:input={(e) => { autoResize(e); updateDayProfessionalGoals(year.id, month.id, week.id, day.id, (e.target as HTMLTextAreaElement).value); }}
                            ></textarea>
                            <button 
                              class="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.proGoalCompleted ? 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.8)]' : day.proGoalRejected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'border-red-500'}"
                              on:click={() => {
                                if (!day.proGoalCompleted && !day.proGoalRejected) {
                                  pendingProfessionalDayAction = {yearId: year.id, monthId: month.id, weekId: week.id, dayId: day.id};
                                  showProfessionalDayDialog = true;
                                } else {
                                  toggleDayProfessionalCompleted(year.id, month.id, week.id, day.id);
                                }
                              }}
                            >
                              {#if day.proGoalCompleted}
                                <span class="text-yellow-500 text-3xl font-bold">👑</span>
                              {:else if day.proGoalRejected}
                                <span class="text-red-500 text-3xl font-bold">💩</span>
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

<!-- Custom Private Day Dialog -->
{#if showPrivateDayDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showPrivateDayDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you honor your monthly and/or weekly Private goal?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showPrivateDayDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateDayAction) {
              toggleDayPrivateCompleted(pendingPrivateDayAction.yearId, pendingPrivateDayAction.monthId, pendingPrivateDayAction.weekId, pendingPrivateDayAction.dayId, false);
              pendingPrivateDayAction = null;
            }
            showPrivateDayDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateDayAction) {
              toggleDayPrivateCompleted(pendingPrivateDayAction.yearId, pendingPrivateDayAction.monthId, pendingPrivateDayAction.weekId, pendingPrivateDayAction.dayId, true);
              pendingPrivateDayAction = null;
            }
            showPrivateDayDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Day Dialog -->
{#if showProfessionalDayDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showProfessionalDayDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Professional Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you honor your monthly and/or weekly Professional goal?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showProfessionalDayDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(pendingProfessionalDayAction.yearId, pendingProfessionalDayAction.monthId, pendingProfessionalDayAction.weekId, pendingProfessionalDayAction.dayId, false);
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(pendingProfessionalDayAction.yearId, pendingProfessionalDayAction.monthId, pendingProfessionalDayAction.weekId, pendingProfessionalDayAction.dayId, true);
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Private Week Dialog -->
{#if showPrivateWeekDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showPrivateWeekDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you fulfill your Private goals for this week?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showPrivateWeekDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateWeekAction) {
              toggleWeekPrivateCompleted(pendingPrivateWeekAction.yearId, pendingPrivateWeekAction.monthId, pendingPrivateWeekAction.weekId, false);
              pendingPrivateWeekAction = null;
            }
            showPrivateWeekDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateWeekAction) {
              toggleWeekPrivateCompleted(pendingPrivateWeekAction.yearId, pendingPrivateWeekAction.monthId, pendingPrivateWeekAction.weekId, true);
              pendingPrivateWeekAction = null;
            }
            showPrivateWeekDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Week Dialog -->
{#if showProfessionalWeekDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showProfessionalWeekDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Professional Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you fulfill your Professional goals for this week?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showProfessionalWeekDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(pendingProfessionalWeekAction.yearId, pendingProfessionalWeekAction.monthId, pendingProfessionalWeekAction.weekId, false);
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(pendingProfessionalWeekAction.yearId, pendingProfessionalWeekAction.monthId, pendingProfessionalWeekAction.weekId, true);
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Private Month Dialog -->
{#if showPrivateMonthDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showPrivateMonthDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you fulfill your Private goals for this month?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showPrivateMonthDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateMonthAction) {
              toggleMonthPrivateCompleted(pendingPrivateMonthAction.yearId, pendingPrivateMonthAction.monthId, false);
              pendingPrivateMonthAction = null;
            }
            showPrivateMonthDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateMonthAction) {
              toggleMonthPrivateCompleted(pendingPrivateMonthAction.yearId, pendingPrivateMonthAction.monthId, true);
              pendingPrivateMonthAction = null;
            }
            showPrivateMonthDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Month Dialog -->
{#if showProfessionalMonthDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showProfessionalMonthDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Professional Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">Did you fulfill your Professional goals for this month?</p>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showProfessionalMonthDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(pendingProfessionalMonthAction.yearId, pendingProfessionalMonthAction.monthId, false);
              pendingProfessionalMonthAction = null;
            }
            showProfessionalMonthDialog = false;
          }}
        >
          No
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(pendingProfessionalMonthAction.yearId, pendingProfessionalMonthAction.monthId, true);
              pendingProfessionalMonthAction = null;
            }
            showProfessionalMonthDialog = false;
          }}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Private Goal Dialog -->
{#if showPrivateGoalDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showPrivateGoalDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-2xl" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Change Private Goal</h3>
      <p class="text-white/90 text-xl mb-4">Are you sure you want to change your private goal?</p>
      {#if pendingPrivateGoalChange && pendingPrivateGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">This is the {pendingPrivateGoalChange.changeCount}{pendingPrivateGoalChange.changeCount === 1 ? 'st' : pendingPrivateGoalChange.changeCount === 2 ? 'nd' : pendingPrivateGoalChange.changeCount === 3 ? 'rd' : 'th'} time you have changed it.</p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-green-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your private goal..."
        rows="3"
        bind:value={pendingPrivateGoalChange.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showPrivateGoalDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingPrivateGoalChange) {
              updateYearPrivateGoal(pendingPrivateGoalChange.yearId, pendingPrivateGoalChange.value);
              pendingPrivateGoalChange = null;
            }
            showPrivateGoalDialog = false;
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Professional Goal Dialog -->
{#if showProfessionalGoalDialog}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" on:click={() => showProfessionalGoalDialog = false}>
    <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-2xl" on:click|stopPropagation>
      <h3 class="text-white text-2xl font-semibold mb-4">Change Professional Goal</h3>
      <p class="text-white/90 text-xl mb-4">Are you sure you want to change your professional goal?</p>
      {#if pendingProfessionalGoalChange && pendingProfessionalGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">This is the {pendingProfessionalGoalChange.changeCount}{pendingProfessionalGoalChange.changeCount === 1 ? 'st' : pendingProfessionalGoalChange.changeCount === 2 ? 'nd' : pendingProfessionalGoalChange.changeCount === 3 ? 'rd' : 'th'} time you have changed it.</p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-yellow-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your professional goal..."
        rows="3"
        bind:value={pendingProfessionalGoalChange.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button 
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => showProfessionalGoalDialog = false}
        >
          Cancel
        </button>
        <button 
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          on:click={() => {
            if (pendingProfessionalGoalChange) {
              updateYearProfessionalGoal(pendingProfessionalGoalChange.yearId, pendingProfessionalGoalChange.value);
              pendingProfessionalGoalChange = null;
            }
            showProfessionalGoalDialog = false;
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { onMount } from "svelte";
  import { autoResize } from "$lib/utils/textareaResize";
  import { getMonthName } from "$lib/stores/general";
  import {
    persGoalData,
    generatePersGoalStructureToDate,
    addHealthEntry,
    deleteHealthEntry,
    updateHealthEntry,
    updateHealthYearGoal,
    updateYearPrivateGoal,
    updateHealthMonthGoal,
    updateMonthPrivateGoals,
    updateWeekPrivateGoals,
    updateDayPrivateGoals,
    updateDaySleepScreen,
    toggleDayScreenFollowed,
    toggleDayPrivateCompleted,
    toggleWeekPrivateCompleted,
    toggleMonthPrivateCompleted,
    persGoalExpandedYears,
    persGoalExpandedMonths,
    persGoalExpandedWeeks,
  } from "$lib/stores/persgoal";

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // Dialog state
  let showPrivateDayDialog = $state(false);
  let pendingPrivateDayAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
  } | null>(null);
  
  let showPrivateWeekDialog = $state(false);
  let pendingPrivateWeekAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
  } | null>(null);
 
  let showPrivateMonthDialog = $state(false);
  let pendingPrivateMonthAction = $state<{
    yearId: string;
    monthId: string;
  } | null>(null);
  
  let showScreenGoalDialog = $state(false);
  let pendingScreenGoalAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
  } | null>(null);
  let showPrivateGoalDialog = $state(false);
  let pendingPrivateGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null);
  
  // onMount(): void
  onMount(() => {
    const today = new Date();
    // Always generate structure to ensure current date data exists
    generatePersGoalStructureToDate(today);
  });

  // isCurrentDay(year: number, month: number, day: number): boolean
  function isCurrentDay(
    yearNum: number,
    monthNum: number,
    dayNum: number,
  ): boolean {
    return (
      yearNum === currentYear &&
      monthNum === currentMonth &&
      dayNum === currentDay
    );
  }

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    persGoalExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    persGoalExpandedMonths.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    persGoalExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // handlePrivateGoalClick(yearId: string, currentValue: string, changeCount: number): void
  function handlePrivateGoalClick(
    yearId: string,
    currentValue: string,
    changeCount: number,
  ) {
    pendingPrivateGoalChange = { yearId, value: currentValue, changeCount };
    showPrivateGoalDialog = true;
  }

</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-3xl font-bold text-white">Personal</h1>
</div>

<!-- Empty state -->
{#if $persGoalData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $persGoalData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleYear(year.id)}
        >
          {$persGoalExpandedYears[year.id] ? "▼" : "▶"}
        </button>

        <div class="text-white text-3xl font-semibold">
          {year.year}
        </div>

        <!-- Yrly Priv. Goal -->
        <label class="text-purple-500 text-2xl font-semibold whitespace-nowrap"
          ></label
        >
        <textarea
          class="flex-1 bg-transparent border-0 px-5 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Personal ... "
          rows="1"
          readonly
          value={year.yearPrivateGoal || ""}
          onclick={() =>
            handlePrivateGoalClick(
              year.id,
              year.yearPrivateGoal || "",
              year.yearPrivateGoalChangeCount,
            )}
        ></textarea>

      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $persGoalExpandedYears[year.id]}
      <div class="ml-12 mt-2 space-y-2">
        {#each year.months as month (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button
                class="text-white text-3xl w-6 shrink-0"
                onclick={() => toggleMonth(monthKey)}
              >
                {$persGoalExpandedMonths[monthKey] ? "▼" : "▶"}
              </button>

              <div class="text-white text-3xl font-semibold w-48 shrink-0">
                {getMonthName(month.monthNumber)}
              </div>
              <!--Monthly Private Goals -->
             
              <textarea
                class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden {month.priGoalCompleted
                  ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                  : month.priGoalRejected
                    ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                    : 'border border-purple-500'}"
                placeholder=""
                rows="1"
                value={month.monthPrivateGoals || ""}
                use:autoResize
                oninput={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  textarea.style.height = "auto";
                  textarea.style.height = textarea.scrollHeight + "px";
                  updateMonthPrivateGoals(
                    year.id,
                    month.id,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
              ></textarea>
              <button
                class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {month.priGoalCompleted
                  ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                  : month.priGoalRejected
                    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                    : 'border-red-500'}"
                onclick={() => {
                  if (!month.priGoalCompleted && !month.priGoalRejected) {
                    pendingPrivateMonthAction = {
                      yearId: year.id,
                      monthId: month.id,
                    };
                    showPrivateMonthDialog = true;
                  } else {
                    toggleMonthPrivateCompleted(year.id, month.id);
                  }
                }}
              >
                {#if month.priGoalCompleted}
                  <span class="text-yellow-500 text-3xl font-bold">🤴</span>
                {:else if month.priGoalRejected}
                  <span class="text-red-500 text-2xl font-bold">🤡</span>
                {:else}
                  <span class="w-4 h-4 rounded-full bg-red-500 inline-block"
                  ></span>
                {/if}
              </button>

             
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $persGoalExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
               
                <div class="rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleWeek(weekKey)}
                    >
                      {$persGoalExpandedWeeks[weekKey] ? "▼" : "▶"}
                    </button>

                    <div class="text-white text-3xl font-semibold w-54">
                      {week.weekNumber} Week {week.startDay}-{week.endDay}
                    </div>

                    <!-- Private Wkly -->
                    
                    <textarea
                      class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden {week.priGoalCompleted
                        ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                        : week.priGoalRejected
                          ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                          : 'border border-purple-500'}"
                      placeholder=""
                      rows="1"
                      value={week.weekPrivateGoals || ""}
                      use:autoResize
                      oninput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = "auto";
                        textarea.style.height = textarea.scrollHeight + "px";
                        updateWeekPrivateGoals(
                          year.id,
                          month.id,
                          week.id,
                          (e.target as HTMLTextAreaElement).value,
                        );
                      }}
                    ></textarea>
                    <button
                      class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {week.priGoalCompleted
                        ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                        : week.priGoalRejected
                          ? ''
                          : 'border-red-500'}"
                      onclick={() => {
                        if (!week.priGoalCompleted && !week.priGoalRejected) {
                          pendingPrivateWeekAction = {
                            yearId: year.id,
                            monthId: month.id,
                            weekId: week.id,
                          };
                          showPrivateWeekDialog = true;
                        } else {
                          toggleWeekPrivateCompleted(
                            year.id,
                            month.id,
                            week.id,
                          );
                        }
                      }}
                    >
                      {#if week.priGoalCompleted}
                        <span class="text-yellow-500 text-3xl font-bold"
                          >🤴</span
                        >
                      {:else if week.priGoalRejected}
                        <span class="text-red-500 text-2xl font-bold">🤡</span>
                      {:else}
                        <span
                          class="w-4 h-4 rounded-full bg-red-500 inline-block"
                        ></span>
                      {/if}
                    </button>

                    
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $persGoalExpandedWeeks[weekKey] && week.days}
                    <div class="ml-12 mt-3 space-y-3">
                     {#each week.days as day (day.id)}
                        <div class="rounded-lg p-3 bg-white/5">
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div
                              class="text-white text-2xl font-semibold whitespace-nowrap w-58"
                            >
                              {day.dayNumber}
                              {day.dayOfWeek}
                            </div>

                            <!-- Private Daily -->
                           
                            <textarea
                              class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden {day.priGoalCompleted
                                ? 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                                : day.priGoalRejected
                                  ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]'
                                  : 'border border-purple-500'}"
                              placeholder=""
                              rows="1"
                              value={day.dayPrivateGoals || ""}
                              use:autoResize
                              oninput={(e) => {
                                const textarea =
                                  e.target as HTMLTextAreaElement;
                                textarea.style.height = "auto";
                                textarea.style.height =
                                  textarea.scrollHeight + "px";
                                updateDayPrivateGoals(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  (e.target as HTMLTextAreaElement).value,
                                );
                              }}
                            ></textarea>
                            <button
                              class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.priGoalCompleted
                                ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                                : day.priGoalRejected
                                  ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                                  : 'border-red-500'}"
                              onclick={() => {
                                if (
                                  !day.priGoalCompleted &&
                                  !day.priGoalRejected
                                ) {
                                  pendingPrivateDayAction = {
                                    yearId: year.id,
                                    monthId: month.id,
                                    weekId: week.id,
                                    dayId: day.id,
                                  };
                                  showPrivateDayDialog = true;
                                } else {
                                  toggleDayPrivateCompleted(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  );
                                }
                              }}
                            >
                              {#if day.priGoalCompleted}
                                <span class="text-yellow-500 text-3xl font-bold"
                                 >🤴</span
                                >
                              {:else if day.priGoalRejected}
                                <span class="text-red-500 text-2xl font-bold"
                                  >🤡</span
                                >
                              {:else}
                                <span
                                  class="w-4 h-4 rounded-full bg-red-500 inline-block"
                                ></span>
                              {/if}
                            </button>

                           
                          </div>

                          <!-- Sleep & Screen row -->
                          <div class="flex items-center gap-3 mt-2">
                            <div class="w-58 shrink-0"></div>

                            <label class="text-teal-400 text-sm font-semibold whitespace-nowrap">Sleep</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTime || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'sleepTime', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-teal-400 text-sm font-semibold whitespace-nowrap">Wake</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepWake || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'sleepWake', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-teal-400 text-sm font-semibold whitespace-nowrap">Sleep</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTimeBack || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'sleepTimeBack', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-teal-400 text-sm font-semibold whitespace-nowrap">Wake</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepWakeAgain || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'sleepWakeAgain', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-teal-400 text-sm font-semibold whitespace-nowrap">Sleep Total</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTotal || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'sleepTotal', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-orange-400 text-sm font-semibold whitespace-nowrap">Screen Total</label>
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.screenGoal || ''}
                              oninput={(e) => updateDaySleepScreen(year.id, month.id, week.id, day.id, 'screenGoal', (e.target as HTMLInputElement).value)}
                            />

                            <label class="text-orange-400 text-sm font-semibold whitespace-nowrap">Screen Goal</label>
                            <button
                              class="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.screenFollowed
                                ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                                : 'border-orange-500'}"
                              onclick={() => {
                                if (!day.screenFollowed) {
                                  pendingScreenGoalAction = {
                                    yearId: year.id,
                                    monthId: month.id,
                                    weekId: week.id,
                                    dayId: day.id,
                                  };
                                  showScreenGoalDialog = true;
                                } else {
                                  toggleDayScreenFollowed(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  );
                                }
                              }}
                            >
                              {#if day.screenFollowed}
                                <span class="text-yellow-500 text-xl font-bold">🤴</span>
                              {:else}
                                <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
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
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateDayDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">
        Did you honor your monthly and/or weekly Private goal?
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateDayDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateDayAction) {
              toggleDayPrivateCompleted(
                pendingPrivateDayAction.yearId,
                pendingPrivateDayAction.monthId,
                pendingPrivateDayAction.weekId,
                pendingPrivateDayAction.dayId,
                false,
              );
              pendingPrivateDayAction = null;
            }
            showPrivateDayDialog = false;
          }}
        >
          No
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateDayAction) {
              toggleDayPrivateCompleted(
                pendingPrivateDayAction.yearId,
                pendingPrivateDayAction.monthId,
                pendingPrivateDayAction.weekId,
                pendingPrivateDayAction.dayId,
                true,
              );
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


<!-- Custom Private Week Dialog -->
{#if showPrivateWeekDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateWeekDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">
        Did you fulfill your Private goals for this week?
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateWeekDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateWeekAction) {
              toggleWeekPrivateCompleted(
                pendingPrivateWeekAction.yearId,
                pendingPrivateWeekAction.monthId,
                pendingPrivateWeekAction.weekId,
                false,
              );
              pendingPrivateWeekAction = null;
            }
            showPrivateWeekDialog = false;
          }}
        >
          No
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateWeekAction) {
              toggleWeekPrivateCompleted(
                pendingPrivateWeekAction.yearId,
                pendingPrivateWeekAction.monthId,
                pendingPrivateWeekAction.weekId,
                true,
              );
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

<!-- Custom Private Month Dialog -->
{#if showPrivateMonthDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateMonthDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">Private Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">
        Did you fulfill your Private goals for this month?
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateMonthDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateMonthAction) {
              toggleMonthPrivateCompleted(
                pendingPrivateMonthAction.yearId,
                pendingPrivateMonthAction.monthId,
                false,
              );
              pendingPrivateMonthAction = null;
            }
            showPrivateMonthDialog = false;
          }}
        >
          No
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateMonthAction) {
              toggleMonthPrivateCompleted(
                pendingPrivateMonthAction.yearId,
                pendingPrivateMonthAction.monthId,
                true,
              );
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

<!-- Screen Goal Dialog -->
{#if showScreenGoalDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showScreenGoalDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">Screen Goal Check</h3>
      <p class="text-white/90 text-xl mb-6">
        Did you follow your screen time goal today?
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showScreenGoalDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingScreenGoalAction) {
              toggleDayScreenFollowed(
                pendingScreenGoalAction.yearId,
                pendingScreenGoalAction.monthId,
                pendingScreenGoalAction.weekId,
                pendingScreenGoalAction.dayId,
                false,
              );
              pendingScreenGoalAction = null;
            }
            showScreenGoalDialog = false;
          }}
        >
          No
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingScreenGoalAction) {
              toggleDayScreenFollowed(
                pendingScreenGoalAction.yearId,
                pendingScreenGoalAction.monthId,
                pendingScreenGoalAction.weekId,
                pendingScreenGoalAction.dayId,
                true,
              );
              pendingScreenGoalAction = null;
            }
            showScreenGoalDialog = false;
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
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateGoalDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">
        Change Private Goal
      </h3>
      <p class="text-white/90 text-xl mb-4">
        Are you sure you want to change your private goal?
      </p>
      {#if pendingPrivateGoalChange && pendingPrivateGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">
          This is the {pendingPrivateGoalChange.changeCount}{pendingPrivateGoalChange.changeCount ===
          1
            ? "st"
            : pendingPrivateGoalChange.changeCount === 2
              ? "nd"
              : pendingPrivateGoalChange.changeCount === 3
                ? "rd"
                : "th"} time you have changed it.
        </p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-green-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your private goal..."
        rows="3"
        bind:value={pendingPrivateGoalChange!.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateGoalDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateGoalChange) {
              updateYearPrivateGoal(
                pendingPrivateGoalChange.yearId,
                pendingPrivateGoalChange.value,
              );
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

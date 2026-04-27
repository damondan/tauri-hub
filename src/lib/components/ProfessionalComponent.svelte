<!-- src/lib/components/GoalComponent.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { autoResize } from "$lib/utils/textareaResize";
  import { getMonthName } from "$lib/stores/general";
  import { borderNTextNBg,buttonStyles } from "$lib/styles";
  import { appProfState } from "$lib/stores/state.svelte"
  import {
    profGoalData,
    generateProfGoalStructureToDate,
    updateYearProfessionalGoal,
    updateMonthProfessionalGoals,
    updateWeekProfessionalGoals,
    updateDayProfessionalGoals,
    toggleDayProfessionalCompleted,
    toggleWeekProfessionalCompleted,
    toggleMonthProfessionalCompleted,
    profGoalExpandedYears,
    profGoalExpandedMonths,
    profGoalExpandedWeeks,
  } from "$lib/stores/profgoal";

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

    let lastRow = $derived(
    ($profGoalData.find((y) => y.year === currentYear)?.months?.length ?? 0) -
      1,
  );

  let showProfessionalDayDialog = $state(false);
  let pendingProfessionalDayAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
  } | null>(null);
 
  let showProfessionalWeekDialog = $state(false);
  let pendingProfessionalWeekAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
  } | null>(null);
  let showProfessionalMonthDialog = $state(false);
  let pendingProfessionalMonthAction = $state<{
    yearId: string;
    monthId: string;
  } | null>(null);
  let showProfessionalGoalDialog = $state(false);

  let pendingProfessionalGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null);

  // onMount(): void
  onMount(() => {
    const today = new Date();
    // Always generate structure to ensure current date data exists
    generateProfGoalStructureToDate(today);
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
    profGoalExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    profGoalExpandedMonths.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    profGoalExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // handleProfessionalGoalClick(yearId: string, currentValue: string, changeCount: number): void
  function handleProfessionalGoalClick(
    yearId: string,
    currentValue: string,
    changeCount: number,
  ) {
    pendingProfessionalGoalChange = {
      yearId,
      value: currentValue,
      changeCount,
    };
    showProfessionalGoalDialog = true;
  }
</script>

<div class="flex items-center justify-between mb-6">
  <!--Focus button-takes out earlier months to focus on present-->
  <button
    class="text-sm rounded p-1 bg-white/10 text-white/30 hover:bg-black/70 hover:text-white/80 float-right transition-all"
    onclick={() => (appProfState.showOnlyLast = !appProfState.showOnlyLast)}
  >
    Focus
  </button>
</div>

<!-- Empty state -->
{#if $profGoalData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $profGoalData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleYear(year.id)}
        >
          {$profGoalExpandedYears[year.id] ? "▼" : "▷"}
        </button>

        <div class="text-white/80 text-3xl font-semibold">
          {year.year}
        </div>

        <!-- Yrly Prof. Goal -->
    
        <textarea
         class="flex-1 bg-transparent border-0 px-5 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Professional ..."
          rows="1"
          readonly
          value={year.yearProfessionalGoal || ""}
          onclick={() =>
            handleProfessionalGoalClick(
              year.id,
              year.yearProfessionalGoal || "",
              year.yearProfessionalGoalChangeCount,
            )}
        ></textarea>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $profGoalExpandedYears[year.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each year.months as month, i (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          <div class="bg-white/10 rounded-xl p-3
           {appProfState.showOnlyLast && i !== lastRow
              ? 'h-0 min-h-0 max-h-0 p-0 m-0 opacity-0 overflow-hidden border-0 flex-none scale-y-0 origin-top'
              : 'h-auto'}
          {!appProfState.showOnlyLast && i !== lastRow
              ? borderNTextNBg.lightText
              : 'text-white'}"
              >
            <div class="flex items-center gap-3">
              <button
                class="text-white text-3xl w-6 shrink-0"
                onclick={() => toggleMonth(monthKey)}
              >
                {$profGoalExpandedMonths[monthKey] ? "▼" : "▷"}
              </button>

              <div class="text-white text-3xl font-semibold w-48 shrink-0">
                {getMonthName(month.monthNumber)}
              </div>
              <!--Monthly Professional Goals -->
              <textarea
                class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)] {month.proGoalCompleted
                  ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                  : month.proGoalRejected
                    ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                    : borderNTextNBg.lightBorder}"
                placeholder=""
                rows="1"
                value={month.monthProfessionalGoals || ""}
                use:autoResize
                oninput={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  textarea.style.height = "auto";
                  textarea.style.height = textarea.scrollHeight + "px";
                  updateMonthProfessionalGoals(
                    year.id,
                    month.id,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
              ></textarea>
              <button
                class="w-10 h-10 rounded-full border-2 flex items-center justify-center {month.proGoalCompleted
                  ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                  : month.proGoalRejected
                    ? 'border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                    : buttonStyles.circleLightHover}"
                onclick={() => {
                  if (!month.proGoalCompleted && !month.proGoalRejected) {
                    pendingProfessionalMonthAction = {
                      yearId: year.id,
                      monthId: month.id,
                    };
                    showProfessionalMonthDialog = true;
                  } else {
                    toggleMonthProfessionalCompleted(year.id, month.id);
                  }
                }}
              >
                {#if month.proGoalCompleted}
                  <span class="text-white text-sm font-bold">⭐</span>
                {:else if month.proGoalRejected}
                  <span class="text-white text-2xl font-bold"></span>
                {:else}
                  <span class="text-white"
                  >?</span>
                {/if}
              </button>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $profGoalExpandedMonths[monthKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                <div class="rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleWeek(weekKey)}
                    >
                      {$profGoalExpandedWeeks[weekKey] ? "▼" : "▷"}
                    </button>

                    <div class="text-white text-3xl font-semibold w-25">
                      {week.startDay}-{week.endDay}
                    </div>

                    <!-- Professional -->
              
                    <textarea
                      class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden 
                      focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {week.proGoalCompleted
                        ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                        : week.proGoalRejected
                          ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                          : 'border border-white/30'}"
                      placeholder=""
                      rows="1"
                      value={week.weekProfessionalGoals || ""}
                      use:autoResize
                      oninput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = "auto";
                        textarea.style.height = textarea.scrollHeight + "px";
                        updateWeekProfessionalGoals(
                          year.id,
                          month.id,
                          week.id,
                          (e.target as HTMLTextAreaElement).value,
                        );
                      }}
                    ></textarea>
                    <button
                      class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {week.proGoalCompleted
                        ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                        : week.proGoalRejected
                          ? ''
                          : 'border-gray-500 hover:border-white'}"
                      onclick={() => {
                        if (!week.proGoalCompleted && !week.proGoalRejected) {
                          pendingProfessionalWeekAction = {
                            yearId: year.id,
                            monthId: month.id,
                            weekId: week.id,
                          };
                          showProfessionalWeekDialog = true;
                        } else {
                          toggleWeekProfessionalCompleted(
                            year.id,
                            month.id,
                            week.id,
                          );
                        }
                      }}
                    >
                      {#if week.proGoalCompleted}
                        <span class="text-white text-sm font-bold">⭐</span>
                      {:else if week.proGoalRejected}
                        <span class="text-black text-2xl font-bold"></span>
                      {:else}
                        <span
                          class="text-white"
                        >?</span>
                      {/if}
                    </button>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $profGoalExpandedWeeks[weekKey] && week.days}
                    <div class="ml-10 mr-10 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        <div class="rounded-lg p-3">
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div
                              class="text-white text-2xl font-semibold whitespace-nowrap w-58"
                            >
                              {day.dayNumber}
                              {day.dayOfWeek}
                            </div>

                            <!-- Professional -->
                           
                            <textarea
                              class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden 
                              focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {day.proGoalCompleted
                                ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : day.proGoalRejected
                                  ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                                  : 'border border-white/30'}"
                              placeholder=""
                              rows="1"
                              value={day.dayProfessionalGoals || ""}
                              use:autoResize
                              oninput={(e) => {
                                const textarea =
                                  e.target as HTMLTextAreaElement;
                                textarea.style.height = "auto";
                                textarea.style.height =
                                  textarea.scrollHeight + "px";
                                autoResize(textarea);
                                updateDayProfessionalGoals(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  (e.target as HTMLTextAreaElement).value,
                                );
                              }}
                            ></textarea>
                            <button
                              class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.proGoalCompleted
                                ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : day.proGoalRejected
                                  ? 'border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                                  : 'border border-white/30 hover:border-white'}"
                              onclick={() => {
                                if (
                                  !day.proGoalCompleted &&
                                  !day.proGoalRejected
                                ) {
                                  pendingProfessionalDayAction = {
                                    yearId: year.id,
                                    monthId: month.id,
                                    weekId: week.id,
                                    dayId: day.id,
                                  };
                                  showProfessionalDayDialog = true;
                                } else {
                                  toggleDayProfessionalCompleted(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  );
                                }
                              }}
                            >
                              {#if day.proGoalCompleted}
                                <span class="text-white text-sm font-bold">⭐</span>
                              {:else if day.proGoalRejected}
                                <span class="text-black text-2xl font-bold"
                                  ></span
                                >
                              {:else}
                                <span
                                  class="text-white"
                                >?</span>
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

<!-- Custom Professional Day Dialog -->
{#if showProfessionalDayDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalDayDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(
                pendingProfessionalDayAction.yearId,
                pendingProfessionalDayAction.monthId,
                pendingProfessionalDayAction.weekId,
                pendingProfessionalDayAction.dayId,
                false,
              );
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          Convert
        </button>
        <button
         class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(
                pendingProfessionalDayAction.yearId,
                pendingProfessionalDayAction.monthId,
                pendingProfessionalDayAction.weekId,
                pendingProfessionalDayAction.dayId,
                true,
              );
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalDayDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Week Dialog -->
{#if showProfessionalWeekDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalWeekDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
       
        <button
           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(
                pendingProfessionalWeekAction.yearId,
                pendingProfessionalWeekAction.monthId,
                pendingProfessionalWeekAction.weekId,
                false,
              );
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(
                pendingProfessionalWeekAction.yearId,
                pendingProfessionalWeekAction.monthId,
                pendingProfessionalWeekAction.weekId,
                true,
              );
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          Fight
        </button>
         <button
           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalWeekDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Month Dialog -->
{#if showProfessionalMonthDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalMonthDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">
        Professional Goal Check
      </h3>
      <p class="text-white/90 text-xl mb-6">
        Did you fulfill your Professional goals for this month?
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalMonthDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(
                pendingProfessionalMonthAction.yearId,
                pendingProfessionalMonthAction.monthId,
                false,
              );
              pendingProfessionalMonthAction = null;
            }
            showProfessionalMonthDialog = false;
          }}
        >
          No
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(
                pendingProfessionalMonthAction.yearId,
                pendingProfessionalMonthAction.monthId,
                true,
              );
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

<!-- Professional Goal Dialog -->
{#if showProfessionalGoalDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalGoalDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">
        Change Professional Goal
      </h3>
      <p class="text-white/90 text-xl mb-4">
        Are you sure you want to change your professional goal?
      </p>
      {#if pendingProfessionalGoalChange && pendingProfessionalGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">
          This is the {pendingProfessionalGoalChange.changeCount}{pendingProfessionalGoalChange.changeCount ===
          1
            ? "st"
            : pendingProfessionalGoalChange.changeCount === 2
              ? "nd"
              : pendingProfessionalGoalChange.changeCount === 3
                ? "rd"
                : "th"} time you have changed it.
        </p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-yellow-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your professional goal..."
        rows="3"
        bind:value={pendingProfessionalGoalChange!.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalGoalDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalGoalChange) {
              updateYearProfessionalGoal(
                pendingProfessionalGoalChange.yearId,
                pendingProfessionalGoalChange.value,
              );
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

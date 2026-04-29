<script lang="ts">
  import { onMount } from "svelte";
  import { autoResize } from "$lib/utils/textareaResize";
  import { getMonthName, fileToDataUrl } from "$lib/stores/general";
  import { borderNTextNBg, buttonStyles } from "$lib/styles";
  import { appPersState } from "$lib/stores/state.svelte";
  import {
    persGoalData,
    generatePersGoalStructureToDate,
    updateYearPrivateGoal,
    updateMonthPrivateGoals,
    updateWeekPrivateGoals,
    updateDayPrivateGoals,
    persGoalExpandedYears,
    persGoalExpandedMonths,
    persGoalExpandedWeeks,
    updateDayImage,
    updateWeekImage,
    updateMonthImage,
    updateYearImage,
    removeDayImage,
    removeWeekImage,
    removeMonthImage,
    removeYearImage,
    updateDayIsDream,
    updateHighlight,
  } from "$lib/stores/persgoal";
  import { app } from "@tauri-apps/api";

  let now = new Date();
  let currentDay = now.getDate();
  let currentWeekOfMonth = Math.ceil(new Date().getDate() / 7);
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // Dialog state
  let showPrivateGoalDialog = $state(false);
  let pendingPrivateGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null);

  //Hide initial months
  let lastRow = $derived(
    ($persGoalData.find((y) => y.year === currentYear)?.months?.length ?? 0) -
      1,
  );

  let activeTarget = $state<{
    yearId: string;
    monthId?: string;
    weekId?: string;
    dayId?: string;
  } | null>(null);

  let imageInput: HTMLInputElement | null = null;

  function openImagePicker(
    yearId: string,
    monthId?: string,
    weekId?: string,
    dayId?: string,
  ): void {
    activeTarget = { yearId, monthId, weekId, dayId }; // ✅ assign object
    imageInput?.click();
  }

  let editingDay = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
    text: string;
  } | null>(null);

  function toggleExpand(dayId: string) {
    const currentState = appPersState.expandedRows[dayId] ?? false;

    appPersState.expandedRows = {
      ...appPersState.expandedRows,
      [dayId]: !currentState,
    };

    console.log(`ID: ${dayId} is now:`, appPersState.expandedRows[dayId]);
  }

  async function handleImageChange(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !activeTarget) return;

    const target = activeTarget; // snapshot
    activeTarget = null;

    const dataUrl = await fileToDataUrl(file);

    if (target.weekId) {
      updateWeekImage(dataUrl, target.yearId, target.monthId!, target.weekId);
    } else if (target.monthId) {
      updateMonthImage(dataUrl, target.yearId, target.monthId);
    } else {
      updateYearImage(dataUrl, target.yearId);
    }

    input.value = ""; // allow reselecting same file
  }

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
    persGoalExpandedMonths.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    persGoalExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  function handlePrivateGoalClick(
    yearId: string,
    currentValue: string,
    changeCount: number,
  ) {
    pendingPrivateGoalChange = { yearId, value: currentValue, changeCount };
    showPrivateGoalDialog = true;
  }
</script>

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
          {$persGoalExpandedYears[year.id] ? "▼" : "▷"}
        </button>

        <div class="text-white/80 text-3xl font-semibold">
          {year.year}
        </div>

        <!-- Yrly Priv. Goal -->
        <button
          onclick={() => toggleExpand(year.id)}
          class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
          title="Toggle Expand"
        >
          {appPersState.expandedRows[year.id] ? "S" : "E"}
        </button>
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
        <input
          bind:this={imageInput}
          type="file"
          accept="image/*"
          class="hidden"
          onchange={handleImageChange}
        />
        <button
          class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
          onclick={() => openImagePicker(year.id, "", "")}
          >I
        </button>
        {#if year.yearImage?.dataUrl}
          <img
            src={year.yearImage?.dataUrl}
            class="mt-2 max-w-full h-auto rounded-lg"
            ondblclick={() => removeYearImage(year.id)}
          />
        {/if}
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $persGoalExpandedYears[year.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each year.months as month, i (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          {@const isExpanded = month.monthPrivateGoals != ""}
          {@const isThisMonth = currentMonth}
          {@const result = isExpanded || isThisMonth == month.monthNumber}
          <div
            class={result
              ? "bg-white/10 rounded-xl p-3 text-white"
              : borderNTextNBg.collapseRows}
          >
            <div class="flex items-center gap-3 leading-none">
              <button
                class="text-3xl w-6 shrink-0 leading-none"
                onclick={() => toggleMonth(monthKey)}
              >
                {$persGoalExpandedMonths[monthKey] ? "▼" : "▷"}
              </button>

              <div class="text-3xl font-semibold w-38 shrink-0 leading-none">
                {getMonthName(month.monthNumber)}
              </div>
              <!--Monthly Private Goals -->
              <button
                onclick={() => toggleExpand(month.id)}
                class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                title="Toggle Expand"
              >
                {appPersState.expandedRows[month.id] ? "S" : "E"}
              </button>
              <textarea
                class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                    {borderNTextNBg.lightBorder}"
                placeholder=""
                rows="1"
                use:autoResize={[
                  month.monthPrivateGoals,
                  appPersState.expandedRows[month.id],
                ]}
                value={month.monthPrivateGoals || ""}
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
              <input
                bind:this={imageInput}
                type="file"
                accept="image/*"
                class="hidden"
                onchange={handleImageChange}
              />
              <button
                class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
                onclick={() => openImagePicker(year.id, month.id, "")}
                >I
              </button>
              {#if month.monthImage?.dataUrl}
                <img
                  src={month.monthImage?.dataUrl}
                  class="mt-2 max-w-full h-auto rounded-lg"
                  ondblclick={() => removeMonthImage(year.id, month.id)}
                />
              {/if}
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $persGoalExpandedMonths[monthKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const isCurrentWeek = currentWeekOfMonth === week.weekNumber}
                {@const hasGoals = !!week.weekPrivateGoals}
                {@const result = hasGoals || isCurrentWeek}
                <div
                  class={result
                    ? "rounded-xl p-3"
                    : borderNTextNBg.collapseRows}
                >
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleWeek(weekKey)}
                    >
                      {$persGoalExpandedWeeks[weekKey] ? "▼" : "▷"}
                    </button>

                    <div class="text-white text-3xl font-semibold w-30">
                      {week.startDay}-{week.endDay}
                    </div>

                    <!-- Private Wkly -->
                    <button
                      onclick={() => toggleExpand(week.id)}
                      class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                      title="Toggle Expand"
                    >
                      {appPersState.expandedRows[week.id] ? "S" : "E"}
                    </button>
                    <textarea
                      class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                      focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {borderNTextNBg.lightBorder}"
                      placeholder=""
                      rows="1"
                      use:autoResize={[
                        week.weekPrivateGoals,
                        appPersState.expandedRows[week.id],
                      ]}
                      value={week.weekPrivateGoals || ""}
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
                    <input
                      bind:this={imageInput}
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onchange={handleImageChange}
                    />
                    <button
                      class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
                      onclick={() =>
                        openImagePicker(year.id, month.id, week.id)}
                      >I
                    </button>
                    {#if week.weekImage?.dataUrl}
                      <img
                        src={week.weekImage?.dataUrl}
                        class="mt-2 max-w-full h-auto rounded-lg"
                        ondblclick={() =>
                          removeWeekImage(year.id, month.id, week.id)}
                      />
                    {/if}
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $persGoalExpandedWeeks[weekKey] && week.days}
                    {@const d = new Date()}
                    {@const dayNum = d.getDate()}
                    <div class="ml-10 mr-10 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        {@const isToday = day.dayNumber === dayNum}
                        {@const hasGoals = day.dayPrivateGoals != ""}
                        {@const result = hasGoals || isToday}
                        <div
                          class={result
                            ? "rounded-lg p-3 bg-white/5"
                            : "h-0 min-h-0 max-h-0 p-0 m-0 opacity-0 overflow-hidden border-0 flex-none scale-y-0 origin-top"}
                        >
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div
                              class="text-white text-2xl font-semibold whitespace-nowrap w-48"
                            >
                              {day.dayNumber}
                              {day.dayOfWeek}
                            </div>

                            <!-- Private Daily -->
                            <button
                              onclick={() => toggleExpand(day.id)}
                              class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                              title="Toggle Expand"
                            >
                              {appPersState.expandedRows[day.id] ? "S" : "E"}
                            </button>

                            <textarea
                              class="flex-1 bg-white/10 rounded-2xl ml-4 px-3 py-1 text-white text-xl resize-none overflow-hidden
                              focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)]
                                 {isToday
                                ? 'border-2 border-white'
                                : day.isDream
                                  ? 'border border-blue-700'
                                  : day.highlight
                                    ? 'border border-yellow-400'
                                    : 'border border-white/30'}"
                              placeholder=""
                              rows="1"
                              value={day.dayPrivateGoals || ""}
                              use:autoResize={[
                                day.dayPrivateGoals,
                                appPersState.expandedRows[day.id],
                              ]}
                              ondblclick={() => {
                                editingDay = {
                                  yearId: year.id,
                                  monthId: month.id,
                                  weekId: week.id,
                                  dayId: day.id,
                                  text: day.dayPrivateGoals || "",
                                };
                              }}
                              oninput={(e) => {
                                // Keep your existing persistence logic
                                updateDayPrivateGoals(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  (e.target as HTMLTextAreaElement).value,
                                );
                              }}
                            ></textarea>
                            <input
                              bind:this={imageInput}
                              type="file"
                              accept="image/*"
                              class="hidden"
                              onchange={handleImageChange}
                            />
                            <button
                              class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex
                              items-center justify-center border hover:border-white"
                              onclick={() =>
                                openImagePicker(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                )}
                              >I
                            </button>
                            {#if day.dayImage?.dataUrl}
                              <img
                                src={day.dayImage?.dataUrl}
                                class="mt-2 max-w-full h-auto rounded-lg"
                                ondblclick={() =>
                                  removeDayImage(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  )}
                              />
                            {/if}
                            <label class="flex gap-1 cursor-pointer">
                              <span class="text-white text-sm leading-tight"
                                >D</span
                              >
                              <input
                                type="checkbox"
                                bind:checked={day.isDream}
                                onchange={(e) =>
                                  updateDayIsDream(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    (e.target as HTMLInputElement).checked,
                                  )}
                                class="w-4 h-4 accent-blue-600 opacity-30"
                              />
                            </label>
                            <!--day.-->
                            <label class="flex gap-1 cursor-pointer">
                              <span class="text-white text-sm leading-tight"
                                >H</span
                              >
                              <input
                                type="checkbox"
                                bind:checked={day.highlight}
                                onchange={(e) =>
                                  updateHighlight(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    (e.target as HTMLInputElement).checked,
                                  )}
                                class="w-4 h-4 accent-yellow-600 opacity-30"
                              />
                            </label>

                            <!--
                            <button
                              class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.priGoalCompleted
                                ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : day.priGoalRejected
                                  ? 'border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                                  : 'border border-white/30 hover:border-white'}"
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
                                <span class="text-white text-sm font-bold"
                                  >⭐</span
                                >
                              {:else if day.priGoalRejected}
                                <span class="text-black text-2xl font-bold"
                                ></span>
                              {:else}
                                <span class="text-white">?</span>
                              {/if}
                            </button> -->
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
              <!--week -->
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/each}

{#if editingDay}
  <div class="fixed inset-0 z-[100] flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      onclick={() => (editingDay = null)}
    ></div>

    <div
      class="relative w-[95vw] md:w-[90vw] lg:w-[85vw] h-[80vh] bg-[#1a1a1a] border border-white/20 rounded-3xl flex flex-col shadow-2xl"
    >
      <div
        class="p-4 border-b border-white/10 flex justify-between items-center text-white/50 font-mono"
      >
        <span>EDITOR</span>
        <span class="text-xs">Through Perseverance We Conquer</span>
      </div>

      <textarea
        class="flex-1 bg-transparent p-4 text-white text-2xl font-mono outline-none resize-none overflow-y-auto"
        style="padding-top: 5vh; padding-bottom: 5vh;"
        bind:value={editingDay.text}
        autofocus
      ></textarea>

      <div class="p-6 border-t border-white/10 flex justify-end">
        <button
          onclick={() => {
            const current = editingDay;
            if (!current) return;
            updateDayPrivateGoals(
              current.yearId,
              current.monthId,
              current.weekId,
              current.dayId,
              current.text,
            );

            // 2. Close modal
            editingDay = null;
          }}
          class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Save
        </button>
        <button
          onclick={() => {
            editingDay = null;
          }}
          class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Cancel
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
      class="bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
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
        class="w-full bg-white/10 border border-white rounded px-4 py-3 text-white text-xl resize-none mb-6"
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

<!-- let showPrivateDayDialog = $state(false);
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

  // let showScreenGoalDialog = $state(false);
  // let pendingScreenGoalAction = $state<{
  //   yearId: string;
  //   monthId: string;
  //   weekId: string;
  //   dayId: string;
  // } | null>(null);

  let showPrivateGoalDialog = $state(false);
  let pendingPrivateGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null); -->
<!-- Custom Private Day Dialog -->
<!-- {#if showPrivateDayDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateDayDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateDayDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if} -->

<!-- Custom Private Week Dialog -->
<!-- {#if showPrivateWeekDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateWeekDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateWeekDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if} -->

<!-- Custom Private Month Dialog -->
<!-- {#if showPrivateMonthDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateMonthDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 text-white {buttonStyles.circleLightHover} rounded-lg text-xl font-semibold transition-colors border"
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
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateMonthDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if} -->

<!-- Screen Goal Dialog -->
<!-- {#if showScreenGoalDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showScreenGoalDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
       
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Fail
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
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
          Succeed
        </button>
         <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showScreenGoalDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if} -->

<!-- Sleep & Screen row -->
<!-- <div class="flex items-center gap-3 mt-2">
                            <div class="w-58 shrink-0"></div>

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Sleep</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTime || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "sleepTime",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Wake</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepWake || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "sleepWake",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Sleep</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTimeBack || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "sleepTimeBack",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Wake</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepWakeAgain || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "sleepWakeAgain",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Sleep Total</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.sleepTotal || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "sleepTotal",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Screen Bounds</label
                            >
                            <input
                              type="text"
                              class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                              placeholder=""
                              value={day.screenGoal || ""}
                              oninput={(e) =>
                                updateDaySleepScreen(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  "screenGoal",
                                  (e.target as HTMLInputElement).value,
                                )}
                            />

                            <label
                              class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
                              >Screen Goal</label
                            >
                            <button
                              class="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.screenFollowed
                                ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : 'border-2 border-gray-500 hover:border-white'}"
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
                                <span class="text-white text-sm font-bold">⭐</span>
                              {:else}
                                <span
                                  class="text-white"
                                >x</span>
                              {/if}
                            </button>
                          </div> -->

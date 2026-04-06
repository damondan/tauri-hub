<!-- src/lib/components/FinanceComponent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMonthName } from '$lib/stores/general';
  import FinanceCalendar from '$lib/components/FinanceCalendar.svelte';
  import {
    financeData,
    generateFinanceStructureToDate,
    addFinanceEntry,
    deleteFinanceEntry,
    updateFinanceEntry,
    updateFinanceEntryCheckbox,
    updateFinanceMonthAmount,
    addOrUpdateExpense,
    removeExpenseByName,
    toggleExpensePaid,
    expensesData,
    sumExpenses,
    calculateYearTotal,
    calculateMonthTotal,
    calculateMonthHBBalance,
    calculateMonthFoodTotal,
    calculateMonthGasTotal,
    calculateWeekTotal,
    formatCurrency,
    financeExpandedYears,
    financeExpandedMonths,
    financeExpandedWeeks,
  } from "$lib/stores/finance";

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // Expense input fields
  let expenseName = "";
  let expenseCost = "";

  // handleAddExpense(): void
  function handleAddExpense() {
    if (!expenseName.trim()) return;
    addOrUpdateExpense(expenseName.trim(), expenseCost.trim());
    expenseName = "";
    expenseCost = "";
  }

  // handleRemoveExpense(): void
  function handleRemoveExpense() {
    if (!expenseName.trim()) return;
    removeExpenseByName(expenseName.trim());
    expenseName = "";
    expenseCost = "";
  }

  // onMount(): void
  onMount(() => {
    // Only regenerate if data is empty or has old structure
    const today = new Date();
    const currentData = $financeData;

    // Check if we need to regenerate (empty or old structure without days array)
    const needsRegeneration =
      currentData.length === 0 ||
      (currentData[0]?.months?.[0]?.weeks?.[0] &&
        !currentData[0].months[0].weeks[0].days);

    if (needsRegeneration) {
      financeData.set([]);
    }

    generateFinanceStructureToDate(today);
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
    financeExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    financeExpandedMonths.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    financeExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // handleRadioChange
  function handleRadioChange(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: "isHB" | "isDisc" | "isAmerX" | "isGas" | "isFood" | "isOther",
  ) {
    // Radio buttons are always "checked" when clicked, so pass true
    updateFinanceEntryCheckbox(
      yearId,
      monthId,
      weekId,
      dayId,
      entryId,
      field,
      true,
    );
  }
</script>

<!-- Top-level Expenses section -->
<div class="mb-4 bg-white/10 rounded-xl p-3">
  <div class="flex items-center gap-3">
    <div class="justify-center">
      <label class="text-white text-2xl font-semibold">Expenses</label>
      <label class="text-white text-xl font-serif"
        >Total<span class="ml-1">{sumExpenses($expensesData)}</span></label
      >
    </div>
    <input
      type="text"
      class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-48"
      placeholder="Name..."
      bind:value={expenseName}
    />
    <input
      type="text"
      class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-28"
      placeholder="Cost..."
      bind:value={expenseCost}
    />
    <button
      class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-lg font-semibold"
      on:click={handleAddExpense}
    >
      +
    </button>
    <button
      class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg font-semibold"
      on:click={handleRemoveExpense}
    >
      -
    </button>
    <!-- Display current top-level expenses -->
    <div class="flex items-center gap-4 ml-4">
      {#each $expensesData as exp (exp.id)}
        <span class="text-white/70 text-lg">{exp.name} ${exp.cost}</span>
      {/each}
    </div>
  </div>
</div>

<!-- Empty state -->
{#if $financeData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $financeData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-1">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          on:click={() => toggleYear(year.id)}
        >
          {$financeExpandedYears[year.id] ? "▼" : "▶"}
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
          <div class="bg-white/10 rounded-xl p-1">
            <div class="relative flex items-center justify-center gap-4">
              <!-- Arrow + Month name pinned to the left -->
              <div class="absolute left-0 flex items-center gap-3">
                <button
                  class="text-white text-3xl w-6"
                  on:click={() => toggleMonth(monthKey)}
                >
                  {$financeExpandedMonths[monthKey] ? "▼" : "▶"}
                </button>
                <div class="text-white text-3xl">
                  {getMonthName(month.monthNumber)}
                </div>
              </div>

              <!-- Centered fields group -->
              <div class="flex items-center gap-4">
                <!-- Disc Amount -->
                <div class="flex items-center gap-1">
                  <label class="text-white text-xl">Disc $</label>
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-32"
                    maxlength="14"
                    value={month.discAmount || ""}
                    on:input={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "discAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- Disc Interest Amount -->
                <div class="flex items-center gap-1">
                  <label class="text-white text-xl">Int $</label>
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                    maxlength="6"
                    value={month.discIntAmount || ""}
                    on:input={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "discIntAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- AmerX Amount -->
                <div class="flex items-center gap-1">
                  <label class="text-white text-xl">AmerX $</label>
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-32"
                    maxlength="14"
                    value={month.amerXAmount || ""}
                    on:input={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "amerXAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- AmerX Interest Amount -->
                <div class="flex items-center gap-1">
                  <label class="text-white text-xl">Int $</label>
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                    maxlength="6"
                    value={month.amerXIntAmount || ""}
                    on:input={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "amerXIntAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- Food Total (calculated, read-only) -->
                <div class="flex items-center gap-1 ml-8">
                  <label class="text-red-500 text-xl font-semibold"
                    >Food $</label
                  >
                  <div
                    class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  >
                    {calculateMonthFoodTotal(month).toFixed(2)}
                  </div>
                </div>

                <!-- Gas Total (calculated, read-only) -->
                <div class="flex items-center gap-1">
                  <label class="text-red-500 text-xl font-semibold">Gas $</label
                  >
                  <div
                    class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  >
                    {calculateMonthGasTotal(month).toFixed(2)}
                  </div>
                </div>
              </div>

              <!-- HB Balance pinned to far right -->
              <div
                class="absolute right-0 text-white text-2xl font-semibold pr-2"
              >
                {formatCurrency(calculateMonthHBBalance(year, month))}
              </div>
            </div>

            <!-- Month-level expenses display -->
            {#if month.expenses && month.expenses.length > 0}
              <div class="flex items-center gap-4 mt-1 px-3 pb-1 flex-wrap">
                {#each month.expenses as exp (exp.id)}
                  <span
                    class="text-xl font-semibold {exp.paid
                      ? 'text-green-500'
                      : 'text-white/40'}"
                  >
                    {exp.name} ${exp.cost}{#if exp.paid && exp.datePaid}
                      — {exp.datePaid}{/if}
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $financeExpandedMonths[monthKey]}
            <div class="ml-12 mt-2 space-y-2">
              {#each month.weeks as week (week.id)}
                <!--Going through weeks of month-->
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      on:click={() => toggleWeek(weekKey)}
                    >
                      {$financeExpandedWeeks[weekKey] ? "▼" : "▶"}
                    </button>

                    <div class="text-white text-3xl font-semibold">
                      {week.weekNumber} Week {week.startDay}-{week.endDay}
                    </div>

                    <!-- Week-level expenses with checkboxes -->
                    {#if month.expenses && month.expenses.length > 0}
                      <div class="flex-1 flex justify-center gap-10">
                        {#each month.expenses as exp (exp.id)}
                          <label
                            class="flex items-center gap-1 text-lg font-semibold {exp.paid
                              ? 'text-green-500'
                              : 'text-white/40'}"
                          >
                            {exp.name} ${exp.cost}
                            <input
                              type="checkbox"
                              class="w-4 h-4 ml-1"
                              checked={exp.paid || false}
                              on:change={() =>
                                toggleExpensePaid(year.id, month.id, exp.id)}
                            />
                          </label>
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
                        <div
                          class="bg-white/5 rounded-lg p-3 {isCurrentDay(
                            year.year,
                            month.monthNumber,
                            day.dayNumber,
                          )
                            ? 'border-2 border-green-500'
                            : ''}"
                        >
                          <!-- Day entries -->
                          {#each day.entries as entry, entryIndex (entry.id)}
                            <div class="flex items-center gap-2 mb-2">
                              <!-- Entry fields -->
                              <!-- Day label (only show on first entry) -->
                              {#if entryIndex === 0}
                                <div
                                  class="text-white text-2xl font-semibold w-40 shrink-0 whitespace-nowrap"
                                >
                                  {day.dayNumber}
                                  {day.dayOfWeek}
                                </div>
                              {:else}
                                <div class="w-40 shrink-0"></div>
                              {/if}

                              <!-- + amount -->
                              <label class="text-white text-xl w-4">+</label>
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-24"
                                placeholder="0"
                                value={entry.addAmount}
                                on:input={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "addAmount",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- - amount -->
                              <label class="text-white text-xl w-4 ml-2"
                                >-</label
                              >
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-24"
                                placeholder="0"
                                value={entry.subAmount}
                                on:input={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "subAmount",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- Radio buttons (stacked vertically) -->
                              <div class="flex flex-col gap-1 ml-2">
                                <!-- Payment method group -->
                                <div class="flex items-center gap-2">
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    HB
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isHB || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isHB",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Disc
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isDisc || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isDisc",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    AmerX
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isAmerX || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isAmerX",
                                        )}
                                    />
                                  </label>
                                </div>

                                <!-- Category group -->
                                <div class="flex items-center gap-2">
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Gas
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isGas || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isGas",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Food
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isFood || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isFood",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Other
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isOther || false}
                                      on:change={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isOther",
                                        )}
                                    />
                                  </label>
                                </div>
                              </div>

                              <!-- Description -->
                              <input
                                type="text"
                                class="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-xl"
                                placeholder="Description..."
                                value={entry.description}
                                on:input={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "description",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- + button (first entry) or Delete button (additional entries) -->
                              {#if entryIndex === 0}
                                <button
                                  class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-lg"
                                  on:click={() =>
                                    addFinanceEntry(
                                      year.id,
                                      month.id,
                                      week.id,
                                      day.id,
                                    )}
                                >
                                  +
                                </button>
                              {:else}
                                <button
                                  class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                  on:click={() =>
                                    deleteFinanceEntry(
                                      year.id,
                                      month.id,
                                      week.id,
                                      day.id,
                                      entry.id,
                                    )}
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

<!-- Calendar -->
<div class="mt-6">
  <FinanceCalendar />
</div>

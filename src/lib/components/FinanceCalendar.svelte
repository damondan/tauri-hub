<!-- src/lib/components/FinanceCalendar.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { getDaysInMonth, getMonthName } from "$lib/stores/general";
  import {
    calendarData,
    addOrUpdateFinancial,
    removeFinancialEntry,
    generateCalendarStructureToDate,
    getDaysInMonthCal,
    type CalendarMonth,
    type CalendarDay,
    type CalendarFinanceDayEntry,
  } from "$lib/stores/calendar";

  let displayYear: number = $state(0);
  let displayMonth: number = $state(0);
  let displayDay: number = $state(0);
  let todayDate: Date = $state(new Date());

  let showDayCalendarDialog = $state(false);
  let payType: string = $state("expense");
  let payName: string = $state("");
  let payAmount: string = $state("");

  //This is data saved for showDayCalendarDialog
  let selectedDayMonthYear = $state<{
    day: number;
    month: number;
    year: number;
    calEntries: CalendarFinanceDayEntry[];
  } | null>(null);

  let selectedEntry = $state<CalendarFinanceDayEntry | null>(null);

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // onMount(): void
  onMount(() => {
    displayDay = todayDate.getDate();
    console.log("Today is the " + displayDay + " of April");
    displayYear = todayDate.getFullYear();
    displayMonth = todayDate.getMonth() + 1; // 1-12

    const currentData = $calendarData;

    // Check if we need to regenerate (empty or old structure without days array)
    const needsRegeneration =
      currentData.length === 0 ||
      (currentData[0]?.months?.[0]?.days && !currentData[0].months[0].days);

    if (needsRegeneration) {
      console.log("IN regeneration");
      calendarData.set([]);
    }
    //The todayDate is used within to get the year
    //This initializes
    generateCalendarStructureToDate(todayDate);
  });

  // getFirstDayOfMonth(year: number, month: number): number
  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
  }

  // prevMonth(): void
  function prevMonth() {
    if (displayMonth === 1) {
      displayMonth = 12;
      displayYear--;
    } else {
      displayMonth--;
    }
  }

  // nextMonth(): void
  function nextMonth() {
    if (displayMonth === 12) {
      displayMonth = 1;
      displayYear++;
    } else {
      displayMonth++;
    }
  }

  let calendarDays = $derived.by(() => {
    const month = calendarMonth;

    if (!month) return [];

    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

    const days: (CalendarDay | null)[] = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual CalendarDay objects
    for (const day of month.days) {
      days.push(day);
    }

    return days;
  });

  let calendarMonth = $derived.by((): CalendarMonth | undefined => {
    const data = $calendarData;
    return getDaysInMonthCal(displayMonth, displayYear);
  });

  function isToday(day: number): boolean {
    return (
      displayYear === todayDate.getFullYear() &&
      displayMonth === todayDate.getMonth() + 1 &&
      day === displayDay
    );
  }
</script>

<div class="flex justify-center">
  <div class="bg-white/10 rounded-xl p-3 w-7xl">
    <!-- Header with nav -->
    <div class="flex items-center justify-between mb-2">
      <button
        class="text-white text-xl px-2 hover:text-white/70"
        onclick={prevMonth}
      >
        ◀
      </button>
      <div class="text-white text-4xl font-semibold">
        {getMonthName(displayMonth)}
        {displayYear}
      </div>
      <button
        class="text-white text-xl px-2 hover:text-white/70"
        onclick={nextMonth}
      >
        ▶
      </button>
    </div>

    <!-- Day headers -->
    <div class="grid grid-cols-7 gap-1 mb-1">
      {#each dayHeaders as header}
        <div class="text-white/50 text-2xl text-center font-semibold">
          {header}
        </div>
      {/each}
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-1">
      {#each calendarDays as day}
        {#if day === null}
          <div></div>
        {:else}
          <div
            class="flex flex-col text-center text-xl py-1 {isToday(
              day.dayNumber,
            )
              ? 'h-40 cursor-pointer bg-green-500 text-white font-bold shadow-[0_0_12px_rgba(34,197,94,0.7)]'
              : 'h-40 cursor-pointer text-white/80 hover:bg-white/10'}"
            onclick={() => {
              selectedDayMonthYear = {
                day: day.dayNumber,
                month: displayMonth,
                year: displayYear,
                calEntries: day?.calEntries,
              };
              showDayCalendarDialog = true;
            }}
          >
            {day.dayNumber}
            {#if day.calEntries.length > 0}
              {#each day.calEntries as cal (cal.id)}
                {#if cal.isPaycheck == true && !["Checking"].includes(cal.name) }
                  <button
                    class="w-full h-auto text-black bg-orange-400 hover:bg-orange-500 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        day: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "expense" : "paycheck";
                      payName = cal.name;
                      payAmount = cal.amount;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                {:else if cal.isPaycheck == false && !["Gas","Food"].includes(cal.name)}
                  <button
                    class="w-full h-auto text-black bg-blue-400 hover:bg-blue-500 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        day: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "expense" : "paycheck";
                      payName = cal.name;
                      payAmount = cal.amount;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                {:else if ["Gas", "Food"].includes(cal.name) && cal.isPaycheck == false}
                  <button
                    class="w-full h-auto text-black bg-red-500 hover:bg-red-600 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        day: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "expense" : "paycheck";
                      payName = cal.name;
                      payAmount = cal.amount;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                  {:else if ["Checking"].includes(cal.name) && cal.isPaycheck == true}
                  <button
                    class="w-full h-auto text-black bg-white hover:bg-yellow-100 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        day: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "expense" : "paycheck";
                      payName = cal.name;
                      payAmount = cal.amount;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                {/if}
              {/each}
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  {#if showDayCalendarDialog == true}
    <div class="flex flex-col w-80 h-auto border-2 border-red-600">
      <div class="flex flex-row justify-center">
        <label class="text-2xl text-white mr-3">Paycheck</label>
        <input
          type="radio"
          name="payment"
          value="paycheck"
          class="w-5 h-5 mt-1.5"
          bind:group={payType}
        />
      </div>
      <div class="flex flex-row justify-center">
        <label class="text-2xl text-white mr-3">Expense</label>
        <input
          type="radio"
          name="payment"
          value="expense"
          class="w-5 h-5 mt-1.5"
          bind:group={payType}
        />
      </div>
      <div class="flex flex-col mt-3 items-center">
        <label class="text-2xl text-white mr-3">Name</label>
        <textarea
          class="text-white pl-2 text-2xl w-50 h-auto border-2 border-amber-100"
          rows="1"
          bind:value={payName}
        ></textarea>
      </div>
      <div class="flex flex-col items-center">
        <label class="text-2xl text-white mr-3">Amount</label>
        <textarea
          class="text-white pl-2 text-2xl w-50 h-auto border-2 border-amber-100"
          rows="1"
          bind:value={payAmount}
        ></textarea>
      </div>
      <div class="flex mt-3 justify-center">
        <button
          class="w-20 h-5 text-white hover:bg-green-900"
          onclick={() => {
            addOrUpdateFinancial(
              payType,
              payName,
              payAmount,
              selectedDayMonthYear!.day,
              selectedDayMonthYear!.month,
              selectedDayMonthYear!.year,
              selectedEntry,
            );
            payType = "expense";
            payName = "";
            payAmount = "";
            showDayCalendarDialog = false;
          }}>Add</button
        >
        <button
          class="w-20 h-5 text-white hover:bg-blue-700"
          onclick={() => {
            if (!selectedDayMonthYear) return;
            const entry = selectedDayMonthYear.calEntries[0];
            if (!entry) return;
            if (!selectedEntry) return;
            removeFinancialEntry(
              selectedEntry,
              selectedDayMonthYear.day,
              selectedDayMonthYear.month,
              selectedDayMonthYear.year,
            );
            payType = "expense";
            payName = "";
            payAmount = "";
          }}>Remove</button
        >
        {#if selectedEntry != null}
          <button
            class="w-20 h-5 text-white hover:bg-purple-700"
            onclick={() => {
              addOrUpdateFinancial(
                payType,
                payName,
                payAmount,
                selectedDayMonthYear!.day,
                selectedDayMonthYear!.month,
                selectedDayMonthYear!.year,
                selectedEntry,
              );
              payType = "expense";
              payName = "";
              payAmount = "";
              showDayCalendarDialog = false;
            }}>Update</button
          >
        {/if}
        <button
          class="w-20 h-5 text-white hover:bg-red-700"
          onclick={() => {
            payType = "expense";
            payName = "";
            payAmount = "";

            showDayCalendarDialog = false;
          }}>Cancel</button
        >
      </div>
    </div>
  {/if}
</div>

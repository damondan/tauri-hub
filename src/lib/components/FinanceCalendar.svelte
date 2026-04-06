<!-- src/lib/components/FinanceCalendar.svelte -->
<script lang="ts">
  import { getDaysInMonth, getMonthName } from '$lib/stores/general';

  const now = new Date();
  let displayYear = $state(now.getFullYear());
  let displayMonth = $state(now.getMonth() + 1); // 1-12

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // calendarDays: (number | null)[]
  let calendarDays = $derived.by(() => {
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  });

  // isToday(day: number): boolean
  function isToday(day: number): boolean {
    return displayYear === todayYear && displayMonth === todayMonth && day === todayDay;
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
      {getMonthName(displayMonth)} {displayYear}
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
      <div class="text-white/50 text-2xl text-center font-semibold">{header}</div>
    {/each}
  </div>

  <!-- Day grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each calendarDays as day}
      {#if day === null}
        <div></div>
      {:else}
        <div
          class="text-center text-xl py-1 rounded-full {isToday(day)
            ? 'bg-green-500 text-white font-bold shadow-[0_0_12px_rgba(34,197,94,0.7)]'
            : 'text-white/80 hover:bg-white/10'}"
        >
          {day}
        </div>
      {/if}
    {/each}
  </div>
</div>
</div>

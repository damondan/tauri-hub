<script lang="ts">
    import {
        calculateMonthAccountSpending,
        financeData,
        financeNames,
        formatCurrency,
        type FinanceNames,
    } from "$lib/stores/finance";
    import {
        calendarData,
        getFinanceMonthCal,
        setCalMonthLimits,
    } from "$lib/stores/calendar";

    let { displayMonth, displayYear } = $props();

    let projectedEarnings = $state("");
    let projectedExpenses = $state("");
    let foodSpendLimit: string = $state("");
    let gasSpendLimit: string = $state("");
    let persSpendLimit: string = $state("");
    let lastLoadedMonthKey: string = $state("");
    let statusMonthKey = $state("");
    let accountSpending = $state({ checking: 0, primaryCard: 0, secondaryCard: 0 });
    const accounts: (keyof FinanceNames)[] = ["checking", "primaryCard", "secondaryCard"];

    function getMonthStatus() {
        const presentMonth = getFinanceMonthCal(
            $calendarData,
            displayYear,
            displayMonth,
        );
        // Commit the input drafts only when Status is clicked.
        setCalMonthLimits(
            displayYear,
            displayMonth,
            projectedEarnings,
            projectedExpenses,
            presentMonth?.monthBalLimit ?? "",
            foodSpendLimit,
            gasSpendLimit,
            persSpendLimit,
        );
        accountSpending = calculateMonthAccountSpending(
            $financeData,
            displayYear,
            displayMonth,
        );
        statusMonthKey = `${displayYear}-${displayMonth}`;
    }

    $effect(() => {
        const monthKey = `${displayYear}-${displayMonth}`;

        if (monthKey === lastLoadedMonthKey) return;

        lastLoadedMonthKey = monthKey;
        statusMonthKey = "";

        const presentMonth = getFinanceMonthCal(
            $calendarData,
            displayYear,
            displayMonth,
        );

        projectedEarnings = presentMonth?.projectedEarnings ?? "";
        projectedExpenses = presentMonth?.projectedExpenses ?? "";
        gasSpendLimit = presentMonth?.gasLimit ?? "";
        foodSpendLimit = presentMonth?.foodLimit ?? "";
        persSpendLimit = presentMonth?.otherLimit ?? "";
    });
</script>

<div class="w-[320px] mr-2">
    <div class="grid grid-cols-[70%_30%] gap-x-0 gap-y-2 items-center mt-4">
        <!-- Row 1 bind value-->
        <div class="text-white text-2xl">~ Earnings</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={projectedEarnings}
        />
        <div class="text-white text-2xl">~ Expenses</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={projectedExpenses}
        />

        <!-- Row 2 bind value-->
        <div class="text-white text-2xl">Food Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={foodSpendLimit}
        />

        <!--bind value-->
        <div class="text-white text-2xl">Gas Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={gasSpendLimit}
        />

        <div class="text-white text-2xl">Pers Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={persSpendLimit}
        />

        <div class="text-white text-2xl">Get Status</div>
        <button
            type="button"
            class="text-2xl bg-blue-400/30 hover:bg-blue-500 rounded px-2 py-1 h-9"
            onclick={getMonthStatus}
        >Status</button
        >

        {#if statusMonthKey === `${displayYear}-${displayMonth}`}
            {#each accounts as account}
                {#if $financeNames[account].trim()}
                    <div class="text-white text-2xl">{$financeNames[account]}</div>
                    <div class="text-white text-2xl text-right">
                        {formatCurrency(accountSpending[account])}
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>

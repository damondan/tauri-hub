<script lang="ts">
    import { show } from "@tauri-apps/api/app";
    import { onMount } from "svelte";
    import {
        calculateMonthGasTotal,
        calculateMonthFoodTotal,
        formatCurrency,
        calculateMonthHBBalance,
        financeData,
        type FinanceYear,
        getFinanceMonthFromNumber,
        getFinanceYearFromNumber,
    } from "$lib/stores/finance";
    let monthIncomeLimit: string = $state("");
    let foodSpendLimit: string = $state("");
    let gasSpendLimit: string = $state("");
    let showMonthStatus: boolean = $state(false);
    let updateWithPayBool: boolean = $state(false);
    let monthIncomeSpent: string = $state("");
    let monthIncomeLeft: string = $state("");
    let foodSpent: string = $state("");
    let foodLeft: string = $state("");
    let gasLimit: string = $state("");
    let gasLeft: string = $state("");
    let gasSpent: string = $state("");
    let expensesTotal: string = $state("");
    let expensesPaid: string = $state("");
    let expensesLeft: string = $state("");

    let updatedPayVar: string = $state("");

    const currentYear = $derived(getFinanceYearFromNumber($financeData));
    const currentMonth = $derived(getFinanceMonthFromNumber($financeData));

    const balance = $derived(
        currentYear && currentMonth
            ? calculateMonthHBBalance(currentYear, currentMonth)
            : 0,
    );

    function getMonthStatus() {
        showMonthStatus = !showMonthStatus;
    }

    function updateWithPayFunc() {
        updateWithPayBool = !updateWithPayBool;
    }
</script>

<div class="w-[320px] mr-2">
    <div class="grid grid-cols-[70%_30%] gap-x-0 gap-y-2 items-center mt-4">
        <!-- Row 1 -->
        <div class="text-white text-2xl">Month Inc Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={monthIncomeLimit}
        />

        <!-- Row 2 -->
        <div class="text-white text-2xl">Food Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={foodSpendLimit}
        />

        <!-- Row 3 -->
        <div class="text-white text-2xl">Gas Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={gasSpendLimit}
        />

        <div class="text-white text-2xl">Get Status</div>
        <button
            class="text-2xl bg-blue-400 rounded px-2 py-1 h-9"
            onclick={getMonthStatus}>Go</button
        >

        {#if showMonthStatus == true}
            <!-- Good -->
            <div class="text-green-500 text-2xl">Month Inc Limit</div>
            <h2 class="text-white text-2xl">{monthIncomeLimit}</h2>

            <div class="text-green-500 text-2xl">Month Spent</div>
            <h2 class="text-white text-2xl">
                {formatCurrency(balance)}
            </h2>

            <div class="text-green-500 text-2xl">Month Inc Left</div>
            <h2 class="text-white text-2xl">{formatCurrency(balance-Number({monthIncomeLimit}))}</h2>
            <!-- <h2 class="text-white text-2xl">{monthIncomeLeft}</h2> -->

            <div>----------------</div>
            <h2></h2>

            <div class="text-red-600 text-2xl">Food Limit</div>
            <h2 class="text-white text-2xl">{foodSpendLimit}</h2>

            <div class="text-red-600 text-2xl">Food Spent</div>
            <h2 class="text-white text-2xl">{foodSpent}</h2>

            <div class="text-red-600 text-2xl">Food Left</div>
            <h2 class="text-white text-2xl">{foodLeft}</h2>

            <div>----------------</div>
            <h2></h2>

            <div class="text-red-700 text-2xl">Gas Limit</div>
            <h2 class="text-white text-2xl">{gasLimit}</h2>

            <div class="text-red-700 text-2xl">Gas Spent</div>
            <h2 class="text-white text-2xl">{gasSpent}</h2>

            <div class="text-red-700 text-2xl">Gas Left</div>
            <h2 class="text-white text-2xl">{gasLeft}</h2>

            <div>----------------</div>
            <h2></h2>

            <div class="text-blue-600 text-2xl">Expenses Total</div>
            <h2 class="text-white text-2xl">{expensesTotal}</h2>

            <div class="text-blue-600 text-2xl">Expenses Paid</div>
            <h2 class="text-white text-2xl">{expensesPaid}</h2>

            <div class="text-blue-600 text-2xl">Expenses Left</div>
            <h2 class="text-white text-2xl">{expensesLeft}</h2>

            <div class="text-white text-2xl">Update with Pay</div>
            <button
                class="text-2xl bg-blue-400 rounded px-2 py-1 h-9"
                onclick={updateWithPayFunc}>Go</button
            >
        {/if}

        {#if updateWithPayBool == true}
            <h3 class="text-white text-2xl">Updated with Pay</h3>
            <h3 class="text-white text-2xl">{updatedPayVar}</h3>
        {/if}
    </div>
</div>

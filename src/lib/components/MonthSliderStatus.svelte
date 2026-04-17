<script lang="ts">
    import { show } from "@tauri-apps/api/app";
    import { onMount } from "svelte";
    import {
        formatCurrency,
        calculateMonthHBBalance,
        financeData,
        type FinanceYear,
        getFinanceMonthFin,
        getFinanceYearFin,
        calculateFoodGasOtherTotal,
    } from "$lib/stores/finance";

    import {
        calendarData,
        setCalMonthLimits,
        getFinanceMonthCal,
        getFinanceYearCal,
        type CalendarMonth,
        getMonthExpensesSpent,
    } from "$lib/stores/calendar";
    import { get } from "svelte/store";

    let { displayMonth, displayYear } = $props();

    let monthIncomeLimit = $state("");
    let foodSpendLimit: string = $state("");
    let gasSpendLimit: string = $state("");
    let showMonthStatus: boolean = $state(false);
    let updateWithPayBool: boolean = $state(false);
    let monthIncomeSpent: string = $state("");
    let foodSpent: string = $state("");
    let foodLeft: string = $state("");
    let gasLimit: string = $state("");
    let gasLeft: string = $state("");
    let gasSpent: string = $state("");
    let expensesTotal: string = $state("");
    let expensesPaid: string = $state("");
    let expensesLeft: string = $state("");

    let updatedPayVar: string = $state("");

    //Getting data from financeData
    const currentYearFromFin = $derived(
        getFinanceYearFin($financeData, displayYear),
    );
    const currentMonthFromFin = $derived(
        getFinanceMonthFin($financeData, displayYear, displayMonth),
    );

    const balanceFromFin = $derived(
        currentYearFromFin && currentMonthFromFin
            ? calculateMonthHBBalance(currentYearFromFin, currentMonthFromFin)
            : 0,
    );

    let monthIncomeLeft = $derived(
        Number(monthIncomeLimit) - Number(monthIncomeSpent),
    );

    function getMonthStatus() {
        showMonthStatus = !showMonthStatus;
        setCalMonthLimits(
            displayYear,
            displayMonth,
            monthIncomeLimit,
            foodSpendLimit,
            gasSpendLimit,
        );
        monthIncomeSpent = calculateFoodGasOtherTotal(
            $financeData,
            displayYear,
            displayMonth,
        );
    }

    function updateWithPayFunc() {
        updateWithPayBool = !updateWithPayBool;
    }

    $effect(() => {
        const presentMonth = getFinanceMonthCal(
            $calendarData,
            displayYear,
            displayMonth,
        );
        if (!presentMonth) {
            console.log(`presnt month is ${presentMonth}`);
            console.log("present Month is false");
            return;
        }

        monthIncomeLimit = presentMonth.monthBalLimit ?? "";
        gasSpendLimit = presentMonth.gasLimit ?? "";
        foodSpendLimit = presentMonth.foodLimit ?? "";
        console.log(monthIncomeLimit + gasSpendLimit + foodSpendLimit);
    });
</script>

<div class="w-[320px] mr-2">
    <div class="grid grid-cols-[70%_30%] gap-x-0 gap-y-2 items-center mt-4">
        <!-- Row 1 bind value-->
        <div class="text-white text-2xl">Month Inc Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={monthIncomeLimit}
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

        <div class="text-white text-2xl">Get Status</div>
        <button
            class="text-2xl bg-blue-400 rounded px-2 py-1 h-9"
            onclick={getMonthStatus}>Go</button
        >

        {#if showMonthStatus == true}
            <!-- Good -->
            <div class="text-green-500 text-2xl">Balance</div>
            <h2 class="text-white text-2xl">
                {formatCurrency(balanceFromFin)}
            </h2>

            <div class="text-green-500 text-2xl">Month Inc Limit</div>
            <h2 class="text-white text-2xl">{monthIncomeLimit}</h2>
            <!-- Month spent must be all moneys spent in gas, food, and other.  -->
            <!-- All expenses are to be added for the month -->

            <!-- Look for functions for get all gas, food, and other -->
            <!-- finance.ts calculateMonthGasTotal, calculateMonthFoodTotal, calculateMonthOtherTotal -->
            <!-- Look for somewhere with all expeneses -->
            <!-- This will reference where I am at presently. Additioanlly this method will have to look at  -->
            <!-- expenses on the calendar day and after by CalendarFinanceDayEntry.amount -->
            <div class="text-green-500 text-2xl">Month Spent</div>
            <h2 class="text-white text-2xl">{monthIncomeSpent}</h2>

            <div class="text-green-500 text-2xl">Month Inc Left</div>
            <h2 class="text-white text-2xl">{monthIncomeLeft}</h2>
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
            <h2 class="text-white text-2xl">{gasSpendLimit}</h2>

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

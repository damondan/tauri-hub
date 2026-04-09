//There is expenses functionality to look at in finance.ts

import { get, writable } from 'svelte/store';
import { makeId, getDaysInMonth } from '$lib/stores/general';

export interface miscExpenses {
    id: string;
    name: string;
    cost: string;
}

export interface CalendarFinanceDayEntry {
    id: string;
    name: string;
    amount: string;
    datePaid: string;
    dateDue: string;
    isPaycheck: boolean;
}

export interface CalendarDay {
    id: string;
    dayNumber: number;
    calEntries: CalendarFinanceDayEntry[];
}

export interface CalendarMonth {
    id: string;
    monthNumber: number;
    days: CalendarDay[];
}

export interface CalendarYear {
    id: string;
    yearNumber: number;
    months: CalendarMonth[];
}

export const calendarData = writable<CalendarYear[]>([]);

export function generateCalendarStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();

    const record: Record<number, number> = createMonthDaysMap(targetYear);

    calendarData.update((years) => {
        const updatedYears = [...years];

        let yearEntry = updatedYears.find(y => y.yearNumber === targetYear);

        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                yearNumber: targetYear,
                months: []
            };
            updatedYears.push(yearEntry);
        }

        for (let monthNum = 1; monthNum <= 12; monthNum++) {

            // ✅ Create month ONLY if missing
            if (!yearEntry.months[monthNum - 1]) {
                yearEntry.months[monthNum - 1] = {
                    id: makeId(),
                    monthNumber: monthNum,
                    days: []
                };
            }

            const month = yearEntry.months[monthNum - 1];

            // ✅ DO NOT reset id every time
            if (!month.id) month.id = makeId();
            month.monthNumber = monthNum;

            const numDays = record[monthNum];

            // ✅ Only initialize days if empty
            if (!month.days || month.days.length === 0) {
                month.days = Array.from({ length: numDays }, (_, i) => ({
                    id: makeId(),
                    dayNumber: i + 1,
                    calEntries: [] // unique per day
                }));
            }

            // ✅ Optional: handle month length changes (leap years, etc.)
            if (month.days.length !== numDays) {
                const existingDays = month.days;

                month.days = Array.from({ length: numDays }, (_, i) => {
                    return existingDays[i] ?? {
                        id: makeId(),
                        dayNumber: i + 1,
                        calEntries: []
                    };
                });
            }
        }

        return updatedYears;
    });
}

// export function addOrUpdateFinancial(payType: string, name: string, amount: string,
//     day: number, month: number, year: number, entry: CalendarFinanceDayEntry | null): void {
//     console.log("addOrUpdateExpense");
//     console.log("payType= " + payType + "name= " + name + " amount= " + amount + " day = " + day + " month = " + month + " year= " + year);
//      const entryId = entry ? entry.id : makeId();
//         calendarData.update((years) => {
//             return years.map((y) => {
//                 if (y.yearNumber === year) {
//                     return {
//                         ...y,
//                         months: y.months.map((m) => {
//                             if (m.monthNumber !== month) return m;
//                             return {
//                                 ...m,
//                                 days: m.days.map((d) => {
//                                     if (d.dayNumber === day) {
//                                         return {
//                                             ...d,
//                                             calEntries: [
//                                                 ...d.calEntries,
//                                                 {
//                                                     id: entryId,
//                                                     name,
//                                                     amount,
//                                                     datePaid: "",
//                                                     dateDue: String(day),
//                                                     isPaycheck: payType !== "expense"
//                                                 }
//                                             ]
//                                         };
//                                     }
//                                     return d; // ✅ must return original
//                                 })
//                             };
//                         })
//                     };
//                 }
//                 return y; // ✅ must return original
//             });
//         });
//     }

export function addOrUpdateFinancial(
    payType: string,
    name: string,
    amount: string,
    day: number,
    month: number,
    year: number,
    entry: CalendarFinanceDayEntry | null
): void {
    console.log("addOrUpdateFinancial", { payType, name, amount, day, month, year, entry });

    const entryId = entry?.id || makeId();

    calendarData.update((years) =>
        years.map((y) =>
            y.yearNumber !== year
                ? y
                : {
                    ...y,
                    months: y.months.map((m) =>
                        m.monthNumber !== month
                            ? m
                            : {
                                ...m,
                                days: m.days.map((d) =>
                                    d.dayNumber !== day
                                        ? d
                                        : {
                                            ...d,
                                            calEntries: entry
                                                ? d.calEntries.map((e) =>
                                                    e.id === entry.id
                                                        ? {
                                                            ...e,
                                                            name,
                                                            amount,
                                                            isPaycheck: payType !== "expense",
                                                            dateDue: String(day),
                                                            datePaid: e.datePaid || ""
                                                        }
                                                        : e
                                                )
                                                : [
                                                    ...d.calEntries,
                                                    {
                                                        id: entryId,
                                                        name,
                                                        amount,
                                                        datePaid: "",
                                                        dateDue: String(day),
                                                        isPaycheck: payType !== "expense"
                                                    }
                                                ]
                                        }
                                )
                            }
                    )
                }
        )
    );
}

export function removeFinancialEntry(
    entry: CalendarFinanceDayEntry,
    day: number,
    month: number,
    year: number
): void {
    const entryId: string = entry?.id;
    calendarData.update((years) =>
        years.map((y) =>
            y.yearNumber !== year
                ? y
                : {
                    ...y,
                    months: y.months.map((m) =>
                        m.monthNumber !== month
                            ? m
                            : {
                                ...m,
                                days: m.days.map((d) =>
                                    d.dayNumber !== day
                                        ? d
                                        : {
                                            ...d,
                                            calEntries: d.calEntries.filter(
                                                (entry) => entry.id !== entryId
                                            )
                                        }
                                )
                            }
                    )
                }
        )
    );
}

export function createMonthDaysMap(year: number): Record<number, number> {
    const monthDays: Record<number, number> = {};

    for (let month = 1; month <= 12; month++) {
        monthDays[month] = getDaysInMonth(year, month);
    }

    return monthDays;
}

export function getDaysInMonthCal(month: number, year: number): CalendarMonth | undefined {
    const data = get(calendarData);
    const yearEntry = data.find((y) => y.yearNumber === year);

    if (!yearEntry) { console.log("undefined"); return undefined; }

    const monthEntry = yearEntry.months.find((m) => m.monthNumber === month);
    return monthEntry;
}
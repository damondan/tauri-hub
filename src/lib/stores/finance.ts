import { writable } from 'svelte/store';
import { makeId, getDaysInMonth, getDayOfWeek} from '$lib/stores/general'

export const financeExpandedYears = writable<Record<string, boolean>>({});
export const financeExpandedMonths = writable<Record<string, boolean>>({});
export const financeExpandedWeeks = writable<Record<string, boolean>>({});

// Finance
export interface FinanceEntry {
	id: string;
	addAmount: string; // User input for addition
	subAmount: string; // User input for subtraction
	description: string;
}

export interface FinanceDay {
	id: string;
	dayNumber: number; // 1-31
	dayOfWeek: string; // 'Monday', 'Tuesday', etc.
	entries: FinanceEntry[];
}

export interface FinanceWeek {
	id: string;
	weekNumber: number; // 1, 2, 3, 4, 5
	startDay: number; // First day number in week (e.g., 1, 8, 15)
	endDay: number; // Last day number in week (e.g., 7, 14, 21)
	days: FinanceDay[];
}

export interface FinanceMonth {
	id: string;
	monthNumber: number; // 1-12 (1=January, 2=February, etc.)
	discAmount: string; // Discover card amount
	discIntAmount: string; // Discover interest amount
	amerXAmount: string; // American Express amount
	amerXIntAmount: string; // American Express interest amount
	weeks: FinanceWeek[];
}

export interface FinanceYear {
	id: string;
	year: number; // 2026, 2027, etc.
	months: FinanceMonth[];
}

export const financeData = writable<FinanceYear[]>([]);

// Generate Finance structure up to a specific date
// generateFinanceStructureToDate(targetDate: Date): void
export function generateFinanceStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    financeData.update((years) => {
        const updatedYears = [...years];
        
        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                months: []
            };
            updatedYears.push(yearEntry);
        }
        
        // Generate months up to target month
        for (let monthNum = 1; monthNum <= targetMonth; monthNum++) {
            let monthEntry = yearEntry.months.find(m => m.monthNumber === monthNum);
            if (!monthEntry) {
                monthEntry = {
                    id: makeId(),
                    monthNumber: monthNum,
                    discAmount: '',
                    discIntAmount: '',
                    amerXAmount: '',
                    amerXIntAmount: '',
                    weeks: []
                };
                yearEntry.months.push(monthEntry);
                yearEntry.months.sort((a, b) => a.monthNumber - b.monthNumber);
            }
            
            // Determine how many days to generate for this month
            const daysInMonth = getDaysInMonth(targetYear, monthNum);
            const lastDayToGenerate = monthNum === targetMonth ? targetDay : daysInMonth;
            
            // Generate weeks and days
            for (let dayNum = 1; dayNum <= lastDayToGenerate; dayNum++) {
                const weekNum = Math.ceil(dayNum / 7);
                const startDay = (weekNum - 1) * 7 + 1;
                const endDay = Math.min(weekNum * 7, daysInMonth);
                
                // Find or create week
                let weekEntry = monthEntry.weeks.find(w => w.weekNumber === weekNum);
                if (!weekEntry) {
                    weekEntry = {
                        id: makeId(),
                        weekNumber: weekNum,
                        startDay,
                        endDay,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }
                
                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: FinanceDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        entries: [{
                            id: makeId(),
                            addAmount: '',
                            subAmount: '',
                            description: ''
                        }]
                    };
                    weekEntry.days.push(dayEntry);
                    weekEntry.days.sort((a, b) => a.dayNumber - b.dayNumber);
                }
            }
        }
        
        return updatedYears;
    });
}

// Add entry to a specific day
// addFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string): string
export function addFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string
): string {
    const entryId = makeId();
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: [...d.entries, { id: entryId, addAmount: '', subAmount: '', description: '' }]
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
    return entryId;
}

// Delete entry from a day
// deleteFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string): void
export function deleteFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: d.entries.filter(e => e.id !== entryId)
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update entry field
// updateFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string, field: 'addAmount' | 'subAmount' | 'description', value: string): void
export function updateFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: 'addAmount' | 'subAmount' | 'description',
    value: string
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: d.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Calculate day total (sum of adds - sum of subs)
// calculateDayTotal(day: FinanceDay): number
export function calculateDayTotal(day: FinanceDay): number {
    let total = 0;
    if (day.entries) {
        for (const entry of day.entries) {
            const addVal = parseFloat(entry.addAmount) || 0;
            const subVal = parseFloat(entry.subAmount) || 0;
            total += addVal - subVal;
        }
    }
    return total;
}

// Calculate week total
// calculateWeekTotal(week: FinanceWeek): number
export function calculateWeekTotal(week: FinanceWeek): number {
    let total = 0;
    if (week.days) {
        for (const day of week.days) {
            total += calculateDayTotal(day);
        }
    }
    return total;
}

// Calculate month total
// calculateMonthTotal(month: FinanceMonth): number
export function calculateMonthTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            total += calculateWeekTotal(week);
        }
    }
    return total;
}

// Calculate Food total for a month
// calculateMonthFoodTotal(month: FinanceMonth): number
export function calculateMonthFoodTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            // Check if description contains the word "food" (case-insensitive, whole word only)
                            const description = entry.description.toLowerCase();
                            const words = description.split(/\s+/);
                            if (words.includes('food')) {
                                const subVal = parseFloat(entry.subAmount) || 0;
                                total += subVal;
                            }
                        }
                    }
                }
            }
        }
    }
    return total;
}

// Calculate Gas total for a month
// calculateMonthGasTotal(month: FinanceMonth): number
export function calculateMonthGasTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            // Check if description contains the word "gas" (case-insensitive, whole word only)
                            const description = entry.description.toLowerCase();
                            const words = description.split(/\s+/);
                            if (words.includes('gas')) {
                                const subVal = parseFloat(entry.subAmount) || 0;
                                total += subVal;
                            }
                        }
                    }
                }
            }
        }
    }
    return total;
}

// Calculate year total
// calculateYearTotal(year: FinanceYear): number
export function calculateYearTotal(year: FinanceYear): number {
    let total = 0;
    if (year.months) {
        for (const month of year.months) {
            total += calculateMonthTotal(month);
        }
    }
    return total;
}

// Format amount as currency
// formatCurrency(amount: number): string
export function formatCurrency(amount: number): string {
    const sign = amount >= 0 ? '' : '-';
    const abs = Math.abs(amount);
    return `${sign}$${abs.toFixed(2)}`;
}

// Update month Disc or AmerX amount
// updateFinanceMonthAmount(yearId: string, monthId: string, field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount', value: string): void
export function updateFinanceMonthAmount(
    yearId: string,
    monthId: string,
    field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount',
    value: string
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, [field]: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}
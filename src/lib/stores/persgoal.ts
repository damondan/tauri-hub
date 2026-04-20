import { writable } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';

export const persGoalExpandedYears = writable<Record<string, boolean>>({});
export const persGoalExpandedMonths = writable<Record<string, boolean>>({});
export const persGoalExpandedWeeks = writable<Record<string, boolean>>({});

export interface PersGoalEntry {
    id: string;
    description: string;
}

export interface PersGoalDay {
    id: string;
    dayNumber: number; 
    dayOfWeek: string; 
    dayPrivateGoals: string;
    priGoalCompleted: boolean; 
    priGoalRejected: boolean; 
    sleepTime: string;
    sleepWake: string;
    sleepTimeBack: string;
    sleepWakeAgain: string;
    sleepTotal: string;
    screenGoal: string;
    screenFollowed: boolean;
    entries: PersGoalEntry[];
}

export interface PersGoalWeek {
    id: string;
    weekNumber: number; // 1, 2, 3, 4, 5
    startDay: number; // First day number in week (e.g., 1, 8, 15)
    endDay: number; // Last day number in week (e.g., 7, 14, 21)
    weekPrivateGoals: string; // TV-related goals
    priGoalCompleted: boolean; // Week private goal completed
    priGoalRejected: boolean; // Week private goal rejected
    days: PersGoalDay[];
}

export interface PersGoalMonth {
    id: string;
    monthNumber: number; // 1-12 (1=January, 2=February, etc.)
    monthGoals: string; // Month- Goals
    monthPrivateGoals: string; // TV-related goals
    priGoalCompleted: boolean; // Month private goal completed
    priGoalRejected: boolean; // Month private goal rejected
    weeks: PersGoalWeek[];
}

export interface PersGoalYear {
    id: string;
    year: number; // 2026, 2027, etc.
    yearHealthGoal: string; // Year-level goals
    yearPrivateGoal: string; // Yearly private goal
    yearPrivateGoalChangeCount: number; // Count of private goal changes
    months: PersGoalMonth[];
}

export const persGoalData = writable<PersGoalYear[]>([]);

export function generatePersGoalStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    persGoalData.update((years) => {
        const updatedYears = [...years];
        
        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                yearHealthGoal: '',
                yearPrivateGoal: '',
                yearPrivateGoalChangeCount: 0,
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
                    monthGoals: '',
                    monthPrivateGoals: '',
                    priGoalCompleted: false,
                    priGoalRejected: false,
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
                        weekPrivateGoals: '',
                        priGoalCompleted: false,
                        priGoalRejected: false,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }
                
                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: PersGoalDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        dayPrivateGoals: '',
                        priGoalCompleted: false,
                        priGoalRejected: false,
                        sleepTime: '',
                        sleepWake: '',
                        sleepTimeBack: '',
                        sleepWakeAgain: '',
                        sleepTotal: '',
                        screenGoal: '',
                        screenFollowed: false,
                        entries: [{
                            id: makeId(),
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
// addHealthEntry(yearId: string, monthId: string, weekId: string, dayId: string): string
export function addHealthEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string
): string {
    const entryId = makeId();
    persGoalData.update((years) =>
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
                                    entries: [...d.entries, { id: entryId, description: '' }]
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
// deleteHealthEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string): void
export function deleteHealthEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string
): void {
    persGoalData.update((years) =>
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

// Update year goal
// updateHealthYearGoal(yearId: string, value: string): void
export function updateHealthYearGoal(
    yearId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return { ...y, yearHealthGoal: value };
            }
            return y;
        })
    );
}

// Update year private goal
// updateYearPrivateGoal(yearId: string, value: string): void
export function updateYearPrivateGoal(
    yearId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return { 
                    ...y, 
                    yearPrivateGoal: value,
                    yearPrivateGoalChangeCount: y.yearPrivateGoalChangeCount + 1
                };
            }
            return y;
        })
    );
}

// Update month goal
// updateHealthMonthGoal(yearId: string, monthId: string, value: string): void
export function updateHealthMonthGoal(
    yearId: string,
    monthId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update month private goals
// updateMonthPrivateGoals(yearId: string, monthId: string, value: string): void
export function updateMonthPrivateGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthPrivateGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update week private goals
// updateWeekPrivateGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateWeekPrivateGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    persGoalData.update((years) =>
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
                                        return { ...w, weekPrivateGoals: value };
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

// Update day private goals
// updateDayPrivateGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateDayPrivateGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    persGoalData.update((years) =>
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
                                                    return { ...d, dayPrivateGoals: value };
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

// updateDaySleepScreen(yearId: string, monthId: string, weekId: string, dayId: string, field: 'sleepTime' | 'sleepWake' | 'sleepTimeBack' | 'sleepWakeAgain' | 'sleepTotal' | 'screenGoal', value: string): void
export function updateDaySleepScreen(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    field: 'sleepTime' | 'sleepWake' | 'sleepTimeBack' | 'sleepWakeAgain' | 'sleepTotal' | 'screenGoal',
    value: string
): void {
    persGoalData.update((years) =>
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
                                                    return { ...d, [field]: value };
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

// toggleDayScreenFollowed(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleDayScreenFollowed(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
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
                                                    if (completed === true) {
                                                        return { ...d, screenFollowed: true };
                                                    } else if (completed === false) {
                                                        return { ...d, screenFollowed: false };
                                                    } else {
                                                        return { ...d, screenFollowed: !d.screenFollowed };
                                                    }
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

// Toggle day private checkbox
// toggleDayPrivateCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleDayPrivateCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
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
                                                    if (completed === true) {
                                                        // User clicked Yes
                                                        return { 
                                                            ...d, 
                                                            priGoalCompleted: true, 
                                                            priGoalRejected: false
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return { 
                                                            ...d, 
                                                            priGoalCompleted: false, 
                                                            priGoalRejected: true 
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return { 
                                                            ...d, 
                                                            priGoalCompleted: false, 
                                                            priGoalRejected: false
                                                        };
                                                    }
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

// Toggle week private checkbox
// toggleWeekPrivateCompleted(yearId: string, monthId: string, weekId: string, completed?: boolean): void
export function toggleWeekPrivateCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
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
                                        if (completed === true) {
                                            return { 
                                                ...w, 
                                                priGoalCompleted: true, 
                                                priGoalRejected: false
                                            };
                                        } else if (completed === false) {
                                            return { 
                                                ...w, 
                                                priGoalCompleted: false, 
                                                priGoalRejected: true 
                                            };
                                        } else {
                                            return { 
                                                ...w, 
                                                priGoalCompleted: false, 
                                                priGoalRejected: false
                                            };
                                        }
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

// Toggle month private checkbox
// toggleMonthPrivateCompleted(yearId: string, monthId: string, completed?: boolean): void
export function toggleMonthPrivateCompleted(
    yearId: string,
    monthId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            if (completed === true) {
                                return { 
                                    ...m, 
                                    priGoalCompleted: true, 
                                    priGoalRejected: false
                                };
                            } else if (completed === false) {
                                return { 
                                    ...m, 
                                    priGoalCompleted: false, 
                                    priGoalRejected: true 
                                };
                            } else {
                                return { 
                                    ...m, 
                                    priGoalCompleted: false, 
                                    priGoalRejected: false
                                };
                            }
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
// updateHealthEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string, field: 'description', value: string): void
export function updateHealthEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: 'description',
    value: string
): void {
    persGoalData.update((years) =>
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

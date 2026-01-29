import { writable } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';

export const healthExpandedYears = writable<Record<string, boolean>>({});
export const healthExpandedMonths = writable<Record<string, boolean>>({});
export const healthExpandedWeeks = writable<Record<string, boolean>>({});

export interface HealthEntry {
	id: string;
	description: string;
}

export interface HealthDay {
	id: string;
	dayNumber: number; // 1-31
	dayOfWeek: string; // 'Monday', 'Tuesday', etc.
	dayFoodGoals: string; // Food-related goals
	dayTVGoals: string; // TV-related goals
	daySleepGoals: string; // Sleep-related goals
	foodCompleted: boolean; // Food checkbox state
	foodRejected: boolean; // Food checkbox rejected state (clicked No)
	tvCompleted: boolean; // TV checkbox state
	tvRejected: boolean; // TV checkbox rejected state (clicked No)
	sleepCompleted: boolean; // Sleep checkbox state
	sleepRejected: boolean; // Sleep checkbox rejected state (clicked No)
	entries: HealthEntry[];
}

export interface HealthWeek {
	id: string;
	weekNumber: number; // 1, 2, 3, 4, 5
	startDay: number; // First day number in week (e.g., 1, 8, 15)
	endDay: number; // Last day number in week (e.g., 7, 14, 21)
	weekFoodGoals: string; // Food-related goals
	weekTVGoals: string; // TV-related goals
	weekSleepGoals: string; // Sleep-related goals
	days: HealthDay[];
}

export interface HealthMonth {
	id: string;
	monthNumber: number; // 1-12 (1=January, 2=February, etc.)
	monthHealthGoal: string; // Month-Health Goals
	monthFoodGoals: string; // Food-related goals
	monthTVGoals: string; // TV-related goals
	monthSleepGoals: string; // Sleep-related goals
	weeks: HealthWeek[];
}

export interface HealthYear {
	id: string;
	year: number; // 2026, 2027, etc.
	yearHealthGoal: string; // Year-level health goals
	months: HealthMonth[];
}

export const healthData = writable<HealthYear[]>([]);

export function generateHealthStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    healthData.update((years) => {
        const updatedYears = [...years];
        
        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                yearHealthGoal: '',
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
                    monthHealthGoal: '',
                    monthFoodGoals: '',
                    monthTVGoals: '',
                    monthSleepGoals: '',
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
                        weekFoodGoals: '',
                        weekTVGoals: '',
                        weekSleepGoals: '',
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }
                
                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: HealthDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        dayFoodGoals: '',
                        dayTVGoals: '',
                        daySleepGoals: '',
                        foodCompleted: false,
                        foodRejected: false,
                        tvCompleted: false,
                        tvRejected: false,
                        sleepCompleted: false,
                        sleepRejected: false,
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
    healthData.update((years) =>
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
    healthData.update((years) =>
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

// Update year health goal
// updateHealthYearGoal(yearId: string, value: string): void
export function updateHealthYearGoal(
    yearId: string,
    value: string
): void {
    healthData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return { ...y, yearHealthGoal: value };
            }
            return y;
        })
    );
}

// Update month health goal
// updateHealthMonthGoal(yearId: string, monthId: string, value: string): void
export function updateHealthMonthGoal(
    yearId: string,
    monthId: string,
    value: string
): void {
    healthData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthHealthGoal: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update month food goals
// updateHealthMonthFoodGoals(yearId: string, monthId: string, value: string): void
export function updateHealthMonthFoodGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    healthData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthFoodGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update month TV goals
// updateHealthMonthTVGoals(yearId: string, monthId: string, value: string): void
export function updateHealthMonthTVGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    healthData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthTVGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update month sleep goals
// updateHealthMonthSleepGoals(yearId: string, monthId: string, value: string): void
export function updateHealthMonthSleepGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    healthData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthSleepGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update week food goals
// updateHealthWeekFoodGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateHealthWeekFoodGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                        return { ...w, weekFoodGoals: value };
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

// Update week TV goals
// updateHealthWeekTVGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateHealthWeekTVGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                        return { ...w, weekTVGoals: value };
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

// Update week sleep goals
// updateHealthWeekSleepGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateHealthWeekSleepGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                        return { ...w, weekSleepGoals: value };
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

// Update day food goals
// updateHealthDayFoodGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateHealthDayFoodGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                                    return { ...d, dayFoodGoals: value };
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

// Update day TV goals
// updateHealthDayTVGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateHealthDayTVGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                                    return { ...d, dayTVGoals: value };
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

// Update day sleep goals
// updateHealthDaySleepGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateHealthDaySleepGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    healthData.update((years) =>
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
                                                    return { ...d, daySleepGoals: value };
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

// Toggle day food checkbox
// toggleHealthDayFoodCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleHealthDayFoodCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    healthData.update((years) =>
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
                                                            foodCompleted: true, 
                                                            foodRejected: false,
                                                            dayFoodGoals: 'You chose Hope over Despair!' 
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return { 
                                                            ...d, 
                                                            foodCompleted: false, 
                                                            foodRejected: true 
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return { 
                                                            ...d, 
                                                            foodCompleted: false, 
                                                            foodRejected: false,
                                                            dayFoodGoals: '' 
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

// Toggle day TV checkbox
// toggleHealthDayTVCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleHealthDayTVCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    healthData.update((years) =>
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
                                                            tvCompleted: true, 
                                                            tvRejected: false,
                                                            dayTVGoals: 'You chose Hope over Despair' 
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return { 
                                                            ...d, 
                                                            tvCompleted: false, 
                                                            tvRejected: true 
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return { 
                                                            ...d, 
                                                            tvCompleted: false, 
                                                            tvRejected: false,
                                                            dayTVGoals: '' 
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

// Toggle day sleep checkbox
// toggleHealthDaySleepCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleHealthDaySleepCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    healthData.update((years) =>
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
                                                            sleepCompleted: true, 
                                                            sleepRejected: false,
                                                            daySleepGoals: 'You chose Hope over Despair' 
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return { 
                                                            ...d, 
                                                            sleepCompleted: false, 
                                                            sleepRejected: true 
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return { 
                                                            ...d, 
                                                            sleepCompleted: false, 
                                                            sleepRejected: false,
                                                            daySleepGoals: '' 
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
    healthData.update((years) =>
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

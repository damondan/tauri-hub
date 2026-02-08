import { writable } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';

export const goalExpandedYears = writable<Record<string, boolean>>({});
export const goalExpandedMonths = writable<Record<string, boolean>>({});
export const goalExpandedWeeks = writable<Record<string, boolean>>({});

export interface GoalEntry {
	id: string;
	description: string;
}

export interface GoalDay {
	id: string;
	dayNumber: number; // 1-31
	dayOfWeek: string; // 'Monday', 'Tuesday', etc.
	dayPrivateGoals: string; // TV-related goals
	dayProfessionalGoals: string; // Sleep-related goals
	priGoalCompleted: boolean; // TV checkbox state
	priGoalRejected: boolean; // TV checkbox rejected state (clicked No)
	proGoalCompleted: boolean; // Sleep checkbox state
	proGoalRejected: boolean; // Sleep checkbox rejected state (clicked No)
	entries: GoalEntry[];
}

export interface GoalWeek {
	id: string;
	weekNumber: number; // 1, 2, 3, 4, 5
	startDay: number; // First day number in week (e.g., 1, 8, 15)
	endDay: number; // Last day number in week (e.g., 7, 14, 21)
	weekPrivateGoals: string; // TV-related goals
	weekProfessionalGoals: string; // Sleep-related goals
	priGoalCompleted: boolean; // Week private goal completed
	priGoalRejected: boolean; // Week private goal rejected
	proGoalCompleted: boolean; // Week professional goal completed
	proGoalRejected: boolean; // Week professional goal rejected
	days: GoalDay[];
}

export interface GoalMonth {
	id: string;
	monthNumber: number; // 1-12 (1=January, 2=February, etc.)
	monthGoals: string; // Month- Goals
	monthPrivateGoals: string; // TV-related goals
	monthProfessionalGoals: string; // Sleep-related goals
	priGoalCompleted: boolean; // Month private goal completed
	priGoalRejected: boolean; // Month private goal rejected
	proGoalCompleted: boolean; // Month professional goal completed
	proGoalRejected: boolean; // Month professional goal rejected
	weeks: GoalWeek[];
}

export interface GoalYear {
	id: string;
	year: number; // 2026, 2027, etc.
	yearHealthGoal: string; // Year-level goals
	yearPrivateGoal: string; // Yearly private goal
	yearProfessionalGoal: string; // Yearly professional goal
	yearPrivateGoalChangeCount: number; // Count of private goal changes
	yearProfessionalGoalChangeCount: number; // Count of professional goal changes
	months: GoalMonth[];
}

export const goalData = writable<GoalYear[]>([]);

export function generateGoalStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    goalData.update((years) => {
        const updatedYears = [...years];
        
        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                yearHealthGoal: '',
                yearPrivateGoal: '',
                yearProfessionalGoal: '',
                yearPrivateGoalChangeCount: 0,
                yearProfessionalGoalChangeCount: 0,
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
                    monthProfessionalGoals: '',
                    priGoalCompleted: false,
                    priGoalRejected: false,
                    proGoalCompleted: false,
                    proGoalRejected: false,
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
                        weekProfessionalGoals: '',
                        priGoalCompleted: false,
                        priGoalRejected: false,
                        proGoalCompleted: false,
                        proGoalRejected: false,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }
                
                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: GoalDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        dayPrivateGoals: '',
                        dayProfessionalGoals: '',
                        priGoalCompleted: false,
                        priGoalRejected: false,
                        proGoalCompleted: false,
                        proGoalRejected: false,
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
    goalData.update((years) =>
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
    goalData.update((years) =>
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
    goalData.update((years) =>
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
    goalData.update((years) =>
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

// Update year professional goal
// updateYearProfessionalGoal(yearId: string, value: string): void
export function updateYearProfessionalGoal(
    yearId: string,
    value: string
): void {
    goalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return { 
                    ...y, 
                    yearProfessionalGoal: value,
                    yearProfessionalGoalChangeCount: y.yearProfessionalGoalChangeCount + 1
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
    goalData.update((years) =>
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
    goalData.update((years) =>
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

// Update month professional goals
// updateMonthProfessionalGoals(yearId: string, monthId: string, value: string): void
export function updateMonthProfessionalGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    goalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthProfessionalGoals: value };
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
    goalData.update((years) =>
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

// Update week professional goals
// updateWeekProfessionalGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateWeekProfessionalGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    goalData.update((years) =>
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
                                        return { ...w, weekProfessionalGoals: value };
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
    goalData.update((years) =>
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

// Update day professional goals
// updateDayProfessionalGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateDayProfessionalGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    goalData.update((years) =>
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
                                                    return { ...d, dayProfessionalGoals: value };
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
    goalData.update((years) =>
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

// Toggle day professional checkbox
// toggleDayProfessionalCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleDayProfessionalCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    goalData.update((years) =>
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
                                                            proGoalCompleted: true, 
                                                            proGoalRejected: false
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return { 
                                                            ...d, 
                                                            proGoalCompleted: false, 
                                                            proGoalRejected: true 
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return { 
                                                            ...d, 
                                                            proGoalCompleted: false, 
                                                            proGoalRejected: false
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
    goalData.update((years) =>
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

// Toggle week professional checkbox
// toggleWeekProfessionalCompleted(yearId: string, monthId: string, weekId: string, completed?: boolean): void
export function toggleWeekProfessionalCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    completed?: boolean
): void {
    goalData.update((years) =>
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
                                                proGoalCompleted: true, 
                                                proGoalRejected: false
                                            };
                                        } else if (completed === false) {
                                            return { 
                                                ...w, 
                                                proGoalCompleted: false, 
                                                proGoalRejected: true 
                                            };
                                        } else {
                                            return { 
                                                ...w, 
                                                proGoalCompleted: false, 
                                                proGoalRejected: false
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
    goalData.update((years) =>
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

// Toggle month professional checkbox
// toggleMonthProfessionalCompleted(yearId: string, monthId: string, completed?: boolean): void
export function toggleMonthProfessionalCompleted(
    yearId: string,
    monthId: string,
    completed?: boolean
): void {
    goalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            if (completed === true) {
                                return { 
                                    ...m, 
                                    proGoalCompleted: true, 
                                    proGoalRejected: false
                                };
                            } else if (completed === false) {
                                return { 
                                    ...m, 
                                    proGoalCompleted: false, 
                                    proGoalRejected: true 
                                };
                            } else {
                                return { 
                                    ...m, 
                                    proGoalCompleted: false, 
                                    proGoalRejected: false
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
    goalData.update((years) =>
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

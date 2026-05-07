import { writable } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';

export const persGoalExpandedYears = writable<Record<string, boolean>>({});
export const persGoalExpandedMonths = writable<Record<string, boolean>>({});
export const persGoalExpandedWeeks = writable<Record<string, boolean>>({});
//persGoalHighlights.set(data.persGoalHighlights ?? []);

interface HighlightLevel3 {
    text: string;
}

interface HighlightLevel2 {
    text: string;
    children: Record<string, HighlightLevel3>;
}

export interface HighlightLevel1 {
    text: string;
    children: Record<string, HighlightLevel2>;
}

export const persGoalHighlights = writable<Record<string, HighlightLevel1>>({});

export interface PersGoalEntry {
    id: string;
    description: string;
}

type PersImage = {
  id: string;
  dataUrl: string;
};

export interface PersGoalDay {
    id: string;
    dayNumber: number; 
    dayOfWeek: string; 
    dayPrivateGoals?: string;
    priGoalCompleted?: boolean; 
    priGoalRejected?: boolean; 
    sleepTime?: string;
    sleepWake?: string;
    sleepTimeBack?: string;
    sleepWakeAgain?: string;
    sleepTotal?: string;
    screenGoal?: string;
    screenFollowed?: boolean;
    dayImage?: PersImage;
    isDream?: boolean;
    highlight?: boolean;
    entries: PersGoalEntry[];
}

export interface PersGoalWeek {
    id: string;
    weekNumber: number; // 1, 2, 3, 4, 5
    startDay: number; // First day number in week (e.g., 1, 8, 15)
    endDay: number; // Last day number in week (e.g., 7, 14, 21)
    weekPrivateGoals?: string; // TV-related goals
    priGoalCompleted?: boolean; // Week private goal completed
    priGoalRejected?: boolean; // Week private goal rejected
    weekImage?: PersImage;
    days: PersGoalDay[];
}

export interface PersGoalMonth {
    id: string;
    monthNumber: number; // 1-12 (1=January, 2=February, etc.)
    monthGoals?: string; // Month- Goals
    monthPrivateGoals?: string; // TV-related goals
    priGoalCompleted?: boolean; // Month private goal completed
    priGoalRejected?: boolean; // Month private goal rejected
    monthImage?: PersImage;
    weeks: PersGoalWeek[];
}

export interface PersGoalYear {
    id: string;
    year: number; // 2026, 2027, etc.
    yearHealthGoal?: string; // Year-level goals
    yearPrivateGoal?: string; // Yearly private goal
    yearPrivateGoalChangeCount: number; // Count of private goal changes
    yearImage?: PersImage;
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
                    const dayEntry: PersGoalDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        entries: [{
                            id: makeId(),
                            description:""
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

export function updateDayImage(dataUrl: string, year: string, month: string, week:string, day:string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === day) {
                                                    return { ...d, 
                                                        dayImage: {
                                                            id:makeId(),
                                                            dataUrl
                                                        } 
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

export function updateWeekImage(dataUrl: string, year: string, month: string, week:string): void {
persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                           weekImage : {
                                            id:makeId(),
                                            dataUrl
                                           }
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

export function updateMonthImage(dataUrl: string, year: string, month: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                               monthImage: {
                                id: makeId(),
                                dataUrl
                               }
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

export function updateYearImage(dataUrl: string, year: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                   yearImage:{
                    id:makeId(),
                    dataUrl
                   }
                };
            }
            return y;
        })
    );
}

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

export function removeDayImage(year: string, month: string, week:string, day:string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === day) {
                                                    return { ...d, 
                                                        dayImage: undefined
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

export function removeWeekImage(year: string, month: string, week:string): void {
persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                           weekImage : undefined
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

export function removeMonthImage(year: string, month: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                               monthImage: undefined
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

export function removeYearImage(year: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                   yearImage: undefined
                };
            }
            return y;
        })
    );
}

export function updateDayIsDream(year:string,month:string,week:string,day:string, value:boolean):void {
    persGoalData.update(years =>
    years.map(y =>
      y.id === year
        ? {
            ...y,
            months: y.months.map(m =>
              m.id === month
                ? {
                    ...m,
                    weeks: m.weeks.map(w =>
                      w.id === week
                        ? {
                            ...w,
                            days: w.days.map(d =>
                              d.id === day
                                ? { ...d, isDream: value }
                                : d
                            )
                          }
                        : w
                    )
                  }
                : m
            )
          }
        : y
    )
  );
}

export function  updateHighlight(
                                  yearid:string,
                                  monthid: string,
                                  weekid: string,
                                  dayid:string,
                                  value:boolean
                                ):void{
     persGoalData.update(years =>
    years.map(y =>
      y.id === yearid
        ? {
            ...y,
            months: y.months.map(m =>
              m.id === monthid
                ? {
                    ...m,
                    weeks: m.weeks.map(w =>
                      w.id === weekid
                        ? {
                            ...w,
                            days: w.days.map(d =>
                              d.id === dayid
                                ? { ...d, highlight: value }
                                : d
                            )
                          }
                        : w
                    )
                  }
                : m
            )
          }
        : y
    )
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

//PersGoalHighlight functions
export function addHighlightItem() {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [id]: {
            text: "",
            children: {}
        }
    }));
}

export function addSubHighlight(
    parentId: string
) {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [id]: {
                    text: "",
                    children: {}
                }
            }
        }
    }));
}

export function addDetailHighlight(
    parentId: string,
    childId: string
) {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [id]: {
                            text: ""
                        }
                    }
                }
            }
        }
    }));
}

export function removeHighlight(
    id: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };
        delete updated[id];
        return updated;
    });
}

export function removeSubHighlight(
    parentId: string,
    childId: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };

        delete updated[parentId]
            .children?.[childId];

        return updated;
    });
}

export function removeDetailHighlight(
    parentId: string,
    childId: string,
    detailId: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };

        delete updated[parentId]
            .children?.[childId]
            .children?.[detailId];

        return updated;
    });
}

export function updateTopHighlight(
    id: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [id]: {
            ...highlights[id],
            text: value
        }
    }));
}

export function updateSubHighlight(
    parentId: string,
    childId: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    text: value
                }
            }
        }
    }));
}

export function updateDetailHighlight(
    parentId: string,
    childId: string,
    detailId: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [detailId]: {
                            ...highlights[parentId]
                                .children![childId]
                                .children![detailId],
                            text: value
                        }
                    }
                }
            }
        }
    }));
}

export function migratePersGoalHighlights(
  data: any
): Record<string, HighlightLevel1> {
  // No migration needed yet.
  // This exists to support future schema changes.

  return data as Record<string, HighlightLevel1>;
}
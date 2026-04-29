interface AppSessionPersState {
	showOnlyLast: boolean;
    expandedRows: Record<string, boolean>;
}

export const appPersState = $state<AppSessionPersState>({
    showOnlyLast: false,
    expandedRows: {} as Record<string,boolean>,
});


interface AppSessionProfState {
	showOnlyLast: boolean;
    expandedRowsProf: Record<string, boolean>;
}

export const appProfState = $state<AppSessionProfState>({
    showOnlyLast: false,
    expandedRowsProf: {} as Record<string,boolean>,

});
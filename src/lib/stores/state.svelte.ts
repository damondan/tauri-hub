interface AppSessionPersState {
	showOnlyLast: boolean;
}

export const appPersState = $state<AppSessionPersState>({
    showOnlyLast: false,
});


interface AppSessionProfState {
	showOnlyLast: boolean;
}

export const appProfState = $state<AppSessionProfState>({
    showOnlyLast: false,
});
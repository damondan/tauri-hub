// src/lib/stores/general.ts

// Helper: generate unique id
export function makeId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Helper: get today as YYYY-MM-DD
// todayKey(): string
export function todayKey(): string {
	const d = new Date();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${month}-${day}`;
}

// ===== FINANCE and HEALTH HELPERS =====
const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// getMonthName(monthNumber: number): string
export function getMonthName(monthNumber: number): string {
	return MONTH_NAMES[monthNumber - 1] || '';
}

// getDayOfWeek(year: number, month: number, day: number): string
export function getDayOfWeek(year: number, month: number, day: number): string {
	const date = new Date(year, month - 1, day);
	return DAY_NAMES[date.getDay()];
}

// getDaysInMonth(year: number, month: number): number
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

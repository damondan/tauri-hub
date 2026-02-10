// src/lib/utils/textareaResize.ts

/**
 * resizeTextarea(textarea: HTMLTextAreaElement): void
 * Auto-resize a single textarea to fit its content
 */
export function resizeTextarea(textarea: HTMLTextAreaElement): void {
	textarea.style.height = 'auto';
	textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * autoResize(textarea: HTMLTextAreaElement): { update: () => void; destroy: () => void }
 * Svelte action that auto-resizes textarea on mount and input
 */
export function autoResize(textarea: HTMLTextAreaElement) {
	// Resize immediately on mount
	resizeTextarea(textarea);

	return {
		update() {
			// Re-resize when the value binding changes
			resizeTextarea(textarea);
		},
		destroy() {
			// Cleanup if needed
		}
	};
}

/**
 * Auto-resize all textareas in the document
 */
export function resizeAllTextareas(): void {
	const textareas = document.querySelectorAll('textarea');
	textareas.forEach((textarea) => {
		if (textarea instanceof HTMLTextAreaElement) {
			resizeTextarea(textarea);
		}
	});
}

/**
 * Setup window resize listener to recalculate textarea heights
 * Returns cleanup function
 */
export function setupTextareaResizeListener(): () => void {
	const handleResize = () => {
		resizeAllTextareas();
	};

	window.addEventListener('resize', handleResize);

	return () => {
		window.removeEventListener('resize', handleResize);
	};
}

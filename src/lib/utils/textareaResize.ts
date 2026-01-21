// src/lib/utils/textareaResize.ts

/**
 * Auto-resize a single textarea to fit its content
 */
export function resizeTextarea(textarea: HTMLTextAreaElement): void {
	textarea.style.height = 'auto';
	textarea.style.height = textarea.scrollHeight + 'px';
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

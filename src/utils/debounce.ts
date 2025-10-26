// Debounce utility to prevent excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debouncedFunction(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}

// Throttle utility to limit function execution rate
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastExecutionTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttledFunction(...args: Parameters<T>) {
    const currentTime = Date.now();
    const timeSinceLastExecution = currentTime - lastExecutionTime;

    if (timeSinceLastExecution >= limitMs) {
      func(...args);
      lastExecutionTime = currentTime;
    } else {
      // Schedule execution for when the limit period expires
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecutionTime = Date.now();
        timeoutId = null;
      }, limitMs - timeSinceLastExecution);
    }
  };
}

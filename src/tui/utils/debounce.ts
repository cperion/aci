/**
 * Debounce utility for optimizing search performance
 * Prevents excessive API calls during rapid typing
 */

// Store active timeouts by key for cancellation
const debounceTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Debounce a function call with configurable delay
 * @param fn Function to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 * @param key Unique key for this debounce instance (default: 'default')
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  key: string = 'default'
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    // Cancel previous timeout for this key
    const existingTimeout = debounceTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      debounceTimeouts.delete(key);
      fn(...args);
    }, delay);
    
    debounceTimeouts.set(key, timeout);
  };
}

/**
 * Throttle a function to limit execution frequency
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @param key Unique key for this throttle instance
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300,
  key: string = 'default'
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  const throttleKey = `throttle_${key}`;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cancel all pending debounced calls
 */
export function cancelAllDebounces(): void {
  debounceTimeouts.forEach(timeout => clearTimeout(timeout));
  debounceTimeouts.clear();
}

/**
 * Cancel debounced calls for a specific key
 */
export function cancelDebounce(key: string): void {
  const timeout = debounceTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    debounceTimeouts.delete(key);
  }
}
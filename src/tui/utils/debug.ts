/**
 * Debug utilities for monitoring state updates and detecting loops
 */

// Simple debug log function
export const debugLog = (operation: string, data: any, category: string = 'system') => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${category.toUpperCase()}] ${operation}:`, data);
  }
};
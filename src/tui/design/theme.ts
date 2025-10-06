/**
 * Simplified theme hook for components
 * Provides access to current theme colors and roles
 */

import { useColorRoles } from './roles.js';

export type Theme = ReturnType<typeof useColorRoles>;

/**
 * Hook to get the current theme
 * This is a re-export of useColorRoles for convenience
 */
export function useTheme(): Theme {
  return useColorRoles();
}
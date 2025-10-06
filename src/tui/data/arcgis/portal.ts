/**
 * ArcGIS Portal Data Layer - Re-exports from adapters
 * This file provides backward compatibility while routing through the service layer
 */

export {
  listPortalRoot,
  listPortalUsers,
  listPortalGroups,
  listPortalItems,
  listPortalItemOperations,
  commandService
} from '../adapters.js';

// Legacy exports - these are now handled by the adapters but kept for compatibility
export const listPortalUserItems = async (): Promise<any[]> => {
  // User items are now handled as part of the user listing in adapters
  return [];
};

// Re-export types for compatibility
export type { Node } from '../types.js';
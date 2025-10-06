/**
 * ArcGIS Server Data Layer - Re-exports from adapters
 * This file provides backward compatibility while routing through the service layer
 */

export {
  listServerRoot,
  listServiceChildren,
  listLayerOperations,
  commandService
} from '../adapters.js';

// Legacy exports - these are now handled by the adapters but kept for compatibility
export const listServerFolder = async (): Promise<any[]> => {
  // Server folders are now handled as part of the service listing in adapters
  return [];
};

// Re-export types for compatibility
export type { Node } from '../types.js';
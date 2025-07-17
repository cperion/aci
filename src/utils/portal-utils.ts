import { getSession } from '../session.js';
import type { UserSession } from '../types/arcgis-raw.js';

/**
 * Safe error handling for portal operations
 */
export function handlePortalError(error: unknown, operation: string, options?: { debug?: boolean }): never {
  if (error instanceof Error) {
    console.error(`Failed to ${operation}: ${error.message}`);
    if (options?.debug) {
      console.error(error);
    }
  } else {
    console.error(`Failed to ${operation}: Unknown error occurred`);
    if (options?.debug) {
      console.error('Error details:', error);
    }
  }
  process.exit(1);
}

/**
 * Get authenticated session with validation
 */
export async function getAuthenticatedSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    console.error('Not authenticated. Please run: aci login');
    process.exit(1);
  }
  return session;
}

/**
 * Build sharing REST URL from session portal
 */
export function buildSharingRestUrl(session: UserSession): string {
  return `${session.portal}/portal/sharing/rest`;
}

/**
 * Safe date formatting with fallback
 */
export function formatDate(timestamp?: number): string {
  if (!timestamp) return 'Unknown';
  
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Parse and validate limit parameter
 */
export function parseLimit(limit?: string, defaultLimit: number = 10, maxLimit: number = 100): number {
  if (!limit) return defaultLimit;
  
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return defaultLimit;
  
  return Math.min(parsed, maxLimit);
}

/**
 * Validate portal API response
 */
export function validateApiResponse(response: unknown): void {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid API response format');
  }
  
  const apiResponse = response as { error?: { message: string; code: number } };
  if (apiResponse.error) {
    throw new Error(`Portal API error (${apiResponse.error.code}): ${apiResponse.error.message}`);
  }
}
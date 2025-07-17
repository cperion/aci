import { arcgisPostRequest, arcgisRequest, normalizeServerUrl } from './http-client.js';
import type { UserSession, FederatedToken } from '../types/arcgis-raw.js';
import { isTokenResponse } from '../types/arcgis-raw.js';

// Simple in-memory token store with size limits to prevent memory leaks
const MAX_CACHE_SIZE = parseInt(process.env.MAX_TOKEN_CACHE || '100');
const tokenStore = new Map<string, FederatedToken>();

/**
 * Compresses the token cache when it exceeds size limits
 * Removes expired tokens first, then oldest entries
 */
function compressTokenCache(): void {
  if (tokenStore.size <= MAX_CACHE_SIZE) return;

  const now = Date.now();
  
  // Priority 1: Remove expired tokens
  const expiredKeys = Array.from(tokenStore.entries())
    .filter(([_, token]) => token.expires <= now)
    .map(([key]) => key);
  
  expiredKeys.forEach(key => tokenStore.delete(key));
  
  // Priority 2: If still over limit, remove oldest entries
  if (tokenStore.size > MAX_CACHE_SIZE) {
    const keysToRemove = Array.from(tokenStore.keys())
      .slice(0, tokenStore.size - MAX_CACHE_SIZE);
    
    keysToRemove.forEach(key => tokenStore.delete(key));
  }
}

/**
 * Gets a federated token for an ArcGIS Server from a Portal session
 * Uses simple Map to avoid repeated token generation requests
 */
export async function getFederatedToken(
  portalSession: UserSession,
  serverUrl: string
): Promise<string> {
  const normalizedUrl = normalizeServerUrl(serverUrl);
  
  // Check cache first (with 2-minute buffer for safety)
  const cached = tokenStore.get(normalizedUrl);
  if (cached && Date.now() < cached.expires - 120000) {
    return cached.token;
  }
  
  try {
    // Generate new federated token via Portal
    const federatedToken = await generateServerToken(portalSession, normalizedUrl);
    
    // Store the token
    tokenStore.set(normalizedUrl, {
      token: federatedToken,
      expires: Date.now() + 3600000, // 1 hour
      server: normalizedUrl
    });
    
    // Compress cache if needed to prevent memory leaks
    compressTokenCache();
    
    return federatedToken;
    
  } catch (error) {
    // Handle federation failures gracefully
    return handleFederationFailure(portalSession, normalizedUrl, error);
  }
}

/**
 * Generates a server token through Portal federation
 */
async function generateServerToken(
  session: UserSession,
  serverUrl: string
): Promise<string> {
  // Use the correct enterprise portal token generation endpoint
  const tokenEndpoint = `${session.portal}/generateToken`;
  
  const response = await arcgisPostRequest(tokenEndpoint, {
    serverUrl,
    expiration: '60', // 1 hour (as string)
  }, session);

  if (!isTokenResponse(response)) {
    throw new Error(`Failed to generate federated token for ${serverUrl}`);
  }

  return response.token;
}

/**
 * Handles federation failures - fail fast for security
 */
function handleFederationFailure(
  session: UserSession,
  serverUrl: string,
  error: any
): never {
  console.error(`Federation failed for ${serverUrl}: ${error.message}`);
  
  // Provide specific guidance based on error type
  if (error.message?.includes('not federated') || error.code === 498) {
    throw new Error(`Server ${serverUrl} is not federated with portal ${session.portal}. Configure federation or use direct server authentication.`);
  }
  
  // Network/firewall issues
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new Error(`Cannot reach server ${serverUrl}. Check network connectivity and firewall settings.`);
  }
  
  // Re-throw with context
  throw new Error(`Federation token generation failed for ${serverUrl}: ${error.message}`);
}


/**
 * Checks if a server is federated with the given portal
 */
export async function isServerFederated(
  portalUrl: string,
  serverUrl: string
): Promise<boolean> {
  try {
    const serverInfo = await arcgisRequest(`${serverUrl}/rest/info`);
    
    if (serverInfo.portalUrl) {
      const serverPortal = normalizeServerUrl(serverInfo.portalUrl);
      const sessionPortal = normalizeServerUrl(portalUrl);
      return serverPortal === sessionPortal;
    }
    
    return false;
  } catch {
    // If we can't reach the server or get its info, assume not federated
    return false;
  }
}

/**
 * Clears the federation token cache
 */
export function clearFederationCache(): void {
  tokenStore.clear();
}

/**
 * Gets cache statistics for debugging
 */
export function getFederationCacheStats() {
  return {
    size: tokenStore.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(tokenStore.keys())
  };
}
import { request } from '@esri/arcgis-rest-request';
import { UserSession } from '@esri/arcgis-rest-auth';

interface FederatedToken {
  token: string;
  expires: number;
  server: string;
}

// Simple in-memory token store (replaces LRU cache)
const tokenStore = new Map<string, FederatedToken>();

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
  
  const response = await request(tokenEndpoint, {
    httpMethod: 'POST',
    params: {
      serverUrl,
      token: session.token,
      expiration: 60, // 1 hour
      f: 'json'
    },
    authentication: session
  });

  if (!response.token) {
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
 * Normalizes server URLs for consistent caching
 */
function normalizeServerUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove path and query parameters, keep just protocol + host + port
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

/**
 * Checks if a server is federated with the given portal
 */
export async function isServerFederated(
  portalUrl: string,
  serverUrl: string
): Promise<boolean> {
  try {
    const serverInfo = await request(`${serverUrl}/rest/info`, {
      params: { f: 'json' }
    });
    
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
    keys: Array.from(tokenStore.keys())
  };
}
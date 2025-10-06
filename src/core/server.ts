/**
 * Core Server Functions - Pure data layer without console I/O
 * Provides reusable server operations for both CLI and TUI
 */

import { ArcGISServerAdminClient } from '../services/admin-client.js';
import { arcgisRequest } from '../services/http-client.js';
import { getSession } from '../session.js';
import type { AdminSession } from '../session.js';
import type { UserSession } from '../types/arcgis-raw.js';
import type { ServiceInfo } from '../services/admin-client.js';
import type { QueryResponse, ServiceInfo as ServiceMetadata } from '../types/arcgis-raw.js';

export interface ServerSearchParams {
  query?: string;
  session?: AdminSession | UserSession;
}

export interface InspectParams {
  url: string;
  session?: AdminSession | UserSession;
}

export interface QueryParams {
  where?: string;
  limit?: number;
  session?: UserSession;
}

/**
 * List all services available on the server
 * Uses admin client if admin session is available, otherwise falls back to public directory
 */
export async function listServices(session?: AdminSession | UserSession): Promise<Array<{ name: string; type: string; status?: string; description?: string }>> {
  // Try admin client first if we have admin session
  const adminSession = session && 'adminToken' in session ? session as AdminSession : null;
  
  if (adminSession) {
    try {
      const adminClient = new ArcGISServerAdminClient(adminSession);
      const services = await adminClient.listServices();
      
      return services.map((service: ServiceInfo) => ({
        name: service.serviceName,
        type: service.type,
        status: service.status,
        description: service.description
      }));
    } catch (error) {
      // Fall back to public directory if admin access fails
      console.warn('Admin access failed, falling back to public service directory');
    }
  }
  
  // Fallback to public services directory
  const userSession = session && 'token' in session ? session as UserSession : null;
  if (userSession) {
    try {
      const baseUrl = userSession.portal.replace('/portal/sharing/rest', '/arcgis/rest/services');
      const response = await arcgisRequest(`${baseUrl}?f=json`, {}, userSession);
      
      const services: Array<{ name: string; type: string; status?: string; description?: string }> = [];
      
      if (response.services) {
        for (const service of response.services) {
          services.push({
            name: service.name,
            type: service.type,
            status: 'UNKNOWN', // Public directory doesn't provide status
            description: ''
          });
        }
      }
      
      return services;
    } catch (error) {
      throw new Error(`Failed to list services: ${(error as Error).message}`);
    }
  }
  
  throw new Error('No session available for service listing');
}

/**
 * Inspect a service to get detailed metadata including layers and tables
 */
export async function inspectService(url: string, session?: AdminSession | UserSession): Promise<any> {
  // Try to get service info using the provided session
  const userSession = session && 'token' in session ? session as UserSession : null;
  
  if (userSession) {
    try {
      const serviceUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const response = await arcgisRequest(`${serviceUrl}?f=json`, {}, userSession);
      return response;
    } catch (error) {
      // Try without session if authenticated request fails
      try {
        const serviceUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const response = await arcgisRequest(`${serviceUrl}?f=json`);
        return response;
      } catch (fallbackError) {
        throw new Error(`Failed to inspect service: ${(error as Error).message}`);
      }
    }
  }
  
  // Try without session
  try {
    const serviceUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const response = await arcgisRequest(`${serviceUrl}?f=json`);
    return response;
  } catch (error) {
    throw new Error(`Failed to inspect service: ${(error as Error).message}`);
  }
}

/**
 * Query features from a feature service layer
 */
export async function queryFeatures(url: string, options: QueryParams = {}): Promise<any> {
  const { where = '1=1', limit = 10, session } = options;
  
  // Build query parameters
  const queryParams: Record<string, string> = {
    where,
    outFields: '*',
    resultRecordCount: String(limit),
    returnGeometry: 'true',
    f: 'json'
  };
  
  // Add token if session is provided
  if (session?.token) {
    queryParams.token = session.token;
  }
  
  try {
    const response = await arcgisRequest(url, queryParams, session);
    return response;
  } catch (error) {
    throw new Error(`Failed to query features: ${(error as Error).message}`);
  }
}

/**
 * Get service directory information
 */
export async function getServiceDirectory(baseUrl: string, session?: UserSession): Promise<any> {
  const serviceUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const directoryUrl = `${serviceUrl}?f=json`;
  
  try {
    const response = await arcgisRequest(directoryUrl, {}, session);
    return response;
  } catch (error) {
    throw new Error(`Failed to get service directory: ${(error as Error).message}`);
  }
}

/**
 * Get layer information from a service
 */
export async function getLayerInfo(serviceUrl: string, layerId: number, session?: UserSession): Promise<any> {
  const url = `${serviceUrl}/${layerId}?f=json`;
  
  try {
    const response = await arcgisRequest(url, {}, session);
    return response;
  } catch (error) {
    throw new Error(`Failed to get layer info: ${(error as Error).message}`);
  }
}

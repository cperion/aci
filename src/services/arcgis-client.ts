/**
 * ArcGIS REST API client using raw HTTP calls
 * Replaces hybrid SDK approach with consistent raw API
 */

import { arcgisRequest, isSameOrigin } from './http-client.js';
import { getFederatedToken } from './federation.js';
import type { 
  UserSession, 
  QueryOptions, 
  QueryResponse, 
  ServiceInfo, 
  LayerInfo
} from '../types/arcgis-raw.js';
import {
  isQueryResponse,
  isServiceInfo,
  isLayerInfo
} from '../types/arcgis-raw.js';

export async function getServiceInfo(url: string, session?: UserSession): Promise<ServiceInfo> {
  // Clean URL to get service root
  const serviceUrl = url.replace(/\/\d+$/, '');
  
  const response = await arcgisRequest(serviceUrl, {}, session);
  
  if (!isServiceInfo(response)) {
    throw new Error('Invalid service info response');
  }
  
  return response;
}

export async function getLayerInfo(url: string, layerId: number, session?: UserSession): Promise<LayerInfo> {
  const layerUrl = `${url}/${layerId}`;
  
  const response = await arcgisRequest(layerUrl, {}, session);
  
  if (!isLayerInfo(response)) {
    throw new Error('Invalid layer info response');
  }
  
  return response;
}

export async function queryFeatures(
  url: string, 
  options: QueryOptions, 
  session?: UserSession
): Promise<QueryResponse> {
  // Ensure URL points to a layer (append /0 if it's just a service)
  let queryUrl = url;
  if (!url.match(/\/\d+$/)) {
    queryUrl = `${url}/0`;
  }
  
  // Add /query endpoint
  const fullQueryUrl = `${queryUrl}/query`;
  
  // Build query parameters
  const params = {
    where: options.where || '1=1',
    outFields: (options.outFields || ['*']).join(','),
    resultRecordCount: (options.resultRecordCount || 10).toString(),
    returnGeometry: (options.returnGeometry !== false).toString(),
  };
  
  // Handle federated authentication if needed
  let effectiveSession = session;
  if (session && !isSameOrigin(url, session.portal)) {
    try {
      const federatedToken = await getFederatedToken(session, new URL(url).origin);
      effectiveSession = { ...session, token: federatedToken };
    } catch (error) {
      console.warn(`Federation failed, using portal token: ${(error as Error).message}`);
    }
  }
  
  const response = await arcgisRequest(fullQueryUrl, params, effectiveSession);
  
  if (!isQueryResponse(response)) {
    throw new Error('Invalid query response');
  }
  
  return response;
}
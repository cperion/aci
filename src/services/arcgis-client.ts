import { UserSession } from '@esri/arcgis-rest-auth';
import { request } from '@esri/arcgis-rest-request';
import { queryFeatures as restQueryFeatures } from '@esri/arcgis-rest-feature-service';
import type { IQueryFeaturesResponse, IQueryResponse } from '@esri/arcgis-rest-feature-service';

export interface QueryOptions {
  where?: string;
  outFields?: string[];
  resultRecordCount?: number;
  returnGeometry?: boolean;
}

export async function getServiceInfo(url: string, session?: UserSession) {
  // Clean URL to get service root
  const serviceUrl = url.replace(/\/\d+$/, ''); // Remove layer number if present
  
  // Check if we're in Node.js environment
  const isNodeEnvironment = typeof window === 'undefined';
  
  if (isNodeEnvironment) {
    // Use direct fetch in Node.js to avoid CORS-related browser functions
    return await directFetch(serviceUrl, session);
  }
  
  try {
    const requestOptions: any = {
      params: { f: 'json' }
    };
    
    // Only add authentication if session is provided
    if (session) {
      requestOptions.authentication = session;
    }
    
    return await request(serviceUrl, requestOptions);
  } catch (error) {
    // Fallback to direct fetch if ArcGIS REST JS fails
    console.warn('ArcGIS REST JS request failed, using direct fetch...');
    return await directFetch(serviceUrl, session);
  }
}

// Direct fetch fallback for when ArcGIS REST JS has issues
async function directFetch(url: string, session?: UserSession): Promise<any> {
  const fetchUrl = new URL(url);
  fetchUrl.searchParams.set('f', 'json');
  
  const headers: any = {
    'Content-Type': 'application/json'
  };
  
  // Add token if authenticated
  if (session && session.token) {
    fetchUrl.searchParams.set('token', session.token);
  }
  
  const response = await fetch(fetchUrl.toString(), { headers });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function getLayerInfo(url: string, layerId: number, session?: UserSession) {
  const layerUrl = `${url}/${layerId}`;
  
  // Check if we're in Node.js environment
  const isNodeEnvironment = typeof window === 'undefined';
  
  if (isNodeEnvironment) {
    // Use direct fetch in Node.js to avoid CORS-related browser functions
    return await directFetch(layerUrl, session);
  }
  
  try {
    const requestOptions: any = {
      params: { f: 'json' }
    };
    
    // Only add authentication if session is provided
    if (session) {
      requestOptions.authentication = session;
    }
    
    return await request(layerUrl, requestOptions);
  } catch (error) {
    // Fallback to direct fetch if ArcGIS REST JS fails
    console.warn('ArcGIS REST JS request failed, using direct fetch...');
    return await directFetch(layerUrl, session);
  }
}

export async function queryFeatures(url: string, options: QueryOptions, session?: UserSession): Promise<IQueryFeaturesResponse | IQueryResponse> {
  // Ensure URL points to a layer (append /0 if it's just a service)
  let queryUrl = url;
  if (!url.match(/\/\d+$/)) {
    queryUrl = `${url}/0`;
  }
  
  // Check if we're in Node.js environment
  const isNodeEnvironment = typeof window === 'undefined';
  
  if (isNodeEnvironment) {
    // Use direct fetch in Node.js to avoid CORS-related browser functions
    return await directQueryFetch(queryUrl, options, session);
  }
  
  try {
    const queryOptions: any = {
      url: queryUrl,
      where: options.where || '1=1',
      outFields: options.outFields || ['*'],
      resultRecordCount: options.resultRecordCount || 10,
      returnGeometry: options.returnGeometry !== false,
      f: 'json'
    };
    
    // Only add authentication if session is provided
    if (session) {
      queryOptions.authentication = session;
    }
    
    return await restQueryFeatures(queryOptions);
  } catch (error) {
    // Fallback to direct fetch if ArcGIS REST JS fails
    console.warn('ArcGIS REST JS query failed, using direct fetch...');
    return await directQueryFetch(queryUrl, options, session);
  }
}

// Direct fetch fallback for querying features
async function directQueryFetch(url: string, options: QueryOptions, session?: UserSession): Promise<any> {
  const queryUrl = new URL(`${url}/query`);
  
  // Set query parameters
  queryUrl.searchParams.set('f', 'json');
  queryUrl.searchParams.set('where', options.where || '1=1');
  queryUrl.searchParams.set('outFields', (options.outFields || ['*']).join(','));
  queryUrl.searchParams.set('resultRecordCount', (options.resultRecordCount || 10).toString());
  queryUrl.searchParams.set('returnGeometry', (options.returnGeometry !== false).toString());
  
  // Add token if authenticated
  if (session && session.token) {
    queryUrl.searchParams.set('token', session.token);
  }
  
  const response = await fetch(queryUrl.toString());
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}
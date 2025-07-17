/**
 * Raw HTTP client for ArcGIS REST API
 * Replaces SDK dependencies with direct fetch calls
 */

import type { UserSession } from '../types/arcgis-raw.js';
import { isArcGISError } from '../types/arcgis-raw.js';

export interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Make a GET request to ArcGIS REST API
 */
export async function arcgisRequest(
  url: string,
  params: Record<string, string> = {},
  session?: UserSession,
  options: RequestOptions = {}
): Promise<any> {
  const urlObj = new URL(url);
  
  // Add default f=json parameter
  urlObj.searchParams.set('f', 'json');
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Add token if session is provided
  if (session?.token) {
    urlObj.searchParams.set('token', session.token);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const response = await fetch(urlObj.toString(), {
      method: options.method || 'GET',
      headers: options.headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check for ArcGIS-style errors in successful responses
    if (isArcGISError(data)) {
      throw new Error(`ArcGIS ${data.code}: ${data.message}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make a POST request to ArcGIS REST API with form data
 */
export async function arcgisPostRequest(
  url: string,
  formData: Record<string, string>,
  session?: UserSession,
  options: RequestOptions = {}
): Promise<any> {
  const body = new URLSearchParams();
  
  // Add default f=json parameter
  body.append('f', 'json');
  
  // Add form data
  Object.entries(formData).forEach(([key, value]) => {
    body.append(key, value);
  });

  // Add token if session is provided
  if (session?.token) {
    body.append('token', session.token);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check for ArcGIS-style errors in successful responses
    if (isArcGISError(data)) {
      throw new Error(`ArcGIS ${data.code}: ${data.message}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if two URLs have the same origin
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    return new URL(url1).origin === new URL(url2).origin;
  } catch {
    return false;
  }
}

/**
 * Normalize server URL to origin only
 */
export function normalizeServerUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}
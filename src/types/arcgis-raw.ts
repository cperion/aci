/**
 * Minimal type definitions for ArcGIS REST API responses
 * Based on actual API responses from enterprise ArcGIS Server
 */

export interface ArcGISError {
  code: number;
  message: string;
  details?: string[];
}

export interface Feature {
  attributes: Record<string, unknown>;
  geometry?: {
    paths?: number[][][];
    rings?: number[][][];
    x?: number;
    y?: number;
    points?: number[][];
  };
}

export interface QueryResponse {
  features: Feature[];
  exceededTransferLimit?: boolean;
  objectIdFieldName?: string;
  globalIdFieldName?: string;
  geometryType?: string;
  spatialReference?: {
    wkid?: number;
    latestWkid?: number;
  };
}

export interface ServiceInfo {
  currentVersion: number;
  serviceDescription?: string;
  hasVersionedData?: boolean;
  capabilities?: string;
  maxRecordCount?: number;
  layers?: Array<{
    id: number;
    name: string;
    type: string;
    geometryType?: string;
  }>;
  tables?: Array<{
    id: number;
    name: string;
  }>;
  spatialReference?: {
    wkid?: number;
    latestWkid?: number;
  };
}

export interface LayerInfo {
  id: number;
  name: string;
  type: string;
  geometryType?: string;
  objectIdField?: string;
  globalIdField?: string;
  fields?: Array<{
    name: string;
    type: string;
    alias?: string;
    length?: number;
    domain?: {
      type: string;
      codedValues?: Array<{
        name: string;
        code: string | number;
      }>;
    };
  }>;
  capabilities?: string;
  maxRecordCount?: number;
  hasAttachments?: boolean;
  timeInfo?: {
    startTimeField?: string;
    endTimeField?: string;
  };
}

export interface ServicesDirectoryResponse {
  currentVersion: number;
  folders: string[];
  services: Array<{
    name: string;
    type: "MapServer" | "FeatureServer" | "GPServer" | "ImageServer";
  }>;
}

export interface TokenResponse {
  token: string;
  expires?: number;
}

export interface FederatedToken {
  token: string;
  expires: number;
  server: string;
}

export interface UserSession {
  token: string;
  portal: string;
  username?: string;
  tokenExpires?: Date;
}

export interface QueryOptions {
  where?: string;
  outFields?: string[];
  resultRecordCount?: number;
  returnGeometry?: boolean;
}

// Type guards for runtime validation
export function isArcGISError(response: any): response is ArcGISError {
  return typeof response === 'object' && 
         response !== null &&
         'code' in response && 
         'message' in response &&
         typeof response.code === 'number';
}

export function isQueryResponse(response: any): response is QueryResponse {
  return typeof response === 'object' && 
         response !== null &&
         'features' in response && 
         Array.isArray(response.features);
}

export function isTokenResponse(response: any): response is TokenResponse {
  return typeof response === 'object' && 
         response !== null &&
         'token' in response && 
         typeof response.token === 'string';
}

export function isServiceInfo(response: any): response is ServiceInfo {
  return typeof response === 'object' && 
         response !== null &&
         'currentVersion' in response && 
         typeof response.currentVersion === 'number';
}

export function isLayerInfo(response: any): response is LayerInfo {
  return typeof response === 'object' && 
         response !== null &&
         'id' in response && 
         'name' in response &&
         typeof response.id === 'number';
}

export function isServicesDirectory(response: any): response is ServicesDirectoryResponse {
  return typeof response === 'object' && 
         response !== null &&
         'currentVersion' in response &&
         'services' in response &&
         Array.isArray(response.services);
}
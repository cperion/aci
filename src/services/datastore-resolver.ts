/**
 * Data Store Resolver Service
 * Correlates service URLs with backing datastores for integrated analysis
 */

import type { DataStoreInfo } from '../types/datastore.js';
import { ArcGISServerAdminClient } from './admin-client.js';
import { getAdminSession } from '../session.js';

export interface ServiceDatastoreCorrelation {
  serviceName: string;
  serviceUrl: string;
  backingDatastore?: DataStoreInfo;
  correlationMethod: 'direct' | 'heuristic' | 'unknown';
  correlationConfidence: 'high' | 'medium' | 'low';
}

/**
 * Resolve backing datastore for a service URL
 */
export async function resolveServiceDatastore(
  serviceUrl: string, 
  environment?: string
): Promise<ServiceDatastoreCorrelation> {
  const serviceName = extractServiceName(serviceUrl);
  
  const correlation: ServiceDatastoreCorrelation = {
    serviceName,
    serviceUrl,
    correlationMethod: 'unknown',
    correlationConfidence: 'low'
  };

  try {
    // Try admin API correlation if admin session available
    const adminSession = await getAdminSession(environment);
    if (adminSession) {
      const adminClient = new ArcGISServerAdminClient(adminSession);
      const datastores = await adminClient.listDatastores();
      
      const match = await correlateViaAdminAPI(serviceUrl, datastores);
      if (match) {
        correlation.backingDatastore = match;
        correlation.correlationMethod = 'direct';
        correlation.correlationConfidence = 'high';
        return correlation;
      }
    }
  } catch (error) {
    // Admin correlation failed, fall through to heuristics
  }

  try {
    // Fallback to heuristic correlation
    const heuristicMatch = await correlateViaHeuristics(serviceUrl);
    if (heuristicMatch) {
      correlation.backingDatastore = heuristicMatch;
      correlation.correlationMethod = 'heuristic';
      correlation.correlationConfidence = 'medium';
    }
  } catch (error) {
    // Heuristic correlation failed
  }

  return correlation;
}

/**
 * Extract service name from URL
 */
function extractServiceName(serviceUrl: string): string {
  try {
    const url = new URL(serviceUrl);
    const pathParts = url.pathname.split('/');
    
    // Find services index
    const servicesIndex = pathParts.findIndex(part => part === 'services');
    if (servicesIndex !== -1 && servicesIndex + 1 < pathParts.length) {
      // Extract folder/service or just service
      const servicePart = pathParts[servicesIndex + 1];
      const serviceType = pathParts[servicesIndex + 2];
      
      if (servicePart && serviceType && (serviceType.includes('Server') || serviceType.includes('Service'))) {
        return servicePart;
      }
    }
    
    return 'Unknown Service';
  } catch (error) {
    return 'Invalid URL';
  }
}

/**
 * Correlate service with datastore using admin API
 */
async function correlateViaAdminAPI(
  serviceUrl: string, 
  datastores: DataStoreInfo[]
): Promise<DataStoreInfo | null> {
  // Method 1: Check if service name matches datastore patterns
  const serviceName = extractServiceName(serviceUrl);
  
  // Look for datastores with matching names or patterns
  for (const datastore of datastores) {
    // Direct name match
    if (datastore.name.toLowerCase().includes(serviceName.toLowerCase()) ||
        serviceName.toLowerCase().includes(datastore.name.toLowerCase())) {
      return datastore;
    }
    
    // Pattern matching for common enterprise naming conventions
    if (matchesEnterprisePattern(serviceName, datastore.name)) {
      return datastore;
    }
  }

  // Method 2: Check spatial reference patterns (requires service metadata)
  try {
    const serviceMetadata = await fetchServiceMetadata(serviceUrl);
    if (serviceMetadata?.spatialReference) {
      return correlateViaSpatialReference(serviceMetadata.spatialReference, datastores);
    }
  } catch (error) {
    // Service metadata not accessible
  }

  return null;
}

/**
 * Correlate via heuristic analysis (when admin API unavailable)
 */
async function correlateViaHeuristics(serviceUrl: string): Promise<DataStoreInfo | null> {
  try {
    const serviceMetadata = await fetchServiceMetadata(serviceUrl);
    
    if (!serviceMetadata) {
      return null;
    }

    // Heuristic: Infer datastore type from service characteristics
    const serviceName = extractServiceName(serviceUrl);
    const inferredDatastore: DataStoreInfo = {
      name: `${serviceName}_inferred`,
      type: inferDatastoreType(serviceMetadata),
      status: 'Healthy', // Assume healthy if service is responding
      path: '/inferred',
      onServerStart: true,
      isManaged: false
    };

    return inferredDatastore;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch service metadata for correlation
 */
async function fetchServiceMetadata(serviceUrl: string): Promise<any> {
  // Construct metadata URL (remove layer index if present)
  let metadataUrl = serviceUrl;
  if (metadataUrl.match(/\/\d+$/)) {
    metadataUrl = metadataUrl.replace(/\/\d+$/, '');
  }
  
  const response = await fetch(`${metadataUrl}?f=json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Match enterprise naming patterns
 */
function matchesEnterprisePattern(serviceName: string, datastoreName: string): boolean {
  // Common enterprise patterns:
  // - Service: "Planning_Zoning", Datastore: "PlanningDB"
  // - Service: "CadastralData", Datastore: "CadastralDatabase"
  // - Service: "Infrastructure", Datastore: "InfrastructureStore"
  
  const serviceBase = serviceName.toLowerCase().replace(/[_-]/g, '');
  const datastoreBase = datastoreName.toLowerCase().replace(/[_-]/g, '');
  
  // Remove common suffixes
  const serviceCleaned = serviceBase.replace(/(service|server|data)$/, '');
  const datastoreCleaned = datastoreBase.replace(/(db|database|store|datastore)$/, '');
  
  // Check if cleaned names have significant overlap
  if (serviceCleaned.length > 0 && datastoreCleaned.length > 0) {
    return serviceCleaned.includes(datastoreCleaned) || 
           datastoreCleaned.includes(serviceCleaned) ||
           levenshteinDistance(serviceCleaned, datastoreCleaned) <= 2;
  }
  
  return false;
}

/**
 * Correlate via spatial reference system
 */
function correlateViaSpatialReference(
  spatialReference: any, 
  datastores: DataStoreInfo[]
): DataStoreInfo | null {
  // Enterprise heuristic: Different datastores often use different SRS
  // This is a placeholder for more sophisticated SRS-based correlation
  
  if (spatialReference && typeof spatialReference.wkid === 'number') {
    // Common enterprise patterns:
    // - wkid 4326 (WGS84) → Cloud datastores
    // - wkid 3857 (Web Mercator) → Tile cache datastores  
    // - Local projections → Enterprise databases
    
    if (spatialReference.wkid === 4326) {
      return datastores.find(ds => ds.type === 'cloud') || null;
    }
    
    if (spatialReference.wkid === 3857) {
      return datastores.find(ds => ds.type === 'tileCache') || null;
    }
    
    // Local projections likely indicate enterprise database
    if (spatialReference.wkid > 32000) {
      return datastores.find(ds => ds.type === 'enterprise') || null;
    }
  }
  
  return null;
}

/**
 * Infer datastore type from service characteristics
 */
function inferDatastoreType(serviceMetadata: any): DataStoreInfo['type'] {
  // Inference based on service properties
  if (serviceMetadata && serviceMetadata.serviceDescription && 
      typeof serviceMetadata.serviceDescription === 'string' &&
      serviceMetadata.serviceDescription.toLowerCase().includes('tile')) {
    return 'tileCache';
  }
  
  if (serviceMetadata && serviceMetadata.capabilities && 
      typeof serviceMetadata.capabilities === 'string' &&
      serviceMetadata.capabilities.includes('Map,TilesOnly')) {
    return 'tileCache';
  }
  
  if (serviceMetadata && serviceMetadata.spatialReference && 
      serviceMetadata.spatialReference.wkid === 4326) {
    return 'cloud';
  }
  
  // Default to enterprise database
  return 'enterprise';
}

/**
 * Simple Levenshtein distance for string similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j]![0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1,     // deletion
        matrix[j - 1]![i]! + 1,     // insertion
        matrix[j - 1]![i - 1]! + indicator // substitution
      );
    }
  }
  
  return matrix[b.length]![a.length]!;
}
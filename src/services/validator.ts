export type ServiceType = 
  | 'feature-service' 
  | 'feature-layer'
  | 'map-service' 
  | 'map-layer'
  | 'image-service'
  | 'unknown-arcgis-resource';

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // For portal URLs, we're more lenient - just needs to be a valid URL
    return true;
    
  } catch {
    return false;
  }
}

export function detectServiceType(url: string): ServiceType {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const tokens = path.split('/').filter(Boolean);
    const lastToken = tokens[tokens.length - 1];
    const penultimateToken = tokens[tokens.length - 2];
    
    // Immediate classification
    if (lastToken === 'FeatureServer') return 'feature-service';
    if (lastToken === 'MapServer') return 'map-service';
    if (lastToken === 'ImageServer') return 'image-service';
    
    // Layer detection
    if (lastToken && !isNaN(parseInt(lastToken))) {
      if (penultimateToken === 'FeatureServer') return 'feature-layer';
      if (penultimateToken === 'MapServer') return 'map-layer';
    }
    
    return 'unknown-arcgis-resource';
    
  } catch {
    return 'unknown-arcgis-resource';
  }
}

export function isValidItemId(input: string): boolean {
  // ArcGIS item IDs are 32-character hexadecimal strings
  return /^[a-f0-9]{32}$/i.test(input);
}

export function isEnterprisePortal(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // ArcGIS Online hostnames
    const onlineHosts = [
      'arcgis.com',
      'www.arcgis.com', 
      'arcgisonline.com',
      'www.arcgisonline.com'
    ];
    
    // Check if hostname matches any ArcGIS Online patterns
    const isOnline = onlineHosts.some(host => 
      hostname === host || hostname.endsWith('.' + host)
    );
    
    return !isOnline;
  } catch {
    return false; // Invalid URL treated as not enterprise
  }
}

export function extractServiceIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Extract service name from path like /rest/services/ServiceName/FeatureServer
    const match = path.match(/\/rest\/services\/([^\/]+)\/\w+Server/);
    return match?.[1] || null;
    
  } catch {
    return null;
  }
}

/**
 * Normalizes portal URL to base format (removes sharing/rest paths)
 */
export function normalizeBasePortalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove any sharing/rest paths to get base portal URL
    let cleanPath = parsed.pathname.replace(/\/portal\/sharing\/rest\/?$/i, '')
                                  .replace(/\/sharing\/rest\/?$/i, '');
    
    // Ensure clean path doesn't end with slash
    cleanPath = cleanPath.replace(/\/$/, '');
    
    return `${parsed.protocol}//${parsed.host}${cleanPath}`;
  } catch {
    return url; // Return original if parsing fails
  }
}

/**
 * Builds the correct sharing/rest URL from base portal URL
 */
export function buildSharingRestUrl(baseUrl: string): string {
  // If URL already ends with sharing/rest, return as-is
  if (baseUrl.match(/\/sharing\/rest\/?$/i)) {
    return baseUrl.replace(/\/$/, ''); // Just remove trailing slash
  }
  
  const normalized = normalizeBasePortalUrl(baseUrl);
  
  // Check if the base URL already has arcgis in the path
  // (like https://rsig.parisladefense.com/arcgis)
  if (normalized.match(/\/arcgis$/i)) {
    return `${normalized}/sharing/rest`;
  }
  
  // Enterprise portals typically use /portal/sharing/rest
  if (isEnterprisePortal(baseUrl)) {
    return `${normalized}/portal/sharing/rest`;
  }
  // ArcGIS Online uses /sharing/rest
  return `${normalized}/sharing/rest`;
}
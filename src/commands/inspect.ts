import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { detectServiceType, validateUrl } from '../services/validator.js';
import { getServiceInfo, getLayerInfo } from '../services/arcgis-client.js';
import { getFederatedToken, isServerFederated } from '../services/federation.js';
import { handleError } from '../errors/handler.js';
import { formatOutput } from '../utils/output.js';

interface InspectOptions {
  json?: boolean;
  fields?: boolean;
  env?: Environment;
}

export async function inspectCommand(url: string, options: InspectOptions): Promise<void> {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    
    // Detect service type
    const serviceType = detectServiceType(url);
    console.log(`Detected service type: ${serviceType}`);
    
    // Get session for authentication (optional for public services)
    const session = await getSession(options.env);
    console.log(session ? `Using authenticated session for ${session.username}` : 'Attempting unauthenticated request...');
    
    // Handle federated authentication for ArcGIS Server (only if authenticated)
    let authSession = session;
    
    if (session) {
      const serverUrl = new URL(url).origin;
      
      // Check if this is a different server that might need federation
      if (serverUrl !== new URL(session.portal).origin) {
        const isFederated = await isServerFederated(session.portal, serverUrl);
        if (isFederated) {
          console.log(`Obtaining federated token for ${serverUrl}...`);
          try {
            const federatedToken = await getFederatedToken(session, serverUrl);
            // Create a new session with the federated token for this server
            authSession = new (session.constructor as any)({
              portal: session.portal,
              token: federatedToken,
              tokenExpires: session.tokenExpires,
              username: session.username
            });
          } catch (error) {
            console.warn(`Federation failed, using portal token: ${(error as Error).message}`);
          }
        }
      }
    }
    
    // Get service information
    let serviceInfo;
    switch (serviceType) {
      case 'feature-service':
      case 'map-service':
        serviceInfo = await getServiceInfo(url, authSession || undefined);
        break;
      case 'feature-layer':
      case 'map-layer':
        // For layers, get the specific layer information which includes fields
        const layerMatch = url.match(/\/(\d+)$/);
        if (layerMatch && layerMatch[1]) {
          const layerId = parseInt(layerMatch[1], 10);
          const serviceUrl = url.replace(/\/\d+$/, '');
          serviceInfo = await getLayerInfo(serviceUrl, layerId, authSession || undefined);
        } else {
          serviceInfo = await getServiceInfo(url, authSession || undefined);
        }
        break;
      default:
        throw new Error(`Service type "${serviceType}" not yet supported`);
    }
    
    // Format and display output
    if (options.json) {
      console.log(JSON.stringify(serviceInfo, null, 2));
    } else {
      formatOutput(serviceInfo, { showFields: options.fields });
    }
    
  } catch (error) {
    handleError(error, 'Service inspection failed');
  }
}
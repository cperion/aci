import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { detectServiceType, validateUrl } from '../services/validator.js';
import { queryFeatures } from '../services/arcgis-client.js';
import { getFederatedToken, isServerFederated } from '../services/federation.js';
import { handleError } from '../errors/handler.js';
import { formatQueryResults } from '../utils/output.js';
import type { IQueryFeaturesResponse, IQueryResponse, IFeature } from '@esri/arcgis-rest-feature-service';

interface QueryOptions {
  where?: string;
  limit?: string;
  fields?: string;
  json?: boolean;
  geojson?: boolean;
  env?: Environment;
}

export async function queryCommand(url: string, options: QueryOptions): Promise<void> {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    
    // Detect service type
    const serviceType = detectServiceType(url);
    if (!serviceType.includes('feature')) {
      throw new Error(`Cannot query service type "${serviceType}". Only feature services support querying.`);
    }
    
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
    
    // Parse options
    const whereClause = options.where || '1=1';
    const limit = options.limit ? parseInt(options.limit, 10) : 10;
    const outFields = options.fields ? options.fields.split(',').map(f => f.trim()) : ['*'];
    
    console.log(`Querying: ${url}`);
    console.log(`WHERE: ${whereClause}`);
    console.log(`LIMIT: ${limit}`);
    console.log(`FIELDS: ${outFields.join(', ')}`);
    console.log('');
    
    // Execute query
    const results = await queryFeatures(url, {
      where: whereClause,
      outFields,
      resultRecordCount: limit
    }, authSession || undefined);
    
    // Format and display results
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else if (options.geojson) {
      if ('features' in results) {
        const features: IFeature[] = results.features;
        const geojson = {
          type: 'FeatureCollection',
          features: features.map((feature: IFeature) => ({
            type: 'Feature',
            geometry: feature.geometry,
            properties: feature.attributes
          }))
        };
        console.log(JSON.stringify(geojson, null, 2));
      } else {
        console.error('No features in response - query may have returned metadata only');
      }
    } else {
      formatQueryResults(results);
    }
    
  } catch (error) {
    handleError(error, 'Query failed');
  }
}
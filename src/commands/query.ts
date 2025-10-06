import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { detectServiceType, validateUrl } from '../services/validator.js';
import { queryFeatures } from '../core/server.js';
import { handleError } from '../errors/handler.js';
import { formatQueryResults } from '../utils/output.js';
import type { QueryResponse, Feature } from '../types/arcgis-raw.js';

interface CommandQueryOptions {
  where?: string;
  limit?: string;
  fields?: string;
  json?: boolean;
  geojson?: boolean;
  env?: Environment;
}

export async function queryCommand(url: string, options: CommandQueryOptions): Promise<void> {
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
    
    // Federation is now handled automatically in queryFeatures function
    
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
      limit: limit,
      session: session || undefined
    });
    
    // Check for transfer limit exceeded
    if (results.exceededTransferLimit) {
      console.warn('⚠️  Transfer limit exceeded - only partial results returned');
      console.warn('   Consider using a more specific WHERE clause or reducing the limit');
    }
    
    // Format and display results
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else if (options.geojson) {
      const features: Feature[] = results.features;
      const geojson = {
        type: 'FeatureCollection',
        features: features.map((feature: Feature) => ({
          type: 'Feature',
          geometry: feature.geometry,
          properties: feature.attributes
        }))
      };
      console.log(JSON.stringify(geojson, null, 2));
    } else {
      formatQueryResults(results);
    }
    
  } catch (error) {
    handleError(error, 'Query failed');
  }
}
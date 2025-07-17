import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { arcgisRequest } from '../services/http-client.js';
import { handleError } from '../errors/handler.js';
import type { UserSession } from '../types/arcgis-raw.js';

interface SearchOptions {
  type?: string;
  owner?: string;
  limit?: string;
  json?: boolean;
  env?: Environment;
}

interface SearchResult {
  total: number;
  results: Array<{
    id: string;
    title: string;
    type: string;
    owner: string;
    snippet?: string;
    url?: string;
    modified: number;
  }>;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  try {
    // Get session for authentication
    const session = await getSession(options.env);
    if (!session) {
      const envName = options.env || 'current environment';
      throw new Error(`Not authenticated in ${envName}. Please run "arc login --env ${options.env || 'default'}" first.`);
    }
    
    console.log(`Searching portal for: "${query}"`);
    console.log(`Portal: ${session.portal}`);
    
    // Use direct API call for portal search
    const results = await searchPortalItems(query, options, session);
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatSearchResults(results);
    }
    
  } catch (error) {
    handleError(error, 'Portal search failed');
  }
}

// Portal search using raw API
async function searchPortalItems(query: string, options: SearchOptions, session: UserSession): Promise<SearchResult> {
  // Ensure we use the correct portal URL structure
  let portalBaseUrl = session.portal;
  if (!portalBaseUrl.includes('/sharing/rest')) {
    portalBaseUrl = `${portalBaseUrl}/portal/sharing/rest`;
  }
  
  const searchUrl = `${portalBaseUrl}/search`;
  
  // Build query string
  let searchQuery = query;
  
  // Add type filter if specified
  if (options.type) {
    searchQuery += ` type:"${options.type}"`;
  }
  
  // Add owner filter if specified
  if (options.owner) {
    searchQuery += ` owner:${options.owner}`;
  }
  
  console.log(`Search query: ${searchQuery}`);
  
  // Set search parameters
  const params = {
    q: searchQuery,
    num: options.limit || '10',
    start: '1'
  };
  
  const results = await arcgisRequest(searchUrl, params, session);
  
  if (results.error) {
    throw new Error(`Search failed: ${results.error.message}`);
  }
  
  return results;
}

function formatSearchResults(results: SearchResult): void {
  console.log(`\n=== Search Results ===`);
  console.log(`Found ${results.total} items (showing ${results.results.length})`);
  console.log('');
  
  if (results.results.length === 0) {
    console.log('No items found');
    return;
  }
  
  results.results.forEach((item, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   Type: ${item.type}`);
    console.log(`   Owner: ${item.owner}`);
    if (item.snippet) {
      console.log(`   Description: ${item.snippet}`);
    }
    if (item.url) {
      console.log(`   URL: ${item.url}`);
    }
    console.log(`   ID: ${item.id}`);
    console.log(`   Modified: ${new Date(item.modified).toLocaleDateString()}`);
    console.log('');
  });
  
  if (results.total > results.results.length) {
    console.log(`... and ${results.total - results.results.length} more items`);
    console.log('Use --limit to see more results');
  }
}
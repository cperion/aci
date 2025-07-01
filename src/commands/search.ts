import { getSession } from '../session.js';
import type { Environment } from '../session.js';
import { searchItems } from '@esri/arcgis-rest-portal';
import { handleError } from '../errors/handler.js';
import type { ISearchResult, IItem } from '@esri/arcgis-rest-portal';
import type { UserSession } from '@esri/arcgis-rest-auth';

interface SearchOptions {
  type?: string;
  owner?: string;
  limit?: string;
  json?: boolean;
  env?: Environment;
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
    
    // Check if we're in Node.js environment
    const isNodeEnvironment = typeof window === 'undefined';
    
    if (isNodeEnvironment) {
      // Use direct fetch in Node.js to avoid CORS-related browser functions
      const results = await directSearchFetch(query, options, session);
      
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        formatSearchResults(results);
      }
    } else {
      // Use ArcGIS REST JS for browser compatibility
      const searchOptions: any = {
        q: query,
        num: parseInt(options.limit || '10'),
        authentication: session
      };
      
      // Add type filter if specified
      if (options.type) {
        searchOptions.q += ` type:"${options.type}"`;
      }
      
      // Add owner filter if specified
      if (options.owner) {
        searchOptions.q += ` owner:${options.owner}`;
      }
      
      console.log(`Search query: ${searchOptions.q}`);
      
      const results: ISearchResult<IItem> = await searchItems(searchOptions);
      
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        formatSearchResults(results);
      }
    }
    
  } catch (error) {
    handleError(error, 'Portal search failed');
  }
}

// Direct fetch fallback for when ArcGIS REST JS has issues
async function directSearchFetch(query: string, options: SearchOptions, session: UserSession): Promise<ISearchResult<IItem>> {
  // Ensure we use the correct portal URL structure
  let portalBaseUrl = session.portal;
  if (!portalBaseUrl.includes('/sharing/rest')) {
    portalBaseUrl = `${portalBaseUrl}/portal/sharing/rest`;
  }
  
  const searchUrl = new URL(`${portalBaseUrl}/search`);
  
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
  searchUrl.searchParams.set('q', searchQuery);
  searchUrl.searchParams.set('f', 'json');
  searchUrl.searchParams.set('num', options.limit || '10');
  searchUrl.searchParams.set('start', '1');
  
  // Add token for authentication
  if (session.token) {
    searchUrl.searchParams.set('token', session.token);
  }
  
  const response = await fetch(searchUrl.toString());
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const results = await response.json();
  
  if (results.error) {
    throw new Error(`Search failed: ${results.error.message}`);
  }
  
  return results;
}

function formatSearchResults(results: ISearchResult<IItem>): void {
  console.log(`\n=== Search Results ===`);
  console.log(`Found ${results.total} items (showing ${results.results.length})`);
  console.log('');
  
  if (results.results.length === 0) {
    console.log('No items found');
    return;
  }
  
  results.results.forEach((item: IItem, index: number) => {
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
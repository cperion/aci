import { formatUser, formatUsersTable } from '../utils/output.js';
import { getAuthenticatedSession, buildSharingRestUrl, handlePortalError, parseLimit, validateApiResponse, formatDate } from '../utils/portal-utils.js';
import type { UserSearchOptions, UserGetOptions, PortalUserSearchResponse, PortalUser } from '../types/portal-types.js';

export async function findUsersCommand(query: string, options: UserSearchOptions): Promise<void> {
  try {
    const session = await getAuthenticatedSession();
    const sharingRestUrl = buildSharingRestUrl(session);
    
    const searchOptions = {
      q: query,
      num: parseLimit(options.limit, 10, 100)
    };

    if (options.filter) {
      searchOptions.q += ` AND ${options.filter}`;
    }

    // Direct REST API call to search users
    const url = `${sharingRestUrl}/community/users`;
    const params = new URLSearchParams({
      q: searchOptions.q,
      num: searchOptions.num.toString(),
      f: 'json',
      token: session.token
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const results: unknown = await response.json();
    validateApiResponse(results);
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatUserSearchResults(results as PortalUserSearchResponse);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'search users', options);
  }
}

export async function getUserCommand(username: string, options: UserGetOptions): Promise<void> {
  try {
    const session = await getAuthenticatedSession();
    const sharingRestUrl = buildSharingRestUrl(session);
    
    // Direct REST API call to get user profile
    const url = `${sharingRestUrl}/community/users/${username}`;
    const params = new URLSearchParams({
      f: 'json',
      token: session.token
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const user: unknown = await response.json();
    validateApiResponse(user);
    
    if (options.json) {
      console.log(JSON.stringify(user, null, 2));
    } else {
      formatUserProfile(user as PortalUser);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'get user profile', options);
  }
}

function formatUserSearchResults(results: PortalUserSearchResponse): void {
  console.log(`\u2500 Users (${results.results.length} of ${results.total})\n`);
  
  if (results.results.length > 3) {
    console.log(formatUsersTable(results.results));
  } else {
    results.results.forEach((user) => {
      console.log(formatUser(user));
    });
  }
}

function formatUserProfile(user: PortalUser): void {
  console.log(formatUser(user));
  
  // Additional profile details
  console.log(`  created: ${formatDate(user.created)} | last-login: ${user.lastLogin ? formatDate(user.lastLogin) : 'never'}`);
  
  if (user.privileges && user.privileges.length > 0) {
    console.log(`  privileges: ${user.privileges.slice(0, 5).join(', ')}${user.privileges.length > 5 ? '...' : ''}`);
  }
}
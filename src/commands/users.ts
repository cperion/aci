import { formatUser, formatUsersTable } from '../utils/output.js';
import { handlePortalError, formatDate } from '../utils/portal-utils.js';
import { findUsers, getUser } from '../core/portal.js';
import type { UserSearchOptions, UserGetOptions, PortalUserSearchResponse, PortalUser } from '../types/portal-types.js';

export async function findUsersCommand(query: string, options: UserSearchOptions): Promise<void> {
  try {
    const results = await findUsers({
      query,
      limit: options.limit ? parseInt(options.limit) : undefined,
      filter: options.filter
    });
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      formatUserSearchResults(results);
    }
  } catch (error: unknown) {
    handlePortalError(error, 'search users', options);
  }
}

export async function getUserCommand(username: string, options: UserGetOptions): Promise<void> {
  try {
    const user = await getUser(username);
    
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
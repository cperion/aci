/**
 * Core Portal Functions - Pure data layer without console I/O
 * Provides reusable portal operations for both CLI and TUI
 */

import { getAuthenticatedSession, buildSharingRestUrl, validateApiResponse, parseLimit } from '../utils/portal-utils.js';
import { arcgisRequest, arcgisPostRequest } from '../services/http-client.js';
import type { UserSession } from '../types/arcgis-raw.js';
import type { PortalUserSearchResponse, PortalGroupSearchResponse, PortalItemSearchResponse } from '../types/portal-types.js';

export interface PortalSearchParams {
  query: string;
  limit?: number;
  filter?: string;
  type?: string;
  owner?: string;
  session?: UserSession;
}

/**
 * Search for users in the portal
 */
export async function findUsers(params: PortalSearchParams): Promise<PortalUserSearchResponse> {
  const session = params.session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(session);
  
  const searchOptions = {
    q: params.query,
    num: parseLimit(String(params.limit || 10), 10, 100)
  };

  if (params.filter) {
    searchOptions.q += ` AND ${params.filter}`;
  }

  const url = `${sharingRestUrl}/community/users`;
  const queryParams = {
    q: searchOptions.q,
    num: searchOptions.num.toString(),
    f: 'json',
    token: session.token
  };

  const response = await arcgisRequest(url, queryParams, session);
  validateApiResponse(response);
  
  return response as PortalUserSearchResponse;
}

/**
 * Search for groups in the portal
 */
export async function findGroups(params: PortalSearchParams): Promise<PortalGroupSearchResponse> {
  const session = params.session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(session);
  
  const searchOptions = {
    q: params.query,
    num: parseLimit(String(params.limit || 10), 10, 100)
  };

  const url = `${sharingRestUrl}/community/groups`;
  const queryParams = {
    q: searchOptions.q,
    num: searchOptions.num.toString(),
    f: 'json',
    token: session.token
  };

  const response = await arcgisRequest(url, queryParams, session);
  validateApiResponse(response);
  
  return response as PortalGroupSearchResponse;
}

/**
 * Search for items in the portal
 */
export async function findItems(params: PortalSearchParams): Promise<PortalItemSearchResponse> {
  const session = params.session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(session);
  
  let searchQuery = params.query;
  
  // Add type filter if specified
  if (params.type) {
    searchQuery += ` type:"${params.type}"`;
  }
  
  // Add owner filter if specified
  if (params.owner) {
    searchQuery += ` owner:${params.owner}`;
  }
  
  const searchOptions = {
    q: searchQuery,
    num: parseLimit(String(params.limit || 10), 10, 100)
  };

  const url = `${sharingRestUrl}/search`;
  const queryParams = {
    q: searchOptions.q,
    num: searchOptions.num.toString(),
    f: 'json',
    token: session.token
  };

  const response = await arcgisRequest(url, queryParams, session);
  validateApiResponse(response);
  
  return response as PortalItemSearchResponse;
}

/**
 * Search for items with advanced filtering options
 */
export interface SearchItemsParams {
  query: string;
  type?: string;
  owner?: string;
  limit?: number;
  session?: UserSession;
}

export async function searchItems(params: SearchItemsParams): Promise<{ total: number; results: any[] }> {
  const session = params.session || await getAuthenticatedSession();
  
  // Ensure we use the correct portal URL structure
  let portalBaseUrl = session.portal;
  if (!portalBaseUrl.includes('/sharing/rest')) {
    portalBaseUrl = `${portalBaseUrl}/portal/sharing/rest`;
  }
  
  const searchUrl = `${portalBaseUrl}/search`;
  
  // Build query string
  let searchQuery = params.query;
  
  // Add type filter if specified
  if (params.type) {
    searchQuery += ` type:"${params.type}"`;
  }
  
  // Add owner filter if specified
  if (params.owner) {
    searchQuery += ` owner:${params.owner}`;
  }
  
  // Set search parameters
  const queryParams = {
    q: searchQuery,
    num: String(params.limit || 10),
    start: '1',
    f: 'json',
    token: session.token
  };
  
  const response = await arcgisRequest(searchUrl, queryParams, session);
  validateApiResponse(response);
  
  return {
    total: response.total || 0,
    results: response.results || []
  };
}

/**
 * Get user profile information
 */
export async function getUser(username: string, session?: UserSession): Promise<any> {
  const userSession = session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(userSession);
  
  const url = `${sharingRestUrl}/community/users/${username}`;
  const queryParams = {
    f: 'json',
    token: userSession.token
  };

  const response = await arcgisRequest(url, queryParams, userSession);
  validateApiResponse(response);
  
  return response;
}

/**
 * Get group information
 */
export async function getGroup(groupId: string, session?: UserSession): Promise<any> {
  const userSession = session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(userSession);
  
  const url = `${sharingRestUrl}/community/groups/${groupId}`;
  const queryParams = {
    f: 'json',
    token: userSession.token
  };

  const response = await arcgisRequest(url, queryParams, userSession);
  validateApiResponse(response);
  
  return response;
}

/**
 * Create a new group
 */
export interface CreateGroupParams {
  title: string;
  access?: string;
  description?: string;
  session?: UserSession;
}

export async function createGroup(params: CreateGroupParams): Promise<any> {
  const userSession = params.session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(userSession);
  
  const url = `${sharingRestUrl}/community/createGroup`;
  const formData = {
    title: params.title,
    access: params.access || 'private',
    description: params.description || `Group created by ACI on ${new Date().toISOString()}`,
    token: userSession.token
  };

  const response = await arcgisPostRequest(url, formData, userSession);
  validateApiResponse(response);
  
  return response;
}

/**
 * Get item information
 */
export async function getItem(itemId: string, session?: UserSession): Promise<any> {
  const userSession = session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(userSession);
  
  const url = `${sharingRestUrl}/content/items/${itemId}`;
  const queryParams = {
    f: 'json',
    token: userSession.token
  };

  const response = await arcgisRequest(url, queryParams, userSession);
  validateApiResponse(response);
  
  return response;
}

/**
 * Share an item with specified groups, organization, or public
 */
export interface ShareItemParams {
  itemId: string;
  groups?: string[];
  org?: boolean;
  public?: boolean;
  session?: UserSession;
}

export async function shareItem(params: ShareItemParams): Promise<any> {
  const userSession = params.session || await getAuthenticatedSession();
  const sharingRestUrl = buildSharingRestUrl(userSession);
  
  const url = `${sharingRestUrl}/content/users/${userSession.username}/items/${params.itemId}/share`;
  const formData: Record<string, string> = {
    f: 'json',
    token: userSession.token
  };

  if (params.groups) {
    formData.groups = params.groups.join(',');
  }
  if (params.org) {
    formData.org = 'true';
  }
  if (params.public) {
    formData.everyone = 'true';
  }

  const response = await arcgisPostRequest(url, formData, userSession);
  validateApiResponse(response);
  
  return response;
}

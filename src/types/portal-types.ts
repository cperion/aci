// Type interfaces for portal command options
export interface UserSearchOptions {
  limit?: string;
  filter?: string;
  json?: boolean;
  debug?: boolean;
}

export interface UserGetOptions {
  json?: boolean;
  debug?: boolean;
}

export interface GroupSearchOptions {
  limit?: string;
  json?: boolean;
  debug?: boolean;
}

export interface GroupCreateOptions {
  access?: string;
  description?: string;
  json?: boolean;
  debug?: boolean;
}

export interface GroupGetOptions {
  json?: boolean;
  debug?: boolean;
}

export interface ItemSearchOptions {
  limit?: string;
  type?: string;
  owner?: string;
  json?: boolean;
  debug?: boolean;
}

export interface ItemGetOptions {
  json?: boolean;
  debug?: boolean;
}

export interface ItemShareOptions {
  groups?: string;
  org?: boolean;
  public?: boolean;
  json?: boolean;
  debug?: boolean;
}

// Portal API response types
export interface PortalUserSearchResponse {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: PortalUser[];
}

export interface PortalUser {
  username: string;
  fullName?: string;
  email?: string;
  role?: string;
  created?: number;
  lastLogin?: number;
  groups?: PortalGroup[];
  privileges?: string[];
}

export interface PortalGroupSearchResponse {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: PortalGroup[];
}

export interface PortalGroup {
  id: string;
  title: string;
  owner: string;
  access: string;
  membershipAccess?: string;
  created?: number;
  modified?: number;
  description?: string;
  tags?: string[];
  thumbnail?: string;
}

export interface PortalItemSearchResponse {
  total: number;
  start: number;
  num: number;
  nextStart: number;
  results: PortalItem[];
}

export interface PortalItem {
  id: string;
  title: string;
  type: string;
  owner: string;
  created?: number;
  modified?: number;
  access?: string;
  description?: string;
  snippet?: string;
  tags?: string[];
  url?: string;
  thumbnail?: string;
}

export interface PortalApiResponse {
  success?: boolean;
  error?: {
    code: number;
    message: string;
    details?: string[];
  };
}

export interface GroupCreateResponse extends PortalApiResponse {
  group?: {
    id: string;
  };
  groupId?: string;
}
/**
 * Unified command result interface for CLI/TUI integration
 * This replaces the CommandFacade pattern with direct command invocation
 */

export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
  metadata?: {
    executionTime?: number;
    source?: 'cli' | 'tui' | 'direct';
    resultCount?: number;
    totalCount?: number;
    hasMore?: boolean;
  };
}

// Specific result types for type safety
export interface UserSearchResult {
  results: PortalUser[];
  total: number;
  start: number;
  num: number;
  nextStart?: number;
  query: string;
}

export interface GroupSearchResult {
  results: PortalGroup[];
  total: number;
  start: number;
  num: number;
  nextStart?: number;
  query: string;
}

export interface ItemSearchResult {
  results: PortalItem[];
  total: number;
  start: number;
  num: number;
  nextStart?: number;
  query: string;
}

export interface ServiceHealthResult {
  serviceName: string;
  status: 'running' | 'stopped' | 'error';
  health: 'healthy' | 'warning' | 'critical';
  lastChecked: number;
  metrics?: {
    responseTime?: number;
    requests?: number;
    errors?: number;
  };
}

export interface LoginResult {
  portal: string;
  username: string;
  token: string;
  expires: number;
  session: PortalSession;
}

// Portal types (imported from existing portal-types)
interface PortalUser {
  username: string;
  fullName?: string;
  email?: string;
  role: string;
  groups?: string[];
  created: number;
  lastLogin?: number;
  privileges?: string[];
}

interface PortalGroup {
  id: string;
  title: string;
  description?: string;
  owner: string;
  access: 'private' | 'org' | 'public';
  created: number;
  modified: number;
  membershipAccess?: 'none' | 'org' | 'collaboration';
}

interface PortalItem {
  id: string;
  title: string;
  type: string;
  owner: string;
  created: number;
  modified: number;
  tags?: string[];
  snippet?: string;
  access: 'private' | 'shared' | 'org' | 'public';
}

export interface PortalSession {
  portal: string;
  username: string;
  token: string;
  expires: number;
  ssl?: boolean;
}

// Command execution options
export interface CommandOptions {
  source?: 'cli' | 'tui' | 'direct';
  timeout?: number;
  format?: 'json' | 'table' | 'raw';
  limit?: number;
  offset?: number;
  filter?: string;
  debug?: boolean;
}

// Helper functions for creating command results
export function createSuccessResult<T>(data: T, metadata?: CommandResult<T>['metadata']): CommandResult<T> {
  return {
    success: true,
    data,
    metadata: {
      source: 'direct',
      executionTime: Date.now(),
      ...metadata
    }
  };
}

export function createErrorResult(error: string, metadata?: CommandResult['metadata']): CommandResult {
  return {
    success: false,
    error,
    metadata: {
      source: 'direct',
      executionTime: Date.now(),
      ...metadata
    }
  };
}

export function createWarningResult<T>(data: T, warning: string, metadata?: CommandResult<T>['metadata']): CommandResult<T> {
  return {
    success: true,
    data,
    warning,
    metadata: {
      source: 'direct',
      executionTime: Date.now(),
      ...metadata
    }
  };
}
/**
 * Wrapper functions for CLI commands that return void
 * These adapt the commands to return structured data for TUI usage
 */

import { getSession } from '../session.js';
import { loginCommand, logoutCommand } from '../commands/auth.js';
import { findUsersCommand, getUserCommand } from '../commands/users.js';
import { findGroupsCommand } from '../commands/groups.js';
import { findItemsCommand } from '../commands/items.js';
import type { LoginResult, UserSearchResult, GroupSearchResult, ItemSearchResult } from '../types/command-result.js';

export async function loginWrapper(options: { portal: string; token?: string; username?: string }): Promise<LoginResult> {
  // Execute the login command
  await loginCommand(options);
  
  // Get the session that was just created
  const session = await getSession();
  if (!session) {
    throw new Error('Login failed - no session created');
  }
  
  return {
    portal: options.portal,
    username: session.username || 'api-token-user',
    token: session.token,
    expires: session.tokenExpires ? session.tokenExpires.getTime() : (Date.now() + 7200000),
    session: {
      portal: options.portal,
      username: session.username || 'api-token-user',
      token: session.token,
      expires: session.tokenExpires ? session.tokenExpires.getTime() : (Date.now() + 7200000)
    }
  };
}

export async function logoutWrapper(): Promise<void> {
  await logoutCommand({});
}

export async function findUsersWrapper(query: string, options: any): Promise<UserSearchResult> {
  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (data: any) => {
    if (typeof data === 'object') {
      output = JSON.stringify(data);
    } else {
      output += String(data);
    }
  };
  
  try {
    await findUsersCommand(query, { ...options, json: true });
    console.log = originalLog;
    
    try {
      return JSON.parse(output);
    } catch {
      return { results: [], total: 0, start: 0, num: 0, query };
    }
  } finally {
    console.log = originalLog;
  }
}

export async function findGroupsWrapper(query: string, options: any): Promise<GroupSearchResult> {
  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (data: any) => {
    if (typeof data === 'object') {
      output = JSON.stringify(data);
    } else {
      output += String(data);
    }
  };
  
  try {
    await findGroupsCommand(query, { ...options, json: true });
    console.log = originalLog;
    
    try {
      return JSON.parse(output);
    } catch {
      return { results: [], total: 0, start: 0, num: 0, query };
    }
  } finally {
    console.log = originalLog;
  }
}

export async function findItemsWrapper(query: string, options: any): Promise<ItemSearchResult> {
  // Capture console output
  let output = '';
  const originalLog = console.log;
  console.log = (data: any) => {
    if (typeof data === 'object') {
      output = JSON.stringify(data);
    } else {
      output += String(data);
    }
  };
  
  try {
    await findItemsCommand(query, { ...options, json: true });
    console.log = originalLog;
    
    try {
      return JSON.parse(output);
    } catch {
      return { results: [], total: 0, start: 0, num: 0, query };
    }
  } finally {
    console.log = originalLog;
  }
}
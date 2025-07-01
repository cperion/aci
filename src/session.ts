import * as keytar from 'keytar';
import { UserSession } from '@esri/arcgis-rest-auth';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';

const SERVICE_NAME = 'aci';
const ADMIN_SERVICE_NAME = 'aci'; // Use same service name to avoid separate keyring prompts

// File-based storage fallback
const SESSION_DIR = join(homedir(), '.aci-sessions');
const ADMIN_SESSION_DIR = join(homedir(), '.aci-admin-sessions');
const ENV_FILE = join(homedir(), '.aci-environment');

// Environment type and default
export type Environment = 'dev' | 'qa' | 'prod' | string;

// Dynamic environment resolver - replaces static DEFAULT_ENV
function getCurrentAccount(env?: Environment): Environment {
  return env || getCurrentEnvironment();
}

// Environment configuration
interface EnvironmentConfig {
  portal: string;
  serverAdmin?: string;  // ArcGIS Server admin URL
  authType?: 'token' | 'oauth' | 'saml' | 'certificate';
  adminTimeout?: number; // Admin session timeout in seconds
}

// Simple environment mapping - can be extended via config file
const ENV_PORTALS: Record<string, string> = {
  prod: 'https://www.arcgis.com/sharing/rest',
  default: 'https://www.arcgis.com/sharing/rest'
};

// Load custom environment config if exists
const CONFIG_FILE = join(homedir(), '.acirc');
let customEnvs: Record<string, EnvironmentConfig> = {};

if (existsSync(CONFIG_FILE)) {
  try {
    const configContent = readFileSync(CONFIG_FILE, 'utf-8');
    // Parse simple INI-style config
    const currentEnv: any = {};
    let currentSection = '';
    
    configContent.split('\n').forEach(line => {
      line = line.trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        if (currentSection && currentEnv.portal) {
          customEnvs[currentSection] = { ...currentEnv };
        }
        currentSection = line.slice(1, -1).toLowerCase();
        Object.keys(currentEnv).forEach(key => delete currentEnv[key]);
      } else if (line.includes('=') && currentSection) {
        const [key, value] = line.split('=').map(s => s.trim());
        if (key && value) {
          currentEnv[key] = value;
        }
      }
    });
    
    if (currentSection && currentEnv.portal) {
      customEnvs[currentSection] = { ...currentEnv };
    }
  } catch (error) {
    console.warn('Failed to load .acirc config:', error);
  }
}

export interface SessionData {
  token: string;
  portal: string;
  username?: string;
  expires: number;
}

export interface AdminSession {
  environment: string;
  adminToken: string;
  serverAdminUrl: string;
  portalToken?: string;
  portal?: string;
  username?: string;
  elevationExpires: number;
  privileges?: string[];
  authenticationMethod: 'TOKEN' | 'CERT' | 'MFA' | 'PORTAL_ELEVATION';
}

// Helper to get portal URL for environment
export function getPortalUrl(env?: Environment): string {
  const environment = env || getCurrentEnvironment();
  
  // Check custom config first
  if (customEnvs[environment]) {
    return customEnvs[environment].portal;
  }
  
  // Fall back to built-in mappings
  return ENV_PORTALS[environment] || ENV_PORTALS.default || 'https://www.arcgis.com/sharing/rest';
}

// Helper to get server admin URL for environment
export function getServerAdminUrl(env?: Environment): string | null {
  const environment = env || getCurrentEnvironment();
  
  // Check custom config for server admin URL
  if (customEnvs[environment]?.serverAdmin) {
    return customEnvs[environment].serverAdmin!;
  }
  
  return null;
}

// Helper to get admin timeout for environment (default 30 minutes)
export function getAdminTimeout(env?: Environment): number {
  const environment = env || getCurrentEnvironment();
  
  if (customEnvs[environment]?.adminTimeout) {
    return customEnvs[environment].adminTimeout! * 1000; // Convert to milliseconds
  }
  
  return 30 * 60 * 1000; // 30 minutes default
}

// Set current environment (persist selection)
export function setCurrentEnvironment(env: Environment): void {
  try {
    writeFileSync(ENV_FILE, env, { mode: 0o600 });
  } catch (error) {
    // Silently fail - not critical for operation
  }
}

// Get current environment name with persistence
export function getCurrentEnvironment(): Environment {
  // Try persistent environment file first
  if (existsSync(ENV_FILE)) {
    try {
      return readFileSync(ENV_FILE, 'utf8').trim();
    } catch {
      // Fall through on read errors
    }
  }
  // Fall back to process env or default
  return process.env.ACI_ENV || 'default';
}

// List all available environments
export function listEnvironments(): Record<string, string> {
  const allEnvs: Record<string, string> = { ...ENV_PORTALS };
  
  // Add custom environments
  Object.entries(customEnvs).forEach(([name, config]) => {
    allEnvs[name] = config.portal;
  });
  
  return allEnvs;
}

// Helper functions for file-based storage
function ensureSessionDir(): void {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 }); // Private directory
  }
}

function getSessionFilePath(account: string): string {
  return join(SESSION_DIR, `${account}.json`);
}

function ensureAdminSessionDir(): void {
  if (!existsSync(ADMIN_SESSION_DIR)) {
    mkdirSync(ADMIN_SESSION_DIR, { recursive: true, mode: 0o700 }); // Private directory
  }
}

function getAdminSessionFilePath(account: string): string {
  return join(ADMIN_SESSION_DIR, `${account}.json`);
}

export async function getSession(env?: Environment): Promise<UserSession | null> {
  const account = getCurrentAccount(env);
  
  // Try keyring first (silently)
  try {
    const sessionStr = await keytar.getPassword(SERVICE_NAME, account);
    if (sessionStr) {
      const sessionData = JSON.parse(sessionStr) as SessionData;
      
      // Check if token is expired with 2-minute buffer
      if (Date.now() > sessionData.expires - 120000) {
        await keytar.deletePassword(SERVICE_NAME, account).catch(() => {});
        return null;
      }
      
      // Create UserSession from stored data
      return new UserSession({
        portal: sessionData.portal,
        token: sessionData.token,
        username: sessionData.username,
        tokenExpires: new Date(sessionData.expires)
      });
    }
  } catch (error) {
    // Keyring failed, continue to file fallback
  }
  
  // Fallback to file-based storage
  try {
    const sessionFilePath = getSessionFilePath(account);
    if (!existsSync(sessionFilePath)) return null;
    
    const sessionStr = readFileSync(sessionFilePath, 'utf-8');
    const sessionData = JSON.parse(sessionStr) as SessionData;
    
    // Check if token is expired with 2-minute buffer
    if (Date.now() > sessionData.expires - 120000) {
      // Remove expired session file
      try {
        require('fs').unlinkSync(sessionFilePath);
      } catch {}
      return null;
    }
    
    // Create UserSession from stored data
    return new UserSession({
      portal: sessionData.portal,
      token: sessionData.token,
      username: sessionData.username,
      tokenExpires: new Date(sessionData.expires)
    });
    
  } catch (error) {
    // Handle corrupted session data
    console.error(`Invalid session data for ${account}, clearing...`);
    try {
      require('fs').unlinkSync(getSessionFilePath(account));
    } catch {}
    return null;
  }
}

export async function saveSession(session: UserSession, env?: Environment): Promise<void> {
  const account = getCurrentAccount(env);
  
  const sessionData: SessionData = {
    token: session.token,
    portal: session.portal,
    username: session.username,
    expires: session.tokenExpires ? session.tokenExpires.getTime() : Date.now() + 7200000 // 2 hours default
  };
  
  // Try keyring first (silently)
  try {
    await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(sessionData));
    console.log(`✓ Session saved to keyring for environment: ${account}`);
    return;
  } catch (error) {
    // Keyring failed, use file fallback
  }
  
  // Fallback to file-based storage
  try {
    ensureSessionDir();
    const sessionFilePath = getSessionFilePath(account);
    writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2), { mode: 0o600 }); // Private file
    console.log(`✓ Session saved to file for environment: ${account}`);
    
  } catch (error) {
    throw new Error(`Failed to save session: ${(error as Error).message}`);
  }
}

export async function clearSession(env?: Environment): Promise<void> {
  const account = getCurrentAccount(env);
  
  // Clear from keyring (silently)
  try {
    await keytar.deletePassword(SERVICE_NAME, account);
  } catch (error) {
    // Ignore errors when clearing session (might not exist)
  }
  
  // Clear from file storage
  try {
    const sessionFilePath = getSessionFilePath(account);
    if (existsSync(sessionFilePath)) {
      require('fs').unlinkSync(sessionFilePath);
    }
  } catch (error) {
    // Ignore errors when clearing session file
  }
}

// Clear all sessions across all environments
export async function clearAllSessions(): Promise<void> {
  // Clear from keyring
  try {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    for (const cred of credentials) {
      await keytar.deletePassword(SERVICE_NAME, cred.account);
    }
  } catch (error) {
    // Ignore errors
  }
  
  // Clear all session files
  try {
    if (existsSync(SESSION_DIR)) {
      const files = require('fs').readdirSync(SESSION_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          require('fs').unlinkSync(join(SESSION_DIR, file));
        }
      }
    }
    
    if (existsSync(ADMIN_SESSION_DIR)) {
      const files = require('fs').readdirSync(ADMIN_SESSION_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          require('fs').unlinkSync(join(ADMIN_SESSION_DIR, file));
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

// Admin Session Management

export async function getAdminSession(env?: Environment): Promise<AdminSession | null> {
  const account = `admin-${getCurrentAccount(env)}`; // Prefix with 'admin-' to differentiate from portal sessions
  
  // Try keyring first (silently)
  try {
    const sessionStr = await keytar.getPassword(ADMIN_SERVICE_NAME, account);
    if (sessionStr) {
      const adminSession = JSON.parse(sessionStr) as AdminSession;
      
      // Check if admin session is expired with 2-minute buffer
      if (Date.now() > adminSession.elevationExpires - 120000) {
        await keytar.deletePassword(ADMIN_SERVICE_NAME, account).catch(() => {});
        return null;
      }
      
      return adminSession;
    }
  } catch (error) {
    // Keyring failed, continue to file fallback
  }
  
  // Fallback to file-based storage
  try {
    const sessionFilePath = getAdminSessionFilePath(account);
    if (!existsSync(sessionFilePath)) return null;
    
    const sessionStr = readFileSync(sessionFilePath, 'utf-8');
    const adminSession = JSON.parse(sessionStr) as AdminSession;
    
    // Check if admin session is expired with 2-minute buffer
    if (Date.now() > adminSession.elevationExpires - 120000) {
      // Remove expired session file
      try {
        require('fs').unlinkSync(sessionFilePath);
      } catch {}
      return null;
    }
    
    return adminSession;
    
  } catch (error) {
    // Handle corrupted admin session data
    console.error(`Invalid admin session data for ${account}, clearing...`);
    try {
      require('fs').unlinkSync(getAdminSessionFilePath(account));
    } catch {}
    return null;
  }
}

export async function saveAdminSession(adminSession: AdminSession, env?: Environment): Promise<void> {
  const account = `admin-${env || adminSession.environment}`; // Prefix with 'admin-' to differentiate from portal sessions
  
  // Try keyring first (silently)
  try {
    await keytar.setPassword(ADMIN_SERVICE_NAME, account, JSON.stringify(adminSession));
    console.log(`✓ Admin session saved to keyring for environment: ${account}`);
    return;
  } catch (error) {
    // Keyring failed, use file fallback
  }
  
  // Fallback to file-based storage
  try {
    ensureAdminSessionDir();
    const sessionFilePath = getAdminSessionFilePath(account);
    writeFileSync(sessionFilePath, JSON.stringify(adminSession, null, 2), { mode: 0o600 }); // Private file
    console.log(`✓ Admin session saved to file for environment: ${account}`);
    
  } catch (error) {
    throw new Error(`Failed to save admin session: ${(error as Error).message}`);
  }
}

export async function clearAdminSession(env?: Environment): Promise<void> {
  const account = `admin-${getCurrentAccount(env)}`; // Prefix with 'admin-' to differentiate from portal sessions
  
  // Clear from keyring (silently)
  try {
    await keytar.deletePassword(ADMIN_SERVICE_NAME, account);
  } catch (error) {
    // Ignore errors when clearing session (might not exist)
  }
  
  // Clear from file storage
  try {
    const sessionFilePath = getAdminSessionFilePath(account);
    if (existsSync(sessionFilePath)) {
      require('fs').unlinkSync(sessionFilePath);
    }
  } catch (error) {
    // Ignore errors when clearing session file
  }
}

export async function requireAdminSession(env?: Environment): Promise<AdminSession> {
  const session = await getAdminSession(env);
  
  if (!session) {
    const environment = getCurrentAccount(env);
    throw new Error(
      `No admin session found for environment '${environment}'. ` +
      `Please authenticate with: aci admin login --env ${environment}`
    );
  }
  
  return session;
}


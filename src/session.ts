import * as keytar from 'keytar';
import { UserSession } from '@esri/arcgis-rest-auth';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';

const SERVICE_NAME = 'aci';
const ADMIN_SERVICE_NAME = 'aci-admin';

// Environment type and default
export type Environment = 'dev' | 'qa' | 'prod' | string;
const DEFAULT_ENV: Environment = process.env.ACI_ENV || 'default';

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
  const environment = env || DEFAULT_ENV;
  
  // Check custom config first
  if (customEnvs[environment]) {
    return customEnvs[environment].portal;
  }
  
  // Fall back to built-in mappings
  return ENV_PORTALS[environment] || ENV_PORTALS.default || 'https://www.arcgis.com/sharing/rest';
}

// Helper to get server admin URL for environment
export function getServerAdminUrl(env?: Environment): string | null {
  const environment = env || DEFAULT_ENV;
  
  // Check custom config for server admin URL
  if (customEnvs[environment]?.serverAdmin) {
    return customEnvs[environment].serverAdmin!;
  }
  
  return null;
}

// Helper to get admin timeout for environment (default 30 minutes)
export function getAdminTimeout(env?: Environment): number {
  const environment = env || DEFAULT_ENV;
  
  if (customEnvs[environment]?.adminTimeout) {
    return customEnvs[environment].adminTimeout! * 1000; // Convert to milliseconds
  }
  
  return 30 * 60 * 1000; // 30 minutes default
}

// Get current environment name
export function getCurrentEnvironment(): Environment {
  return DEFAULT_ENV;
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

export async function getSession(env?: Environment): Promise<UserSession | null> {
  const account = env || DEFAULT_ENV;
  
  try {
    const sessionStr = await keytar.getPassword(SERVICE_NAME, account);
    if (!sessionStr) return null;
    
    const sessionData = JSON.parse(sessionStr) as SessionData;
    
    // Check if token is expired with 2-minute buffer
    if (Date.now() > sessionData.expires - 120000) {
      await keytar.deletePassword(SERVICE_NAME, account);
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
    await keytar.deletePassword(SERVICE_NAME, account).catch(() => {});
    return null;
  }
}

export async function saveSession(session: UserSession, env?: Environment): Promise<void> {
  const account = env || DEFAULT_ENV;
  
  try {
    const sessionData: SessionData = {
      token: session.token,
      portal: session.portal,
      username: session.username,
      expires: session.tokenExpires ? session.tokenExpires.getTime() : Date.now() + 7200000 // 2 hours default
    };
    
    await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(sessionData));
    console.log(`✓ Session saved for environment: ${account}`);
    
  } catch (error) {
    throw new Error(`Failed to save session: ${(error as Error).message}`);
  }
}

export async function clearSession(env?: Environment): Promise<void> {
  const account = env || DEFAULT_ENV;
  
  try {
    await keytar.deletePassword(SERVICE_NAME, account);
  } catch (error) {
    // Ignore errors when clearing session (might not exist)
  }
}

// Clear all sessions across all environments
export async function clearAllSessions(): Promise<void> {
  try {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    for (const cred of credentials) {
      await keytar.deletePassword(SERVICE_NAME, cred.account);
    }
    
    // Also clear admin sessions
    const adminCredentials = await keytar.findCredentials(ADMIN_SERVICE_NAME);
    for (const cred of adminCredentials) {
      await keytar.deletePassword(ADMIN_SERVICE_NAME, cred.account);
    }
  } catch (error) {
    // Ignore errors
  }
}

// Admin Session Management

export async function getAdminSession(env?: Environment): Promise<AdminSession | null> {
  const account = env || DEFAULT_ENV;
  
  try {
    const sessionStr = await keytar.getPassword(ADMIN_SERVICE_NAME, account);
    if (!sessionStr) return null;
    
    const adminSession = JSON.parse(sessionStr) as AdminSession;
    
    // Check if admin session is expired with 2-minute buffer
    if (Date.now() > adminSession.elevationExpires - 120000) {
      await keytar.deletePassword(ADMIN_SERVICE_NAME, account);
      return null;
    }
    
    return adminSession;
    
  } catch (error) {
    // Handle corrupted admin session data
    console.error(`Invalid admin session data for ${account}, clearing...`);
    await keytar.deletePassword(ADMIN_SERVICE_NAME, account).catch(() => {});
    return null;
  }
}

export async function saveAdminSession(adminSession: AdminSession, env?: Environment): Promise<void> {
  const account = env || adminSession.environment;
  
  try {
    await keytar.setPassword(ADMIN_SERVICE_NAME, account, JSON.stringify(adminSession));
  } catch (error) {
    throw new Error(`Failed to save admin session: ${(error as Error).message}`);
  }
}

export async function clearAdminSession(env?: Environment): Promise<void> {
  const account = env || DEFAULT_ENV;
  
  try {
    await keytar.deletePassword(ADMIN_SERVICE_NAME, account);
  } catch (error) {
    // Ignore errors when clearing session (might not exist)
  }
}

export async function requireAdminSession(env?: Environment): Promise<AdminSession> {
  const session = await getAdminSession(env);
  
  if (!session) {
    const environment = env || DEFAULT_ENV;
    throw new Error(
      `No admin session found for environment '${environment}'. ` +
      `Please authenticate with: aci admin login --env ${environment}`
    );
  }
  
  return session;
}


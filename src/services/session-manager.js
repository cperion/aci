/**
 * Session Manager Service
 * Simplified session management extracted from React contexts
 * Handles file-based session storage with proper locking for concurrent CLI usage
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as keytar from 'keytar';

const SERVICE_NAME = 'aci';
const SESSION_DIR = join(homedir(), '.aci-sessions');
const ADMIN_SESSION_DIR = join(homedir(), '.aci-admin-sessions');
const ENV_FILE = join(homedir(), '.aci-environment');
const LOCK_TIMEOUT = 5000; // 5 seconds

// Simple file-based locking for concurrent CLI usage
const activeLocks = new Map();

async function withLock(lockPath, operation) {
  const lockKey = lockPath + '.lock';
  
  // Check if lock already exists
  if (activeLocks.has(lockKey)) {
    throw new Error(`Session is locked by another process: ${lockPath}`);
  }
  
  // Acquire lock
  activeLocks.set(lockKey, Date.now());
  
  try {
    const result = await operation();
    return result;
  } finally {
    // Release lock
    activeLocks.delete(lockKey);
  }
}

function ensureSessionDir() {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
  }
}

function ensureAdminSessionDir() {
  if (!existsSync(ADMIN_SESSION_DIR)) {
    mkdirSync(ADMIN_SESSION_DIR, { recursive: true, mode: 0o700 });
  }
}

function getCurrentEnvironment() {
  if (existsSync(ENV_FILE)) {
    try {
      return readFileSync(ENV_FILE, 'utf8').trim();
    } catch {
      // Fall through on read errors
    }
  }
  return process.env.ACI_ENV || 'default';
}

export class SessionManager {
  /**
   * Get current portal session
   */
  static async getSession(env) {
    const account = env || getCurrentEnvironment();
    const sessionPath = join(SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Try keyring first (silently)
      try {
        const sessionStr = await keytar.getPassword(SERVICE_NAME, account);
        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          
          // Check if token is expired with 2-minute buffer
          if (Date.now() > sessionData.expires - 120000) {
            await keytar.deletePassword(SERVICE_NAME, account).catch(() => {});
            return null;
          }
          
          return sessionData;
        }
      } catch (error) {
        // Keyring failed, continue to file fallback
      }
      
      // Fallback to file-based storage
      try {
        if (!existsSync(sessionPath)) return null;
        
        const sessionStr = readFileSync(sessionPath, 'utf-8');
        const sessionData = JSON.parse(sessionStr);
        
        // Check if token is expired with 2-minute buffer
        if (Date.now() > sessionData.expires - 120000) {
          try {
            unlinkSync(sessionPath);
          } catch {}
          return null;
        }
        
        return sessionData;
        
      } catch (error) {
        // Handle corrupted session data
        console.error(`Invalid session data for ${account}, clearing...`);
        try {
          unlinkSync(sessionPath);
        } catch {}
        return null;
      }
    });
  }

  /**
   * Save portal session with atomic writes
   */
  static async setSession(sessionData, env) {
    const account = env || getCurrentEnvironment();
    const sessionPath = join(SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Try keyring first (silently)
      try {
        await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(sessionData));
        return;
      } catch (error) {
        // Keyring failed, use file fallback
      }
      
      // Fallback to file-based storage
      try {
        ensureSessionDir();
        writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2), { mode: 0o600 });
        
      } catch (error) {
        throw new Error(`Failed to save session: ${error.message}`);
      }
    });
  }

  /**
   * Clear portal session
   */
  static async clearSession(env) {
    const account = env || getCurrentEnvironment();
    const sessionPath = join(SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Clear from keyring (silently)
      try {
        await keytar.deletePassword(SERVICE_NAME, account);
      } catch (error) {
        // Ignore errors when clearing session (might not exist)
      }
      
      // Clear from file storage
      try {
        if (existsSync(sessionPath)) {
          unlinkSync(sessionPath);
        }
      } catch (error) {
        // Ignore errors when clearing session file
      }
    });
  }

  /**
   * Get admin session
   */
  static async getAdminSession(env) {
    const account = `admin-${env || getCurrentEnvironment()}`;
    const sessionPath = join(ADMIN_SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Try keyring first (silently)
      try {
        const sessionStr = await keytar.getPassword(SERVICE_NAME, account);
        if (sessionStr) {
          const adminSession = JSON.parse(sessionStr);
          
          // Check if admin session is expired with 2-minute buffer
          if (Date.now() > adminSession.elevationExpires - 120000) {
            await keytar.deletePassword(SERVICE_NAME, account).catch(() => {});
            return null;
          }
          
          return adminSession;
        }
      } catch (error) {
        // Keyring failed, continue to file fallback
      }
      
      // Fallback to file-based storage
      try {
        if (!existsSync(sessionPath)) return null;
        
        const sessionStr = readFileSync(sessionPath, 'utf-8');
        const adminSession = JSON.parse(sessionStr);
        
        // Check if admin session is expired with 2-minute buffer
        if (Date.now() > adminSession.elevationExpires - 120000) {
          try {
            unlinkSync(sessionPath);
          } catch {}
          return null;
        }
        
        return adminSession;
        
      } catch (error) {
        // Handle corrupted admin session data
        console.error(`Invalid admin session data for ${account}, clearing...`);
        try {
          unlinkSync(sessionPath);
        } catch {}
        return null;
      }
    });
  }

  /**
   * Save admin session with atomic writes
   */
  static async setAdminSession(adminSession, env) {
    const account = `admin-${env || adminSession.environment}`;
    const sessionPath = join(ADMIN_SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Try keyring first (silently)
      try {
        await keytar.setPassword(SERVICE_NAME, account, JSON.stringify(adminSession));
        return;
      } catch (error) {
        // Keyring failed, use file fallback
      }
      
      // Fallback to file-based storage
      try {
        ensureAdminSessionDir();
        writeFileSync(sessionPath, JSON.stringify(adminSession, null, 2), { mode: 0o600 });
        
      } catch (error) {
        throw new Error(`Failed to save admin session: ${error.message}`);
      }
    });
  }

  /**
   * Clear admin session
   */
  static async clearAdminSession(env) {
    const account = `admin-${env || getCurrentEnvironment()}`;
    const sessionPath = join(ADMIN_SESSION_DIR, `${account}.json`);
    
    return withLock(sessionPath, async () => {
      // Clear from keyring (silently)
      try {
        await keytar.deletePassword(SERVICE_NAME, account);
      } catch (error) {
        // Ignore errors when clearing session (might not exist)
      }
      
      // Clear from file storage
      try {
        if (existsSync(sessionPath)) {
          unlinkSync(sessionPath);
        }
      } catch (error) {
        // Ignore errors when clearing session file
      }
    });
  }

  /**
   * Get current environment
   */
  static getCurrentEnvironment() {
    return getCurrentEnvironment();
  }

  /**
   * Set current environment
   */
  static setCurrentEnvironment(env) {
    try {
      writeFileSync(ENV_FILE, env, { mode: 0o600 });
    } catch (error) {
      // Silently fail - not critical for operation
    }
  }
}
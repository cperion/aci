import { readFile, writeFile, stat } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Session synchronization utility
 * Ensures TUI and CLI share the same session state
 */
export class SessionSync {
  private static readonly SESSION_FILE = join(homedir(), '.acirc');
  private lastModified: number = 0;
  
  /**
   * Check if session file has been modified since last read
   */
  async hasSessionChanged(): Promise<boolean> {
    try {
      const stats = await stat(SessionSync.SESSION_FILE);
      const currentModified = stats.mtime.getTime();
      
      if (currentModified > this.lastModified) {
        this.lastModified = currentModified;
        return true;
      }
      return false;
    } catch {
      // File doesn't exist or error reading - consider as no change
      return false;
    }
  }
  
  /**
   * Read session data from file
   */
  async readSession(): Promise<{ portal: boolean; admin: boolean }> {
    try {
      const data = await readFile(SessionSync.SESSION_FILE, 'utf-8');
      const session = JSON.parse(data);
      
      // Update last modified time
      const stats = await stat(SessionSync.SESSION_FILE);
      this.lastModified = stats.mtime.getTime();
      
      return {
        portal: !!session.portal,
        admin: !!session.admin
      };
    } catch {
      return { portal: false, admin: false };
    }
  }
  
  /**
   * Start monitoring session file for changes
   * Returns a cleanup function to stop monitoring
   */
  startMonitoring(callback: (authStatus: { portal: boolean; admin: boolean }) => void): () => void {
    const interval = setInterval(async () => {
      if (await this.hasSessionChanged()) {
        const authStatus = await this.readSession();
        callback(authStatus);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }
  
  /**
   * Get current session status synchronously (from last read)
   */
  getLastKnownStatus(): { portal: boolean; admin: boolean } {
    // This is a simplified implementation
    // In production, you might want to cache the last known state
    return { portal: false, admin: false };
  }
}
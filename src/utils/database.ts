import { Database } from 'bun:sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import type { LogEntry } from './logger.js';

// Database schema version for migrations
const SCHEMA_VERSION = 2;

// Database location
const DB_DIR = join(homedir(), '.aci');
const DB_PATH = join(DB_DIR, 'admin.db');

export interface CommandHistory {
  id?: number;
  command: string;
  environment: string;
  arguments: string; // JSON
  start_time: number;
  end_time?: number;
  duration?: number;
  success?: boolean;
  error?: string;
  user?: string;
  metadata?: string; // JSON
}

export interface AdminSessionRecord {
  id?: number;
  environment: string;
  admin_token_hash: string; // Hash of admin token for identification
  server_admin_url: string;
  portal_token_hash?: string; // Hash of portal token if federated
  portal_url?: string;
  username?: string;
  created_time: number;
  expires_time: number;
  privileges?: string; // JSON array
  auth_method: 'TOKEN' | 'CERT' | 'MFA' | 'PORTAL_ELEVATION';
  last_accessed?: number;
}

export interface AuditLog {
  id?: number;
  timestamp: number;
  level: string;
  command: string;
  environment: string;
  message: string;
  duration?: number;
  metadata?: string; // JSON
  success?: boolean;
  user?: string;
}

export interface ServiceEvent {
  id?: number;
  timestamp: number;
  environment: string;
  service_name: string;
  service_type: string;
  event_type: 'START' | 'STOP' | 'RESTART' | 'FAILURE' | 'RECOVERY';
  status: string;
  folder?: string;
  url?: string;
  metadata?: string; // JSON
}

/**
 * SQLite-based persistence layer for ArcGIS CLI admin operations
 * Provides audit trails, session management, and queryable operational data
 */
export class AdminDatabase {
  private db: Database;
  private initialized = false;

  constructor() {
    // Ensure database directory exists
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true, mode: 0o700 });
    }

    // Open database with Bun's SQLite
    this.db = new Database(DB_PATH);

    // Enable WAL mode for better concurrency
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA cache_size = 1000');
    this.db.exec('PRAGMA temp_store = memory');

    this.initialize();
  }

  /**
   * Initialize database schema and run migrations
   */
  private initialize(): void {
    if (this.initialized) return;

    // Check current schema version
    let currentVersion = 0;
    try {
      const result = this.db.query('PRAGMA user_version').get() as { user_version: number };
      currentVersion = result?.user_version || 0;
    } catch (error) {
      // Database doesn't exist yet
    }

    // Run migrations
    this.runMigrations(currentVersion);
    this.initialized = true;
  }

  /**
   * Run database migrations
   */
  private runMigrations(fromVersion: number): void {
    const migrations = [
      // Migration 0 -> 1: Initial schema
      () => {
        this.db.exec(`
          -- Command execution history
          CREATE TABLE IF NOT EXISTS command_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command TEXT NOT NULL,
            environment TEXT NOT NULL,
            arguments TEXT, -- JSON
            start_time INTEGER NOT NULL,
            end_time INTEGER,
            duration INTEGER,
            success BOOLEAN,
            error TEXT,
            user TEXT,
            metadata TEXT, -- JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Admin session records
          CREATE TABLE IF NOT EXISTS admin_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            environment TEXT NOT NULL,
            admin_token_hash TEXT NOT NULL,
            server_admin_url TEXT NOT NULL,
            portal_token_hash TEXT,
            portal_url TEXT,
            username TEXT,
            created_time INTEGER NOT NULL,
            expires_time INTEGER NOT NULL,
            privileges TEXT, -- JSON array
            auth_method TEXT NOT NULL CHECK (auth_method IN ('TOKEN', 'CERT', 'MFA', 'PORTAL_ELEVATION')),
            last_accessed INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Audit log for compliance and debugging
          CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            level TEXT NOT NULL,
            command TEXT NOT NULL,
            environment TEXT NOT NULL,
            message TEXT NOT NULL,
            duration INTEGER,
            metadata TEXT, -- JSON
            success BOOLEAN,
            user TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Service events for operational monitoring
          CREATE TABLE IF NOT EXISTS service_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            environment TEXT NOT NULL,
            service_name TEXT NOT NULL,
            service_type TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK (event_type IN ('START', 'STOP', 'RESTART', 'FAILURE', 'RECOVERY')),
            status TEXT NOT NULL,
            folder TEXT,
            url TEXT,
            metadata TEXT, -- JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Indexes for performance
          CREATE INDEX IF NOT EXISTS idx_command_history_time ON command_history(start_time);
          CREATE INDEX IF NOT EXISTS idx_command_history_env ON command_history(environment);
          CREATE INDEX IF NOT EXISTS idx_command_history_command ON command_history(command);
          
          CREATE INDEX IF NOT EXISTS idx_admin_sessions_env ON admin_sessions(environment);
          CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_time);
          
          CREATE INDEX IF NOT EXISTS idx_audit_log_time ON audit_log(timestamp);
          CREATE INDEX IF NOT EXISTS idx_audit_log_env ON audit_log(environment);
          CREATE INDEX IF NOT EXISTS idx_audit_log_level ON audit_log(level);
          
          CREATE INDEX IF NOT EXISTS idx_service_events_time ON service_events(timestamp);
          CREATE INDEX IF NOT EXISTS idx_service_events_env ON service_events(environment);
          CREATE INDEX IF NOT EXISTS idx_service_events_service ON service_events(service_name);
        `);
      },
      // Migration 1 -> 2: Add recent_items table for TUI navigation
      () => {
        this.db.exec(`
          -- Recent items for TUI navigation
          CREATE TABLE IF NOT EXISTS recent_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('service', 'user', 'group', 'item', 'datastore')),
            name TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            view_id TEXT,
            metadata TEXT, -- JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(item_id, type) -- Prevent duplicates
          );

          -- Indexes for recent_items
          CREATE INDEX IF NOT EXISTS idx_recent_items_timestamp ON recent_items(timestamp);
          CREATE INDEX IF NOT EXISTS idx_recent_items_type ON recent_items(type);
        `);
      }
    ];

    // Run migrations sequentially
    for (let version = fromVersion; version < SCHEMA_VERSION; version++) {
      const migration = migrations[version];
      if (migration) {
        migration();
        this.db.exec(`PRAGMA user_version = ${version + 1}`);
      }
    }
  }

  /**
   * Record command execution start
   */
  recordCommandStart(command: string, environment: string, args: string[], options: Record<string, any>): number {
    const stmt = this.db.query(`
      INSERT INTO command_history (command, environment, arguments, start_time, user, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      command,
      environment,
      JSON.stringify(args),
      Date.now(),
      process.env.USER || process.env.USERNAME || 'unknown',
      JSON.stringify({ options })
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Record command execution completion
   */
  recordCommandEnd(historyId: number, success: boolean, error?: string, metadata?: Record<string, any>): void {
    const endTime = Date.now();
    
    const stmt = this.db.query(`
      UPDATE command_history 
      SET end_time = ?, duration = (? - start_time), success = ?, error = ?, metadata = json_patch(COALESCE(metadata, '{}'), ?)
      WHERE id = ?
    `);

    stmt.run(endTime, endTime, success, error || null, JSON.stringify(metadata || {}), historyId);
  }

  /**
   * Save admin session record
   */
  saveAdminSession(session: Omit<AdminSessionRecord, 'id'>): number {
    const stmt = this.db.query(`
      INSERT INTO admin_sessions (
        environment, admin_token_hash, server_admin_url, portal_token_hash,
        portal_url, username, created_time, expires_time, privileges, auth_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      session.environment,
      session.admin_token_hash,
      session.server_admin_url,
      session.portal_token_hash || null,
      session.portal_url || null,
      session.username || null,
      session.created_time,
      session.expires_time,
      session.privileges || null,
      session.auth_method
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get admin sessions by environment
   */
  getAdminSessions(environment?: string): AdminSessionRecord[] {
    let query = 'SELECT * FROM admin_sessions';
    let params: any[] = [];

    if (environment) {
      query += ' WHERE environment = ?';
      params.push(environment);
    }

    query += ' ORDER BY created_time DESC';

    const stmt = this.db.query(query);
    return stmt.all(...params) as AdminSessionRecord[];
  }

  /**
   * Clean expired admin sessions
   */
  cleanExpiredAdminSessions(): number {
    const stmt = this.db.query('DELETE FROM admin_sessions WHERE expires_time < ?');
    const result = stmt.run(Date.now());
    return result.changes;
  }

  /**
   * Add audit log entry
   */
  addAuditEntry(entry: LogEntry): void {
    const stmt = this.db.query(`
      INSERT INTO audit_log (timestamp, level, command, environment, message, duration, metadata, success, user)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.timestamp,
      entry.level,
      entry.command,
      entry.environment || 'default',
      entry.message,
      entry.duration || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.success || null,
      process.env.USER || process.env.USERNAME || 'unknown'
    );
  }

  /**
   * Record service event
   */
  recordServiceEvent(event: Omit<ServiceEvent, 'id'>): number {
    const stmt = this.db.query(`
      INSERT INTO service_events (timestamp, environment, service_name, service_type, event_type, status, folder, url, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      event.timestamp,
      event.environment,
      event.service_name,
      event.service_type,
      event.event_type,
      event.status,
      event.folder || null,
      event.url || null,
      event.metadata || null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get command history with optional filters
   */
  getCommandHistory(options: {
    environment?: string;
    command?: string;
    success?: boolean;
    limit?: number;
    since?: number;
  } = {}): CommandHistory[] {
    let query = 'SELECT * FROM command_history WHERE 1=1';
    const params: any[] = [];

    if (options.environment) {
      query += ' AND environment = ?';
      params.push(options.environment);
    }

    if (options.command) {
      query += ' AND command LIKE ?';
      params.push(`%${options.command}%`);
    }

    if (options.success !== undefined) {
      query += ' AND success = ?';
      params.push(options.success);
    }

    if (options.since) {
      query += ' AND start_time >= ?';
      params.push(options.since);
    }

    query += ' ORDER BY start_time DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.query(query);
    return stmt.all(...params) as CommandHistory[];
  }

  /**
   * Execute safe read-only query with security restrictions
   */
  executeQuery(sql: string, params: any[] = []): any[] {
    // Security: Only allow read operations
    const normalizedSql = sql.trim().toLowerCase();
    if (!normalizedSql.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Security: Prevent certain dangerous operations
    const forbidden = ['attach', 'detach', 'pragma', 'vacuum', 'alter', 'drop', 'create'];
    if (forbidden.some(word => normalizedSql.includes(word))) {
      throw new Error('Query contains forbidden operations');
    }

    // Security: Limit result size
    const limitedSql = sql.includes('LIMIT') ? sql : `${sql} LIMIT 1000`;

    // Execute with timeout - better-sqlite3 doesn't have setTimeout, use a workaround
    const stmt = this.db.query(limitedSql);
    
    // Set database busy timeout instead
    this.db.exec('PRAGMA busy_timeout = 5000');
    
    return stmt.all(...params);
  }

  /**
   * Get database schema information
   */
  getSchema(): Array<{ table: string; columns: any[] }> {
    const tables = this.db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as Array<{ name: string }>;

    return tables.map(table => ({
      table: table.name,
      columns: this.db.query(`PRAGMA table_info(${table.name})`).all()
    }));
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Add recent item (with deduplication)
   */
  addRecentItem(item: { id: string; type: string; name: string; viewId?: string; metadata?: Record<string, any> }): void {
    const stmt = this.db.query(`
      INSERT OR REPLACE INTO recent_items (item_id, type, name, timestamp, view_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.type,
      item.name,
      Date.now(),
      item.viewId || null,
      item.metadata ? JSON.stringify(item.metadata) : null
    );
  }

  /**
   * Get recent items with optional type filter
   */
  getRecentItems(type?: string, limit: number = 10): Array<{ id: string; type: string; name: string; timestamp: number; viewId?: string; metadata?: Record<string, any> }> {
    let query = 'SELECT item_id as id, type, name, timestamp, view_id as viewId, metadata FROM recent_items';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    // Only show items from the last 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    query += type ? ' AND timestamp > ?' : ' WHERE timestamp > ?';
    params.push(weekAgo);

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.query(query);
    const results = stmt.all(...params) as Array<{ id: string; type: string; name: string; timestamp: number; viewId?: string; metadata?: string }>;

    return results.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : undefined
    }));
  }

  /**
   * Remove recent item
   */
  removeRecentItem(id: string, type: string): void {
    const stmt = this.db.query('DELETE FROM recent_items WHERE item_id = ? AND type = ?');
    stmt.run(id, type);
  }

  /**
   * Clear all recent items
   */
  clearRecentItems(): void {
    const stmt = this.db.query('DELETE FROM recent_items');
    stmt.run();
  }

  /**
   * Clean old recent items (older than 7 days)
   */
  cleanOldRecentItems(): number {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const stmt = this.db.query('DELETE FROM recent_items WHERE timestamp < ?');
    const result = stmt.run(weekAgo);
    return result.changes;
  }

  /**
   * Get database file path
   */
  getDbPath(): string {
    return DB_PATH;
  }
}

// Singleton instance
let adminDB: AdminDatabase | null = null;

export function getAdminDatabase(): AdminDatabase {
  if (!adminDB) {
    adminDB = new AdminDatabase();
  }
  return adminDB;
}

export function closeAdminDatabase(): void {
  if (adminDB) {
    adminDB.close();
    adminDB = null;
  }
}
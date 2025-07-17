/**
 * Database Service
 * Simplified database operations extracted from React contexts
 * Provides SQLite abstraction for recent items, audit logs, and analytics
 */

import { getAdminDatabase } from '../utils/database.js';

export class DatabaseService {
  /**
   * Get recent items with optional type filter
   */
  static getRecentItems(type, limit = 10) {
    const db = getAdminDatabase();
    return db.getRecentItems(type, limit);
  }

  /**
   * Add recent item with proper cleanup
   */
  static addRecentItem(item) {
    const db = getAdminDatabase();
    
    // Clean old items first to prevent bloat
    db.cleanOldRecentItems();
    
    // Add new item (will replace existing with same id/type)
    db.addRecentItem(item);
  }

  /**
   * Remove specific recent item
   */
  static removeRecentItem(id, type) {
    const db = getAdminDatabase();
    db.removeRecentItem(id, type);
  }

  /**
   * Clear all recent items
   */
  static clearRecentItems() {
    const db = getAdminDatabase();
    db.clearRecentItems();
  }

  /**
   * Add audit log entry for operations
   */
  static logOperation(command, environment, message, metadata = {}) {
    const db = getAdminDatabase();
    
    const entry = {
      timestamp: Date.now(),
      level: 'INFO',
      command,
      environment: environment || 'default',
      message,
      metadata,
      success: true
    };
    
    db.addAuditEntry(entry);
  }

  /**
   * Log error for operations
   */
  static logError(command, environment, error, metadata = {}) {
    const db = getAdminDatabase();
    
    const entry = {
      timestamp: Date.now(),
      level: 'ERROR',
      command,
      environment: environment || 'default',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        ...metadata,
        stack: error instanceof Error ? error.stack : undefined
      },
      success: false
    };
    
    db.addAuditEntry(entry);
  }

  /**
   * Get audit logs with filtering
   */
  static getAuditLogs(options = {}) {
    const db = getAdminDatabase();
    
    // Map to command_history query format
    const queryOptions = {
      environment: options.environment,
      command: options.command,
      success: options.success,
      limit: options.limit || 100,
      since: options.since
    };
    
    return db.getCommandHistory(queryOptions);
  }

  /**
   * Record service event for monitoring
   */
  static recordServiceEvent(serviceName, eventType, status, metadata = {}) {
    const db = getAdminDatabase();
    
    const event = {
      timestamp: Date.now(),
      environment: metadata.environment || 'default',
      service_name: serviceName,
      service_type: metadata.serviceType || 'unknown',
      event_type: eventType, // 'START', 'STOP', 'RESTART', 'FAILURE', 'RECOVERY'
      status,
      folder: metadata.folder,
      url: metadata.url,
      metadata: JSON.stringify(metadata)
    };
    
    db.recordServiceEvent(event);
  }

  /**
   * Execute safe read-only queries for analytics
   */
  static executeQuery(sql, params = []) {
    const db = getAdminDatabase();
    return db.executeQuery(sql, params);
  }

  /**
   * Get database schema for inspection
   */
  static getSchema() {
    const db = getAdminDatabase();
    return db.getSchema();
  }

  /**
   * Get command execution metrics
   */
  static getCommandMetrics(days = 7) {
    const db = getAdminDatabase();
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    try {
      // Get command frequency
      const commandStats = db.executeQuery(`
        SELECT command, COUNT(*) as count, 
               AVG(duration) as avg_duration,
               COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
               COUNT(CASE WHEN success = 0 THEN 1 END) as error_count
        FROM command_history 
        WHERE start_time > ?
        GROUP BY command 
        ORDER BY count DESC
        LIMIT 20
      `, [since]);

      // Get environment stats
      const envStats = db.executeQuery(`
        SELECT environment, COUNT(*) as count
        FROM command_history 
        WHERE start_time > ?
        GROUP BY environment 
        ORDER BY count DESC
      `, [since]);

      // Get error patterns
      const errorStats = db.executeQuery(`
        SELECT command, error, COUNT(*) as count
        FROM command_history 
        WHERE start_time > ? AND success = 0 AND error IS NOT NULL
        GROUP BY command, error 
        ORDER BY count DESC
        LIMIT 10
      `, [since]);

      return {
        commands: commandStats,
        environments: envStats,
        errors: errorStats,
        timeRange: days
      };
    } catch (error) {
      console.error('Failed to get command metrics:', error);
      return {
        commands: [],
        environments: [],
        errors: [],
        timeRange: days
      };
    }
  }

  /**
   * Get authentication failure patterns
   */
  static getAuthFailures(days = 7) {
    const db = getAdminDatabase();
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    try {
      const authFailures = db.executeQuery(`
        SELECT timestamp, command, environment, message
        FROM audit_log 
        WHERE timestamp > ? 
          AND level = 'ERROR'
          AND (message LIKE '%auth%' OR message LIKE '%login%' OR message LIKE '%token%')
        ORDER BY timestamp DESC
        LIMIT 50
      `, [since]);

      return authFailures.map(failure => ({
        timestamp: new Date(failure.timestamp),
        command: failure.command,
        environment: failure.environment,
        message: failure.message
      }));
    } catch (error) {
      console.error('Failed to get auth failures:', error);
      return [];
    }
  }

  /**
   * Get service health trends
   */
  static getServiceHealth(serviceName, days = 7) {
    const db = getAdminDatabase();
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    try {
      const events = db.executeQuery(`
        SELECT timestamp, event_type, status, metadata
        FROM service_events 
        WHERE timestamp > ? 
          AND service_name = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `, [since, serviceName]);

      return events.map(event => ({
        timestamp: new Date(event.timestamp),
        eventType: event.event_type,
        status: event.status,
        metadata: event.metadata ? JSON.parse(event.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to get service health:', error);
      return [];
    }
  }

  /**
   * Record command start for tracking
   */
  static recordCommandStart(command, environment, args, options = {}) {
    const db = getAdminDatabase();
    return db.recordCommandStart(command, environment, args, options);
  }

  /**
   * Record command completion
   */
  static recordCommandEnd(historyId, success, error, metadata = {}) {
    const db = getAdminDatabase();
    db.recordCommandEnd(historyId, success, error, metadata);
  }

  /**
   * Close database connection
   */
  static close() {
    const db = getAdminDatabase();
    db.close();
  }
}
import { Command } from 'commander';
import { getAdminDatabase } from './database.js';

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  command: string;
  message: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  environment?: string;
  success?: boolean;
}

export interface LogContext {
  command: string;
  environment?: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Minimal viable enterprise logging framework for ArcGIS CLI
 * Provides security-aware sanitization, structured logging, and operation tracing
 */
export class CommandLogger {
  private context: LogContext;
  private entries: LogEntry[] = [];
  private historyId?: number;

  constructor(command: Command, metadata?: Record<string, unknown>) {
    this.context = {
      command: command.name(),
      startTime: Date.now(),
      metadata: metadata || {},
      environment: process.env.ACI_ENV || 'default'
    };

    // Record command start in database
    try {
      const db = getAdminDatabase();
      this.historyId = db.recordCommandStart(
        this.context.command,
        this.context.environment || 'default',
        command.args || [],
        (command as any).opts?.() || {}
      );
    } catch (error) {
      // Fail silently - logging should not break command execution
      console.error('Failed to record command start:', error);
    }
  }

  /**
   * Log with automatic sanitization of sensitive fields
   */
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const sanitizedMeta = metadata ? this.sanitize(metadata) : undefined;
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      command: this.context.command,
      message,
      metadata: sanitizedMeta,
      environment: this.context.environment,
      duration: level === 'AUDIT' ? this.getDuration() : undefined
    };

    this.entries.push(entry);

    // Store in database for audit trail
    try {
      const db = getAdminDatabase();
      db.addAuditEntry(entry);
    } catch (error) {
      // Fail silently - logging should not break command execution
    }

    // Output based on log level and verbosity
    this.output(entry);
  }

  /**
   * Log operation start
   */
  start(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', `→ ${message}`, metadata);
  }

  /**
   * Log operation success
   */
  success(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', `✓ ${message}`, { ...metadata, success: true });
  }

  /**
   * Log operation failure
   */
  failure(message: string, error?: Error | string, metadata?: Record<string, unknown>): void {
    const errorMeta = {
      ...metadata,
      success: false,
      error: typeof error === 'string' ? error : error?.message,
      errorCode: error instanceof Error ? (error as any).code : undefined
    };
    this.log('ERROR', `✗ ${message}`, errorMeta);
  }

  /**
   * Log warning
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', `⚠ ${message}`, metadata);
  }

  /**
   * Log debug information (only in verbose mode)
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Log audit trail for compliance
   */
  audit(action: string, metadata?: Record<string, unknown>): void {
    this.log('AUDIT', action, {
      ...metadata,
      duration: this.getDuration(),
      timestamp: Date.now()
    });
  }

  /**
   * Get operation duration
   */
  getDuration(): number {
    return Date.now() - this.context.startTime;
  }

  /**
   * Complete command execution logging
   */
  complete(success: boolean = true, error?: Error | string, metadata?: Record<string, unknown>): void {
    // Record command completion in database
    if (this.historyId) {
      try {
        const db = getAdminDatabase();
        db.recordCommandEnd(
          this.historyId,
          success,
          typeof error === 'string' ? error : error?.message,
          metadata
        );
      } catch (dbError) {
        // Fail silently - logging should not break command execution
      }
    }

    // Log completion
    if (success) {
      this.audit(`Command completed successfully`, { 
        ...metadata,
        totalEntries: this.entries.length
      });
    } else {
      this.audit(`Command failed`, { 
        ...metadata,
        error: typeof error === 'string' ? error : error?.message,
        totalEntries: this.entries.length
      });
    }
  }

  /**
   * Get all log entries for this command execution
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Sanitize sensitive fields from metadata
   */
  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'token', 'adminToken', 'password', 'credentials', 'apiKey',
      'authorization', 'cookie', 'session', 'secret', 'key'
    ];

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitive) {
        if (typeof value === 'string' && value.length > 8) {
          // Show first 4 and last 4 characters for tokens
          sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          sanitized[key] = '***REDACTED***';
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Output log entry based on level and verbosity
   */
  private output(entry: LogEntry): void {
    const { timestamp, level, command, message, duration, metadata } = entry;
    const timeStr = new Date(timestamp).toISOString();
    const durationStr = duration ? `:${duration}ms` : '';
    const context = `[${command}${durationStr}]`;
    
    // Always show errors
    if (level === 'ERROR') {
      console.error(`${timeStr} ${context} ${message}`);
      if (metadata && Object.keys(metadata).length > 0) {
        console.error('  Context:', metadata);
      }
      return;
    }

    // Show warnings unless in quiet mode
    if (level === 'WARN' && !process.env.ACI_QUIET) {
      console.warn(`${timeStr} ${context} ${message}`);
      if (metadata && Object.keys(metadata).length > 0) {
        console.warn('  Context:', metadata);
      }
      return;
    }

    // Show info/audit in verbose mode or when explicitly requested
    if ((level === 'INFO' || level === 'AUDIT') && (process.env.ACI_VERBOSE || process.env.ACI_DEBUG)) {
      console.log(`${timeStr} ${context} ${message}`);
      if (metadata && Object.keys(metadata).length > 0) {
        console.log('  Context:', metadata);
      }
      return;
    }

    // Show debug only in debug mode
    if (level === 'DEBUG' && process.env.ACI_DEBUG) {
      console.log(`${timeStr} ${context} [DEBUG] ${message}`);
      if (metadata && Object.keys(metadata).length > 0) {
        console.log('  Context:', metadata);
      }
    }
  }
}

/**
 * Global logger instance for static access
 */
let currentLogger: CommandLogger | null = null;

export function setCurrentLogger(logger: CommandLogger): void {
  currentLogger = logger;
}

export function getCurrentLogger(): CommandLogger | null {
  return currentLogger;
}

/**
 * Quick logging functions for use without CommandLogger instance
 */
export const log = {
  info: (message: string, metadata?: Record<string, unknown>) => 
    currentLogger?.log('INFO', message, metadata),
  
  warn: (message: string, metadata?: Record<string, unknown>) => 
    currentLogger?.warn(message, metadata),
  
  error: (message: string, metadata?: Record<string, unknown>) => 
    currentLogger?.failure(message, undefined, metadata),
  
  debug: (message: string, metadata?: Record<string, unknown>) => 
    currentLogger?.debug(message, metadata),
  
  audit: (action: string, metadata?: Record<string, unknown>) => 
    currentLogger?.audit(action, metadata)
};
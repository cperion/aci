/**
 * Error Integration Hook for TUI Actions
 * Provides helper functions to integrate error handling with TUI operations
 */

import { useCallback } from 'react';

// Simple error handler stub - actual error handling is done via useNotification
const useErrorHandler = () => ({
  addError: (error: any) => console.error('Error:', error)
});

// Error creation functions
const createGisError = (title: string, details: string, severity: string = 'operation', data?: any) => ({
  title,
  details,
  category: 'gis',
  severity: severity as any,
  contextData: data
});

const createAuthError = (title: string, details: string) => ({
  title,
  details,
  category: 'auth',
  severity: 'critical'
});

const createNetworkError = (title: string, details: string) => ({
  title,
  details,
  category: 'network',
  severity: 'operation'
});

const createUserError = (title: string, details: string) => ({
  title,
  details,
  category: 'user',
  severity: 'message'
});

const createSystemError = (title: string, details: string, severity: string = 'critical', data?: any) => ({
  title,
  details,
  category: 'system',
  severity: severity as any,
  contextData: data
});

export const useErrorIntegration = () => {
  const { addError } = useErrorHandler();

  // Handle GIS-specific errors with context
  const handleGisError = useCallback((
    error: Error,
    operation: string,
    context?: { service?: string; url?: string; environment?: string }
  ) => {
    if (error.message.includes('token') || error.message.includes('auth')) {
      addError(createAuthError(
        'Authentication Error',
        `${operation} failed: ${error.message}`
      ));
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      addError(createNetworkError(
        'Network Error',
        `${operation} failed due to network issue: ${error.message}`
      ));
    } else {
      addError(createGisError(
        'GIS Operation Failed',
        `${operation}: ${error.message}`,
        'operation',
        {
          operation,
          service: context?.service,
          url: context?.url,
          environment: context?.environment,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      ));
    }
  }, [addError]);

  // Handle service operation errors
  const handleServiceError = useCallback((
    error: Error,
    serviceName: string,
    operation: 'start' | 'stop' | 'restart' | 'status',
    retryAction?: () => Promise<void>
  ) => {
    const title = `Service ${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed`;
    const details = `Could not ${operation} service '${serviceName}': ${error.message}`;
    
    addError(createGisError(
      title,
      details,
      'operation',
      {
        serviceName,
        operation,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      }
    ));
  }, [addError]);

  // Handle command execution errors
  const handleCommandError = useCallback((
    error: Error,
    command: string,
    args?: string[],
    retryAction?: () => Promise<void>
  ) => {
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      addError(createAuthError(
        'Permission Denied',
        `Command '${command}' failed: Insufficient permissions`
      ));
    } else if (error.message.includes('not found') || error.message.includes('invalid')) {
      addError(createUserError(
        'Invalid Command',
        `Command '${command}' failed: ${error.message}`
      ));
    } else {
      addError(createSystemError(
        'Command Execution Failed',
        `Command '${command}' failed: ${error.message}`
      ));
    }
  }, [addError]);

  // Handle validation errors (user input)
  const handleValidationError = useCallback((
    field: string,
    value: any,
    requirement: string
  ) => {
    addError(createUserError(
      'Input Validation Error',
      `${field}: ${requirement}. Current value: '${value}'`
    ));
  }, [addError]);

  // Handle critical system errors
  const handleCriticalError = useCallback((
    error: Error,
    component: string,
    context?: Record<string, any>
  ) => {
    addError(createSystemError(
      'Critical System Error',
      `Critical failure in ${component}: ${error.message}`,
      'critical',
      {
        component,
        errorMessage: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...context
      }
    ));
  }, [addError]);

  // Success notification helper
  const showSuccess = useCallback((
    title: string,
    details: string
  ) => {
    addError({
      title,
      details,
      severity: 'message',
      category: 'user'
    });
  }, [addError]);

  // Information notification helper
  const showInfo = useCallback((
    title: string,
    details: string
  ) => {
    addError(createUserError(title, details));
  }, [addError]);

  return {
    handleGisError,
    handleServiceError,
    handleCommandError,
    handleValidationError,
    handleCriticalError,
    showSuccess,
    showInfo
  };
};

// Common error patterns for GIS operations
export const GIS_ERROR_PATTERNS = {
  TOKEN_EXPIRED: /token.*expired|authentication.*failed|unauthorized/i,
  SERVICE_UNAVAILABLE: /service.*unavailable|service.*down|connection.*refused/i,
  INVALID_URL: /invalid.*url|malformed.*url|url.*not.*found/i,
  PERMISSION_DENIED: /permission.*denied|access.*denied|forbidden/i,
  RATE_LIMITED: /rate.*limit|too.*many.*requests|quota.*exceeded/i,
  SERVER_ERROR: /internal.*server.*error|server.*error|500/i,
  NETWORK_ERROR: /network.*error|connection.*error|timeout/i
} as const;

// Error classification helper
export const classifyGisError = (error: Error): {
  category: 'auth' | 'network' | 'user' | 'system';
  severity: 'critical' | 'operation' | 'message';
  isRetryable: boolean;
} => {
  const message = error.message.toLowerCase();

  if (GIS_ERROR_PATTERNS.TOKEN_EXPIRED.test(message) || 
      GIS_ERROR_PATTERNS.PERMISSION_DENIED.test(message)) {
    return { category: 'auth', severity: 'critical', isRetryable: false };
  }

  if (GIS_ERROR_PATTERNS.NETWORK_ERROR.test(message) ||
      GIS_ERROR_PATTERNS.SERVICE_UNAVAILABLE.test(message)) {
    return { category: 'network', severity: 'operation', isRetryable: true };
  }

  if (GIS_ERROR_PATTERNS.INVALID_URL.test(message)) {
    return { category: 'user', severity: 'message', isRetryable: false };
  }

  if (GIS_ERROR_PATTERNS.SERVER_ERROR.test(message)) {
    return { category: 'system', severity: 'operation', isRetryable: true };
  }

  // Default classification
  return { category: 'system', severity: 'operation', isRetryable: false };
};
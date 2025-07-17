/**
 * Error Utilities
 * Error formatting, categorization, and user-friendly message generation
 * Replaces complex context-based error handling with simple utilities
 */

/**
 * Error categories for better handling
 */
export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  GIS: 'gis',
  SYSTEM: 'system',
  USER: 'user'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Format error with context and user-friendly messages
 */
export function formatError(error, context = {}) {
  const errorInfo = {
    timestamp: Date.now(),
    originalError: error,
    message: error?.message || String(error),
    stack: error?.stack,
    category: categorizeError(error),
    severity: getSeverity(error),
    context,
    userMessage: getUserFriendlyMessage(error),
    suggestions: getRecoverySuggestions(error),
    helpLink: getHelpLink(error)
  };
  
  return errorInfo;
}

/**
 * Categorize error based on message and type
 */
export function categorizeError(error) {
  if (!error) return ErrorCategory.SYSTEM;
  
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('connection') ||
      message.includes('timeout') ||
      name.includes('networkerror')) {
    return ErrorCategory.NETWORK;
  }
  
  // Authentication errors
  if (message.includes('auth') ||
      message.includes('token') ||
      message.includes('login') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      error.status === 401 ||
      error.status === 403) {
    return ErrorCategory.AUTH;
  }
  
  // Validation errors
  if (message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('format') ||
      error.status === 400 ||
      error.status === 422) {
    return ErrorCategory.VALIDATION;
  }
  
  // GIS-specific errors
  if (message.includes('arcgis') ||
      message.includes('esri') ||
      message.includes('feature') ||
      message.includes('service') ||
      message.includes('geometry') ||
      message.includes('spatial')) {
    return ErrorCategory.GIS;
  }
  
  // User errors (things user can fix)
  if (message.includes('not found') ||
      message.includes('does not exist') ||
      error.status === 404) {
    return ErrorCategory.USER;
  }
  
  return ErrorCategory.SYSTEM;
}

/**
 * Determine error severity
 */
export function getSeverity(error) {
  if (!error) return ErrorSeverity.ERROR;
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status;
  
  // Critical system errors
  if (message.includes('fatal') ||
      message.includes('crash') ||
      message.includes('segfault') ||
      status >= 500) {
    return ErrorSeverity.CRITICAL;
  }
  
  // Warnings
  if (message.includes('warn') ||
      message.includes('deprecated') ||
      message.includes('fallback')) {
    return ErrorSeverity.WARNING;
  }
  
  // Info level
  if (message.includes('info') ||
      message.includes('notice')) {
    return ErrorSeverity.INFO;
  }
  
  return ErrorSeverity.ERROR;
}

/**
 * Generate user-friendly error messages
 */
export function getUserFriendlyMessage(error) {
  if (!error) return 'An unknown error occurred';
  
  const category = categorizeError(error);
  const message = error.message || String(error);
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
      
    case ErrorCategory.AUTH:
      if (message.includes('token')) {
        return 'Your session has expired. Please log in again.';
      }
      return 'Authentication failed. Please check your credentials and try again.';
      
    case ErrorCategory.VALIDATION:
      return `Invalid input: ${message}. Please check your data and try again.`;
      
    case ErrorCategory.GIS:
      if (message.includes('service')) {
        return 'The GIS service is currently unavailable. Please try again later.';
      }
      return `GIS operation failed: ${message}`;
      
    case ErrorCategory.USER:
      if (message.includes('not found')) {
        return 'The requested item could not be found. It may have been deleted or moved.';
      }
      return message;
      
    case ErrorCategory.SYSTEM:
    default:
      return 'A system error occurred. Please try again or contact support if the problem persists.';
  }
}

/**
 * Get recovery suggestions based on error type
 */
export function getRecoverySuggestions(error) {
  if (!error) return [];
  
  const category = categorizeError(error);
  const message = error.message?.toLowerCase() || '';
  
  const suggestions = [];
  
  switch (category) {
    case ErrorCategory.NETWORK:
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the server URL is correct');
      suggestions.push('Try again in a few moments');
      if (message.includes('timeout')) {
        suggestions.push('The server may be slow - try increasing timeout');
      }
      break;
      
    case ErrorCategory.AUTH:
      suggestions.push('Log out and log back in');
      if (message.includes('token')) {
        suggestions.push('Your session may have expired');
      }
      suggestions.push('Check your username and password');
      suggestions.push('Contact your administrator if access issues persist');
      break;
      
    case ErrorCategory.VALIDATION:
      suggestions.push('Check the format of your input data');
      suggestions.push('Ensure all required fields are filled');
      suggestions.push('Verify numeric values are within valid ranges');
      break;
      
    case ErrorCategory.GIS:
      suggestions.push('Check if the service is running');
      suggestions.push('Verify service permissions');
      suggestions.push('Try refreshing the service connection');
      break;
      
    case ErrorCategory.USER:
      suggestions.push('Check the item still exists');
      suggestions.push('Verify you have access permissions');
      suggestions.push('Try searching for the item');
      break;
      
    case ErrorCategory.SYSTEM:
    default:
      suggestions.push('Try the operation again');
      suggestions.push('Restart the application if problems persist');
      suggestions.push('Check the application logs for more details');
      break;
  }
  
  return suggestions;
}

/**
 * Get help documentation link based on error
 */
export function getHelpLink(error) {
  if (!error) return null;
  
  const category = categorizeError(error);
  
  const baseUrl = 'https://docs.example.com/aci'; // Update with actual docs URL
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return `${baseUrl}/troubleshooting/network-issues`;
    case ErrorCategory.AUTH:
      return `${baseUrl}/authentication`;
    case ErrorCategory.VALIDATION:
      return `${baseUrl}/data-formats`;
    case ErrorCategory.GIS:
      return `${baseUrl}/gis-services`;
    default:
      return `${baseUrl}/troubleshooting`;
  }
}

/**
 * Create standardized error object
 */
export function createError(message, category = ErrorCategory.SYSTEM, severity = ErrorSeverity.ERROR, context = {}) {
  const error = new Error(message);
  error.category = category;
  error.severity = severity;
  error.context = context;
  error.timestamp = Date.now();
  return error;
}

/**
 * Create network error
 */
export function createNetworkError(message, url, status) {
  const error = createError(message, ErrorCategory.NETWORK);
  error.url = url;
  error.status = status;
  return error;
}

/**
 * Create authentication error
 */
export function createAuthError(message, context = {}) {
  return createError(message, ErrorCategory.AUTH, ErrorSeverity.ERROR, context);
}

/**
 * Create validation error
 */
export function createValidationError(message, field, value) {
  const error = createError(message, ErrorCategory.VALIDATION);
  error.field = field;
  error.value = value;
  return error;
}

/**
 * Create GIS service error
 */
export function createGisError(message, serviceUrl, operation) {
  const error = createError(message, ErrorCategory.GIS);
  error.serviceUrl = serviceUrl;
  error.operation = operation;
  return error;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
  if (!error) return false;
  
  const category = categorizeError(error);
  const message = error.message?.toLowerCase() || '';
  const status = error.status;
  
  // Network errors are usually retryable
  if (category === ErrorCategory.NETWORK) {
    return true;
  }
  
  // Temporary server errors
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // Rate limiting
  if (status === 429) {
    return true;
  }
  
  // Timeout errors
  if (message.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Get retry delay for exponential backoff
 */
export function getRetryDelay(attemptNumber, baseDelay = 1000) {
  return Math.min(baseDelay * Math.pow(2, attemptNumber), 30000); // Max 30 seconds
}

/**
 * Safe error serialization for logging
 */
export function serializeError(error) {
  if (!error) return null;
  
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    category: error.category,
    severity: error.severity,
    context: error.context,
    status: error.status,
    timestamp: error.timestamp || Date.now()
  };
}
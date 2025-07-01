import { ArcGISRequestError } from '@esri/arcgis-rest-request';
import { 
  AdminAuthenticationError, 
  InsufficientPrivilegesError, 
  ServiceOperationError,
  TimeoutError,
  ConfigurationError,
  ValidationError,
  ArcGISError 
} from '../error.js';

export function handleError(error: unknown, context?: string): never {
  let message = 'An unexpected error occurred';
  
  if (error instanceof AdminAuthenticationError) {
    message = `Admin authentication error: ${error.message}`;
    if (error.serverUrl) {
      message += `\nServer: ${error.serverUrl}`;
    }
    message += '\nTry: aci admin login --help for authentication options';
  } else if (error instanceof InsufficientPrivilegesError) {
    message = `Insufficient privileges: ${error.message}`;
    if (error.requiredPrivilege) {
      message += `\nRequired privilege: ${error.requiredPrivilege}`;
    }
    message += '\nContact your administrator for elevated access';
  } else if (error instanceof ServiceOperationError) {
    message = `Service operation failed: ${error.message}`;
    if (error.serviceName) {
      message += `\nService: ${error.serviceName}`;
    }
  } else if (error instanceof TimeoutError) {
    message = `Operation timed out: ${error.message}`;
    message += '\nTry using --wait flag or check service status manually';
  } else if (error instanceof ConfigurationError) {
    message = `Configuration error: ${error.message}`;
    if (error.configFile) {
      message += `\nConfig file: ${error.configFile}`;
    }
  } else if (error instanceof ValidationError) {
    message = `Validation error: ${error.message}`;
    if (error.field) {
      message += `\nField: ${error.field}`;
    }
  } else if (error instanceof ArcGISError) {
    message = `ArcGIS error: ${error.message}`;
    if (error.code) {
      message += ` (Code: ${error.code})`;
    }
  } else if (error instanceof ArcGISRequestError) {
    // Handle ArcGIS-specific errors
    switch (error.code) {
      case 400:
        message = 'Bad request - check your query parameters';
        break;
      case 401:
        message = 'Authentication failed - please run "aci login"';
        break;
      case 403:
        message = 'Access denied - you may not have permission to access this resource';
        break;
      case 404:
        message = 'Resource not found - check the URL';
        break;
      case 500:
        message = 'Server error - the service may be temporarily unavailable';
        break;
      default:
        message = `ArcGIS error (${error.code}): ${error.message}`;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  // Add context if provided
  if (context) {
    console.error(`${context}: ${message}`);
  } else {
    console.error(message);
  }
  
  // Exit with error code
  process.exit(1);
}
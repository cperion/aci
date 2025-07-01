/**
 * Custom error classes for ACI (ArcGIS Command Line Interface)
 */

export class ArcGISError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ArcGISError';
  }
}

export class AuthenticationError extends ArcGISError {
  constructor(message: string, public portal?: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AdminAuthenticationError extends ArcGISError {
  constructor(message: string, public serverUrl?: string) {
    super(message, 'ADMIN_AUTH_ERROR');
    this.name = 'AdminAuthenticationError';
  }
}

export class InsufficientPrivilegesError extends ArcGISError {
  constructor(message: string, public requiredPrivilege?: string) {
    super(message, 'INSUFFICIENT_PRIVILEGES');
    this.name = 'InsufficientPrivilegesError';
  }
}

export class ServiceOperationError extends ArcGISError {
  constructor(message: string, public serviceName?: string) {
    super(message, 'SERVICE_OPERATION_ERROR');
    this.name = 'ServiceOperationError';
  }
}

export class TimeoutError extends ArcGISError {
  constructor(message: string, public operation?: string) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends ArcGISError {
  constructor(message: string, public configFile?: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends ArcGISError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
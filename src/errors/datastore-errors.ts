/**
 * Data Store Error Classes
 * Specialized error handling for datastore operations
 */

export class DataStoreNotFoundError extends Error {
  constructor(name: string) {
    super(`Data store '${name}' not found`);
    this.name = 'DataStoreNotFoundError';
  }
}

export class InsufficientDatastorePrivilegesError extends Error {
  constructor(operation: string, required: string[]) {
    super(`Operation '${operation}' requires privileges: ${required.join(', ')}`);
    this.name = 'InsufficientDatastorePrivilegesError';
  }
}

export class DataStoreConnectionError extends Error {
  public readonly recoveryActions: string[];

  constructor(
    public readonly datastoreName: string,
    message: string,
    recoveryActions: string[] = []
  ) {
    super(`DataStore '${datastoreName}': ${message}`);
    this.name = 'DataStoreConnectionError';
    this.recoveryActions = recoveryActions;
  }
}

export class DataStoreValidationError extends Error {
  constructor(
    public readonly datastoreName: string,
    public readonly validationDetails: string,
    public readonly healthStatus?: string
  ) {
    super(`Validation failed for data store '${datastoreName}': ${validationDetails}`);
    this.name = 'DataStoreValidationError';
  }
}

export class DataStoreTimeoutError extends Error {
  constructor(
    public readonly datastoreName: string,
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(`DataStore '${datastoreName}' ${operation} timeout after ${timeoutMs}ms`);
    this.name = 'DataStoreTimeoutError';
  }
}

export class InvalidDataStoreResponseError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly responseData: string,
    recoveryActions: string[] = []
  ) {
    super(`Invalid response from data store endpoint: ${endpoint}`);
    this.name = 'InvalidDataStoreResponseError';
    
    // Add recovery actions as additional context
    if (recoveryActions.length > 0) {
      this.message += `\n\nSuggested actions:\n${recoveryActions.map(action => `• ${action}`).join('\n')}`;
    }
  }
}
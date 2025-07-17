/**
 * Data Store Management Commands
 * Phase 1: Core diagnostic operations only
 */

import { ArcGISServerAdminClient } from '../services/admin-client.js';
import { requireAdminSession } from '../session.js';
import { handleError } from '../errors/handler.js';
import { 
  formatDatastoreList, 
  formatHealthReport, 
  formatMachineList, 
  formatBackupStatus,
  formatDatastoreError 
} from '../utils/datastore-output.js';
import type { 
  DataStoreConnectionError, 
  DataStoreNotFoundError,
  DataStoreTimeoutError 
} from '../errors/datastore-errors.js';

export interface DatastoreCommandOptions {
  detailed?: boolean;
  timeout?: string;
  env?: string;
}

export interface DatastoreRegistrationOptions extends DatastoreCommandOptions {
  type: string;
  provider?: string;
  onServerStart?: boolean;
  isManaged?: boolean;
  connectionString?: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

/**
 * List all registered data stores
 */
export async function listDatastoresCommand(options: DatastoreCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log('Retrieving data store information...');
    const stores = await client.listDatastores();
    
    console.log(formatDatastoreList(stores));
    
  } catch (error) {
    handleError(error as Error, 'Failed to list data stores');
  }
}

/**
 * Validate health of a specific data store
 */
export async function validateDatastoreCommand(
  name: string, 
  options: DatastoreCommandOptions
): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Validating data store: ${name}...`);
    
    const timeoutMs = options.timeout ? parseInt(options.timeout) * 1000 : undefined;
    const healthReport = await client.validateDatastore(name, { timeout: timeoutMs });
    
    console.log(formatHealthReport(healthReport, options.detailed));
    
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific datastore errors with context
      if (error.name === 'DataStoreNotFoundError') {
        console.error(`Data store '${name}' not found`);
        console.error('• Check name spelling - Use: aci admin datastores list');
        console.error('• Verify registration - Ensure data store is registered with server');
        process.exit(1);
      }
      
      if (error.name === 'DataStoreTimeoutError') {
        const timeoutError = error as DataStoreTimeoutError;
        console.error(`Validation timeout after ${timeoutError.timeoutMs}ms`);
        console.error(`• Increase timeout - Use: --timeout ${Math.ceil(timeoutError.timeoutMs / 1000) + 30}`);
        console.error('• Check connectivity - Verify network access to datastore machines');
        console.error('• Check datastore health - Datastore may be experiencing issues');
        process.exit(1);
      }
      
      if (error.name === 'DataStoreConnectionError') {
        const connError = error as DataStoreConnectionError;
        console.error(`Connection failed for data store '${name}': ${connError.message}`);
        connError.recoveryActions.forEach(action => console.error(`• ${action}`));
        process.exit(1);
      }
    }
    
    handleError(error as Error, `Failed to validate data store '${name}'`);
  }
}

/**
 * Show machine status for a specific data store
 */
export async function machinesCommand(
  name: string, 
  options: DatastoreCommandOptions
): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Retrieving machine information for: ${name}...`);
    const machines = await client.getDataStoreMachines(name);
    
    console.log(formatMachineList(name, machines));
    
  } catch (error) {
    if (error instanceof Error && error.name === 'DataStoreNotFoundError') {
      console.error(`Data store '${name}' not found`);
      console.error('• Check name spelling - Use: aci admin datastores list');
      console.error('• Verify registration - Ensure data store is registered with server');
      process.exit(1);
    }
    
    handleError(error as Error, `Failed to get machines for data store '${name}'`);
  }
}

/**
 * Show backup information across all data stores
 */
export async function backupInfoCommand(options: DatastoreCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log('Retrieving backup information...');
    const backupStatus = await client.getBackupInfo();
    
    console.log(formatBackupStatus(backupStatus));
    
  } catch (error) {
    handleError(error as Error, 'Failed to get backup information');
  }
}

/**
 * Register a new data store
 */
export async function registerDatastoreCommand(
  name: string,
  options: DatastoreRegistrationOptions
): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Registering data store: ${name}...`);
    
    // Build connection parameters based on type
    const connectionParams = buildConnectionParams(options);
    
    const config = {
      name,
      type: options.type as any,
      provider: options.provider,
      onServerStart: options.onServerStart,
      isManaged: options.isManaged,
      connectionParams
    };
    
    const result = await client.registerDatastore(config);
    
    console.log(`✓ Data store '${name}' registered successfully`);
    console.log(`  Type: ${result.type}`);
    console.log(`  Provider: ${result.provider || 'Default'}`);
    console.log(`  Status: ${result.status}`);
    
  } catch (error) {
    handleError(error as Error, `Failed to register data store '${name}'`);
  }
}

/**
 * Unregister a data store
 */
export async function unregisterDatastoreCommand(
  name: string,
  options: DatastoreCommandOptions
): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Unregistering data store: ${name}...`);
    
    await client.unregisterDatastore(name);
    
    console.log(`✓ Data store '${name}' unregistered successfully`);
    
  } catch (error) {
    handleError(error as Error, `Failed to unregister data store '${name}'`);
  }
}

/**
 * Update data store configuration
 */
export async function updateDatastoreCommand(
  name: string,
  options: DatastoreRegistrationOptions
): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Updating data store: ${name}...`);
    
    // Build connection parameters based on provided options
    const connectionParams = buildConnectionParams(options);
    
    const config = {
      type: options.type as any,
      provider: options.provider,
      onServerStart: options.onServerStart,
      isManaged: options.isManaged,
      connectionParams
    };
    
    const result = await client.updateDatastore(name, config);
    
    console.log(`✓ Data store '${name}' updated successfully`);
    console.log(`  Type: ${result.type}`);
    console.log(`  Provider: ${result.provider || 'Default'}`);
    console.log(`  Status: ${result.status}`);
    
  } catch (error) {
    handleError(error as Error, `Failed to update data store '${name}'`);
  }
}

/**
 * Build connection parameters from command options
 */
function buildConnectionParams(options: DatastoreRegistrationOptions): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Handle connection string
  if (options.connectionString) {
    params.connectionString = options.connectionString;
  }
  
  // Handle individual connection parameters
  if (options.host) params.host = options.host;
  if (options.port) params.port = options.port;
  if (options.database) params.database = options.database;
  if (options.username) params.username = options.username;
  if (options.password) params.password = options.password;
  
  // Handle additional parameters
  const excludedKeys = ['type', 'provider', 'onServerStart', 'isManaged', 'env', 'detailed', 'timeout'];
  for (const [key, value] of Object.entries(options)) {
    if (!excludedKeys.includes(key) && value !== undefined) {
      params[key] = String(value);
    }
  }
  
  return params;
}
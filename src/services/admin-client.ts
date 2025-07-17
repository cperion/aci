import type { AdminSession } from '../session.js';
import { AdminAuthenticationError, ServiceOperationError, TimeoutError } from '../error.js';
import type { 
  DataStoreInfo, 
  HealthReport, 
  BackupStatus, 
  MachineStatus,
  RawDataStoreResponse,
  RawHealthResponse,
  DataStoreType,
  DataStoreStatus,
  MachineRole,
  DataStoreRegistrationConfig
} from '../types/datastore.js';
import { 
  DataStoreNotFoundError, 
  DataStoreConnectionError, 
  DataStoreTimeoutError,
  InvalidDataStoreResponseError 
} from '../errors/datastore-errors.js';

export interface ServiceInfo {
  serviceName: string;
  type: string;
  description?: string;
  provider?: string;
  status: 'STARTED' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'FAILED';
  configuredState?: string;
  realTimeState?: string;
  folder?: string;
  instances?: {
    min: number;
    max: number;
    running: number;
  };
}


export interface LogEntry {
  time: number;
  level: 'SEVERE' | 'WARNING' | 'INFO' | 'FINE' | 'FINER' | 'FINEST';
  message: string;
  source?: string;
  thread?: string;
}


/**
 * ArcGIS Server Administration Client
 * Wraps the ArcGIS Server Admin REST API with error handling and state monitoring
 */
export class ArcGISServerAdminClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private session: AdminSession) {
    this.baseUrl = session.serverAdminUrl;
    this.token = session.adminToken;
    
    // Ensure HTTPS for admin operations
    if (!this.baseUrl.startsWith('https://')) {
      throw new AdminAuthenticationError(
        'Admin operations require HTTPS. Configure server_admin URL with https:// in .acirc'
      );
    }
  }


  /**
   * List all services, optionally filtered by folder
   */
  async listServices(folder?: string): Promise<ServiceInfo[]> {
    try {
      const endpoint = folder ? `services/${encodeURIComponent(folder)}` : 'services';
      const response = await this.request(endpoint);
      
      const services: ServiceInfo[] = [];
      
      // Add services from current level
      if (response.services) {
        for (const service of response.services) {
          const serviceInfo: ServiceInfo = {
            serviceName: folder ? `${folder}/${service.serviceName}` : service.serviceName,
            type: service.type,
            description: service.description,
            status: 'STOPPED', // Will be updated with actual status
            folder: folder
          };
          
          // Get detailed status for each service
          try {
            const detailedStatus = await this.getServiceStatus(serviceInfo.serviceName);
            Object.assign(serviceInfo, detailedStatus);
          } catch (error) {
            // If we can't get status, keep the basic info
            console.warn(`Could not get status for service ${serviceInfo.serviceName}`);
          }
          
          services.push(serviceInfo);
        }
      }
      
      // Recursively get services from subfolders if no specific folder requested
      if (!folder && response.folders) {
        for (const subFolder of response.folders) {
          if (subFolder !== 'System' && subFolder !== 'Utilities') { // Skip system folders
            try {
              const subServices = await this.listServices(subFolder);
              services.push(...subServices);
            } catch (error) {
              console.warn(`Could not access folder ${subFolder}`);
            }
          }
        }
      }
      
      return services;
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to list services${folder ? ` from folder ${folder}` : ''}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get detailed status for a specific service
   */
  async getServiceStatus(serviceName: string): Promise<ServiceInfo> {
    try {
      // Parse service name to handle folder/service format
      const { folder, name } = this.parseServiceName(serviceName);
      const endpoint = folder 
        ? `services/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`
        : `services/${encodeURIComponent(name)}`;
      
      const response = await this.request(endpoint);
      
      return {
        serviceName,
        type: response.type,
        description: response.description,
        provider: response.provider,
        status: response.configuredState || 'UNKNOWN',
        configuredState: response.configuredState,
        realTimeState: response.realTimeState,
        folder,
        instances: response.instances ? {
          min: response.minInstancesPerNode || 0,
          max: response.maxInstancesPerNode || 0,
          running: response.instances.length || 0
        } : undefined
      } as ServiceInfo;
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to get status for service ${serviceName}: ${(error as Error).message}`
      );
    }
  }


  /**
   * Start a service with optional state monitoring
   */
  async startService(serviceName: string, wait: boolean = false): Promise<void> {
    try {
      const { folder, name } = this.parseServiceName(serviceName);
      const endpoint = folder 
        ? `services/${encodeURIComponent(folder)}/${encodeURIComponent(name)}/start`
        : `services/${encodeURIComponent(name)}/start`;
      
      await this.request(endpoint, 'POST');
      
      if (wait) {
        await this.waitForServiceState(serviceName, 'STARTED', 120000);
      }
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to start service ${serviceName}: ${(error as Error).message}`,
        serviceName
      );
    }
  }

  /**
   * Stop a service with optional state monitoring
   */
  async stopService(serviceName: string, wait: boolean = false): Promise<void> {
    try {
      const { folder, name } = this.parseServiceName(serviceName);
      const endpoint = folder 
        ? `services/${encodeURIComponent(folder)}/${encodeURIComponent(name)}/stop`
        : `services/${encodeURIComponent(name)}/stop`;
      
      await this.request(endpoint, 'POST');
      
      if (wait) {
        await this.waitForServiceState(serviceName, 'STOPPED', 120000);
      }
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to stop service ${serviceName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get server logs with filtering
   */
  async getLogs(tail: number = 100, level?: string, services?: string[]): Promise<LogEntry[]> {
    try {
      // Complete filter object matching Manager interface format
      const filter: any = {
        codes: [],
        processIds: [],
        requestIds: [],
        services: services || ["*"],
        machines: ["*"],
        users: [],
        component: "*"
      };
      
      // Time range: last 24 hours by default
      const endTime = Date.now();
      const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago
      
      const params: Record<string, string> = {
        filterType: 'json',  // REQUIRED by Manager interface
        filter: JSON.stringify(filter),
        level: level || 'WARNING',
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        pageSize: Math.min(tail, 1000).toString(), // Cap at 1000 like Manager
        f: 'json',
        'dojo.preventCache': Date.now().toString()
      };
      
      const response = await this.request('logs/query', 'GET', params);
      
      if (!response.logMessages) {
        return [];
      }
      
      return response.logMessages.map((msg: any): LogEntry => ({
        time: msg.time,
        level: msg.level,
        message: msg.message,
        source: msg.source,
        thread: msg.thread
      }));
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to get logs: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get server logs with extended time range options
   */
  async getLogsExtended(options: {
    tail?: number;
    level?: string;
    services?: string[];
    hours?: number;
    sinceServerStart?: boolean;
  }): Promise<LogEntry[]> {
    try {
      const { tail = 100, level, services, hours = 24, sinceServerStart = false } = options;
      
      // Complete filter object
      const filter: any = {
        codes: [],
        processIds: [],
        requestIds: [],
        services: services || ["*"],
        machines: ["*"],
        users: [],
        component: "*"
      };
      
      const params: Record<string, string> = {
        filterType: 'json',
        filter: JSON.stringify(filter),
        level: level || 'WARNING',
        pageSize: Math.min(tail, 1000).toString(),
        f: 'json',
        'dojo.preventCache': Date.now().toString()
      };
      
      // Set time range based on options
      if (sinceServerStart) {
        params.sinceServerStart = 'TRUE';
      } else {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        params.startTime = startTime.toString();
        params.endTime = endTime.toString();
      }
      
      const response = await this.request('logs/query', 'GET', params);
      
      if (!response.logMessages) {
        return [];
      }

      return response.logMessages.map((msg: any): LogEntry => ({
        time: msg.time,
        level: msg.level,
        message: msg.message,
        source: msg.source,
        thread: msg.thread
      }));
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to get logs: ${(error as Error).message}`
      );
    }
  }

  // =============================================================================
  // DATA STORE OPERATIONS
  // =============================================================================

  /**
   * List all registered data stores
   */
  async listDatastores(): Promise<DataStoreInfo[]> {
    try {
      // Use the findItems endpoint that actually works and returns real data
      const response = await this.request('data/findItems', 'GET', { types: 'egdb' });
      
      if (!response.items) {
        return [];
      }
      
      const datastores: DataStoreInfo[] = [];
      
      // Process each datastore item
      for (const item of response.items) {
        const datastoreInfo: DataStoreInfo = {
          name: item.path.split('/').pop(), // Extract name from path
          type: this.normalizeDataStoreType(item.type),
          provider: item.provider,
          status: 'Healthy', // Default - will be updated with health check
          path: item.path,
          onServerStart: item.info?.onServerStart ?? false,
          isManaged: item.info?.isManaged ?? false
        };
        
        // Try to get health information
        try {
          const health = await this.getDataStoreQuickHealth(datastoreInfo.name, item.path);
          datastoreInfo.status = health.status;
          datastoreInfo.machineCount = health.machines?.length;
        } catch (healthError) {
          // Health check failed, keep defaults
          datastoreInfo.status = 'Unhealthy';
          datastoreInfo.connectionStatus = 'Failed to connect';
        }
        
        datastores.push(datastoreInfo);
      }
      
      return datastores;
      
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to list data stores: ${(error as Error).message}`
      );
    }
  }

  /**
   * Validate health of a specific data store
   */
  async validateDatastore(name: string, options: { timeout?: number } = {}): Promise<HealthReport> {
    const timeout = options.timeout || 30000; // 30s default for cloud stores
    
    try {
      const store = await this.findDataStore(name);
      const validatePath = this.buildValidatePath(store.path);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${this.baseUrl}/${validatePath}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.token,
          f: 'json'
        })
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new DataStoreConnectionError(
          name,
          `Validation failed: ${response.status} ${response.statusText}`,
          ['Check datastore accessibility', 'Verify admin credentials', 'Review firewall rules']
        );
      }
      
      const data: RawHealthResponse = await response.json();
      
      if (data.error) {
        throw new DataStoreConnectionError(
          name,
          `ArcGIS Server Error ${data.error.code}: ${data.error.message}`
        );
      }
      
      return this.normalizeHealthReport(name, store.type, data);
      
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new DataStoreTimeoutError(name, 'validation', timeout);
      }
      if (error instanceof DataStoreNotFoundError || error instanceof DataStoreConnectionError) {
        throw error;
      }
      throw new DataStoreConnectionError(
        name,
        `Validation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get machine status for a specific data store
   */
  async getDataStoreMachines(name: string): Promise<MachineStatus[]> {
    try {
      const healthReport = await this.validateDatastore(name);
      return healthReport.machines;
    } catch (error) {
      throw new ServiceOperationError(
        `Failed to get machines for data store ${name}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get backup information across all data stores
   */
  async getBackupInfo(): Promise<BackupStatus> {
    try {
      const response = await this.request('disaster-recovery/backupRestoreInfo');
      
      return {
        lastFullBackup: response.lastFullBackup,
        lastIncrementalBackup: response.lastIncrementalBackup,
        lastRestore: response.lastRestore,
        backupMode: response.backupMode || false,
        availableBackups: response.availableBackups || []
      };
      
    } catch (error) {
      // Fallback for older ArcGIS versions without disaster recovery endpoint
      if ((error as Error).message.includes('404') || (error as Error).message.includes('Not Found')) {
        return {
          backupMode: false,
          availableBackups: []
        };
      }
      throw new ServiceOperationError(
        `Failed to get backup information: ${(error as Error).message}`
      );
    }
  }

  /**
   * Find a data store by name from the registry
   */
  private async findDataStore(name: string): Promise<{ path: string; type: DataStoreType }> {
    const response = await this.request('data/findItems', 'GET', { types: 'egdb' });
    
    if (!response.items) {
      throw new DataStoreNotFoundError(name);
    }
    
    const store = response.items.find(s => s.path.split('/').pop() === name);
    if (!store) {
      throw new DataStoreNotFoundError(name);
    }
    
    return {
      path: store.path,
      type: this.normalizeDataStoreType(store.type)
    };
  }

  /**
   * Quick health check without full validation
   */
  private async getDataStoreQuickHealth(name: string, path: string): Promise<{ status: DataStoreStatus; machines?: any[] }> {
    try {
      // For quick health, just try to access the datastore info endpoint
      const response = await this.request(`data/items${path}`);
      return {
        status: 'Healthy',
        machines: response.machines
      };
    } catch (error) {
      return { status: 'Unhealthy' };
    }
  }

  /**
   * Build validation path based on data store type and path
   */
  private buildValidatePath(datastorePath: string): string {
    // Extract the appropriate validation endpoint based on path structure
    if (datastorePath.includes('/enterpriseDatabases/')) {
      return `data/items${datastorePath}/machines/primary/validate`;
    } else if (datastorePath.includes('/cloudStores/')) {
      return `data/items${datastorePath}/validate`;
    } else if (datastorePath.includes('/nosqlDatabases/')) {
      return `data/items${datastorePath}/machines/primary/validate`;
    } else {
      // Generic validation path
      return `data/items${datastorePath}/validate`;
    }
  }

  /**
   * Normalize data store type from API response
   */
  private normalizeDataStoreType(apiType: string): DataStoreType {
    const type = apiType.toLowerCase();
    
    if (type.includes('egdb') || type.includes('enterprise')) return 'enterprise';
    if (type.includes('cloud') || type.includes('s3') || type.includes('azure') || type.includes('gcs')) return 'cloud';
    if (type.includes('relational')) return 'relational';
    if (type.includes('tile') || type.includes('cache')) return 'tileCache';
    if (type.includes('spatiotemporal') || type.includes('bigdata')) return 'spatiotemporal';
    if (type.includes('graph')) return 'graph';
    if (type.includes('object')) return 'object';
    if (type.includes('folder') || type.includes('file')) return 'fileShare';
    if (type.includes('raster')) return 'raster';
    
    // Default fallback
    return 'enterprise';
  }

  /**
   * Normalize health report from various API response formats
   */
  private normalizeHealthReport(name: string, type: DataStoreType, data: RawHealthResponse): HealthReport {
    const machines: MachineStatus[] = [];
    
    if (data.machines) {
      for (const machine of data.machines) {
        machines.push({
          machineName: machine.machineName,
          role: this.normalizeMachineRole(machine.role),
          status: this.normalizeHealthStatus(machine.status),
          version: machine.version,
          databaseStatus: machine.databaseStatus as any,
          replicationStatus: machine.replicationStatus as any,
          lastSyncTime: machine.lastSyncTime,
          diskUsage: machine.diskUsage ? {
            dataDirectory: machine.diskUsage.dataDirectory || 'Unknown',
            logDirectory: machine.diskUsage.logDirectory,
            tempDirectory: machine.diskUsage.tempDirectory
          } : undefined
        });
      }
    }
    
    return {
      name,
      type,
      status: this.normalizeHealthStatus(data.status),
      overallHealth: data.overallHealth || data.status,
      machines,
      lastValidated: new Date().toISOString(),
      warnings: data.warnings,
      recommendations: data.recommendations
    };
  }

  /**
   * Normalize machine role from API response
   */
  private normalizeMachineRole(role: string): MachineRole {
    const normalized = role.toUpperCase();
    if (['PRIMARY', 'STANDBY', 'MEMBER'].includes(normalized)) {
      return normalized as MachineRole;
    }
    return 'MEMBER'; // Default fallback
  }

  /**
   * Normalize health status from API response
   */
  private normalizeHealthStatus(status: string): DataStoreStatus {
    if (status === 'Healthy') return 'Healthy';
    if (status === 'HealthyWithWarning') return 'HealthyWithWarning';
    return 'Unhealthy';
  }



  /**
   * Wait for a service to reach a specific state
   */
  private async waitForServiceState(
    serviceName: string,
    expectedState: string,
    timeout: number = 120000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const serviceInfo = await this.getServiceStatus(serviceName);
        
        if (serviceInfo.status === expectedState) {
          return;
        }
        
        if (serviceInfo.status === 'FAILED') {
          throw new ServiceOperationError(
            `Service ${serviceName} failed to reach ${expectedState} state`
          );
        }
        
        // Simple 2-second wait between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (error instanceof ServiceOperationError) {
          throw error;
        }
        // Continue trying on network errors
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new TimeoutError(
      `Service ${serviceName} did not reach ${expectedState} state within ${timeout}ms`
    );
  }

  /**
   * Parse service name into folder and name components
   */
  private parseServiceName(serviceName: string): { folder?: string; name: string } {
    const parts = serviceName.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { folder: parts[0], name: parts[1] };
    }
    return { name: serviceName };
  }

  /**
   * Make authenticated request to ArcGIS Server admin endpoint
   */
  private async request(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET',
    additionalParams?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const params: Record<string, string> = {
      token: this.token,
      f: 'json',
      ...additionalParams
    };
    
    try {
      let response: Response;
      
      if (method === 'POST') {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(params)
        });
      } else {
        const searchParams = new URLSearchParams(params);
        response = await fetch(`${url}?${searchParams}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for ArcGIS Server errors
      if (data.error) {
        throw new Error(`ArcGIS Server Error ${data.error.code}: ${data.error.message}`);
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof Error) {
        // Handle authentication errors specifically
        if (error.message.includes('Token Required') || error.message.includes('Invalid Token')) {
          throw new AdminAuthenticationError(
            'Admin authentication failed. Please re-authenticate with: aci admin login'
          );
        }
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  /**
   * Register a new data store with the ArcGIS Server
   */
  async registerDatastore(config: DataStoreRegistrationConfig): Promise<DataStoreInfo> {
    const endpoint = this.getDataStoreEndpoint(config.type);
    
    const params = {
      name: config.name,
      f: 'json',
      token: this.session.adminToken,
      ...config.connectionParams
    };

    const response = await this.request(endpoint, 'POST', params);
    
    if (response.error) {
      throw new Error(`Failed to register datastore: ${response.error.message}`);
    }

    // Return the registered datastore info
    return {
      name: config.name,
      type: config.type,
      provider: config.provider,
      status: 'Healthy',
      path: `/data/items/${config.name}`,
      onServerStart: config.onServerStart || false,
      isManaged: config.isManaged || false
    };
  }

  /**
   * Unregister a data store from the ArcGIS Server
   */
  async unregisterDatastore(name: string): Promise<void> {
    // First get the datastore info to determine the correct endpoint
    const stores = await this.listDatastores();
    const store = stores.find(s => s.name === name);
    
    if (!store) {
      throw new Error(`Data store '${name}' not found`);
    }

    const endpoint = `data/items${store.path}/unregister`;
    
    const params = {
      f: 'json',
      token: this.session.adminToken
    };

    const response = await this.request(endpoint, 'POST', params);
    
    if (response.error) {
      throw new Error(`Failed to unregister datastore: ${response.error.message}`);
    }
  }

  /**
   * Update data store configuration
   */
  async updateDatastore(name: string, config: Partial<DataStoreRegistrationConfig>): Promise<DataStoreInfo> {
    // First get the datastore info to determine the correct endpoint
    const stores = await this.listDatastores();
    const store = stores.find(s => s.name === name);
    
    if (!store) {
      throw new Error(`Data store '${name}' not found`);
    }

    const endpoint = `data/items${store.path}/edit`;
    
    const params = {
      f: 'json',
      token: this.session.adminToken,
      ...config.connectionParams
    };

    const response = await this.request(endpoint, 'POST', params);
    
    if (response.error) {
      throw new Error(`Failed to update datastore: ${response.error.message}`);
    }

    // Return updated datastore info
    return {
      ...store,
      ...config
    };
  }

  /**
   * Get the appropriate endpoint for data store operations based on type
   */
  private getDataStoreEndpoint(type: DataStoreType): string {
    switch (type) {
      case 'enterprise':
        return 'data/items/enterpriseDatabases/register';
      case 'cloud':
        return 'data/items/cloudStores/register';
      case 'relational':
        return 'data/items/relationaldatastores/register';
      case 'tileCache':
        return 'data/items/tilecachedatastores/register';
      case 'spatiotemporal':
        return 'data/items/nosqlDatabases/register';
      case 'graph':
        return 'data/items/graphdatastores/register';
      case 'object':
        return 'data/items/objectdatastores/register';
      case 'fileShare':
        return 'data/items/folderDatastores/register';
      case 'raster':
        return 'data/items/rasterdatastores/register';
      default:
        return 'data/items/enterpriseDatabases/register';
    }
  }
}
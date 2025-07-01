import type { AdminSession } from '../session.js';
import { AdminAuthenticationError, ServiceOperationError, TimeoutError } from '../error.js';

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
  async getLogs(tail: number = 100, level?: string): Promise<LogEntry[]> {
    try {
      const params: Record<string, string> = {
        pageSize: tail.toString(),
        f: 'json'
      };
      
      if (level) {
        params.level = level.toUpperCase();
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
}
/**
 * TUI Command Service - Direct command integration without process spawning
 * Replaces CommandFacade with direct function invocation
 */

import { getUserCommand } from '../commands/users.js';
import { getGroupCommand } from '../commands/groups.js';
import { getItemCommand } from '../commands/items.js';
import { searchCommand } from '../commands/search.js';
import { inspectCommand } from '../commands/inspect.js';
import { queryCommand } from '../commands/query.js';
import { 
  loginWrapper, 
  logoutWrapper, 
  findUsersWrapper, 
  findGroupsWrapper, 
  findItemsWrapper 
} from './tui-command-wrapper.js';
import { ArcGISServerAdminClient } from './admin-client.js';
import { requireAdminSession } from '../session.js';
import { 
  createSuccessResult,
  createErrorResult,
  createWarningResult
} from '../types/command-result.js';
import type { 
  CommandResult, 
  CommandOptions,
  UserSearchResult,
  GroupSearchResult,
  ItemSearchResult,
  LoginResult,
  PortalSession
} from '../types/command-result.js';
import type { AdminSession } from '../session.js';

export class TuiCommandService {
  private session: PortalSession | null = null;
  
  constructor(session?: PortalSession) {
    this.session = session || null;
  }
  
  /**
   * Update the session for authenticated operations
   */
  setSession(session: PortalSession): void {
    this.session = session;
  }
  
  /**
   * Clear the current session
   */
  clearSession(): void {
    this.session = null;
  }
  
  /**
   * Check if service has an authenticated session
   */
  isAuthenticated(): boolean {
    return this.session !== null && this.session.token.length > 0;
  }
  
  // Authentication commands
  
  async login(portal: string, token?: string, username?: string): Promise<CommandResult<LoginResult>> {
    try {
      const startTime = Date.now();
      
      const loginData = await loginWrapper({ portal, token, username });
      this.setSession(loginData.session);
      
      return createSuccessResult(loginData, {
        source: 'tui',
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Login failed') as CommandResult<LoginResult>;
    }
  }
  
  async logout(): Promise<CommandResult<void>> {
    try {
      const startTime = Date.now();
      
      await logoutWrapper();
      this.clearSession();
      
      return createSuccessResult(undefined, {
        source: 'tui',
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Logout failed') as CommandResult<void>;
    }
  }
  
  // Portal operations with server-side search
  
  async searchUsers(query: string = '*', options: CommandOptions = {}): Promise<CommandResult<UserSearchResult>> {
    if (!this.isAuthenticated()) {
      return createErrorResult('Authentication required for portal operations') as CommandResult<UserSearchResult>;
    }
    
    try {
      const startTime = Date.now();
      
      const userResult = await findUsersWrapper(query, {
        limit: String(options.limit || 50),
        filter: options.filter
      });
      
      return createSuccessResult(userResult, {
        source: 'tui',
        executionTime: Date.now() - startTime,
        resultCount: userResult.results?.length || 0,
        totalCount: userResult.total || 0
      });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'User search failed') as CommandResult<UserSearchResult>;
    }
  }
  
  async getUser(username: string): Promise<CommandResult<any>> {
    if (!this.isAuthenticated()) {
      return createErrorResult('Authentication required for portal operations');
    }
    
    try {
      const startTime = Date.now();
      
      const result = await this.executeCommandDirect<any>(() =>
        getUserCommand(username, { json: true })
      );
      
      if (result.success) {
        return createSuccessResult(result.data, {
          source: 'tui',
          executionTime: Date.now() - startTime
        });
      }
      
      return createErrorResult(result.error || 'Failed to get user');
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Failed to get user');
    }
  }
  
  async searchGroups(query: string = '*', options: CommandOptions = {}): Promise<CommandResult<GroupSearchResult>> {
    if (!this.isAuthenticated()) {
      return createErrorResult('Authentication required for portal operations') as CommandResult<GroupSearchResult>;
    }
    
    try {
      const startTime = Date.now();
      
      const groupResult = await findGroupsWrapper(query, {
        limit: String(options.limit || 50)
      });
      
      return createSuccessResult(groupResult, {
        source: 'tui',
        executionTime: Date.now() - startTime,
        resultCount: groupResult.results?.length || 0,
        totalCount: groupResult.total || 0
      });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Group search failed') as CommandResult<GroupSearchResult>;
    }
  }
  
  async searchItems(query: string = '*', options: CommandOptions = {}): Promise<CommandResult<ItemSearchResult>> {
    if (!this.isAuthenticated()) {
      return createErrorResult('Authentication required for portal operations') as CommandResult<ItemSearchResult>;
    }
    
    try {
      const startTime = Date.now();
      
      const itemResult = await findItemsWrapper(query, {
        limit: options.limit || 50,
        filter: options.filter
      });
      
      return createSuccessResult(itemResult, {
        source: 'tui',
        executionTime: Date.now() - startTime,
        resultCount: itemResult.results?.length || 0,
        totalCount: itemResult.total || 0
      });
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Item search failed') as CommandResult<ItemSearchResult>;
    }
  }
  
  // Service operations
  
  async searchServices(query: string, options: CommandOptions = {}): Promise<CommandResult<any>> {
    try {
      const startTime = Date.now();
      
      const result = await this.executeCommandDirect<any>(() =>
        searchCommand(query, { json: true })
      );
      
      if (result.success) {
        return createSuccessResult(result.data, {
          source: 'tui',
          executionTime: Date.now() - startTime
        });
      }
      
      return createErrorResult(result.error || 'Service search failed');
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Service search failed');
    }
  }
  
  async inspectService(url: string): Promise<CommandResult<any>> {
    try {
      const startTime = Date.now();
      
      const result = await this.executeCommandDirect<any>(() =>
        inspectCommand(url, { json: true })
      );
      
      if (result.success) {
        return createSuccessResult(result.data, {
          source: 'tui',
          executionTime: Date.now() - startTime
        });
      }
      
      return createErrorResult(result.error || 'Service inspection failed');
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Service inspection failed');
    }
  }
  
  async queryFeatures(url: string, options: { where?: string; limit?: number } = {}): Promise<CommandResult<any>> {
    try {
      const startTime = Date.now();
      
      const result = await this.executeCommandDirect<any>(() =>
        queryCommand(url, {
          where: options.where || '1=1',
          limit: String(options.limit || 100),
          json: true
        })
      );
      
      if (result.success) {
        return createSuccessResult(result.data, {
          source: 'tui',
          executionTime: Date.now() - startTime,
          resultCount: Array.isArray((result.data as any)?.features) ? (result.data as any).features.length : 0
        });
      }
      
      return createErrorResult(result.error || 'Feature query failed');
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Feature query failed');
    }
  }

  // Admin operations
  
  /**
   * Helper for admin operations with centralized session and error handling
   */
  private async withAdminClient<T>(
    operation: (client: ArcGISServerAdminClient) => Promise<T>
  ): Promise<CommandResult<T>> {
    try {
      const startTime = Date.now();
      const adminSession = await requireAdminSession();
      const client = new ArcGISServerAdminClient(adminSession);
      
      const result = await operation(client);
      
      return createSuccessResult(result, {
        source: 'tui',
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      return createErrorResult(
        error instanceof Error ? error.message : 'Admin operation failed'
      ) as CommandResult<T>;
    }
  }
  
  async getServerStatus(): Promise<CommandResult<any>> {
    return this.withAdminClient(async (client) => {
      // Get actual server info instead of mock data
      const services = await client.listServices();
      const runningServices = services.filter(s => s.status === 'STARTED');
      
      return {
        name: 'ArcGIS Server',
        version: '11.x', // Could be enhanced to get actual version
        status: runningServices.length > 0 ? 'running' as const : 'degraded' as const,
        uptime: 'Available via health check', // Could be enhanced
        services: services.length,
        runningServices: runningServices.length
      };
    });
  }
  
  async listServices(): Promise<CommandResult<any[]>> {
    return this.withAdminClient(async (client) => {
      const services = await client.listServices();
      return services;
    });
  }
  
  async getServerLogs(limit: number = 100): Promise<CommandResult<any[]>> {
    return this.withAdminClient(async (client) => {
      const logs = await client.getLogs(limit);
      return logs;
    });
  }
  
  // Additional admin methods using real admin client
  
  async getServiceStatus(serviceName: string): Promise<CommandResult<any>> {
    return this.withAdminClient(async (client) => {
      return client.getServiceStatus(serviceName);
    });
  }
  
  async startService(serviceName: string, wait?: boolean): Promise<CommandResult<void>> {
    return this.withAdminClient(async (client) => {
      await client.startService(serviceName, wait);
    });
  }
  
  async stopService(serviceName: string, wait?: boolean): Promise<CommandResult<void>> {
    return this.withAdminClient(async (client) => {
      await client.stopService(serviceName, wait);
    });
  }
  
  // Insights methods (placeholders for now)
  async getAuthFailures(timeRange: string): Promise<CommandResult<any[]>> {
    // TODO: Implement actual database query
    return createSuccessResult([]);
  }
  
  async getServiceHealth(timeRange: string): Promise<CommandResult<any[]>> {
    // TODO: Implement actual database query
    return createSuccessResult([]);
  }
  
  async getCommandTrends(timeRange: string): Promise<CommandResult<any[]>> {
    // TODO: Implement actual database query
    return createSuccessResult([]);
  }
  
  async getResourceTrends(timeRange: string): Promise<CommandResult<any[]>> {
    // TODO: Implement actual database query
    return createSuccessResult([]);
  }

  // Advanced analytics methods
  async getDbSchema(): Promise<CommandResult<any>> {
    // TODO: Implement actual schema retrieval
    return createSuccessResult({
      tables: ['audit_logs', 'command_metrics', 'auth_failures', 'service_health']
    });
  }

  async getAnalysisTemplates(): Promise<CommandResult<any[]>> {
    // TODO: Implement actual template retrieval
    return createSuccessResult([
      { name: 'Failed Login Analysis', query: 'SELECT * FROM auth_failures' },
      { name: 'Service Health Report', query: 'SELECT * FROM service_health' }
    ]);
  }

  async executeSqlQuery(query: string): Promise<CommandResult<any[]>> {
    // TODO: Implement actual SQL execution
    return createSuccessResult([]);
  }

  // Datastore operations
  async listDatastores(): Promise<CommandResult<any[]>> {
    // TODO: Implement actual datastore listing
    return createSuccessResult([]);
  }

  async validateDatastores(): Promise<CommandResult<any[]>> {
    // TODO: Implement actual datastore validation
    return createSuccessResult([]);
  }

  async checkDatastoreHealth(datastoreId: string): Promise<CommandResult<any>> {
    // TODO: Implement actual health check
    return createSuccessResult({
      status: 'healthy',
      connectionTime: 50,
      lastChecked: new Date()
    });
  }

  // Re-export loginPortal from wrapper
  async loginPortal(options: { portal: string; token?: string; username?: string }): Promise<CommandResult<any>> {
    try {
      const result = await loginWrapper(options);
      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Execute a command function directly and capture its result
   * This replaces process spawning with direct function calls
   */
  private async executeCommandDirect<T>(commandFn: () => Promise<T>): Promise<CommandResult<T>> {
    try {
      // Capture console output for commands that write to stdout
      const originalLog = console.log;
      const originalError = console.error;
      let output = '';
      let errorOutput = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };
      console.error = (...args) => {
        errorOutput += args.join(' ') + '\n';
      };
      
      try {
        const result = await commandFn();
        
        // Restore console
        console.log = originalLog;
        console.error = originalError;
        
        // If the command wrote JSON to output, try to parse it
        if (output.trim()) {
          try {
            const parsedOutput = JSON.parse(output.trim());
            return createSuccessResult(parsedOutput);
          } catch {
            // Not JSON, return raw output
            return createSuccessResult(result);
          }
        }
        
        return createSuccessResult(result);
      } finally {
        // Always restore console
        console.log = originalLog;
        console.error = originalError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Command execution failed';
      return createErrorResult(errorMessage) as CommandResult<T>;
    }
  }
}
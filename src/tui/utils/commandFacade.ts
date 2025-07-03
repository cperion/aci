import { spawn } from 'child_process';
import type { CommandResult } from '../types.js';

/**
 * Command facade for invoking CLI commands from TUI
 * Implements the facade pattern to reuse existing CLI functionality
 */
export class CommandFacade {
  private static instance: CommandFacade;
  
  static getInstance(): CommandFacade {
    if (!CommandFacade.instance) {
      CommandFacade.instance = new CommandFacade();
    }
    return CommandFacade.instance;
  }
  
  /**
   * Execute a CLI command and return structured result
   */
  async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    return new Promise((resolve) => {
      const child = spawn('bun', ['run', 'src/cli.ts', command, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output: stdout,
          error: stderr,
          data: success ? this.parseOutput(stdout) : undefined
        });
      });
      
      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }
  
  /**
   * Parse CLI output into structured data
   * This is a simple implementation - can be enhanced based on output format
   */
  private parseOutput(output: string): unknown {
    // Try to extract JSON if present
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall back to raw output
      }
    }
    return { raw: output };
  }
  
  // Convenience methods for common operations
  async login(portal: string, token?: string, username?: string): Promise<CommandResult> {
    const args = ['--portal', portal];
    if (token) {
      args.push('--token', token);
    } else if (username) {
      args.push('--username', username);
    }
    return this.executeCommand('login', args);
  }
  
  async logout(): Promise<CommandResult> {
    return this.executeCommand('logout');
  }
  
  async inspect(url: string): Promise<CommandResult> {
    return this.executeCommand('inspect', [url]);
  }
  
  async query(url: string, options: { where?: string; limit?: number } = {}): Promise<CommandResult> {
    const args = [url];
    if (options.where) {
      args.push('--where', options.where);
    }
    if (options.limit) {
      args.push('--limit', options.limit.toString());
    }
    return this.executeCommand('query', args);
  }
  
  async adminServices(): Promise<CommandResult> {
    return this.executeCommand('admin', ['services']);
  }
  
  async adminStatus(): Promise<CommandResult> {
    return this.executeCommand('admin', ['status']);
  }
  
  // Portal operations
  async portalUsers(query: string = '*'): Promise<CommandResult> {
    return this.executeCommand('users', ['find', query]);
  }
  
  async portalUserDetails(username: string): Promise<CommandResult> {
    return this.executeCommand('users', ['get', username]);
  }
  
  async portalGroups(query: string = '*'): Promise<CommandResult> {
    return this.executeCommand('groups', ['find', query]);
  }
  
  async portalItems(query: string = '*'): Promise<CommandResult> {
    return this.executeCommand('items', ['find', query]);
  }
  
  // Admin operations
  async adminLogs(): Promise<CommandResult> {
    return this.executeCommand('admin', ['logs']);
  }
  
  async adminHealth(): Promise<CommandResult> {
    return this.executeCommand('admin', ['health']);
  }
  
  // Insights operations
  async insightsAuthFailures(timeRange: string): Promise<CommandResult> {
    return this.executeCommand('insights', ['auth-failures', '--timeRange', timeRange]);
  }
  
  async insightsServiceHealth(timeRange: string): Promise<CommandResult> {
    return this.executeCommand('insights', ['service-health', '--timeRange', timeRange]);
  }
  
  async insightsCommandTrends(timeRange: string): Promise<CommandResult> {
    return this.executeCommand('insights', ['command-trends', '--timeRange', timeRange]);
  }
  
  async insightsResourceTrends(timeRange: string): Promise<CommandResult> {
    return this.executeCommand('insights', ['resource-trends', '--timeRange', timeRange]);
  }
  
  // Analytics operations
  async analyzeTemplate(): Promise<CommandResult> {
    return this.executeCommand('analyze', ['template']);
  }
  
  async analyzeSql(query: string): Promise<CommandResult> {
    return this.executeCommand('analyze', ['sql', query]);
  }
  
  async analyzeSchema(): Promise<CommandResult> {
    return this.executeCommand('analyze', ['schema']);
  }
  
  // Datastore operations
  async datastoresList(): Promise<CommandResult> {
    return this.executeCommand('datastores', ['list']);
  }
  
  async datastoresValidate(): Promise<CommandResult> {
    return this.executeCommand('datastores', ['validate']);
  }
  
  async datastoresHealth(): Promise<CommandResult> {
    return this.executeCommand('datastores', ['health']);
  }
}
import { Command } from 'commander';
import type { AdminSession } from '../session.js';
import { getAdminSession, requireAdminSession } from '../session.js';
import { ArcGISServerAdminClient } from '../services/admin-client.js';
import { handleError } from '../errors/handler.js';
import { AdminAuthenticationError, InsufficientPrivilegesError } from '../error.js';
import { formatServiceTable, formatServiceStatus } from '../utils/output.js';
import { 
  listDatastoresCommand, 
  validateDatastoreCommand, 
  machinesCommand, 
  backupInfoCommand,
  registerDatastoreCommand,
  unregisterDatastoreCommand,
  updateDatastoreCommand
} from './datastores.js';

export interface AdminCommandOptions {
  env?: string;
  wait?: boolean;
  folder?: string;
  status?: string;
  tail?: number;
  level?: string;
  detailed?: boolean;
  days?: number;
  format?: string;
}

/**
 * HTTPS enforcement hook for admin commands
 */
async function enforceHTTPS(command: Command): Promise<void> {
  // Get current environment's server admin URL
  const env = command.getOptionValue('env');
  const session = await getAdminSession(env);
  
  if (session?.serverAdminUrl && !session.serverAdminUrl.startsWith('https://')) {
    throw new AdminAuthenticationError(
      'Admin operations require HTTPS. Configure server_admin URL with https:// in .acirc'
    );
  }
}

/**
 * Register all admin commands with the main CLI program
 */
export function registerAdminCommands(program: Command): void {
  const adminCmd = program
    .command('admin')
    .description('ArcGIS Server administration operations')
    .hook('preAction', enforceHTTPS);

  // Authentication commands
  registerAdminAuthCommands(adminCmd);

  // Services administration
  registerServicesCommands(adminCmd);
  
  // Logs administration  
  registerLogsCommands(adminCmd);
  
  // Status and health
  registerStatusCommands(adminCmd);
  
  // Data store management
  registerDatastoreCommands(adminCmd);
}

/**
 * Register admin authentication commands
 */
function registerAdminAuthCommands(adminCmd: Command): void {
  adminCmd
    .command('login')
    .description('Authenticate for admin operations')
    .option('--token <token>', 'Admin API token')
    .option('--server <url>', 'ArcGIS Server admin URL')
    .option('--username <username>', 'Username for admin authentication')
    .option('--env <environment>', 'Environment to authenticate for')
    .action(adminLoginCommand);

  adminCmd
    .command('logout')
    .description('Clear admin authentication')
    .option('--env <environment>', 'Environment to logout from')
    .action(adminLogoutCommand);
}

/**
 * Register service management commands
 */
function registerServicesCommands(adminCmd: Command): void {
  const servicesCmd = adminCmd
    .command('services')
    .description('Manage ArcGIS services');

  servicesCmd
    .command('list')
    .description('List all services')
    .option('--folder <name>', 'Filter by folder name')
    .option('--status <status>', 'Filter by service status (STARTED, STOPPED)')
    .option('--env <environment>', 'Environment to use')
    .action(listServicesCommand);

  servicesCmd
    .command('status <name>')
    .description('Get service status')
    .option('--env <environment>', 'Environment to use')
    .action(getServiceStatusCommand);

  servicesCmd
    .command('start <name>')
    .description('Start a service')
    .option('--wait', 'Wait for service to start completely')
    .option('--env <environment>', 'Environment to use')
    .action(startServiceCommand);

  servicesCmd
    .command('stop <name>')
    .description('Stop a service')
    .option('--wait', 'Wait for service to stop completely')
    .option('--env <environment>', 'Environment to use')
    .action(stopServiceCommand);

  servicesCmd
    .command('restart <name>')
    .description('Restart a service')
    .option('--wait', 'Wait for service to restart completely')
    .option('--env <environment>', 'Environment to use')
    .action(restartServiceCommand);
}

/**
 * Register log management commands
 */
function registerLogsCommands(adminCmd: Command): void {
  const logsCmd = adminCmd
    .command('logs')
    .description('Manage server logs');

  logsCmd
    .command('view')
    .description('View server logs')
    .option('--tail <n>', 'Number of recent log entries to show', '100')
    .option('--level <level>', 'Log level filter (SEVERE, WARNING, INFO, FINE)')
    .option('--env <environment>', 'Environment to use')
    .action(viewLogsCommand);

  logsCmd
    .command('export')
    .description('Export server logs')
    .option('--days <n>', 'Number of days to export', '7')
    .option('--format <format>', 'Export format (json, csv)', 'json')
    .option('--env <environment>', 'Environment to use')
    .action(exportLogsCommand);
}

/**
 * Register status and health commands
 */
function registerStatusCommands(adminCmd: Command): void {
  adminCmd
    .command('status')
    .description('Show admin session status and server health')
    .option('--env <environment>', 'Environment to use')
    .action(adminStatusCommand);

  adminCmd
    .command('health')
    .description('Perform server health check')
    .option('--detailed', 'Show detailed health information')
    .option('--env <environment>', 'Environment to use')
    .action(healthCheckCommand);
}

/**
 * Register data store management commands
 */
function registerDatastoreCommands(adminCmd: Command): void {
  const datastoresCmd = adminCmd
    .command('datastores')
    .description('Data store management operations');

  datastoresCmd
    .command('list')
    .description('List registered data stores')
    .option('--env <environment>', 'Environment to use')
    .action(listDatastoresCommand);

  datastoresCmd
    .command('validate <name>')
    .description('Validate health of a specific data store')
    .option('--detailed', 'Show detailed health information')
    .option('--timeout <seconds>', 'Validation timeout in seconds')
    .option('--env <environment>', 'Environment to use')
    .action(validateDatastoreCommand);

  datastoresCmd
    .command('machines <name>')
    .description('Show machine status for data store')
    .option('--env <environment>', 'Environment to use')
    .action(machinesCommand);

  datastoresCmd
    .command('backup-info')
    .description('Show backup status across all data stores')
    .option('--env <environment>', 'Environment to use')
    .action(backupInfoCommand);

  datastoresCmd
    .command('register <name>')
    .description('Register a new data store')
    .requiredOption('--type <type>', 'Data store type (enterprise, cloud, relational, tileCache, spatiotemporal, graph, object, fileShare, raster)')
    .option('--provider <provider>', 'Data store provider')
    .option('--connection-string <connectionString>', 'Connection string for the data store')
    .option('--host <host>', 'Database host')
    .option('--port <port>', 'Database port')
    .option('--database <database>', 'Database name')
    .option('--username <username>', 'Database username')
    .option('--password <password>', 'Database password')
    .option('--on-server-start', 'Start data store on server startup')
    .option('--is-managed', 'Data store is managed by ArcGIS Server')
    .option('--env <environment>', 'Environment to use')
    .action(registerDatastoreCommand);

  datastoresCmd
    .command('unregister <name>')
    .description('Unregister a data store')
    .option('--env <environment>', 'Environment to use')
    .action(unregisterDatastoreCommand);

  datastoresCmd
    .command('update <name>')
    .description('Update data store configuration')
    .option('--type <type>', 'Data store type')
    .option('--provider <provider>', 'Data store provider')
    .option('--connection-string <connectionString>', 'Connection string for the data store')
    .option('--host <host>', 'Database host')
    .option('--port <port>', 'Database port')
    .option('--database <database>', 'Database name')
    .option('--username <username>', 'Database username')
    .option('--password <password>', 'Database password')
    .option('--on-server-start', 'Start data store on server startup')
    .option('--is-managed', 'Data store is managed by ArcGIS Server')
    .option('--env <environment>', 'Environment to use')
    .action(updateDatastoreCommand);
}

// Command Implementations

export async function listServicesCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Fetching services${options.folder ? ` from folder: ${options.folder}` : ''}...`);
    
    const services = await client.listServices(options.folder);
    
    // Filter by status if specified
    const filteredServices = options.status 
      ? services.filter(service => service.status === options.status!.toUpperCase())
      : services;
    
    if (filteredServices.length === 0) {
      console.log('No services found matching the criteria.');
      return;
    }
    
    console.log(formatServiceTable(filteredServices));
    console.log(`\nTotal: ${filteredServices.length} service(s)`);
    
  } catch (error) {
    handleError(error, 'Failed to list services');
  }
}

export async function getServiceStatusCommand(name: string, options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Checking status for service: ${name}...`);
    
    const serviceInfo = await client.getServiceStatus(name);
    console.log(formatServiceStatus(serviceInfo));
    
  } catch (error) {
    handleError(error, `Failed to get status for service: ${name}`);
  }
}

export async function startServiceCommand(name: string, options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Starting service: ${name}...`);
    
    await client.startService(name, options.wait);
    
    if (options.wait) {
      console.log(`✓ Service ${name} started successfully`);
    } else {
      console.log(`✓ Start command sent for service ${name}`);
      console.log('Use --wait flag to wait for completion or check status with: aci admin services status ' + name);
    }
    
  } catch (error) {
    handleError(error, `Failed to start service: ${name}`);
  }
}

export async function stopServiceCommand(name: string, options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Stopping service: ${name}...`);
    
    await client.stopService(name, options.wait);
    
    if (options.wait) {
      console.log(`✓ Service ${name} stopped successfully`);
    } else {
      console.log(`✓ Stop command sent for service ${name}`);
      console.log('Use --wait flag to wait for completion or check status with: aci admin services status ' + name);
    }
    
  } catch (error) {
    handleError(error, `Failed to stop service: ${name}`);
  }
}

export async function restartServiceCommand(name: string, options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log(`Restarting service: ${name}...`);
    
    // Simple stop then start
    await client.stopService(name, true);
    console.log(`  ✓ Service ${name} stopped`);
    
    await client.startService(name, true);
    console.log(`  ✓ Service ${name} started`);
    
    console.log(`✓ Service ${name} restarted successfully`);
    
  } catch (error) {
    handleError(error, `Failed to restart service: ${name}`);
  }
}

export async function viewLogsCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    const tail = parseInt(options.tail?.toString() || '100');
    console.log(`Fetching last ${tail} log entries${options.level ? ` (level: ${options.level})` : ''}...`);
    
    const logs = await client.getLogs(tail, options.level);
    
    if (logs.length === 0) {
      console.log('No log entries found.');
      return;
    }
    
    logs.forEach(log => {
      const timestamp = new Date(log.time).toISOString();
      const level = log.level.padEnd(7);
      console.log(`${timestamp} ${level} ${log.message}`);
    });
    
    console.log(`\nShowing ${logs.length} log entries`);
    
  } catch (error) {
    handleError(error, 'Failed to view logs');
  }
}

export async function exportLogsCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log('Getting recent logs...');
    
    const logs = await client.getLogs(1000); // Simple: just get last 1000 entries
    
    if (logs.length === 0) {
      console.log('No log entries found.');
      return;
    }
    
    logs.forEach(log => {
      const timestamp = new Date(log.time).toISOString();
      console.log(`${timestamp} [${log.level}] ${log.message}`);
    });
    
    console.log(`\nShowing ${logs.length} log entries`);
    
  } catch (error) {
    handleError(error, 'Failed to export logs');
  }
}

export async function adminStatusCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const session = await getAdminSession(options.env);
    
    if (!session) {
      console.log('Not authenticated for admin operations');
      console.log('Use: aci admin login --help');
      return;
    }
    
    console.log('Admin Session:');
    console.log(`  Environment: ${session.environment}`);
    console.log(`  Server: ${session.serverAdminUrl}`);
    console.log(`  User: ${session.username || 'API Token User'}`);
    
    const expiresIn = Math.floor((session.elevationExpires - Date.now()) / 1000 / 60);
    console.log(`  Expires in: ${expiresIn} minutes`);
    
  } catch (error) {
    handleError(error, 'Failed to get admin status');
  }
}

export async function healthCheckCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const session = await requireAdminSession(options.env);
    const client = new ArcGISServerAdminClient(session);
    
    console.log('Checking server status...');
    
    // Simple health check: try to get services list
    const services = await client.listServices();
    const runningServices = services.filter(s => s.status === 'STARTED').length;
    
    console.log('Server Status:');
    console.log(`  Total Services: ${services.length}`);
    console.log(`  Running Services: ${runningServices}`);
    console.log(`  Server: ${runningServices > 0 ? '✓ Healthy' : '⚠ No running services'}`);
    
  } catch (error) {
    handleError(error, 'Failed to check server health');
  }
}

// Admin Authentication Commands

export async function adminLoginCommand(options: AdminCommandOptions & {
  token?: string;
  server?: string;
  username?: string;
}): Promise<void> {
  try {
    const environment = options.env || 'default';
    
    if (!options.server) {
      console.error('Admin login requires --server URL');
      console.log('Usage:');
      console.log('  aci admin login --server https://server.com:6443/arcgis/admin --token YOUR_TOKEN');
      console.log('  aci admin login --server https://server.com:6443/arcgis/admin --username admin');
      process.exit(1);
    }
    
    if (options.token) {
      await authenticateWithToken(environment, options.server, options.token);
    } else if (options.username) {
      await authenticateWithUsername(environment, options.server, options.username);
    } else {
      console.error('Must specify either --token or --username');
      process.exit(1);
    }
    
    // Update current environment to ensure subsequent commands find the session
    const { setCurrentEnvironment } = await import('../session.js');
    setCurrentEnvironment(environment);
    
  } catch (error) {
    handleError(error, 'Admin login failed');
  }
}

export async function adminLogoutCommand(options: AdminCommandOptions): Promise<void> {
  try {
    const { clearAdminSession } = await import('../session.js');
    const environment = options.env || 'default';
    
    await clearAdminSession(environment);
    console.log(`✓ Admin session cleared for environment: ${environment}`);
    
  } catch (error) {
    handleError(error, 'Admin logout failed');
  }
}

// Helper functions for authentication

async function authenticateWithToken(
  environment: string,
  serverAdminUrl: string,
  token: string
): Promise<void> {
  const { saveAdminSession, getAdminTimeout } = await import('../session.js');
  
  // Test the token by making a simple request
  const response = await fetch(`${serverAdminUrl}/info?token=${token}&f=json`);
  
  if (!response.ok) {
    throw new AdminAuthenticationError(`Server returned ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new AdminAuthenticationError(`Authentication failed: ${data.error.message}`);
  }
  
  // Create admin session
  const adminSession: AdminSession = {
    environment,
    adminToken: token,
    serverAdminUrl,
    username: 'api-token-user',
    elevationExpires: Date.now() + getAdminTimeout(environment),
    authenticationMethod: 'TOKEN'
  };
  
  await saveAdminSession(adminSession, environment);
  
  console.log(`✓ Admin authentication successful for environment: ${environment}`);
  console.log(`Server: ${serverAdminUrl}`);
}

async function authenticateWithUsername(
  environment: string,
  serverAdminUrl: string,
  username: string
): Promise<void> {
  const { read } = await import('read');
  const { saveAdminSession, getAdminTimeout } = await import('../session.js');
  
  // Prompt for password
  const password = await read({
    prompt: 'Password: ',
    silent: true
  });
  
  // Generate token using username/password
  const response = await fetch(`${serverAdminUrl}/generateToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
      client: 'requestip',
      f: 'json'
    })
  });
  
  if (!response.ok) {
    throw new AdminAuthenticationError(`Server returned ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new AdminAuthenticationError(`Authentication failed: ${data.error.message}`);
  }
  
  if (!data.token) {
    throw new AdminAuthenticationError('No token received from server');
  }
  
  // Create admin session
  const adminSession: AdminSession = {
    environment,
    adminToken: data.token,
    serverAdminUrl,
    username,
    elevationExpires: data.expires || (Date.now() + getAdminTimeout(environment)),
    authenticationMethod: 'TOKEN'
  };
  
  await saveAdminSession(adminSession, environment);
  
  console.log(`✓ Admin authentication successful for environment: ${environment}`);
  console.log(`Server: ${serverAdminUrl}`);
  console.log(`User: ${username}`);
}
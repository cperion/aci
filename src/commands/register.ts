import { Command } from 'commander';
import { loginCommand, logoutCommand, statusCommand } from './auth.js';
import { inspectCommand } from './inspect.js';
import { queryCommand } from './query.js';
import { searchCommand } from './search.js';
import { registerAdminCommands } from './admin.js';

export function registerCommands(program: Command): void {
  // Authentication commands
  program
    .command('login')
    .description('Authenticate with ArcGIS portal')
    .option('-t, --token <token>', 'API token for authentication (enterprise preferred)')
    .option('-u, --username <username>', 'Username for authentication')
    .option('-p, --portal <url>', 'Portal URL (required for enterprise)')
    .option('-e, --env <environment>', 'Target environment (dev/qa/prod)')
    .action(loginCommand);

  program
    .command('logout')
    .description('Clear authentication session')
    .option('-e, --env <environment>', 'Target environment to logout from')
    .option('--all', 'Logout from all environments')
    .action(logoutCommand);
    
  program
    .command('status')
    .description('Show authentication status and environment info')
    .action(statusCommand);

  // Inspection commands
  program
    .command('inspect')
    .description('Inspect service or item metadata')
    .argument('<url>', 'Service URL or item ID to inspect')
    .option('--json', 'Output raw JSON')
    .option('--fields', 'Show field schema details')
    .option('-e, --env <environment>', 'Use specific environment for authentication')
    .action(inspectCommand);

  // Query commands
  program
    .command('query')
    .description('Query features from a service')
    .argument('<url>', 'Feature service URL to query')
    .option('-w, --where <clause>', 'SQL WHERE clause', '1=1')
    .option('-l, --limit <number>', 'Maximum number of features', '10')
    .option('--fields <fields>', 'Comma-separated field names (default: all)')
    .option('--json', 'Output raw JSON')
    .option('--geojson', 'Output as GeoJSON')
    .option('-e, --env <environment>', 'Use specific environment for authentication')
    .action(queryCommand);

  // Search commands
  program
    .command('search')
    .description('Search portal items')
    .argument('<query>', 'Search query string')
    .option('-t, --type <type>', 'Filter by item type (e.g., "Feature Service", "Web Map")')
    .option('-o, --owner <owner>', 'Filter by owner username')
    .option('-l, --limit <number>', 'Maximum number of results', '10')
    .option('--json', 'Output raw JSON')
    .option('-e, --env <environment>', 'Use specific environment for authentication')
    .action(searchCommand);

  // Admin commands
  registerAdminCommands(program);
}
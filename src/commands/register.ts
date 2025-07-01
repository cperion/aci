import { Command } from 'commander';
import { loginCommand, logoutCommand, statusCommand } from './auth.js';
import { inspectCommand } from './inspect.js';
import { queryCommand } from './query.js';
import { searchCommand } from './search.js';
import { registerAdminCommands } from './admin.js';
import { findUsersCommand, getUserCommand } from './users.js';
import { findGroupsCommand, createGroupCommand, getGroupCommand } from './groups.js';
import { findItemsCommand, getItemCommand, shareItemCommand } from './items.js';
import { 
  authFailuresInsight, 
  serviceHealthInsight, 
  commandTrendsInsight, 
  resourceTrendsInsight,
  templateAnalysis,
  expertSqlConsole
} from './insights.js';

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
    .option('--with-infrastructure', 'Include backing datastore analysis')
    .option('--troubleshoot', 'Generate troubleshooting report with infrastructure correlation')
    .option('--compliance-report', 'Generate compliance report with data governance analysis')
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

  // Portal user commands
  program
    .command('users')
    .description('User management operations')
    .addCommand(
      new Command('find')
        .description('Search portal users')
        .argument('<query>', 'Search query (username, email, or name)')
        .option('-l, --limit <number>', 'Maximum number of results', '10')
        .option('--filter <expression>', 'Additional filter criteria')
        .option('--json', 'Output raw JSON')
        .action(findUsersCommand)
    )
    .addCommand(
      new Command('get')
        .description('Get user profile details')
        .argument('<username>', 'Username to retrieve')
        .option('--json', 'Output raw JSON')
        .action(getUserCommand)
    );

  // Portal group commands
  program
    .command('groups')
    .description('Group management operations')
    .addCommand(
      new Command('find')
        .description('Search portal groups')
        .argument('<query>', 'Search query')
        .option('-l, --limit <number>', 'Maximum number of results', '10')
        .option('--json', 'Output raw JSON')
        .action(findGroupsCommand)
    )
    .addCommand(
      new Command('create')
        .description('Create a new group')
        .argument('<title>', 'Group title')
        .option('--access <level>', 'Access level (private, org, public)', 'private')
        .option('--description <text>', 'Group description')
        .option('--json', 'Output raw JSON')
        .action(createGroupCommand)
    )
    .addCommand(
      new Command('get')
        .description('Get group details')
        .argument('<groupId>', 'Group ID to retrieve')
        .option('--json', 'Output raw JSON')
        .action(getGroupCommand)
    );

  // Portal item commands
  program
    .command('items')
    .description('Item management operations')
    .addCommand(
      new Command('find')
        .description('Search portal items')
        .argument('<query>', 'Search query')
        .option('-t, --type <type>', 'Filter by item type')
        .option('-o, --owner <owner>', 'Filter by owner username')
        .option('-l, --limit <number>', 'Maximum number of results', '10')
        .option('--json', 'Output raw JSON')
        .action(findItemsCommand)
    )
    .addCommand(
      new Command('get')
        .description('Get item details')
        .argument('<itemId>', 'Item ID to retrieve')
        .option('--json', 'Output raw JSON')
        .action(getItemCommand)
    )
    .addCommand(
      new Command('share')
        .description('Update item sharing permissions')
        .argument('<itemId>', 'Item ID to share')
        .option('-g, --groups <ids>', 'Comma-separated group IDs')
        .option('--org', 'Share with organization')
        .option('--public', 'Share publicly')
        .option('--json', 'Output raw JSON')
        .action(shareItemCommand)
    );

  // Admin insights and analytics commands
  const insightsCmd = program
    .command('insights')
    .description('Operational insights and analytics for admin users');

  insightsCmd
    .command('auth-failures')
    .description('Analyze authentication failure patterns')
    .option('-e, --environment <env>', 'Target environment')
    .option('-t, --time-window <window>', 'Time window (e.g., 24h, 7d)', '24h')
    .option('-l, --limit <number>', 'Limit results', '30')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(authFailuresInsight);

  insightsCmd
    .command('service-health')
    .description('Analyze service health trends and patterns')
    .option('-e, --environment <env>', 'Target environment')
    .option('-t, --time-window <window>', 'Time window (e.g., 24h, 7d)', '7d')
    .option('-l, --limit <number>', 'Limit results', '20')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(serviceHealthInsight);

  insightsCmd
    .command('command-trends')
    .description('Analyze command execution patterns and performance')
    .option('-e, --environment <env>', 'Target environment')
    .option('-t, --time-window <window>', 'Time window (e.g., 24h, 7d)', '7d')
    .option('-l, --limit <number>', 'Limit results', '15')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(commandTrendsInsight);

  insightsCmd
    .command('resource-trends')
    .description('Analyze resource usage and capacity trends')
    .option('-e, --environment <env>', 'Target environment')
    .option('-t, --time-window <window>', 'Time window (e.g., 24h, 7d)', '24h')
    .option('-l, --limit <number>', 'Limit results', '10')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(resourceTrendsInsight);

  // Advanced analytics commands
  const analyzeCmd = program
    .command('analyze')
    .description('Advanced template-based analysis and expert SQL access');

  analyzeCmd
    .command('template')
    .description('Execute guided template analysis')
    .argument('<template>', 'Template name (auth-correlation, service-dependency, failure-cascade, performance-degradation)')
    .option('-e, --environment <env>', 'Target environment')
    .option('-t, --time-window <window>', 'Time window (e.g., 24h, 7d)', '24h')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .action(templateAnalysis);

  analyzeCmd
    .command('sql')
    .description('Expert SQL console with security safeguards (read-only)')
    .argument('<query>', 'SQL query to execute')
    .option('--format <format>', 'Output format (table, json, csv)', 'table')
    .option('--expert', 'Confirm expert mode access')
    .action((query, options) => {
      if (!options.expert) {
        console.log('Expert SQL access requires --expert flag for security confirmation');
        console.log('Example: aci analyze sql "SELECT * FROM audit_log LIMIT 10" --expert');
        return;
      }
      expertSqlConsole(query, options);
    });

  // Schema inspection
  analyzeCmd
    .command('schema')
    .description('Show database schema information')
    .action(async () => {
      try {
        const { getAdminDatabase } = await import('../utils/database.js');
        const db = getAdminDatabase();
        const schema = db.getSchema();
        
        console.log('📊 Database Schema\n');
        schema.forEach(table => {
          console.log(`Table: ${table.table}`);
          table.columns.forEach((col: any) => {
            console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}`);
          });
          console.log('');
        });
      } catch (error) {
        console.error('Failed to get schema:', error);
      }
    });

  // Admin commands
  registerAdminCommands(program);
}
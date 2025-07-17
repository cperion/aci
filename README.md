# ACI - ArcGIS Command Line Interface

A TypeScript-based command-line interface for interacting with the ArcGIS ecosystem, designed for enterprise workflows and GIS professionals.

## Features

- **Enterprise-First Authentication**: Secure token-based authentication with multi-environment support
- **Service Inspection**: Analyze ArcGIS services and layers with detailed metadata
- **Data Querying**: Query feature services with flexible filtering and output formats
- **Environment Management**: Switch between development, testing, and production environments
- **Federation Support**: Automatic Portal-to-Server authentication token exchange
- **Secure Session Management**: Encrypted token storage using system keychain
- **Datastore Management**: Complete datastore registration, validation, and monitoring
- **Server Administration**: Comprehensive ArcGIS Server management capabilities
- **Terminal UI**: Interactive TUI mode with keyboard shortcuts and theme support

## Installation

```bash
# Install dependencies
bun install

# Build the CLI
bun run build

# Run in development mode
bun run dev
```

### WSL2 Dependencies

On WSL2, the secure credential storage requires additional dependencies:

```bash
# Install required packages for keyring support
sudo apt-get update
sudo apt-get install libsecret-1-0 libsecret-1-dev

# If you still encounter issues, you may need:
sudo apt-get install gnome-keyring dbus-x11
```

**Note**: If keyring services are unavailable in your WSL2 environment, you can use token-based authentication as a workaround:

```bash
# Get admin token manually
curl -X POST "https://your-server.com/arcgis/admin/generateToken" \
  -d "username=admin&password=YOUR_PASSWORD&client=requestip&f=json"

# Use the token directly
aci admin login --server https://your-server.com/arcgis/admin --token YOUR_TOKEN
```

## Quick Start

### 1. Configure Your Environments

Create a `.acirc` file in your home directory:

```ini
[qualif]
portal=https://qsig.parisladefense.com/arcgis/sharing/rest
auth_type=token

[recette]
portal=https://rsig.parisladefense.com/arcgis/sharing/rest
auth_type=token

[prod]
portal=https://sig.parisladefense.com/arcgis/sharing/rest
auth_type=token
```

### 2. Authenticate

```bash
# Login with API token (recommended for enterprise)
aci login --portal https://your-portal.com/arcgis/sharing/rest --token YOUR_API_TOKEN

# Login with username/password
aci login --portal https://your-portal.com/arcgis/sharing/rest --username jsmith

# Login with environment configuration
aci login --env recette --token YOUR_API_TOKEN
```

### 3. Explore Services

```bash
# Search for services
aci search "zoning"

# Inspect service metadata
aci inspect https://your-server.com/arcgis/rest/services/Planning/Zoning/FeatureServer

# Query features
aci query https://your-server.com/arcgis/rest/services/Planning/Zoning/FeatureServer/0 --where "ZONE_TYPE='Residential'" --limit 10
```

## Commands

### Authentication

```bash
# Login to portal
aci login --portal <portal-url> --token <api-token>
aci login --portal <portal-url> --username <username>
aci login --env <environment> --token <api-token>

# Check authentication status
aci status

# Logout
aci logout [--env <environment>]
```

### Service Operations

```bash
# Search for services by keyword
aci search <keyword>

# Inspect service or layer metadata
aci inspect <service-url>

# Query features from a service
aci query <service-url> [options]
```

### Query Options

```bash
--where <sql-expression>    # SQL WHERE clause
--limit <number>           # Maximum number of features
--offset <number>          # Skip first N features
--fields <field1,field2>   # Specific fields to return
--env <environment>        # Use specific environment
```

## Server Administration

ACI provides essential ArcGIS Server administration capabilities through the `admin` command namespace.

### Admin Authentication

```bash
# Authenticate with server admin URL and token
aci admin login --server https://server.com:6443/arcgis/admin --token ADMIN_TOKEN

# Authenticate with username/password
aci admin login --server https://server.com:6443/arcgis/admin --username admin

# Use environment-specific configuration
aci admin login --env prod --token ADMIN_TOKEN
```

### Service Management

```bash
# List all services
aci admin services list

# Filter by status or folder
aci admin services list --status STARTED --folder Planning

# Get service status
aci admin services status MyService

# Start/stop/restart services
aci admin services start MyService --wait
aci admin services stop MyService --wait
aci admin services restart MyService
```

### Logs and Monitoring

```bash
# View recent logs
aci admin logs view --tail 50 --level WARNING

# Export logs
aci admin logs export

# Check server health
aci admin health

# Show admin session status
aci admin status
```

### Datastore Management

```bash
# List all registered datastores
aci admin datastores list

# Validate datastore health
aci admin datastores validate <name>

# Show machine status for datastore
aci admin datastores machines <name>

# Show backup information
aci admin datastores backup-info

# Register new datastore
aci admin datastores register <name> --type enterprise --host db.company.com --port 5432 --database gis --username gis_user --password mypass

# Update datastore configuration
aci admin datastores update <name> --host newdb.company.com --port 5433

# Unregister datastore
aci admin datastores unregister <name>
```

### Portal Management

```bash
# User operations
aci users find "admin*"
aci users get jsmith
aci users list

# Group operations
aci groups find "gis*"
aci groups create "Dev Team" --access private
aci groups get group-id

# Item operations
aci items find "transportation"
aci items get item-id
aci items share item-id --groups group1,group2
```

### Analytics and Insights

```bash
# Authentication failure analysis
aci insights auth-failures --days 7

# Service health trends
aci insights service-health --service "MyService"

# Command execution patterns
aci insights command-trends --top 10

# Advanced template analysis
aci analyze template auth-correlation
aci analyze sql "SELECT * FROM audit_logs LIMIT 10"
aci analyze schema
```

### Terminal UI Mode

```bash
# Launch interactive TUI
aci --tui

# Test available themes
aci theme-test
```

### Admin Session Management

```bash
# Logout from admin session
aci admin logout

# Check current admin session
aci admin status
```

## Environment Management

The CLI supports multiple environments through the `.acirc` configuration file and environment variables.

### Environment Configuration

Set default environment:
```bash
export ACI_ENV=recette
```

Override environment per command:
```bash
aci login --env prod --token YOUR_TOKEN
aci query https://service-url --env qualif
```

List available environments:
```bash
aci status
```

## Authentication Patterns

### Enterprise Portals

For ArcGIS Enterprise portals, use token-based authentication:

```bash
# Direct token authentication
aci login --portal https://your-portal.com/arcgis/sharing/rest --token YOUR_API_TOKEN

# With environment configuration
aci login --env prod --token YOUR_API_TOKEN
```

### Federated Services

The CLI automatically handles federated authentication between Portal and ArcGIS Server:

```bash
# Login to portal
aci login --env recette --token PORTAL_TOKEN

# Query federated server (automatic token exchange)
aci query https://your-server.com/arcgis/rest/services/Service/FeatureServer/0
```

## Configuration

### `.acirc` File Format

```ini
[environment-name]
portal=https://portal-url/arcgis/sharing/rest
auth_type=token

[another-env]
portal=https://another-portal.com/portal/sharing/rest
auth_type=token
```

### Environment Variables

- `ACI_ENV`: Default environment name
- `ARCGIS_CA_BUNDLE`: Path to custom CA certificate bundle

## Examples

### Basic Workflow

```bash
# Configure environment
aci login --env recette --token YOUR_TOKEN

# Find services
aci search "parcels"

# Inspect service
aci inspect https://server.com/arcgis/rest/services/Cadastre/Parcels/FeatureServer

# Query specific layer
aci query https://server.com/arcgis/rest/services/Cadastre/Parcels/FeatureServer/0 \
  --where "AREA > 1000" \
  --limit 5 \
  --fields "PARCEL_ID,AREA,OWNER"
```

### Multi-Environment Development

```bash
# Test in development
aci login --env qualif --token DEV_TOKEN
aci query https://service-url --env qualif

# Deploy to production
aci login --env prod --token PROD_TOKEN
aci query https://service-url --env prod
```

### Enterprise Datastore Management

```bash
# Complete datastore workflow
aci admin login --server https://server.com/arcgis/admin --username admin
aci admin datastores list
aci admin datastores validate problematic-datastore
aci admin datastores machines problematic-datastore

# Bulk datastore health check
for store in $(aci admin datastores list --format json | jq -r '.[].name'); do
  echo "Checking $store..."
  aci admin datastores validate "$store"
done

# Register new enterprise database
aci admin datastores register mydb \
  --type enterprise \
  --host postgres.company.com \
  --port 5432 \
  --database gis_production \
  --username gis_user \
  --password secure_password
```

## Error Handling

The CLI provides detailed error messages and recovery suggestions:

```bash
# Authentication errors
aci login --portal invalid-url --token bad-token
# → Provides specific guidance on URL format and token validation

# Service errors
aci query https://inaccessible-service.com/FeatureServer/0
# → Suggests checking network connectivity and service availability

# Federation errors
aci query https://non-federated-server.com/FeatureServer/0
# → Explains federation requirements and provides alternatives
```

## Development

### Version Control

This project uses **Jujutsu (jj)** as the primary version control system, backed by Git for remote repository support.

#### Jujutsu Setup
```bash
# Clone with jj (if repository exists remotely)
jj git clone <repository-url>

# Or initialize jj in existing directory
jj git init --git-repo .
```

#### Basic Jujutsu Workflow
```bash
# Check status
jj status

# Create new change
jj commit -m "Your commit message"

# Update working copy description
jj describe -m "Work in progress: implementing feature"

# Push to Git remote (when ready)
jj git push

# Pull from Git remote
jj git fetch && jj rebase

# View change history
jj log
```

#### Why Jujutsu?
- **Conflict-free branching**: No merge conflicts during development
- **Automatic backups**: Every change is automatically tracked
- **Git compatibility**: Full interoperability with Git workflows
- **Simplified rebasing**: Easier history management and collaboration

For more information, see the [Jujutsu documentation](https://github.com/martinvonz/jj).

### Build Commands

```bash
bun run dev              # Run CLI in development mode
bun run typecheck        # TypeScript compilation check
bun run build           # Build for production
```

### Project Structure

```
src/
├── cli.ts                     # Entry point and Commander setup
├── session.ts                 # Session management and environment config
├── commands/                  # Command implementations
│   ├── admin.ts              # Admin operations and command registration
│   ├── auth.ts               # Login/logout/status commands
│   ├── datastores.ts         # Datastore management commands
│   ├── groups.ts             # Group operations
│   ├── items.ts              # Item operations
│   ├── users.ts              # User operations
│   ├── insights.ts           # Analytics and insights
│   ├── query.ts              # Feature querying
│   ├── inspect.ts            # Service metadata inspection
│   └── register.ts           # Command registration
├── services/                  # Core services
│   ├── admin-client.ts       # ArcGIS Server admin client
│   ├── arcgis-client.ts      # ArcGIS API client wrappers
│   ├── federation.ts         # Token federation and caching
│   └── validator.ts          # URL validation and service detection
├── tui/                       # Terminal UI implementation
│   ├── app.tsx               # Main TUI application
│   ├── components/           # TUI components
│   ├── themes/               # Theme definitions
│   └── hooks/                # React hooks for TUI
├── types/                     # TypeScript type definitions
│   ├── datastore.ts          # Datastore types
│   └── ...                   # Other type definitions
└── utils/                     # Utilities
    ├── database.ts           # SQLite database wrapper
    ├── output.ts             # Formatting and display
    └── interactive.ts        # User prompts and TTY detection
```

## Troubleshooting

### Common Issues

**Authentication Failures**
- Verify portal URL format includes `/sharing/rest`
- Check token expiration and permissions
- Ensure network connectivity to portal

**Service Access Issues**
- Confirm service URL is accessible
- Check if service requires authentication
- Verify federation configuration for cross-domain access

**Environment Configuration**
- Validate `.acirc` file format
- Check environment name spelling
- Ensure portal URLs are complete and accessible

**Datastore Issues**
- Use `aci admin datastores list` to verify datastore registration
- Check if databases have changed (server moves, credential rotation)
- Validate datastore health with `aci admin datastores validate <name>`
- Unhealthy datastores may need revalidation after infrastructure changes
- For registration issues, ensure database connectivity from ArcGIS Server

**Admin Session Issues**
- Ensure admin session persistence with `aci admin status`
- Re-login if session expired: `aci admin login --server <url> --username <user>`
- Check server URL format: `https://server.com/arcgis/admin`

### Debug Mode

Enable detailed logging:
```bash
aci query https://service-url --debug
```

## License

Private - Paris La Défense Internal Tool

## Contributing

This tool is developed for internal use at Paris La Défense. For questions or issues, contact the GIS team.
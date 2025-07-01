# ACI Command Reference

**Version**: 0.1.0  
**Tool**: ArcGIS Command Line Interface (ACI)  
**Last Updated**: July 2025

---

## Table of Contents

- [Overview](#overview)
- [Global Options](#global-options)
- [Authentication Commands](#authentication-commands)
- [Service Operations](#service-operations)
- [Admin Commands](#admin-commands)
- [Data Store Operations](#data-store-operations)
- [Configuration](#configuration)
- [Environment Management](#environment-management)
- [Examples](#examples)
- [Error Handling](#error-handling)

---

## Overview

ACI is a TypeScript-based command-line interface for interacting with the ArcGIS ecosystem, designed for enterprise workflows and GIS professionals. All commands support multi-environment configurations and secure token management.

### Basic Usage Pattern

```bash
aci <command> [arguments] [options]
aci --help                    # Show all commands
aci <command> --help          # Show command-specific help
```

---

## Global Options

Available across all commands:

| Option | Description | Example |
|--------|-------------|---------|
| `--help` | Show help for command | `aci query --help` |
| `--version` | Show ACI version | `aci --version` |
| `-e, --env <environment>` | Use specific environment | `aci login --env prod` |

---

## Authentication Commands

### `aci login`

Authenticate with ArcGIS portal using token or username/password.

**Usage:**
```bash
aci login [options]
```

**Options:**
| Option | Alias | Description | Required | Example |
|--------|-------|-------------|----------|---------|
| `--token <token>` | `-t` | API token for authentication (enterprise preferred) | * | `--token eyJ0eXAi...` |
| `--username <username>` | `-u` | Username for authentication | * | `--username jsmith` |
| `--portal <url>` | `-p` | Portal URL (required for enterprise) | Yes | `--portal https://portal.company.com/arcgis/sharing/rest` |
| `--env <environment>` | `-e` | Target environment (dev/qa/prod) | No | `--env prod` |

*\* Either --token or --username is required*

**Examples:**
```bash
# Enterprise token authentication (recommended)
aci login --portal https://rsig.parisladefense.com/arcgis/sharing/rest --token YOUR_API_TOKEN

# Username/password authentication
aci login --portal https://rsig.parisladefense.com/arcgis/sharing/rest --username jsmith

# Environment-specific login
aci login --env recette --token YOUR_TOKEN

# Using configured environment
aci login --env prod --username admin
```

**Notes:**
- Token-based authentication is preferred for enterprise environments
- Portal URL must include the full sharing/rest path
- Sessions are stored securely in system keychain
- Token expiration is automatically handled with 2-minute safety buffer

---

### `aci logout`

Clear authentication session from secure storage.

**Usage:**
```bash
aci logout [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Target environment to logout from | `--env prod` |
| `--all` | Logout from all environments | `--all` |

**Examples:**
```bash
# Logout from default environment
aci logout

# Logout from specific environment
aci logout --env recette

# Logout from all environments
aci logout --all
```

---

### `aci status`

Show authentication status and environment information.

**Usage:**
```bash
aci status
```

**Output includes:**
- Current authentication status
- Active environment
- Portal URL
- Username (if available)
- Token expiration time
- Available environments from `.acirc`

**Example:**
```bash
$ aci status
Authentication Status:
  Environment: recette
  Portal: https://rsig.parisladefense.com/arcgis/sharing/rest
  User: jsmith
  Expires: 2025-07-01T14:30:00Z

Available Environments:
  qualif -> https://qsig.parisladefense.com/arcgis/sharing/rest
  recette -> https://rsig.parisladefense.com/arcgis/sharing/rest
  prod -> https://sig.parisladefense.com/arcgis/sharing/rest
```

---

## Service Operations

### `aci search`

Search for portal items using keywords and filters.

**Usage:**
```bash
aci search <query> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<query>` | Search query string | `"zoning"` |

**Options:**
| Option | Alias | Description | Default | Example |
|--------|-------|-------------|---------|---------|
| `--type <type>` | `-t` | Filter by item type | All types | `--type "Feature Service"` |
| `--owner <owner>` | `-o` | Filter by owner username | All owners | `--owner jsmith` |
| `--limit <number>` | `-l` | Maximum number of results | 10 | `--limit 25` |
| `--json` | | Output raw JSON | Table format | `--json` |
| `--env <environment>` | `-e` | Use specific environment | Default | `--env prod` |

**Examples:**
```bash
# Basic search
aci search "parcels"

# Search with type filter
aci search "zoning" --type "Feature Service"

# Search with owner filter
aci search "planning" --owner cityplanner --limit 5

# JSON output
aci search "buildings" --json

# Environment-specific search
aci search "infrastructure" --env prod
```

**Common Item Types:**
- `"Feature Service"`
- `"Map Service"`
- `"Web Map"`
- `"Web App"`
- `"Image Service"`
- `"Vector Tile Service"`

---

### `aci inspect`

Inspect detailed metadata for services, layers, or portal items.

**Usage:**
```bash
aci inspect <url> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<url>` | Service URL or item ID to inspect | `https://server.com/arcgis/rest/services/Planning/Zoning/FeatureServer` |

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--json` | Output raw JSON | `--json` |
| `--fields` | Show detailed field schema | `--fields` |
| `--env <environment>` | Use specific environment | `--env recette` |

**Supported URL Types:**
- Feature Server: `https://server.com/arcgis/rest/services/Folder/Service/FeatureServer`
- Map Server: `https://server.com/arcgis/rest/services/Folder/Service/MapServer`
- Individual Layers: `https://server.com/arcgis/rest/services/Service/FeatureServer/0`
- Portal Items: Item IDs or portal URLs

**Examples:**
```bash
# Inspect feature service
aci inspect https://rsig.parisladefense.com/arcgis/rest/services/PLANNING/ZONING/FeatureServer

# Inspect specific layer
aci inspect https://rsig.parisladefense.com/arcgis/rest/services/PLANNING/ZONING/FeatureServer/0

# Show field details
aci inspect https://server.com/arcgis/rest/services/Service/FeatureServer/1 --fields

# JSON output for processing
aci inspect https://server.com/arcgis/rest/services/Service/FeatureServer --json

# Using specific environment
aci inspect https://service-url --env qualif
```

**Output includes:**
- Service/layer name and description
- Geometry type and spatial reference
- Field schema (with --fields)
- Capabilities and supported operations
- Record count and extent
- Relationships and attachments info

---

### `aci query`

Query features from a feature service with SQL filtering.

**Usage:**
```bash
aci query <url> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<url>` | Feature service URL to query | `https://server.com/arcgis/rest/services/Service/FeatureServer/0` |

**Options:**
| Option | Alias | Description | Default | Example |
|--------|-------|-------------|---------|---------|
| `--where <clause>` | `-w` | SQL WHERE clause | `1=1` | `--where "STATUS='Active'"` |
| `--limit <number>` | `-l` | Maximum number of features | 10 | `--limit 100` |
| `--fields <fields>` | | Comma-separated field names | All fields | `--fields "NAME,STATUS,AREA"` |
| `--json` | | Output raw JSON | Table format | `--json` |
| `--geojson` | | Output as GeoJSON | Table format | `--geojson` |
| `--env <environment>` | `-e` | Use specific environment | Default | `--env prod` |

**Examples:**
```bash
# Basic query (first 10 features)
aci query https://server.com/arcgis/rest/services/Planning/Parcels/FeatureServer/0

# Query with WHERE clause
aci query https://server.com/arcgis/rest/services/Planning/Parcels/FeatureServer/0 \
  --where "AREA > 1000 AND STATUS = 'Active'"

# Query specific fields only
aci query https://server.com/arcgis/rest/services/Planning/Parcels/FeatureServer/0 \
  --fields "PARCEL_ID,OWNER,AREA" --limit 50

# Export as GeoJSON
aci query https://server.com/arcgis/rest/services/Planning/Parcels/FeatureServer/0 \
  --where "ZONE_TYPE = 'Residential'" --geojson

# Complex query with environment
aci query https://service-url/FeatureServer/0 \
  --where "DATE_CREATED >= '2025-01-01' AND STATUS IN ('Active', 'Pending')" \
  --limit 200 --env prod
```

**SQL WHERE Clause Examples:**
```sql
-- Text comparison
"STATUS = 'Active'"
"ZONE_TYPE IN ('Residential', 'Commercial')"
"OWNER LIKE '%SMITH%'"

-- Numeric comparison  
"AREA > 1000"
"POPULATION BETWEEN 1000 AND 5000"

-- Date comparison
"DATE_CREATED >= '2025-01-01'"
"LAST_UPDATE > '2024-12-31 23:59:59'"

-- Spatial queries (if supported)
"OBJECTID IN (1,2,3,4,5)"

-- Complex conditions
"(STATUS = 'Active' OR STATUS = 'Pending') AND AREA > 500"
```

---

## Admin Commands

Administrative operations for ArcGIS Server management. All admin commands require prior authentication with admin privileges.

### `aci admin login`

Authenticate for server administration operations.

**Usage:**
```bash
aci admin login [options]
```

**Options:**
| Option | Description | Required | Example |
|--------|-------------|----------|---------|
| `--token <token>` | Admin API token | * | `--token eyJ0eXAi...` |
| `--username <username>` | Admin username | * | `--username admin` |
| `--server <url>` | ArcGIS Server admin URL | Yes | `--server https://server.com:6443/arcgis/admin` |
| `--env <environment>` | Target environment | No | `--env prod` |

*\* Either --token or --username is required*

**Examples:**
```bash
# Token-based admin authentication
aci admin login --server https://rsig.parisladefense.com:6443/arcgis/admin --token ADMIN_TOKEN

# Username/password admin authentication  
aci admin login --server https://rsig.parisladefense.com:6443/arcgis/admin --username admin

# Environment-specific admin login
aci admin login --env recette --token ADMIN_TOKEN
```

**Notes:**
- Admin sessions have shorter TTL (30 minutes default)
- HTTPS is enforced for all admin operations
- Admin tokens require elevated privileges on the server

---

### `aci admin logout`

Clear admin authentication session.

**Usage:**
```bash
aci admin logout [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Environment to logout from | `--env prod` |

**Examples:**
```bash
# Logout from default admin session
aci admin logout

# Logout from specific environment
aci admin logout --env recette
```

---

### `aci admin status`

Show admin session status and server information.

**Usage:**
```bash
aci admin status [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Environment to check | `--env prod` |

**Example Output:**
```bash
$ aci admin status
Admin Session:
  Environment: recette
  Server: https://rsig.parisladefense.com:6443/arcgis/admin
  User: admin
  Expires in: 25 minutes
```

---

### `aci admin services`

Manage ArcGIS Server services lifecycle.

#### `aci admin services list`

List all services with status information.

**Usage:**
```bash
aci admin services list [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--folder <name>` | Filter by folder name | `--folder Planning` |
| `--status <status>` | Filter by service status | `--status STARTED` |
| `--env <environment>` | Use specific environment | `--env prod` |

**Status Values:**
- `STARTED` - Service is running
- `STOPPED` - Service is stopped
- `STARTING` - Service is starting up
- `STOPPING` - Service is shutting down

**Examples:**
```bash
# List all services
aci admin services list

# List services in specific folder
aci admin services list --folder Planning

# List only running services
aci admin services list --status STARTED

# List stopped services in specific environment
aci admin services list --status STOPPED --env prod
```

---

#### `aci admin services status <name>`

Get detailed status for a specific service.

**Usage:**
```bash
aci admin services status <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Service name (folder/service or service) | `Planning/Zoning` |

**Examples:**
```bash
# Check service status
aci admin services status MyService

# Check service in folder
aci admin services status Planning/Zoning

# Check service in specific environment
aci admin services status MyService --env recette
```

---

#### `aci admin services start <name>`

Start a stopped service.

**Usage:**
```bash
aci admin services start <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Service name to start | `Planning/Zoning` |

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--wait` | Wait for service to start completely | `--wait` |
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Start service (async)
aci admin services start MyService

# Start service and wait for completion
aci admin services start MyService --wait

# Start service in folder
aci admin services start Planning/Zoning --wait

# Start service in specific environment
aci admin services start MyService --wait --env recette
```

---

#### `aci admin services stop <name>`

Stop a running service.

**Usage:**
```bash
aci admin services stop <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Service name to stop | `Planning/Zoning` |

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--wait` | Wait for service to stop completely | `--wait` |
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Stop service (async)
aci admin services stop MyService

# Stop service and wait for completion
aci admin services stop MyService --wait

# Stop service in folder
aci admin services stop Planning/Zoning --wait
```

---

#### `aci admin services restart <name>`

Restart a service (stop then start).

**Usage:**
```bash
aci admin services restart <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Service name to restart | `Planning/Zoning` |

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--wait` | Wait for restart to complete | `--wait` |
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Restart service (always waits)
aci admin services restart MyService

# Restart service in folder
aci admin services restart Planning/Zoning

# Restart service in specific environment
aci admin services restart MyService --env recette
```

---

### `aci admin logs`

Manage server logs and diagnostics.

#### `aci admin logs view`

View recent server log entries.

**Usage:**
```bash
aci admin logs view [options]
```

**Options:**
| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--tail <n>` | Number of recent log entries | 100 | `--tail 50` |
| `--level <level>` | Log level filter | All levels | `--level WARNING` |
| `--env <environment>` | Use specific environment | Default | `--env prod` |

**Log Levels:**
- `SEVERE` - Critical errors
- `WARNING` - Warning messages  
- `INFO` - Informational messages
- `FINE` - Debug information

**Examples:**
```bash
# View last 100 log entries
aci admin logs view

# View last 50 entries
aci admin logs view --tail 50

# View only warnings and errors
aci admin logs view --level WARNING

# View logs in specific environment
aci admin logs view --tail 200 --env prod
```

---

#### `aci admin logs export`

Export server logs (simplified implementation).

**Usage:**
```bash
aci admin logs export [options]
```

**Options:**
| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--days <n>` | Number of days to export | 7 | `--days 3` |
| `--format <format>` | Export format | json | `--format csv` |
| `--env <environment>` | Use specific environment | Default | `--env prod` |

**Examples:**
```bash
# Export recent logs
aci admin logs export

# Export last 3 days
aci admin logs export --days 3

# Export in CSV format  
aci admin logs export --format csv
```

**Note:** Current implementation exports last 1000 log entries regardless of days parameter.

---

### `aci admin health`

Perform basic server health check.

**Usage:**
```bash
aci admin health [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--detailed` | Show detailed health information | `--detailed` |
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Basic health check
aci admin health

# Detailed health information
aci admin health --detailed

# Health check for specific environment
aci admin health --env recette
```

**Example Output:**
```bash
$ aci admin health
Checking server status...
Server Status:
  Total Services: 15
  Running Services: 12
  Server: ✓ Healthy
```

---

## Data Store Operations

Enterprise data store management operations for comprehensive infrastructure monitoring and maintenance.

### `aci admin datastores list`

List all registered data stores with status information.

**Usage:**
```bash
aci admin datastores list [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# List all data stores
aci admin datastores list

# List data stores in specific environment
aci admin datastores list --env recette
```

**Example Output:**
```bash
$ aci admin datastores list
NAME                 TYPE        STATUS              MACHINES
===============================================================
ProductionDB         ENTERPRISE  ✓ Healthy          2 machine(s)
CloudStorage         CLOUD       ⚠ With Warnings    1 machine(s)
TileCache            TILECACHE   ✓ Healthy          3 machine(s)
SpatialAnalytics     SPATIOTEMPORAL ✓ Healthy       4 machine(s)

Total: 4 data store(s)
```

---

### `aci admin datastores validate <name>`

Validate health of a specific data store with comprehensive diagnostics.

**Usage:**
```bash
aci admin datastores validate <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Data store name to validate | `ProductionDB` |

**Options:**
| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--detailed` | Show detailed health information | Basic view | `--detailed` |
| `--timeout <seconds>` | Validation timeout in seconds | 30 | `--timeout 60` |
| `--env <environment>` | Use specific environment | Default | `--env prod` |

**Examples:**
```bash
# Basic validation
aci admin datastores validate ProductionDB

# Detailed validation with extended timeout
aci admin datastores validate CloudStorage --detailed --timeout 60

# Validate in specific environment
aci admin datastores validate TileCache --env recette
```

**Basic Output:**
```bash
$ aci admin datastores validate ProductionDB
Validating data store: ProductionDB...
DataStore: ProductionDB [enterprise]
Status: ✓ Healthy
Last Validated: 2025-07-01T15:30:22Z (recent)
Machines: 2
```

**Detailed Output:**
```bash
$ aci admin datastores validate ProductionDB --detailed
Validating data store: ProductionDB...
DataStore: ProductionDB [enterprise]
==================================================
Status: ✓ Healthy
Overall Health: Healthy
Last Validated: 2025-07-01T15:30:22Z (recent)

Machines:
  primary-db.company.com [PRIMARY    ] ✓ Healthy | DB: Active | Disk: 45%
  standby-db.company.com [STANDBY    ] ✓ Healthy | Repl: InSync | Disk: 32%

Recommendations:
💡 Consider monitoring disk usage on primary machine
💡 Verify backup schedule is current
```

---

### `aci admin datastores machines <name>`

Show machine status for a specific data store.

**Usage:**
```bash
aci admin datastores machines <name> [options]
```

**Arguments:**
| Argument | Description | Example |
|----------|-------------|---------|
| `<name>` | Data store name | `ProductionDB` |

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Show machines for data store
aci admin datastores machines ProductionDB

# Show machines in specific environment
aci admin datastores machines CloudStorage --env recette
```

**Example Output:**
```bash
$ aci admin datastores machines ProductionDB
Retrieving machine information for: ProductionDB...
Machines for DataStore: ProductionDB
====================================

MACHINE                  ROLE        STATUS              DETAILS
----------------------------------------------------------------------
primary-db.company.com   PRIMARY     ✓ Healthy          DB: Active | Repl: InSync
standby-db.company.com   STANDBY     ✓ Healthy          DB: Active | Repl: InSync
```

---

### `aci admin datastores backup-info`

Show backup status across all data stores.

**Usage:**
```bash
aci admin datastores backup-info [options]
```

**Options:**
| Option | Description | Example |
|--------|-------------|---------|
| `--env <environment>` | Use specific environment | `--env prod` |

**Examples:**
```bash
# Show backup information
aci admin datastores backup-info

# Show backup info for specific environment
aci admin datastores backup-info --env prod
```

**Example Output:**
```bash
$ aci admin datastores backup-info
Retrieving backup information...
Backup Status
==============================
Last Full Backup: 2025-07-01T02:00:00Z (13 hours ago)
Last Incremental: 2025-07-01T14:00:00Z (1 hour ago)
Last Restore: 2025-06-30T09:45:12Z (2 days ago)
Backup Mode: 🔄 Active

Available Backups: 5
  ✓ backup_20250701_020000 - 2025-07-01T02:00:00Z (2.3 GB)
  ✓ backup_20250630_020000 - 2025-06-30T02:00:00Z (2.1 GB)
  ✓ backup_20250629_020000 - 2025-06-29T02:00:00Z (2.0 GB)
```

---

## Configuration

### Environment Configuration File (`.acirc`)

ACI supports multi-environment configurations through a `.acirc` file in your home directory.

**Location:** `~/.acirc`

**Format:** INI-style configuration

**Example:**
```ini
[qualif]
portal=https://qsig.parisladefense.com/arcgis/sharing/rest
server_admin=https://qsig.parisladefense.com:6443/arcgis/admin
auth_type=token
admin_timeout=1800

[recette]
portal=https://rsig.parisladefense.com/arcgis/sharing/rest
server_admin=https://rsig.parisladefense.com:6443/arcgis/admin
auth_type=token
admin_timeout=1800

[prod]
portal=https://sig.parisladefense.com/arcgis/sharing/rest
server_admin=https://sig.parisladefense.com:6443/arcgis/admin
auth_type=certificate
admin_cert_path=/etc/ssl/certs/admin.p12
admin_timeout=3600
```

**Configuration Options:**

| Option | Description | Required | Example |
|--------|-------------|----------|---------|
| `portal` | Portal sharing/rest URL | Yes | `https://portal.com/arcgis/sharing/rest` |
| `server_admin` | ArcGIS Server admin URL | No | `https://server.com:6443/arcgis/admin` |
| `auth_type` | Authentication type | No | `token`, `oauth`, `certificate` |
| `admin_timeout` | Admin session timeout (seconds) | No | `1800` (30 minutes) |
| `admin_cert_path` | Client certificate path | No | `/path/to/cert.p12` |

---

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `ACI_ENV` | Default environment name | `default` | `export ACI_ENV=recette` |
| `ARCGIS_CA_BUNDLE` | Custom CA certificate bundle | System default | `/etc/ssl/certs/ca-bundle.crt` |

---

## Environment Management

### Default Environment

Set default environment for all commands:
```bash
export ACI_ENV=recette
```

### Per-Command Environment

Override environment for specific commands:
```bash
aci login --env prod --token YOUR_TOKEN
aci query https://service-url --env qualif
aci admin services list --env recette
```

### Environment Status

Check current environment configuration:
```bash
aci status
```

---

## Examples

### Complete Workflow Examples

#### Basic Service Discovery
```bash
# Authenticate
aci login --env recette --token YOUR_TOKEN

# Search for services
aci search "zoning"

# Inspect service details
aci inspect https://rsig.parisladefense.com/arcgis/rest/services/PLANNING/ZONING/FeatureServer

# Query features
aci query https://rsig.parisladefense.com/arcgis/rest/services/PLANNING/ZONING/FeatureServer/0 \
  --where "STATUS = 'Active'" --limit 5
```

#### Multi-Environment Development
```bash
# Work in development
aci login --env qualif --token DEV_TOKEN
aci query https://service-url --env qualif

# Test in staging
aci login --env recette --token STAGING_TOKEN  
aci query https://service-url --env recette

# Deploy to production
aci login --env prod --token PROD_TOKEN
aci query https://service-url --env prod
```

#### Admin Operations
```bash
# Admin authentication
aci admin login --env recette --token ADMIN_TOKEN

# Check server health
aci admin health --detailed

# List all services
aci admin services list

# Restart problematic service
aci admin services restart Planning/Zoning --wait

# Check service status
aci admin services status Planning/Zoning

# View recent logs
aci admin logs view --tail 100 --level WARNING
```

#### Data Export Workflow
```bash
# Authenticate
aci login --env prod --token YOUR_TOKEN

# Find the service
aci search "parcels" --type "Feature Service"

# Inspect to understand schema
aci inspect https://server.com/arcgis/rest/services/Cadastre/Parcels/FeatureServer/0 --fields

# Export data as GeoJSON
aci query https://server.com/arcgis/rest/services/Cadastre/Parcels/FeatureServer/0 \
  --where "LAST_UPDATE >= '2025-01-01'" \
  --fields "PARCEL_ID,OWNER,AREA,GEOMETRY" \
  --geojson > parcels_2025.geojson
```

---

## Error Handling

### Common Error Types

#### Authentication Errors
```bash
# Token expired
Error: Authentication failed - token expired
Solution: Re-authenticate with aci login

# Invalid portal URL
Error: Portal URL must include /sharing/rest path
Solution: Use full portal URL: https://portal.com/arcgis/sharing/rest
```

#### Network Errors
```bash
# Connection timeout
Error: Network timeout connecting to server
Solution: Check network connectivity and firewall settings

# SSL certificate issues
Error: SSL certificate verification failed
Solution: Set ARCGIS_CA_BUNDLE environment variable or use --insecure flag
```

#### Service Errors
```bash
# Service not found
Error: Service not accessible or does not exist
Solution: Verify service URL and authentication permissions

# Query syntax error
Error: Invalid WHERE clause syntax
Solution: Check SQL syntax, use single quotes for strings
```

#### Admin Errors
```bash
# Insufficient privileges
Error: Operation requires administrative privileges
Solution: Authenticate with admin account using aci admin login

# Service operation timeout
Error: Service failed to start within timeout period
Solution: Use --wait flag and check service configuration
```

### Debug Mode

Enable detailed error information by setting environment variable:
```bash
export DEBUG=aci:*
aci query https://service-url --where "invalid syntax"
```

### Error Recovery

Most commands include automated error recovery:
- Expired tokens trigger re-authentication prompts
- Network errors include retry suggestions
- Invalid syntax errors show corrected examples
- Service timeouts provide status check commands

---

## Version Information

**Current Version:** 0.1.0  
**Node.js Requirements:** >= 18.0.0  
**Dependencies:** Commander.js, @esri/arcgis-rest-*, keytar  
**Version Control:** Jujutsu (jj) backed by Git

### Getting Help

```bash
# General help
aci --help

# Command-specific help
aci login --help
aci query --help
aci admin services --help

# Version information
aci --version
```

For issues or questions, contact the GIS team or check the project documentation in the `docs/` directory.
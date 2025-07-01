# ArcGIS CLI Tool Design

## Overview
A TypeScript-based CLI tool for interacting with the ArcGIS ecosystem, focusing on inspection, querying, and basic administration tasks.

## Core Architecture

### Command Structure
```bash
arcgis <command> <subcommand> [options]
```

### Core Commands (Refined with DeepSeek Insights)

#### **auth** - Authentication management
```bash
arcgis auth login                    # Interactive OAuth login
arcgis auth login --username USER    # Username/password login
arcgis auth status                   # Show current session
arcgis auth logout                   # Clear session
arcgis auth token                    # Display current token
```

#### **env** - Environment management (NEW)
```bash
arcgis env list                      # Show all configured environments
arcgis env add prod https://org.maps.arcgis.com
arcgis env switch dev                # Switch active environment
arcgis env remove staging            # Remove environment
```

#### **portal** - Portal/item operations (ENHANCED)
```bash
arcgis portal search "parks"         # Search items
arcgis portal find --owner "@transport_team" --type "Feature Service"
arcgis portal item <id|url>          # Get item details (accepts URLs)
arcgis portal user <username>        # User info
arcgis portal groups                 # List my groups
arcgis portal content                # List my content
```

#### **map** - Web map inspection (ENHANCED)
```bash
arcgis map <id|url>                  # Show map overview (accepts URLs)
arcgis map resolve <url> --compact   # Quick URL resolution
arcgis map schema <id> --layer 0     # Layer schema details
arcgis layers last                   # Reference last used map
```

#### **service** - Feature service operations (ENHANCED)
```bash
arcgis service <id|url>              # Service info (unified resolution)
arcgis service fields <id> --layer 0 # Show field schema
arcgis query <id|url> --where "population > 100000" --geo output.geojson
```

#### **admin** - MOVED TO SEPARATE CLI
```bash
# Now in arcgis-admin tool for security isolation
arcgis-admin services --status stopped
arcgis-admin service <name> restart --confirm
arcgis-admin logs tail --level ERROR
```

## Key Design Decisions

### What to Expose:
- Common read operations (search, inspect, query)
- Authentication workflows
- Basic admin tasks for power users
- Export capabilities for data extraction

### What to Hide:
- Complex editing operations (better in UI)
- Low-level REST details
- Service creation/deletion (too dangerous)
- Complex spatial operations

## Implementation Structure (Updated with DeepSeek Insights)

```
arcgis-cli/
├── src/
│   ├── commands/
│   │   ├── auth/
│   │   ├── portal/
│   │   ├── map/
│   │   ├── service/
│   │   └── env/             # NEW: Environment management
│   ├── lib/
│   │   ├── session.ts       # Multi-env session with federation
│   │   ├── resolver.ts      # NEW: Unified ID/URL resolution
│   │   ├── query-builder.ts # NEW: Context-aware query parsing
│   │   ├── output.ts        # Formatting/display
│   │   ├── interactive.ts   # Interactive prompts
│   │   ├── context.ts       # NEW: Command context memory
│   │   └── config.ts        # Configuration
│   └── index.ts
├── arcgis-admin/            # NEW: Separate admin CLI
│   └── src/
├── package.json
└── tsconfig.json
```

## Key Features

### Smart Output Formatting
- Default: Human-readable tables/summaries
- `--json`: Raw JSON for scripting
- `--csv`: CSV export for data
- Color coding for different item types

### Interactive Features
- Query builder for complex WHERE clauses
- Service/layer picker when multiple options
- Authentication flow guidance

### Session Persistence
- Save auth tokens securely
- Remember last portal URL
- Quick switch between environments

### Aliases & Shortcuts
```bash
arcgis search "parks"        # Alias for portal search
arcgis ls                    # Alias for portal content
arcgis query <service-url>   # Alias for service query
```

## Example Workflows

```bash
# Find and inspect a web map
arcgis search "traffic" --type "Web Map"
arcgis map abc123def
arcgis map abc123def layers

# Query feature service
arcgis service https://services.arcgis.com/.../FeatureServer/0
arcgis query https://services.arcgis.com/.../FeatureServer/0 \
  --where "population > 50000" \
  --outfields "name,population" \
  --limit 10

# Quick admin check
arcgis admin services --status stopped
arcgis admin logs --since "1 hour ago"
```

## Technologies
- **CLI Framework**: Commander.js or Yargs
- **Auth Storage**: Keytar (cross-platform secure storage)
- **Output**: Chalk (colors), cli-table3 (tables)
- **Interactivity**: Inquirer.js
- **ArcGIS SDK**: @esri/arcgis-rest-* packages

## DeepSeek Consultation Results

### Accepted Recommendations (To Be Implemented)

1. **Unified Resource Resolution**
   - ✅ Accept both IDs and URLs in all commands
   - ✅ Implement `lib/resolver.ts` with pattern matching
   - ✅ Cache resolution results (15-min TTL)
   - ✅ Fallback to portal search for fuzzy matching

2. **Separate Admin Tool**
   - ✅ Move destructive operations to `arcgis-admin` CLI
   - ✅ Require `--confirm` flags for dangerous operations
   - ✅ Implement stricter authentication for admin commands

3. **Environment Management**
   - ✅ Add `arcgis env` command suite
   - ✅ Support multiple concurrent environments
   - ✅ Federated authentication (portal → server tokens)
   - ✅ Secure token storage with keytar

4. **Query Syntax Separation**
   - ✅ Keep Lucene (portal) and SQL (services) distinct
   - ✅ Context-aware parsing in `lib/query-builder.ts`
   - ✅ Interactive query builder for complex queries
   - ✅ Validate SQL syntax before sending to server

5. **Enhanced Error Messages**
   - ✅ Schema-aware error hints
   - ✅ Suggest available fields on mismatches
   - ✅ Include example queries in error output
   - ✅ `--debug` flag for developer details

6. **Context Memory**
   - ✅ `last` keyword to reference previous resources
   - ✅ Store recent command context
   - ✅ `arcgis context` to show recent items

7. **Optimized Output**
   - ✅ `--compact` flag for minimal output
   - ✅ Progressive disclosure with tips
   - ✅ `--pipe` flag for UNIX-style streaming
   - ✅ Smart field selection for common operations

### Key Architectural Improvements

1. **Unified Resource Identifiers**
   - Implement intelligent resolver that accepts both IDs and URLs
   - Pattern matching with fallback to portal search
   - Cache resolution results for performance

2. **Query Syntax Strategy**
   - Keep Lucene (portal) and SQL (services) separate
   - Use domain-specific subcommands with context-aware parsing
   - Interactive query builder for complex queries

3. **Session Management**
   - Multi-environment support with `arcgis env` commands
   - Federated authentication handling (portal → server tokens)
   - Secure token storage with keytar

### Optimized User Flows

#### Web Map Inspection
```bash
# Single command to inspect map from URL
arcgis map resolve "https://arcg.is/abc123" --compact

# Deep schema inspection
arcgis map schema abc123 --layer 0 --fields
```

#### Team Services Audit
```bash
# Find team services with editing status
arcgis portal find --owner "@transport_team" --type "Feature Service" \
                  --fields title,editing --pipe "sort -k editing"
```

#### Data Export
```bash
# Export matching features to GeoJSON
arcgis query "roads_layer" --layer 0 --where "speed_limit > 55" \
          --fields name,speed_zone --geo roads_fast.geojson
```

### Design Decisions (Resolved)

1. **Command naming**: Full names for discoverability
2. **Output defaults**: Minimal summary with `--verbose` option
3. **Admin features**: Separate `arcgis-admin` tool for security
4. **Caching**: 15-minute TTL for metadata
5. **Configuration**: `.arcgisrc` for defaults
6. **Plugins**: Phase 2 feature
7. **Error handling**: Tiered (user-friendly default, `--debug` for developers)
8. **Batch operations**: Essential for DevOps workflows
9. **Export formats**: JSON, CSV, GeoJSON priority
10. **Interactive vs scriptable**: Flags trigger interactivity

### Critical Features to Add

1. **Environment Management**
   ```bash
   arcgis env list
   arcgis env switch production
   ```

2. **Context Memory**
   ```bash
   arcgis map abc123
   arcgis layers last  # References previous map
   ```

3. **Smart Error Messages**
   ```
   ERROR: Field 'speed_zone' not found
   Available fields: [ROAD_NAME, SPEED_LIMIT]
   Hint: Use 'arcgis service fields RoadsFS --layer 0'
   ```

## DeepSeek Round 2: Simplification & Implementation Strategy

### Minimalist Approach (Accepted)

After a second consultation focusing on YAGNI and KISS principles, major simplifications were identified:

#### Refined Command Structure
```bash
# Simplified to 7 core commands
arc login                           # Interactive OAuth only
arc logout                          # Simple session cleanup
arc search "parks"                  # Portal items only
arc users "@transport_team"         # Find users/groups
arc map <id|url>                    # Web map inspection
arc fs <id|url>                     # Feature service inspection
arc query <service-url> --where "pop > 1000"  # Query to GeoJSON
```

#### Eliminated Complexity
- ❌ **Environment management**: Use shell aliases and `.arcgisrc` instead
- ❌ **Unified resolver**: Force explicit URLs/IDs with clear validation
- ❌ **Separate admin CLI**: Integrate with `--yes` confirmation flags
- ❌ **Multiple output formats**: Default to tables, add `--json` flag
- ❌ **Context memory**: Keep only `last` keyword for previous resource

#### 2-Week MVP Scope
**Single critical workflow**: Service schema inspection
```bash
arc login                           # Authenticate
arc search "zoning"                # Find relevant services  
arc fs <service-url>               # Show fields/schema
arc query <layer-url> --limit 10   # Get sample data
```

**Technology Stack Decisions**:
- **CLI Framework**: Commander.js (simpler than Yargs)
- **Build**: tsup (zero-config TypeScript compilation)
- **ArcGIS SDK**: Selective imports to avoid bundle bloat
- **Auth**: keytar + ~/.arcgisrc for token storage

#### Target Pain Point
**Problem**: "I need to check service field schemas before using them in code"

**Current workflow**: 6 browser context switches through AGOL interface
**CLI workflow**: `arc search "address" | arc fs <url>` (single command)

### MVP Implementation Blueprint (10-Day Sprint)

```typescript
// MVP Tech Stack
{
  "cliFramework": "commander.js",    // Simpler API than yargs
  "build": "tsup",                   // Zero-config TS builds
  "auth": "keytar",                  // Secure token storage
  "esriSDK": "selective-imports"     // Avoid bundle bloat
}
```

#### Week 1 Critical Path
```bash
# Day 1-3: Core auth plumbing
arc login                    # OAuth flow → keytar storage

# Day 4-5: Search & inspection  
arc search "zoning"          # Portal item search
arc fs <service-url>         # Show fields/schema

# Day 6-7: Basic querying
arc query <url> --limit 10   # Sample features to JSON

# Day 8-10: Polish & ship
# - JSON formatting with pipes
# - Error handling (network/auth)
# - Single binary build
```

#### Concrete Code Structure
```
src/
├── auth.ts        # keytar-backed session
├── search.ts      # Portal searchItems() wrapper  
├── fs.ts          # Feature service metadata
├── query.ts       # Basic queryFeatures()
└── cli.ts         # Commander entry point
```

## Implementation Examples (From DeepSeek)

### Resource Resolver Implementation
```typescript
// lib/resolver.ts
import { getItem } from '@esri/arcgis-rest-portal';
import { getService } from '@esri/arcgis-rest-feature-service';

enum ResourceType { ITEM, SERVICE, ADMIN_SERVICE }

async function resolveResource(input: string, session: UserSession): Promise<{id: string; type: ResourceType}> {
  // Pattern 1: Already an ID (portal item)
  if (isValidItemId(input)) return { id: input, type: ResourceType.ITEM };
  
  // Pattern 2: Feature Service URL
  if (isFeatureServiceUrl(input)) {
    const serviceId = extractServiceIdFromUrl(input);
    return { id: serviceId, type: ResourceType.SERVICE };
  }
  
  // Pattern 3: Fuzzy search fallback
  const results = await searchItems({
    q: `title:"${input}" OR owner:"${session.username}"`,
    authentication: session
  });
  
  if (results.results[0]?.id) {
    return { id: results.results[0].id, type: ResourceType.ITEM };
  }
  
  throw new Error(`Unable to resolve resource: ${input}`);
}
```

### Session Management with Federation
```typescript
// lib/session.ts
import * as keytar from 'keytar';

class SessionManager {
  async getActiveSession(env: string, authType: 'user' | 'admin') {
    const sessions = await keytar.findCredentials(`arcgis-${env}-*`);
    
    if (authType === 'admin') {
      const adminSession = sessions.find(s => s.account.includes('admin'));
      if (adminSession) return JSON.parse(adminSession.password);
      
      // Federate from portal to server
      return this.federateToServer(await this.getUserSession(env));
    }
    
    return JSON.parse(sessions[0].password);
  }
  
  async federateToServer(userSession: UserSession) {
    const token = await generateAdminToken(
      userSession.token,
      this.getServerUrl()
    );
    
    await keytar.setPassword(
      'arcgis-admin',
      `${this.currentEnv}-admin-token`,
      JSON.stringify({ token, expires: Date.now() + 7200000 })
    );
    
    return token;
  }
}
```

### Query Builder with Context Awareness
```typescript
// lib/query-builder.ts
export function parseQuery(type: 'portal' | 'service', input: string, session: UserSession) {
  const parsers = {
    portal: (query: string) => {
      // Handle special keywords
      if (query.includes('owner:me')) {
        query = query.replace('owner:me', `owner:${session.username}`);
      }
      if (query.includes('@')) {
        // Team syntax: @transport_team → groups:[team-id]
        const teamName = query.match(/@(\w+)/)?.[1];
        if (teamName) {
          const groupId = resolveTeamToGroupId(teamName);
          query = query.replace(`@${teamName}`, `group:${groupId}`);
        }
      }
      return query;
    },
    
    service: (query: string) => {
      // Validate SQL syntax
      try {
        validateSqlWhere(query);
      } catch (e) {
        throw new Error(
          `Invalid SQL WHERE clause: ${e.message}\n` +
          `Example: "population > 100000 AND state = 'CA'"`
        );
      }
      return sanitizeSql(query);
    }
  };
  
  return parsers[type](input);
}
```
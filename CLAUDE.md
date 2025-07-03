# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains a **production-ready ACI (ArcGIS Command Line Interface) tool** - a TypeScript-based command-line interface for interacting with the ArcGIS ecosystem. The repository includes comprehensive design documents, architectural analysis, UML diagrams, and a **fully functional implementation**.

## Key Design Documents

### Core Architecture Documents
- **`arcgis-cli-design.md`** - Primary design document with command structure, implementation strategy, and technology choices
- **`uml-analysis.md`** - Complete UML analysis with use case, sequence, class, component, activity, and state diagrams
- **`arcgis-edge-cases-analysis.md`** - Enterprise-level edge cases and implementation challenges for complex ArcGIS deployments
- **`arcgis-rest-api-guide.md`** - Comprehensive reference for @esri/arcgis-rest-* packages and direct REST API usage

### External Documentation References
- **[ArcGIS REST JS API](https://esri.github.io/arcgis-rest-js/api/)** - Official authentication patterns and UserSession documentation used for enterprise portal authentication implementation

### Ink Documentation (For CLI → TUI Migration)
- **`/docs/quick_ink_reference.md`** - Complete Ink API reference and documentation index
  - This is the **primary entry point** when searching for Ink documentation
  - Contains comprehensive API reference for ink, @inkjs/ui, and ink-table
  - Includes full directory index of all Ink examples and documentation
  - Provides migration patterns from Commander.js to Ink

### Final Architecture (Current Implementation)

The architecture has evolved beyond initial YAGNI principles to include comprehensive enterprise features:

**Command Structure:**
```bash
# Enterprise authentication
aci login --portal https://your-portal.company.com --token YOUR_API_TOKEN
aci login --portal https://your-portal.company.com --username jsmith

# Service operations
aci inspect <url>                   # Metadata inspection  
aci query <url> --where...          # Feature querying with federation
aci search <term>                   # Service search
aci logout                          # Session cleanup

# Portal operations (nested subcommands)
aci users find "admin*"             # User search
aci users get jsmith                # User profile
aci users list                      # List all users
aci groups create "Dev Team"        # Group creation
aci groups find "gis*"              # Group search
aci groups list                     # List all groups
aci items find "transportation"     # Item search
aci items share item123 -g g1,g2    # Item sharing
aci items list                      # List all items

# Enterprise insights & analytics
aci insights auth-failures          # Authentication failure analysis
aci insights service-health         # Service health trends
aci insights command-trends         # Command execution patterns
aci insights resource-trends        # Resource usage analysis

# Advanced analytics
aci analyze template                # Guided template analysis
aci analyze sql                     # Expert SQL console (read-only)
aci analyze schema                  # Database schema inspection

# Datastore management
aci datastores list                 # List data stores
aci datastores validate             # Validate connections
aci datastores health               # Check health status

# Admin operations
aci admin login                     # Server admin authentication
aci admin services                  # Service management
aci admin logs                      # View server logs
aci admin status                    # Server status
aci admin health                    # Health checks

# TUI mode
aci --tui                          # Launch interactive TUI interface
aci theme-test                     # Test TUI themes
```

**Technology Stack:**
- CLI Framework: Commander.js + Ink TUI (fully integrated)
- Build: tsup (zero-config TypeScript)
- Auth: keytar (secure token storage)
- ArcGIS SDK: Selective @esri/arcgis-rest-* imports (including @esri/arcgis-rest-portal)
- TUI Framework: Ink (React for CLIs) with @inkjs/ui components
- Database: SQLite (for audit logs, metrics, and persistence)
- UI Components: chalk-table, strip-ansi, yaml
- Theme System: Base16 color schemes integration

**File Structure (40+ files, ~3000+ LOC):**
```
src/
├── cli.ts                     # Entry point + Commander setup
├── session.ts                 # File-based session + locking
├── error.ts                   # Custom error classes
├── audit/                     # Audit logging system
│   ├── logger.ts              # Audit logger implementation
│   └── types.ts               # Audit types and interfaces
├── commands/
│   ├── admin.ts               # Admin operations
│   ├── analyze.ts             # Analytics commands
│   ├── auth.ts                # login/logout handlers
│   ├── datastores.ts          # Datastore management
│   ├── groups.ts              # Group operations
│   ├── insights.ts            # Enterprise insights
│   ├── inspect.ts             # Metadata inspection
│   ├── items.ts               # Item operations
│   ├── query.ts               # Feature querying
│   ├── register.ts            # Commander command setup
│   ├── search.ts              # Service search
│   ├── theme-test.ts          # TUI theme testing
│   └── users.ts               # User operations
├── errors/
│   ├── handler.ts             # Error boundary
│   └── messages.ts            # User-friendly text
├── security/                  # Security features
│   └── index.ts               # Security utilities
├── services/
│   ├── arcgis-client.ts       # Direct @esri/arcgis-rest-* wrappers
│   ├── datastore-resolver.ts  # Datastore resolution
│   ├── federation.ts          # Token caching + batch federation
│   ├── process.ts             # Process management
│   └── validator.ts           # URL validation + service detection
├── tui/                       # Terminal UI implementation
│   ├── app.tsx                # Main TUI application
│   ├── components/            # TUI components
│   │   ├── CommandList.tsx    # Command navigation
│   │   ├── Header.tsx         # TUI header
│   │   ├── MainView.tsx       # Main content area
│   │   ├── StatusBar.tsx      # Status information
│   │   └── ThemePreview.tsx   # Theme preview component
│   ├── themes/                # Theme definitions
│   │   ├── index.ts           # Theme registry
│   │   └── base16/            # Base16 theme integration
│   └── hooks/                 # React hooks for TUI
├── types/                     # TypeScript type definitions
│   └── additional types...
└── utils/
    ├── database.ts            # SQLite database wrapper
    ├── formatting.ts          # Output formatting
    ├── interactive.ts         # Prompts/TTY detection
    ├── lockfile.ts            # Concurrency control
    ├── output.ts              # Formatting/printing
    └── time.ts                # Time utilities
```

## Critical Implementation Requirements

### Enterprise-Ready Features
- **File-based session management** with process locking for concurrent CLI usage
- **LRU cache for federation tokens** (max 100, 1hr TTL) to prevent memory leaks
- **Federated authentication** handling Portal→Server token exchange
- **Error recovery** with interactive retry prompts and context-aware messages
- **Audit logging** with SQLite persistence for compliance and monitoring
- **Enterprise insights** for operational analytics and trend analysis
- **Interactive TUI mode** with theme support for enhanced user experience
- **Datastore management** for enterprise data source operations

### MVP Blockers (Must Handle)
1. **Federated Token Exchange** - Portal to ArcGIS Server authentication flow
2. **URL-to-Type Detection** - Heuristic service type identification from URLs
3. **Enterprise Authentication** - Handle complex auth scenarios beyond ArcGIS Online

### Implementation Evolution

**Initial YAGNI Focus (Phase 1):**
- Core 4 commands (login, logout, inspect, query)
- Essential federation handling
- Basic error recovery

**Current Implementation (Beyond MVP):**
- Full portal operations (users, groups, items)
- Enterprise insights and analytics
- Audit logging and security features
- Interactive TUI with theme support
- Datastore management
- Advanced SQL analytics
- Comprehensive admin operations

**Key Features:**
- Nested command structure for better organization
- SDK-first approach using @esri/arcgis-rest-portal
- Optional federation via ARCGIS_FEDERATION_ENABLED environment variable
- Enterprise authentication integration with existing session management
- SQLite database for persistence and analytics

## Key Technical Patterns

### Authentication Flow (Enterprise-First Strategy)
**Primary Usage: ArcGIS Enterprise with custom URLs**
- **Token-based authentication** (Primary) - Direct API token entry for enterprise portals
- **Username/password authentication** (Fallback) - For non-federated or legacy systems  
- **OAuth2 flow** (ArcGIS Online only) - Future enhancement for public cloud usage
- **Federated authentication** - Automatic Portal→Server token exchange with LRU caching
- **Secure token storage** using keytar with enterprise certificate support

**Authentication Priority:**
1. `aci login --portal https://your-portal.company.com --token YOUR_API_TOKEN` (Enterprise)
2. `aci login --portal https://your-portal.company.com --username jsmith` (Fallback)  
3. `aci login` (ArcGIS Online OAuth2 - future)

**Enterprise Features:**
- Custom CA certificate support via `NODE_EXTRA_CA_CERTS` environment variable
- Optional federation support via `ARCGIS_FEDERATION_ENABLED` environment variable
- Corporate firewall and proxy compatibility
- Graceful fallback to direct server auth when federation fails

### Error Handling Strategy
- User-friendly messages with `--debug` fallback
- Interactive retry for syntax errors
- Fail-fast for system errors
- Context-aware recovery suggestions

### Service Detection Logic
Path-based heuristics before API calls:
- `/FeatureServer` → feature-service
- `/MapServer` → map-service  
- `/ImageServer` → image-service
- Numeric endpoints for layers

## Development Approach

When implementing, follow these principles established through the design process:

1. **Start with MVP workflow**: Service schema inspection (`aci search "zoning" | aci inspect <url>`)
2. **Use selective @esri/arcgis-rest imports** to avoid bundle bloat
3. **Implement file-based session locking** for concurrent CLI safety
4. **Apply enterprise-first patterns** for authentication and error handling
5. **Focus on TypeScript ergonomics** over raw fetch calls

## Current Implementation Status

### ✅ Completed Features
- **Core Commands**: `login`, `logout`, `search`, `inspect`, `query`
- **Portal Commands**: `users`, `groups`, `items` with full CRUD operations
- **Admin Commands**: `admin login`, `admin services`, `admin logs`, `admin status`, `admin health`
- **Enterprise Insights**: `insights auth-failures`, `insights service-health`, `insights command-trends`, `insights resource-trends`
- **Advanced Analytics**: `analyze template`, `analyze sql`, `analyze schema`
- **Datastore Management**: `datastores list`, `datastores validate`, `datastores health`
- **Interactive TUI**: Full terminal UI with theme support (`--tui` flag)
- **Enterprise Authentication**: Token-based and username/password authentication
- **Federated Token Management**: LRU cache for Portal→Server authentication
- **Service Detection**: Automatic URL-to-type detection (feature-service, map-service, etc.)
- **Error Handling**: Context-aware error messages with recovery suggestions
- **Audit Logging**: SQLite-based audit trail for all operations
- **Security Features**: Role-based access patterns and secure token storage
- **Theme System**: Base16 color scheme integration for TUI
- **TypeScript Compilation**: Zero errors, full type safety

### 🚀 Recent Enhancements (July 2025)
- **TUI Implementation**: Full interactive terminal UI with Ink and React
- **Enterprise Analytics**: Added insights and analysis commands for operational intelligence
- **Database Integration**: SQLite for persistence, audit logs, and analytics
- **Theme Support**: Customizable UI themes with Base16 integration
- **Extended Architecture**: Evolved from ~800 lines MVP to ~3000+ lines enterprise solution

## Build and Development Commands

```bash
# Development
bun run dev              # Run CLI in development mode
bun run typecheck        # TypeScript compilation check (✅ PASSES)
bun run build           # Build for production

# Usage
bun run src/cli.ts --help    # See available commands

# Example workflows (tested working)
bun run src/cli.ts search "rulemapp"
bun run src/cli.ts inspect "https://rsig.parisladefense.com/arcgis/rest/services/APPLICATION_METIER/ARRETES_DE_VOIRIES/FeatureServer/1"
bun run src/cli.ts query "https://rsig.parisladefense.com/arcgis/rest/services/APPLICATION_METIER/ARRETES_DE_VOIRIES/FeatureServer/0" --limit 2
```

## Terminal UI (TUI) Implementation

The ACI tool includes a comprehensive Terminal User Interface built with Ink (React for CLIs):

### TUI Features
- **Interactive Navigation**: Use arrow keys to navigate commands and options
- **Theme Support**: Customizable color schemes using Base16 themes
- **Real-time Updates**: Live status updates and progress indicators
- **Command Palette**: Quick access to all ACI commands
- **Context-Aware Help**: Dynamic help based on current selection

### TUI Components
- **Header**: Displays ACI branding and current context
- **CommandList**: Navigable list of available commands
- **MainView**: Primary content area for command output
- **StatusBar**: Shows connection status, user info, and notifications
- **ThemePreview**: Visual theme selector and preview

### Launching TUI Mode
```bash
# Start interactive TUI
aci --tui

# Test available themes
aci theme-test
```

### Theme System
The TUI uses Base16 color schemes from the submodules:
- `submodules/base16/` - Base16 framework
- `submodules/base-16-schemes/` - Collection of color schemes
- Custom themes can be added in `src/tui/themes/`

## Database and Analytics

### SQLite Integration
The ACI tool uses SQLite for persistence and analytics:
- **Location**: `~/.aci/aci.db` (user home directory)
- **Tables**: audit_logs, command_metrics, auth_failures, service_health
- **Purpose**: Compliance logging, operational insights, performance tracking

### Insights Commands
Enterprise operational analytics capabilities:
```bash
# Authentication failure patterns
aci insights auth-failures --days 7

# Service health trends
aci insights service-health --service "MyService"

# Command execution patterns
aci insights command-trends --top 10

# Resource usage analysis
aci insights resource-trends
```

### Advanced Analytics
Expert-level analysis tools:
```bash
# Guided template analysis
aci analyze template

# Direct SQL console (read-only)
aci analyze sql "SELECT * FROM audit_logs LIMIT 10"

# Database schema inspection
aci analyze schema
```

### Audit Logging
All operations are logged with:
- Timestamp, user, command, status
- Request/response details (sanitized)
- Error information for failures
- Performance metrics

## Type Safety Guidelines

**CRITICAL**: When working with @esri/arcgis-rest packages, always look up the actual type definitions instead of using `any`. 

Key types to import:
```typescript
// Query responses
import { IQueryFeaturesResponse, IQueryResponse, IFeature } from '@esri/arcgis-rest-feature-service';

// Feature structures  
import { IFeatureSet } from '@esri/arcgis-rest-request';
```

Use type guards for query responses:
```typescript
if ('features' in results) {
  // results is IQueryFeaturesResponse with features array
  const features: IFeature[] = results.features;
} else {
  // results is IQueryResponse (metadata only)
}
```

## Architecture Evolution

This design evolved through multiple phases:
- **Round 1**: Initial comprehensive design with unified resolvers
- **Round 2**: YAGNI simplification, eliminated over-engineering  
- **Round 3**: UML analysis with enterprise-ready validation
- **Round 4**: Production-ready architecture with memory management and concurrency safety
- **Current Phase**: Full enterprise implementation with TUI, analytics, and comprehensive feature set

Key architectural additions:
- **TUI Layer**: React-based terminal UI using Ink framework
- **Analytics Engine**: SQLite-backed insights and operational intelligence
- **Audit System**: Comprehensive logging for compliance and monitoring
- **Theme Engine**: Customizable UI with Base16 color schemes
- **Extended Commands**: Portal operations, datastore management, and advanced analytics

The implementation has grown significantly beyond the initial MVP to provide a comprehensive enterprise GIS command-line tool.
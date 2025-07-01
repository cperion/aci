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

### Final Architecture (Post-DeepSeek Consultations)

The design has been refined through multiple rounds of architectural consultations with focus on YAGNI principles:

**Command Structure (Enterprise-Focused):**
```bash
# Enterprise authentication (primary workflow)
aci login --portal https://your-portal.company.com --token YOUR_API_TOKEN
aci login --portal https://your-portal.company.com --username jsmith

# Service operations
aci inspect <url>                   # Metadata inspection  
aci query <url> --where...          # Feature querying with federation
aci logout                          # Session cleanup

# Portal operations (simplified, no nested subcommands)
aci users find "admin*"             # User search
aci users get jsmith                # User profile
aci groups create "Dev Team"        # Group creation
aci groups find "gis*"              # Group search
aci items find "transportation"     # Item search
aci items share item123 -g g1,g2    # Item sharing

# ArcGIS Online (future)
aci login                           # OAuth2 flow for arcgis.com
```

**Technology Stack:**
- CLI Framework: Commander.js (migrating to Ink for TUI)
- Build: tsup (zero-config TypeScript)
- Auth: keytar (secure token storage)
- ArcGIS SDK: Selective @esri/arcgis-rest-* imports (including @esri/arcgis-rest-portal)
- TUI Framework: Ink (React for CLIs) with @inkjs/ui components

**File Structure (15 files, ~1125 LOC):**
```
src/
├── cli.ts                     # Entry point + Commander setup
├── session.ts                 # File-based session + locking
├── error.ts                   # Custom error classes
├── errors/
│   ├── handler.ts             # Error boundary
│   └── messages.ts            # User-friendly text
├── commands/
│   ├── auth.ts                # login/logout handlers
│   ├── query.ts               # Feature querying
│   ├── inspect.ts             # Metadata inspection  
│   └── register.ts            # Commander command setup
├── services/
│   ├── federation.ts          # Token caching + batch federation
│   ├── validator.ts           # URL validation + service detection
│   └── arcgis-client.ts       # Direct @esri/arcgis-rest-* wrappers
└── utils/
    ├── lockfile.ts           # Concurrency control
    ├── output.ts             # Formatting/printing
    └── interactive.ts        # Prompts/TTY detection
```

## Critical Implementation Requirements

### Enterprise-Ready Features
- **File-based session management** with process locking for concurrent CLI usage
- **LRU cache for federation tokens** (max 100, 1hr TTL) to prevent memory leaks
- **Federated authentication** handling Portal→Server token exchange
- **Error recovery** with interactive retry prompts and context-aware messages

### MVP Blockers (Must Handle)
1. **Federated Token Exchange** - Portal to ArcGIS Server authentication flow
2. **URL-to-Type Detection** - Heuristic service type identification from URLs
3. **Enterprise Authentication** - Handle complex auth scenarios beyond ArcGIS Online

### YAGNI Compliance
**Implemented Only:**
- Core 4 commands (login, logout, inspect, query)
- Essential federation handling
- Basic error recovery

**Deferred to Phase 2:**
- Complex deployment workflows
- State machines (XState rejected for MVP)
- Multi-output formats
- Context memory

**Portal Features (Simplified Implementation):**
- Flattened command structure (no nested portal subcommands)
- SDK-first approach using @esri/arcgis-rest-portal
- Optional federation via ARCGIS_FEDERATION_ENABLED environment variable
- Enterprise authentication integration with existing session management

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
- **Admin Commands**: `admin login`, `admin services`, `admin logs`, `admin status`, `admin health`
- **Enterprise Authentication**: Token-based and username/password authentication
- **Federated Token Management**: Simple token caching for Portal→Server authentication
- **Service Detection**: Automatic URL-to-type detection (feature-service, map-service, etc.)
- **Error Handling**: Context-aware error messages with recovery suggestions
- **TypeScript Compilation**: Zero errors, full type safety
- **Output Formatting**: Specialized formatting for services vs layers vs relationships

### 🚧 In Progress - Portal Features
- **Portal Commands**: `users`, `groups`, `items` (simplified, no nested subcommands)
- **SDK Integration**: @esri/arcgis-rest-portal for portal operations
- **Enterprise Portal Support**: Integration with existing authentication system

### 🔧 Recent Improvements (July 2025)
- **MAJOR SIMPLIFICATION**: Removed ~70% of overengineered code following DeepSeek R1 audit
- **YAGNI Compliance**: Eliminated RBAC, audit trails, metrics, and complex failure recovery
- **Admin Integration**: Added essential ArcGIS Server administration commands
- **Simplified Architecture**: ~800 lines of focused functionality vs ~2,500 lines of enterprise frameworks
- **Essential Operations**: Service start/stop/restart, log viewing, basic health checks

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

This design evolved through multiple consultation rounds:
- **Round 1**: Initial comprehensive design with unified resolvers
- **Round 2**: YAGNI simplification, eliminated over-engineering
- **Round 3**: UML analysis with enterprise-ready validation
- **Final**: Production-ready architecture with memory management and concurrency safety

The documents contain detailed implementation examples and enterprise deployment patterns that should be referenced during development.
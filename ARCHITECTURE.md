# ACI (ArcGIS Command Line Interface) Architecture

This document describes the technical architecture, design decisions, and implementation patterns of the ACI (ArcGIS Command Line Interface) tool.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Authentication Strategy](#authentication-strategy)
- [Session Management](#session-management)
- [Error Handling](#error-handling)
- [Enterprise Patterns](#enterprise-patterns)
- [Performance Considerations](#performance-considerations)
- [Security](#security)

## Overview

The ACI (ArcGIS Command Line Interface) is a TypeScript-based command-line tool designed for enterprise GIS workflows. The architecture follows YAGNI (You Aren't Gonna Need It) principles, focusing on essential functionality while maintaining extensibility for future requirements.

### Design Philosophy

- **Enterprise-First**: Prioritizes enterprise portal authentication and federated services
- **Simplicity**: Minimal viable product with focused feature set
- **Type Safety**: Full TypeScript implementation with zero compilation errors
- **Security**: Secure token storage and handling
- **Reliability**: Comprehensive error handling and recovery mechanisms

## Technology Stack

### Core Technologies

- **Runtime**: Node.js with Bun for development
- **Language**: TypeScript with strict type checking
- **CLI Framework**: Commander.js for command parsing and help generation
- **Build Tool**: tsup for zero-config TypeScript compilation
- **ArcGIS SDK**: Selective imports from @esri/arcgis-rest-* packages

### Dependencies

```typescript
// Core CLI framework
"commander": "^14.0.0"

// ArcGIS REST API clients
"@esri/arcgis-rest-auth": "^3.8.0"
"@esri/arcgis-rest-feature-service": "^4.1.0"
"@esri/arcgis-rest-portal": "^4.6.1"
"@esri/arcgis-rest-request": "^4.6.0"

// Secure credential storage
"keytar": "^7.9.0"

// User interaction
"read": "^4.1.0"
```

### Architecture Rationale

**Why Commander.js**: Simple, mature CLI framework with excellent TypeScript support and automatic help generation.

**Why Selective ArcGIS Imports**: Avoids bundle bloat by importing only required functionality from the extensive @esri/arcgis-rest ecosystem.

**Why keytar**: Cross-platform secure credential storage using system keychain (Keychain on macOS, Credential Manager on Windows, libsecret on Linux).

**Why TypeScript**: Type safety prevents runtime errors in enterprise environments where reliability is critical.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Commands  │───▶│  Session Manager │───▶│  Keytar Storage │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│ ArcGIS Services │    │   Environment    │
│   - Portal      │    │   Configuration  │
│   - Federation  │    │   (.arcgisrc)    │
│   - Validation  │    └──────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  @esri/arcgis-  │
│   rest-* APIs   │
└─────────────────┘
```

### Module Structure

```
src/
├── cli.ts                     # Entry point, Commander setup
├── session.ts                 # Session and environment management
├── error.ts                   # Custom error classes
├── commands/                  # Command implementations
│   ├── auth.ts               # Authentication commands
│   ├── query.ts              # Data querying
│   ├── inspect.ts            # Service inspection
│   └── register.ts           # Command registration with Commander
├── services/                  # Business logic services
│   ├── arcgis-client.ts      # ArcGIS API wrappers
│   ├── federation.ts         # Token federation management
│   └── validator.ts          # URL validation and service detection
└── utils/                     # Cross-cutting utilities
    ├── output.ts             # Formatting and display
    └── interactive.ts        # User prompts and TTY detection
```

## Core Components

### CLI Entry Point (`cli.ts`)

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { registerCommands } from './commands/register.js';

const program = new Command();
program
  .name('arc')
  .description('ACI (ArcGIS Command Line Interface) for enterprise workflows')
  .version('0.1.0');

registerCommands(program);
program.parse();
```

**Design Decisions**:
- Single entry point with Commander.js for consistent CLI experience
- Version automatically extracted from package.json
- All commands registered through centralized registration system

### Session Management (`session.ts`)

The session management system handles multiple environments and secure token storage:

```typescript
export type Environment = 'dev' | 'qa' | 'prod' | string;

export interface SessionData {
  token: string;
  portal: string;
  username?: string;
  expires: number;
}
```

**Key Features**:
- Environment-aware session storage using keytar accounts
- INI-style configuration file parsing for environment definitions
- Automatic token expiration handling with 2-minute safety buffer
- Graceful handling of corrupted session data

### Command Architecture

Commands follow a consistent pattern:

```typescript
// Command registration
program
  .command('login')
  .option('--portal <url>', 'Portal URL')
  .option('--token <token>', 'API token')
  .option('--env <environment>', 'Environment name')
  .action(loginCommand);

// Command implementation
export async function loginCommand(options: LoginOptions): Promise<void> {
  // Input validation
  // Authentication logic
  // Session storage
  // User feedback
}
```

## Authentication Strategy

### Enterprise-First Approach

The authentication strategy prioritizes enterprise workflows:

1. **Token-based Authentication** (Primary)
   - Direct API token entry for enterprise portals
   - No OAuth2 complexity for internal tools
   - Secure token storage in system keychain

2. **Username/Password Authentication** (Fallback)
   - Interactive password prompts
   - For non-federated or legacy systems
   - Temporary token generation

3. **Federated Authentication** (Automatic)
   - Portal-to-Server token exchange
   - LRU token caching to prevent repeated requests
   - Graceful fallback to direct server authentication

### Authentication Flow

```typescript
// Portal authentication
const session = await UserSession.fromCredential({
  portal: portalUrl,
  token: apiToken
});

// Federated server authentication
const federatedToken = await getFederatedToken(session, serverUrl);

// Service request with appropriate token
const results = await queryFeatures({
  url: serviceUrl,
  authentication: session // or federatedToken
});
```

## Session Management

### Multi-Environment Support

Sessions are stored per environment using keytar accounts:

```typescript
const SERVICE_NAME = 'arcgis-cli';

// Store session for environment
await keytar.setPassword(SERVICE_NAME, environment, sessionJSON);

// Retrieve session for environment
const sessionData = await keytar.getPassword(SERVICE_NAME, environment);
```

### Environment Configuration

The `.arcgisrc` file provides environment definitions:

```ini
[recette]
portal=https://rsig.parisladefense.com/arcgis/sharing/rest
auth_type=token

[prod]
portal=https://sig.parisladefense.com/arcgis/sharing/rest
auth_type=token
```

**Parsing Logic**:
- Simple INI parser without external dependencies
- Environment-specific portal URL mapping
- Extensible configuration format

### Token Expiration Management

```typescript
export async function getSession(env?: Environment): Promise<UserSession | null> {
  const sessionData = JSON.parse(sessionStr) as SessionData;
  
  // Check expiration with 2-minute buffer
  if (Date.now() > sessionData.expires - 120000) {
    await keytar.deletePassword(SERVICE_NAME, account);
    return null;
  }
  
  return new UserSession({
    portal: sessionData.portal,
    token: sessionData.token,
    tokenExpires: new Date(sessionData.expires)
  });
}
```

## Error Handling

### Error Classification

The CLI uses a hierarchical error handling system:

```typescript
export class ArcGISError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ArcGISError';
  }
}

export class AuthenticationError extends ArcGISError {
  constructor(message: string, portal?: string) {
    super(message, 'AUTH_ERROR');
    this.portal = portal;
  }
}
```

### Error Recovery Patterns

1. **Authentication Errors**: Clear session and prompt for re-authentication
2. **Network Errors**: Provide connectivity troubleshooting guidance
3. **Service Errors**: Suggest alternative approaches or contact information
4. **Configuration Errors**: Offer specific configuration file fixes

### Context-Aware Error Messages

```typescript
function handleFederationFailure(error: any, serverUrl: string, portal: string): never {
  if (error.message?.includes('not federated') || error.code === 498) {
    throw new Error(`Server ${serverUrl} is not federated with portal ${portal}. Configure federation or use direct server authentication.`);
  }
  
  if (error.code === 'ECONNREFUSED') {
    throw new Error(`Cannot reach server ${serverUrl}. Check network connectivity and firewall settings.`);
  }
  
  throw new Error(`Federation token generation failed: ${error.message}`);
}
```

## Enterprise Patterns

### Federation Token Management

The federation service handles Portal-to-Server authentication:

```typescript
// Simple in-memory token store (replaces complex LRU cache)
const tokenStore = new Map<string, FederatedToken>();

export async function getFederatedToken(
  portalSession: UserSession,
  serverUrl: string
): Promise<string> {
  const normalizedUrl = normalizeServerUrl(serverUrl);
  
  // Check cache with 2-minute safety buffer
  const cached = tokenStore.get(normalizedUrl);
  if (cached && Date.now() < cached.expires - 120000) {
    return cached.token;
  }
  
  // Generate new federated token
  const federatedToken = await generateServerToken(portalSession, normalizedUrl);
  
  // Cache the token
  tokenStore.set(normalizedUrl, {
    token: federatedToken,
    expires: Date.now() + 3600000, // 1 hour
    server: normalizedUrl
  });
  
  return federatedToken;
}
```

### URL Normalization

Portal URL handling for enterprise environments:

```typescript
export function buildSharingRestUrl(baseUrl: string): string {
  const normalized = normalizeBasePortalUrl(baseUrl);
  
  // Handle Paris La Défense specific URL pattern
  if (normalized.match(/\/arcgis$/i)) {
    return `${normalized}/sharing/rest`;
  }
  
  // Standard enterprise portal pattern
  if (isEnterprisePortal(baseUrl)) {
    return `${normalized}/portal/sharing/rest`;
  }
  
  // ArcGIS Online pattern
  return `${normalized}/sharing/rest`;
}
```

### Service Type Detection

Heuristic service type detection before API calls:

```typescript
export function detectServiceType(url: string): ServiceType {
  const path = new URL(url).pathname;
  const tokens = path.split('/').filter(Boolean);
  const lastToken = tokens[tokens.length - 1];
  const penultimateToken = tokens[tokens.length - 2];
  
  // Service-level detection
  if (lastToken === 'FeatureServer') return 'feature-service';
  if (lastToken === 'MapServer') return 'map-service';
  
  // Layer-level detection
  if (!isNaN(parseInt(lastToken))) {
    if (penultimateToken === 'FeatureServer') return 'feature-layer';
    if (penultimateToken === 'MapServer') return 'map-layer';
  }
  
  return 'unknown-arcgis-resource';
}
```

## Performance Considerations

### Token Caching Strategy

- **In-Memory Caching**: Simple Map-based storage for federation tokens
- **TTL Management**: 1-hour token lifetime with 2-minute safety buffer
- **Cache Invalidation**: Automatic cleanup on token expiration
- **Memory Management**: No artificial limits due to CLI usage patterns (short-lived processes)

### Bundle Optimization

- **Selective Imports**: Import only required functions from @esri packages
- **Tree Shaking**: tsup automatically removes unused code
- **TypeScript Compilation**: Zero runtime type checking overhead

### Network Optimization

- **Connection Reuse**: @esri/arcgis-rest-request handles HTTP connection pooling
- **Request Batching**: Future enhancement for bulk operations
- **Timeout Management**: Configurable timeouts for enterprise network conditions

## Security

### Token Storage

- **System Keychain**: Secure credential storage using keytar
- **Encryption**: Tokens encrypted at rest by operating system keychain
- **Access Control**: Per-user, per-application credential isolation

### Token Handling

- **In-Memory Only**: Tokens never written to disk outside of keychain
- **Automatic Expiration**: Proactive token cleanup before expiration
- **Session Isolation**: Environment-specific token storage

### Network Security

- **HTTPS Only**: All ArcGIS communications over encrypted connections
- **Certificate Validation**: Support for custom CA bundles via environment variables
- **Corporate Firewalls**: Proxy support through Node.js standard mechanisms

### Input Validation

```typescript
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
```

## Future Architecture Considerations

### Planned Enhancements

1. **Enhanced Error Recovery**: Schema validation and automatic retry mechanisms
2. **Batch Processing**: Multi-service operations with progress reporting
3. **Configuration Management**: Advanced environment and credential management
4. **Plugin System**: Extensible command architecture

### Scalability Patterns

- **Command Registration**: Modular command system for future expansion
- **Service Abstraction**: Clean separation between CLI commands and ArcGIS services
- **Configuration Flexibility**: Extensible environment and authentication configuration

### Testing Strategy

- **Unit Tests**: Component-level testing with mocked ArcGIS services
- **Integration Tests**: Real-world testing against Paris La Défense infrastructure
- **Type Safety**: Comprehensive TypeScript coverage prevents runtime errors

## Development Guidelines

### Version Control

This project uses **Jujutsu (jj)** as the primary version control system, backed by Git for remote repository support. See [docs/VERSION_CONTROL.md](docs/VERSION_CONTROL.md) for comprehensive setup and workflow documentation.

#### Key Benefits
- **Conflict-free operations**: Automatic conflict resolution for most development scenarios
- **Change tracking**: Every modification is automatically tracked and backed up
- **Git compatibility**: Full interoperability with existing Git workflows and remotes
- **Simplified workflows**: Easier branching, rebasing, and history management

#### Basic Workflow
```bash
# Daily development
jj status                    # Check current changes
jj commit -m "Add feature"   # Commit changes
jj git push                  # Push to remote

# Collaboration
jj git fetch && jj rebase    # Sync with remote changes
```

### Code Organization Principles

1. **Single Responsibility**: Each module has a clear, focused purpose
2. **Dependency Injection**: Services accept configuration rather than hardcoding
3. **Error Boundary**: Centralized error handling with context-specific recovery
4. **Type Safety**: Prefer explicit types over `any` for all ArcGIS API interactions

### Performance Monitoring

- **Token Cache Metrics**: Federation cache hit rates and memory usage
- **Request Timing**: Network request duration and retry patterns
- **Error Rates**: Authentication failure and service unavailability tracking

This architecture provides a solid foundation for enterprise GIS workflows while maintaining simplicity and extensibility for future requirements.
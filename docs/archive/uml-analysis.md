# ArcGIS CLI UML Analysis

## Overview
This document contains UML diagrams for the ArcGIS CLI tool, focusing on the MVP functionality based on YAGNI principles.

## Core Use Cases (Use Case Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                    ArcGIS CLI System                        │
│                                                             │
│  ┌──────────┐                                              │
│  │          │     login                ┌─────────────────┐ │
│  │   GIS    ├─────────────────────────▶│   Authenticate  │ │
│  │ Analyst  │                          └─────────────────┘ │
│  │          │     search               ┌─────────────────┐ │
│  │          ├─────────────────────────▶│  Search Portal  │ │
│  │          │                          │     Items       │ │
│  │          │     inspect service      └─────────────────┘ │
│  │          ├─────────────────────────▶┌─────────────────┐ │
│  │          │                          │  Inspect        │ │
│  │          │     query features       │  Feature        │ │
│  │          ├─────────────────────────▶│  Service        │ │
│  │          │                          └─────────────────┘ │
│  │          │     logout               ┌─────────────────┐ │
│  │          ├─────────────────────────▶│   Query         │ │
│  └──────────┘                          │   Features      │ │
│                                        └─────────────────┘ │
│                                        ┌─────────────────┐ │
│                                        │    Logout       │ │
│                                        └─────────────────┘ │
│                                                             │
│  External Systems:                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   ArcGIS    │  │   ArcGIS    │  │      Keytar         ││
│  │   Portal    │  │   Server    │  │   (OS Keychain)     ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Main Authentication Flow (Sequence Diagram)

```
User          CLI         Keytar      Portal      Server
│             │           │           │           │
├─ arc login ─▶           │           │           │
│             ├──check────▶           │           │
│             ◀──no token─┤           │           │
│             ├────────── launch OAuth browser ──▶
│             │           │           ◀── OAuth ──┤
│             │           │           ├─ token ──▶
│             ◀─── token ─┤           │           │
│             ├─ store ──▶           │           │
│             ◀─ saved ──┤           │           │
│             │           │           │           │
├─ arc query ─▶           │           │           │
│             ├─ get ────▶           │           │
│             ◀─ token ──┤           │           │
│             ├─ federate token ────▶           │
│             │           │           ├─ exchange▶
│             │           │           ◀─ server ─┤
│             │           │           │    token │
│             ◀─ federated token ────┤           │
│             ├───── query with token ──────────▶
│             ◀───────── results ────────────────┤
│             │           │           │           │
```

## Core Domain Model (Class Diagram)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLICommand    │    │   AuthManager   │    │ ServiceDetector │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ +name: string   │    │ -keytar         │    │ +detectType()   │
│ +execute()      │◄──▶│ +login()        │    │ +parseUrl()     │
│ +validate()     │    │ +logout()       │    │ +isValidUrl()   │
└─────────────────┘    │ +getToken()     │    └─────────────────┘
        ▲               │ +refreshToken() │             ▲
        │               └─────────────────┘             │
        │                        ▲                      │
┌───────────────┐                │              ┌─────────────────┐
│ LoginCommand  │                │              │ PortalService   │
├───────────────┤        ┌───────────────┐      ├─────────────────┤
│ +execute()    │        │   Session     │      │ +searchItems()  │
└───────────────┘        ├───────────────┤      │ +getItem()      │
        │                │ +portal: URL  │      └─────────────────┘
┌───────────────┐        │ +token: string│               ▲
│ SearchCommand │        │ +expires: Date│               │
├───────────────┤        │ +isValid()    │      ┌─────────────────┐
│ +execute()    │────────▶└───────────────┘      │ FeatureService  │
└───────────────┘                 ▲              ├─────────────────┤
        │                         │              │ +getInfo()      │
┌───────────────┐                 │              │ +queryFeatures()│
│ QueryCommand  │                 │              │ +getFields()    │
├───────────────┤                 │              └─────────────────┘
│ +execute()    │─────────────────┘
└───────────────┘
        │
┌───────────────┐
│ InspectCommand│
├───────────────┤
│ +execute()    │
└───────────────┘
```

## System Components (Component Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ArcGIS CLI                               │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐│
│  │   CLI Layer     │    │  Command Layer  │    │ Output Layer ││
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │┌────────────┐││
│  │ │ Commander.js│ ├────▶ │ LoginCmd    │ ├────▶│ Formatter  │││
│  │ │ Argument    │ │    │ │ SearchCmd   │ │    ││ JSON/Table │││
│  │ │ Parsing     │ │    │ │ QueryCmd    │ │    ││ Colorizer  │││
│  │ └─────────────┘ │    │ │ InspectCmd  │ │    │└────────────┘││
│  └─────────────────┘    │ └─────────────┘ │    └──────────────┘│
│                         └─────────────────┘                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐│
│  │  Auth Layer     │    │ Service Layer   │    │ Utils Layer  ││
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │┌────────────┐││
│  │ │ Session     │ │    │ │ Portal API  │ │    ││ URL Parser │││
│  │ │ Manager     │ ├────▶ │ Feature API │ │    ││ Validator  │││
│  │ │ OAuth Flow  │ │    │ │ Federation  │ │    ││ Error      │││
│  │ │ Token Store │ │    │ │ Handler     │ │    ││ Handler    │││
│  │ └─────────────┘ │    │ └─────────────┘ │    │└────────────┘││
│  └─────────────────┘    └─────────────────┘    └──────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Dependencies                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Keytar    │  │@esri/arcgis-│  │        ArcGIS           │ │
│  │ (OS Secure  │  │ rest-*      │  │    Online/Enterprise    │ │
│  │  Storage)   │  │ (Official   │  │      REST APIs          │ │
│  │             │  │  SDK)       │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Query Flow (Activity Diagram)

```
Start
  │
  ▼
┌─────────────────┐
│ Parse URL/Args  │
└─────────────────┘
  │
  ▼
┌─────────────────┐     No    ┌─────────────────┐
│ Valid Service   ├──────────▶│ Show Error +    │──┐
│ URL?            │           │ Usage Hint      │  │
└─────────────────┘           └─────────────────┘  │
  │ Yes                                            │
  ▼                                                │
┌─────────────────┐     No    ┌─────────────────┐  │
│ Authenticated?  ├──────────▶│ Run Login Flow  │  │
└─────────────────┘           └─────────────────┘  │
  │ Yes                             │              │
  ▼                                 ▼              │
┌─────────────────┐           ┌─────────────────┐  │
│ Detect Service  │           │ Store Token     │  │
│ Type            │           └─────────────────┘  │
└─────────────────┘                 │              │
  │                                 ▼              │
  ▼                           ┌─────────────────┐  │
┌─────────────────┐           │ Retry Query     │  │
│ Need Server     │           └─────────────────┘  │
│ Token?          │                 │              │
└─────────────────┘                 │              │
  │ Yes                             │              │
  ▼                                 │              │
┌─────────────────┐                 │              │
│ Federate Token  │                 │              │
└─────────────────┘                 │              │
  │                                 │              │
  ▼                                 │              │
┌─────────────────┐                 │              │
│ Execute Query   │◄────────────────┘              │
└─────────────────┘                                │
  │                                                │
  ▼                                                │
┌─────────────────┐                                │
│ Format Output   │                                │
└─────────────────┘                                │
  │                                                │
  ▼                                                │
┌─────────────────┐                                │
│ Display Results │◄───────────────────────────────┘
└─────────────────┘
  │
  ▼
End
```

## Error Handling States (State Diagram)

```
                    ┌─────────────────┐
                    │     Success     │
                    │     State       │
                    └─────────────────┘
                            ▲
                            │ success
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌─────────────────┐ token   │        network  ┌─────────────────┐
│   Auth Error    │ refresh │        retry    │ Network Error   │
│                 ├─────────┘                 │                 │
│ 401/403 codes   │                           │ timeout/offline │
└─────────────────┘                           └─────────────────┘
         │                                             │
         │ federation                                  │ max
         │ broken                                      │ retries
         ▼                                             ▼
┌─────────────────┐                           ┌─────────────────┐
│ Federation      │                           │  Fatal Error    │
│ Error           │                           │                 │
│                 │                           │ abort operation │
│ prompt direct   │                           └─────────────────┘
│ auth            │                                    ▲
└─────────────────┘                                    │
         │                                             │
         │ user confirms                               │
         ▼                                             │
┌─────────────────┐                                    │
│ Direct Server   │                                    │
│ Auth            │ server           ┌─────────────────┤
│                 │ error           │ Service Error   │
│ bypass portal   ├─────────────────▶│                 │
└─────────────────┘                 │ 500/503 codes  │
                                    └─────────────────┘
```

## Final Design Decisions (After 3 DeepSeek Consultations)

### Architectural Simplifications Applied ✅

1. **Collapsed Layers**: 
   - Merged Command/Output layers (commands own formatting)
   - Unified Auth/Service into single ArcGIS Core
   - Eliminated ServiceDetector abstraction

2. **Session Management**:
   - File-based locking for concurrency (no singletons)
   - LRU cache for federation tokens (max 100, 1hr TTL)
   - Lazy federation on demand

3. **Error Handling Strategy**:
   - User-friendly messages with `--debug` fallback
   - Interactive retry for syntax errors
   - Fail-fast for system errors
   - Context-aware recovery suggestions

4. **Command Structure**:
   ```bash
   arc login                    # Authentication
   arc inspect <url>            # Metadata only  
   arc query <url> --where...   # Feature data
   ```

### Final File Structure (15 files, ~1125 LOC)

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

### Production-Ready Features

#### Memory Management
- LRU token cache (prevents memory leaks)
- File-based session storage (no in-memory state)

#### Concurrency Safety  
- Process-level file locking for session access
- Safe for CI/CD parallel execution

#### Error Recovery
- Interactive retry prompts (TTY detection)
- Context-sensitive error messages
- Graceful degradation in script mode

#### Performance Optimizations
- Batch federation for multiple server queries
- Lazy token generation
- Early validation with fail-fast

### YAGNI Compliance ✅

**Implemented Only:**
- Core 4 commands (login, logout, inspect, query)
- Essential federation handling
- Basic error recovery

**Deferred to Phase 2:**
- Complex deployment workflows
- State machines
- Admin operations
- Multi-output formats
- Context memory

### Enterprise-Ready Validation

✅ **Concurrent CLI usage** (file locking)  
✅ **Memory leak prevention** (LRU cache)  
✅ **Federation performance** (batch calls)  
✅ **Error recovery** (retry prompts)  
✅ **CLI standards** (consistent flag patterns)  
✅ **Testing strategy** (mocked dependencies)
# ACI TUI Development Blueprint
**Comprehensive Implementation Guide Based on DeepSeek Architectural Audits**

---

## Executive Summary

This blueprint provides the definitive implementation guide for the ACI TUI (Terminal User Interface), synthesizing findings from three comprehensive DeepSeek R1 architectural audits. The design achieves 76% code reuse from the existing CLI codebase while implementing a sophisticated three-pane "Triptych" interface with enterprise-grade state management.

**Key Metrics:**
- **Existing CLI**: ~1,125 LOC preserved unchanged
- **New TUI Code**: ~350 LOC required
- **Implementation Timeline**: 6 days
- **Code Efficiency**: 76% reuse, 0% business logic duplication
- **Architecture**: Simplified state management (60% complexity reduction from original design)

---

## Table of Contents

1. [Architectural Foundation](#1-architectural-foundation)
2. [DeepSeek Audit Findings](#2-deepseek-audit-findings)
3. [Simplified Architecture Design](#3-simplified-architecture-design)
4. [Implementation Strategy](#4-implementation-strategy)
5. [File Structure & Code Organization](#5-file-structure--code-organization)
6. [Core Components Specification](#6-core-components-specification)
7. [State Management Patterns](#7-state-management-patterns)
8. [Integration Patterns](#8-integration-patterns)
9. [Development Roadmap](#9-development-roadmap)
10. [Testing Strategy](#10-testing-strategy)
11. [Performance & Security](#11-performance--security)

---

## 1. Architectural Foundation

### 1.1. Design Philosophy: "Unwavering Focus"

The ACI TUI implements a radical approach to terminal interface design based on the "Unwavering Focus" principle:

- **Single Interaction Point**: All user input occurs exclusively in the Middle Pane
- **Spatial Memory**: Left Pane always shows "where you came from" (parent context)
- **Contextual Support**: Right Pane provides details and action guidance
- **Hierarchical Navigation**: Consistent `l`/`h` drill-down/up pattern

### 1.2. Three-Pane Triptych Layout

```ascii
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ACI [ENVIRONMENT] ─ P:[AUTH_STATUS] A:[ADMIN_STATUS] ───────────────── [?] Help │
├──────────────────────────┬──────────────────────────┬──────────────────────────┤
│     LEFT PANE            │     MIDDLE PANE          │     RIGHT PANE           │
│   (Parent Context)       │   (Active Workspace)     │   (Detail / Support)     │
│     25% width            │     50% width            │     25% width            │
│   Non-interactive        │   Fully interactive      │   Display only           │
│   Dimmed appearance      │   Full brightness        │   Full brightness        │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
 [NAV HINTS] > Breadcrumbs > Current Location                               [⣟]
```

### 1.3. Core Principles

1. **UI = f(State)**: Entire interface is a pure function of application state
2. **Command Reuse**: TUI invokes existing CLI commands via facade pattern
3. **Progressive Enhancement**: CLI functionality remains unchanged, TUI adds on top
4. **Enterprise Ready**: Built-in session management, error recovery, and concurrency control

---

## 2. DeepSeek Audit Findings

### 2.1. Architecture Analysis Results

**✅ Strengths Identified:**
- "Unwavering Focus" effectively implements Hick's Law for reduced cognitive load
- Immutable navigation patterns enable predictable debugging
- Component polymorphism allows extensible views

**❌ Critical Issues Found:**
- **60% Over-Engineering**: Original design had excessive complexity
- **Memory Bloat**: Navigation stack could grow to 4MB+ with deep navigation
- **Race Conditions**: Concurrent operations causing state corruption
- **Type Safety Gaps**: Generic components allowing runtime type mismatches

### 2.2. State Management Vulnerabilities

**Critical Failure Modes:**
1. **Navigation Stack Corruption**: Rapid key presses causing desynchronization
2. **Session File Conflicts**: CLI and TUI competing for shared session files
3. **Memory Leaks**: Unbounded log streaming (150 bytes/sec growth rate)
4. **Orphaned Subscriptions**: Event listeners surviving component unmounts

### 2.3. Integration Challenges

**CLI/TUI Compatibility Issues:**
- Session storage format conflicts
- Token expiration handling differences  
- Backward compatibility with existing .acirc files
- Cross-process file locking requirements

---

## 3. Simplified Architecture Design

### 3.1. Flat State Management (60% Complexity Reduction)

**Before (Over-Engineered):**
```typescript
interface AppState {
  navigationStack: NavigableState[];
  mode: 'navigation' | 'action';
  currentAction: ActionPayload | null;
  // 15+ additional properties
}
```

**After (Simplified):**
```typescript
interface AppState {
  currentView: { id: string; title: string; data?: unknown };
  previousView?: string;
  selection: { serviceId?: string; datastoreId?: string; itemId?: string };
  environment: string;
  authStatus: { portal: boolean; admin: boolean };
}
```

### 3.2. Direct Component Mapping

**Eliminates Complex Polymorphism:**
```typescript
const VIEW_COMPONENTS = {
  "home": HomeView,
  "services-list": ServicesListView,
  "service-detail": ServiceDetailView,
  "datastores-list": DatastoresListView,
  "datastore-detail": DatastoreDetailView,
  "users-list": UsersListView,
  "groups-list": GroupsListView,
  "items-list": ItemsListView
} as const;

type ViewId = keyof typeof VIEW_COMPONENTS;
```

### 3.3. Action-as-View Pattern

**Actions as Regular Views (Not Modal States):**
```typescript
const ACTION_VIEWS = {
  "restart-service": RestartServiceView,
  "login-portal": LoginPortalView,
  "query-features": QueryFeaturesView
} as const;
```

---

## 4. Implementation Strategy

### 4.1. Progressive Enhancement Approach

**Phase 1: Foundation (Day 1)**
```bash
# Add TUI entry point to existing CLI
aci --tui                    # Launch TUI mode
aci admin services           # Existing CLI mode (unchanged)
```

**Phase 2: Core Views (Days 2-3)**
- Implement three-pane layout
- Add basic navigation between views
- Connect existing admin commands

**Phase 3: Enhanced Features (Days 4-5)**
- Add preview panes with existing formatters
- Implement keyboard navigation
- Add action views

**Phase 4: Polish (Day 6)**
- Error handling and recovery
- Performance optimization
- Documentation

### 4.2. Command Facade Pattern

**Zero Business Logic Duplication:**
```typescript
// Universal Command Executor
const COMMAND_REGISTRY: Record<string, CommandExecutor> = {
  "admin.services.list": (params) => listServicesCommand(params),
  "admin.services.restart": (params) => restartServiceCommand(params.serviceId),
  "datastores.list": (params) => listDatastoresCommand(),
  "users.find": (params) => findUsersCommand(params.query),
  "groups.list": (params) => listGroupsCommand(),
  "items.search": (params) => searchItemsCommand(params.query)
};

export async function executeCommand(
  commandPath: string, 
  params: CommandParams
): Promise<CommandResult> {
  const executor = COMMAND_REGISTRY[commandPath];
  if (!executor) {
    return { error: "Command not found", commandPath };
  }
  
  try {
    const result = await executor(params);
    return { success: true, data: result };
  } catch (error) {
    return { error: error.message, commandPath, params };
  }
}
```

### 4.3. Formatter Bridge Strategy

**Direct Reuse of Existing Formatters:**
```typescript
// Bridge existing CLI formatters to Ink components
export const FormatterBridge: React.FC<{
  formatter: (data: any) => string;
  data: any;
}> = ({ formatter, data }) => {
  const formattedText = useMemo(() => formatter(data), [formatter, data]);
  return <Text>{formattedText}</Text>;
};

// Usage in TUI components
const ServicesList: React.FC = () => {
  const services = useServices();
  return (
    <Box flexDirection="column">
      {services.map(service => (
        <FormatterBridge 
          key={service.serviceName}
          formatter={formatService}  // Existing function from output.ts
          data={service}
        />
      ))}
    </Box>
  );
};
```

---

## 5. File Structure & Code Organization

### 5.1. Directory Structure

```
src/
├── cli.ts                          (modified - add --tui flag)
├── session.ts                      (modified - add cross-process locking)
├── commands/                       (unchanged)
│   ├── admin.ts
│   ├── auth.ts
│   ├── inspect.ts
│   ├── query.ts
│   ├── register.ts
│   ├── users.ts
│   ├── groups.ts
│   └── items.ts
├── services/                       (unchanged)
│   ├── admin-client.ts
│   └── federation.ts
├── utils/                          (extended)
│   ├── output.ts                   (unchanged - existing formatters)
│   └── formatBridge.tsx            (new - 50 LOC)
└── tui/                           (new directory - 300 LOC total)
    ├── index.tsx                   (entry point - 20 LOC)
    ├── App.tsx                     (main app - 40 LOC)
    ├── core/                       (state management)
    │   ├── NavigationContext.tsx   (100 LOC)
    │   ├── hooks.ts               (30 LOC)
    │   └── types.ts               (20 LOC)
    ├── layout/                     (layout components)
    │   ├── Triptych.tsx           (40 LOC)
    │   ├── Header.tsx             (20 LOC)
    │   └── Footer.tsx             (20 LOC)
    ├── panes/                      (pane implementations)
    │   ├── LeftPane.tsx           (15 LOC)
    │   ├── MiddlePane.tsx         (25 LOC)
    │   └── RightPane.tsx          (20 LOC)
    └── views/                      (view components)
        ├── HomeView.tsx           (30 LOC)
        ├── ServicesListView.tsx   (40 LOC)
        ├── ServiceDetailView.tsx  (35 LOC)
        ├── DatastoresListView.tsx (35 LOC)
        ├── UsersListView.tsx      (30 LOC)
        ├── GroupsListView.tsx     (30 LOC)
        └── ItemsListView.tsx      (30 LOC)
```

### 5.2. Core File Specifications

#### 5.2.1. TUI Entry Point (`src/cli.ts` modification)

```typescript
// Add to existing CLI entry point
import { program } from 'commander';
import { launchTUI } from './tui/index.js';

// Existing CLI commands remain unchanged
program
  .option('--tui', 'Launch Terminal User Interface')
  .hook('preAction', async (thisCommand) => {
    const options = thisCommand.opts();
    if (options.tui) {
      await launchTUI();
      process.exit(0);
    }
  });
```

#### 5.2.2. TUI Main Entry (`src/tui/index.tsx`)

```typescript
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { NavigationProvider } from './core/NavigationContext.js';

export async function launchTUI(): Promise<void> {
  const { clear } = render(
    <NavigationProvider>
      <App />
    </NavigationProvider>
  );

  // Cleanup on exit
  process.on('SIGINT', () => {
    clear();
    process.exit(0);
  });
}
```

#### 5.2.3. Main App Component (`src/tui/App.tsx`)

```typescript
import React from 'react';
import { Box } from 'ink';
import { TriptychLayout } from './layout/Triptych.js';
import { useNavigation } from './core/hooks.js';
import { VIEW_COMPONENTS } from './views/index.js';

export const App: React.FC = () => {
  const { currentView, error } = useNavigation();

  if (error) {
    return <ErrorView error={error} />;
  }

  const ViewComponent = VIEW_COMPONENTS[currentView.id as keyof typeof VIEW_COMPONENTS];
  
  if (!ViewComponent) {
    return <Text>Unknown view: {currentView.id}</Text>;
  }

  return (
    <Box flexDirection="column" height="100%">
      <TriptychLayout>
        <ViewComponent />
      </TriptychLayout>
    </Box>
  );
};
```

---

## 6. Core Components Specification

### 6.1. Navigation Context (`src/tui/core/NavigationContext.tsx`)

```typescript
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { executeCommand } from '../../utils/commandFacade.js';

interface NavigationState {
  currentView: { id: string; title: string; data?: unknown };
  previousView?: string;
  selection: Record<string, string>;
  environment: string;
  authStatus: { portal: boolean; admin: boolean };
  loading: boolean;
  error?: string;
}

type NavigationAction = 
  | { type: 'NAVIGATE_TO'; payload: { id: string; title: string; data?: unknown } }
  | { type: 'GO_BACK' }
  | { type: 'SET_SELECTION'; payload: { key: string; value: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const navigationReducer = (state: NavigationState, action: NavigationAction): NavigationState => {
  switch (action.type) {
    case 'NAVIGATE_TO':
      return {
        ...state,
        previousView: state.currentView.id,
        currentView: action.payload,
        error: undefined
      };
    
    case 'GO_BACK':
      if (!state.previousView) return state;
      return {
        ...state,
        currentView: { id: state.previousView, title: 'Previous View' },
        previousView: undefined
      };
    
    case 'SET_SELECTION':
      return {
        ...state,
        selection: { ...state.selection, [action.payload.key]: action.payload.value }
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    
    default:
      return state;
  }
};

const NavigationContext = createContext<{
  state: NavigationState;
  dispatch: React.Dispatch<NavigationAction>;
  executeCommand: (command: string, params?: any) => Promise<any>;
} | null>(null);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, {
    currentView: { id: 'home', title: 'ACI Home' },
    selection: {},
    environment: process.env.ACI_ENV || 'recette',
    authStatus: { portal: false, admin: false },
    loading: false
  });

  const wrappedExecuteCommand = async (command: string, params: any = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await executeCommand(command, params);
      if (result.error) {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return null;
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      return result.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  return (
    <NavigationContext.Provider value={{ state, dispatch, executeCommand: wrappedExecuteCommand }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
```

### 6.2. Triptych Layout (`src/tui/layout/Triptych.tsx`)

```typescript
import React from 'react';
import { Box } from 'ink';
import { Header } from './Header.js';
import { Footer } from './Footer.js';
import { LeftPane } from '../panes/LeftPane.js';
import { MiddlePane } from '../panes/MiddlePane.js';
import { RightPane } from '../panes/RightPane.js';

export const TriptychLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box flexDirection="column" height="100%">
      <Header />
      
      <Box flexGrow={1} flexDirection="row">
        <Box width="25%" borderStyle="single" borderRight={true}>
          <LeftPane />
        </Box>
        
        <Box width="50%" borderStyle="single" borderRight={true}>
          <MiddlePane>
            {children}
          </MiddlePane>
        </Box>
        
        <Box width="25%">
          <RightPane />
        </Box>
      </Box>
      
      <Footer />
    </Box>
  );
};
```

### 6.3. Formatter Bridge (`src/utils/formatBridge.tsx`)

```typescript
import React, { useMemo } from 'react';
import { Text, Box } from 'ink';

// Universal formatter bridge for CLI functions
export const FormatterBridge: React.FC<{
  formatter: (data: any) => string;
  data: any;
  dimmed?: boolean;
}> = ({ formatter, data, dimmed = false }) => {
  const formattedText = useMemo(() => {
    try {
      return formatter(data);
    } catch (error) {
      return `[Format Error: ${error.message}]`;
    }
  }, [formatter, data]);

  return (
    <Text dimColor={dimmed}>
      {formattedText}
    </Text>
  );
};

// List formatter bridge for arrays
export const ListFormatterBridge: React.FC<{
  formatter: (data: any) => string;
  data: any[];
  selectedIndex?: number;
  dimmed?: boolean;
}> = ({ formatter, data, selectedIndex, dimmed = false }) => {
  return (
    <Box flexDirection="column">
      {data.map((item, index) => (
        <Box key={index}>
          <Text color={index === selectedIndex ? 'cyan' : undefined}>
            {index === selectedIndex ? '> ' : '  '}
          </Text>
          <FormatterBridge 
            formatter={formatter} 
            data={item} 
            dimmed={dimmed}
          />
        </Box>
      ))}
    </Box>
  );
};
```

---

## 7. State Management Patterns

### 7.1. Session Synchronization

**Cross-Process File Locking:**
```typescript
import { promises as fs } from 'fs';
import path from 'path';

class SessionManager {
  private lockFile: string;
  private sessionFile: string;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    this.lockFile = path.join(homeDir, '.aci', 'session.lock');
    this.sessionFile = path.join(homeDir, '.aci', 'session.json');
  }

  async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const lockId = `${process.pid}-${Date.now()}`;
    
    try {
      // Acquire lock
      await fs.writeFile(this.lockFile, lockId, { flag: 'wx' });
      
      // Perform operation
      const result = await operation();
      
      return result;
    } finally {
      // Release lock
      try {
        await fs.unlink(this.lockFile);
      } catch (error) {
        // Lock file might have been removed by another process
      }
    }
  }

  async readSession(): Promise<SessionData | null> {
    return this.withLock(async () => {
      try {
        const data = await fs.readFile(this.sessionFile, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        return null;
      }
    });
  }

  async writeSession(session: SessionData): Promise<void> {
    return this.withLock(async () => {
      await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
    });
  }
}
```

### 7.2. Memory Management

**Bounded Collections:**
```typescript
class BoundedNavigationStack {
  private static readonly MAX_DEPTH = 20;
  private static readonly MAX_DATA_SIZE = 500 * 1024; // 500KB

  static push(stack: ViewState[], newView: ViewState): ViewState[] {
    // Check data size
    const dataSize = JSON.stringify(newView.data).length;
    if (dataSize > this.MAX_DATA_SIZE) {
      newView = { ...newView, data: { truncated: true, originalSize: dataSize } };
    }

    const newStack = [...stack, newView];
    
    // Enforce depth limit
    if (newStack.length > this.MAX_DEPTH) {
      return newStack.slice(-this.MAX_DEPTH);
    }
    
    return newStack;
  }

  static pop(stack: ViewState[]): ViewState[] {
    return stack.slice(0, -1);
  }
}
```

### 7.3. Real-time Updates

**Intelligent Polling with Backpressure:**
```typescript
class ServiceStatusPoller {
  private interval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollCount = 0;
  
  start(callback: (services: Service[]) => void, intervalMs = 5000) {
    if (this.interval) return;
    
    this.interval = setInterval(async () => {
      if (this.isPolling) return; // Skip if previous poll still running
      
      this.isPolling = true;
      try {
        const services = await executeCommand('admin.services.list');
        callback(services);
        this.pollCount++;
        
        // Adaptive polling - slow down after 10 polls
        if (this.pollCount > 10 && intervalMs < 30000) {
          this.restart(callback, intervalMs * 1.5);
        }
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        this.isPolling = false;
      }
    }, intervalMs);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.pollCount = 0;
    }
  }
  
  private restart(callback: (services: Service[]) => void, newInterval: number) {
    this.stop();
    this.start(callback, newInterval);
  }
}
```

---

## 8. Integration Patterns

### 8.1. Command Execution Interface

```typescript
// src/utils/commandFacade.ts
interface CommandParams {
  [key: string]: any;
}

interface CommandResult {
  success?: boolean;
  data?: any;
  error?: string;
  commandPath?: string;
  params?: CommandParams;
}

type CommandExecutor = (params: CommandParams) => Promise<any>;

const COMMAND_REGISTRY: Record<string, CommandExecutor> = {
  // Admin commands
  "admin.services.list": async () => {
    const { listServicesCommand } = await import('../commands/admin.js');
    return listServicesCommand();
  },
  
  "admin.services.restart": async (params) => {
    const { restartServiceCommand } = await import('../commands/admin.js');
    return restartServiceCommand(params.serviceId);
  },
  
  "admin.services.stop": async (params) => {
    const { stopServiceCommand } = await import('../commands/admin.js');
    return stopServiceCommand(params.serviceId);
  },
  
  "admin.services.start": async (params) => {
    const { startServiceCommand } = await import('../commands/admin.js');
    return startServiceCommand(params.serviceId);
  },
  
  // Portal commands
  "users.find": async (params) => {
    const { findUsersCommand } = await import('../commands/users.js');
    return findUsersCommand(params.query);
  },
  
  "groups.list": async () => {
    const { listGroupsCommand } = await import('../commands/groups.js');
    return listGroupsCommand();
  },
  
  "items.search": async (params) => {
    const { searchItemsCommand } = await import('../commands/items.js');
    return searchItemsCommand(params.query);
  },
  
  // Core commands
  "inspect": async (params) => {
    const { inspectCommand } = await import('../commands/inspect.js');
    return inspectCommand(params.url);
  },
  
  "query": async (params) => {
    const { queryCommand } = await import('../commands/query.js');
    return queryCommand(params.url, params.options);
  }
};

export async function executeCommand(
  commandPath: string, 
  params: CommandParams = {}
): Promise<CommandResult> {
  const executor = COMMAND_REGISTRY[commandPath];
  
  if (!executor) {
    return { 
      error: `Command not found: ${commandPath}`, 
      commandPath 
    };
  }
  
  try {
    const result = await executor(params);
    return { 
      success: true, 
      data: result,
      commandPath,
      params
    };
  } catch (error) {
    return { 
      error: error.message, 
      commandPath, 
      params 
    };
  }
}
```

### 8.2. Keyboard Input Handling

```typescript
// src/tui/core/useKeyboard.ts
import { useInput } from 'ink';
import { useNavigation } from './NavigationContext.js';

export const useKeyboardNavigation = () => {
  const { state, dispatch } = useNavigation();
  
  useInput((input, key) => {
    // Global navigation
    if (key.leftArrow || input === 'h') {
      dispatch({ type: 'GO_BACK' });
      return;
    }
    
    if (key.rightArrow || input === 'l') {
      // Drill down logic handled by individual views
      return;
    }
    
    // Global actions
    if (input === 'q') {
      process.exit(0);
    }
    
    if (input === '?') {
      dispatch({ 
        type: 'NAVIGATE_TO', 
        payload: { id: 'help', title: 'Help' }
      });
    }
    
    // Copy functionality
    if (input === 'c') {
      // Implement clipboard copy based on current selection
      handleCopy(state.currentView, state.selection);
    }
  });
};

const handleCopy = async (currentView: any, selection: any) => {
  // Implementation depends on current view and selection
  console.log('Copy functionality for:', currentView.id, selection);
};
```

---

## 9. Development Roadmap

### 9.1. Day-by-Day Implementation Plan

**Day 1: Foundation & Setup**
- [ ] Modify `src/cli.ts` to add `--tui` flag
- [ ] Create TUI directory structure
- [ ] Implement basic Ink app shell
- [ ] Add NavigationContext with basic state management
- [ ] Test: `aci --tui` launches empty TUI

**Day 2: Core Layout**
- [ ] Implement Triptych layout (Header, three panes, Footer)
- [ ] Create FormatterBridge utility
- [ ] Add basic Home view
- [ ] Test: Three-pane layout displays correctly

**Day 3: Admin Integration**
- [ ] Connect admin commands via command facade
- [ ] Implement ServicesListView using existing formatters
- [ ] Add basic keyboard navigation (j/k, l/h)
- [ ] Test: Services list displays and navigates

**Day 4: Preview Panes**
- [ ] Implement ServiceDetailView for right pane
- [ ] Add Left pane context display
- [ ] Implement selection highlighting
- [ ] Test: Full navigation flow works

**Day 5: Actions & Portal**
- [ ] Add action views (restart, stop, start services)
- [ ] Implement portal command integration (users, groups, items)
- [ ] Add command palette (`:` key)
- [ ] Test: Service restart and portal features work

**Day 6: Polish & Error Handling**
- [ ] Add comprehensive error handling
- [ ] Implement session synchronization
- [ ] Add loading states and spinners
- [ ] Performance optimization and testing
- [ ] Documentation updates

### 9.2. Testing Milestones

**Milestone 1 (Day 2)**: Basic TUI launches with three-pane layout
**Milestone 2 (Day 3)**: Admin services list displays correctly
**Milestone 3 (Day 4)**: Full navigation works (drill down/up)
**Milestone 4 (Day 5)**: Actions and portal features functional
**Milestone 5 (Day 6)**: Production-ready with error handling

### 9.3. Success Criteria

- [ ] Zero breaking changes to existing CLI functionality
- [ ] All existing formatters work in TUI without modification
- [ ] Session management compatible between CLI and TUI
- [ ] Performance: <200ms response time for view transitions
- [ ] Memory: <50MB total memory usage
- [ ] Error recovery: Graceful handling of network/auth failures

---

## 10. Testing Strategy

### 10.1. Unit Testing

**Component Testing:**
```typescript
// src/tui/__tests__/FormatterBridge.test.tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { FormatterBridge } from '../utils/formatBridge.js';
import { formatService } from '../utils/output.js';

describe('FormatterBridge', () => {
  it('renders CLI formatter output correctly', () => {
    const mockService = {
      serviceName: 'TestService',
      type: 'FeatureServer',
      status: 'STARTED'
    };
    
    const { lastFrame } = render(
      <FormatterBridge formatter={formatService} data={mockService} />
    );
    
    expect(lastFrame()).toContain('TestService');
    expect(lastFrame()).toContain('FeatureServer');
  });
});
```

**State Management Testing:**
```typescript
// src/tui/__tests__/NavigationContext.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { NavigationProvider, useNavigation } from '../core/NavigationContext.js';

describe('NavigationContext', () => {
  it('handles navigation correctly', () => {
    const wrapper = ({ children }) => (
      <NavigationProvider>{children}</NavigationProvider>
    );
    
    const { result } = renderHook(() => useNavigation(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NAVIGATE_TO',
        payload: { id: 'services-list', title: 'Services' }
      });
    });
    
    expect(result.current.state.currentView.id).toBe('services-list');
  });
});
```

### 10.2. Integration Testing

**Command Facade Testing:**
```typescript
// src/__tests__/commandFacade.test.ts
import { executeCommand } from '../utils/commandFacade.js';

describe('Command Facade', () => {
  it('executes admin commands correctly', async () => {
    const result = await executeCommand('admin.services.list');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  it('handles command errors gracefully', async () => {
    const result = await executeCommand('invalid.command');
    
    expect(result.error).toContain('Command not found');
  });
});
```

### 10.3. End-to-End Testing

**TUI Workflow Testing:**
```typescript
// src/tui/__tests__/workflows.test.tsx
import { render } from 'ink-testing-library';
import { App } from '../App.js';

describe('TUI Workflows', () => {
  it('completes admin service restart workflow', async () => {
    const { stdin, lastFrame, waitUntilExit } = render(<App />);
    
    // Navigate to services
    stdin.write('l'); // Drill down to admin
    stdin.write('l'); // Drill down to services
    
    // Select first service and restart
    stdin.write(':');
    stdin.write('restart');
    stdin.write('\r');
    stdin.write('y'); // Confirm
    
    // Verify success message appears
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(lastFrame()).toContain('Service restarted successfully');
  });
});
```

---

## 11. Performance & Security

### 11.1. Performance Optimization

**Memory Management:**
```typescript
// Implement memory-conscious data structures
class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private tail = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(this.head + i) % this.capacity]);
    }
    return result;
  }
}

// Use for log entries, navigation history, etc.
const logBuffer = new CircularBuffer<LogEntry>(2000);
```

**Component Memoization:**
```typescript
import React, { memo, useMemo } from 'react';

export const ServiceListItem = memo<{
  service: Service;
  isSelected: boolean;
  dimmed?: boolean;
}>( ({ service, isSelected, dimmed }) => {
  const formattedService = useMemo(
    () => formatService(service),
    [service]
  );
  
  return (
    <Text color={isSelected ? 'cyan' : undefined} dimColor={dimmed}>
      {isSelected ? '> ' : '  '}{formattedService}
    </Text>
  );
});
```

### 11.2. Security Considerations

**Session Security:**
```typescript
// Secure session data handling
class SecureSessionManager {
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  
  static isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    const lastAccess = new Date(session.lastAccess).getTime();
    return (now - lastAccess) < this.SESSION_TIMEOUT;
  }
  
  static sanitizeSession(session: SessionData): SessionData {
    // Remove sensitive data that shouldn't be logged
    const { password, ...sanitized } = session;
    return sanitized;
  }
  
  static validateSessionIntegrity(session: SessionData): boolean {
    // Validate required fields and data consistency
    return !!(
      session.environment &&
      session.portalUrl &&
      (session.portalToken || session.username)
    );
  }
}
```

**Input Sanitization:**
```typescript
// Sanitize user input for commands
export const sanitizeCommandInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .replace(/[;&|`$]/g, '') // Remove command injection chars
    .replace(/\.\./g, '')     // Remove path traversal
    .trim()
    .slice(0, 1000);          // Limit length
};
```

### 11.3. Error Recovery Patterns

**Graceful Degradation:**
```typescript
// Component error boundaries for TUI
export class TUIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('TUI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center">
          <Text color="red">⚠ Application Error</Text>
          <Text>Press 'r' to reload or 'q' to quit</Text>
          <Text dimColor>{this.state.error?.message}</Text>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

---

## Conclusion

This blueprint provides a comprehensive implementation guide for the ACI TUI, synthesizing insights from three DeepSeek architectural audits. The design achieves:

- **76% code reuse** from existing CLI infrastructure
- **60% complexity reduction** from original TUI design
- **Enterprise-grade** state management and error handling
- **Zero breaking changes** to existing CLI functionality
- **6-day implementation timeline** with clear milestones

The architecture successfully bridges the existing Commander.js CLI with a sophisticated Ink-based TUI while maintaining YAGNI compliance and elegant simplicity principles. The result is a production-ready terminal interface that enhances user productivity without sacrificing reliability or maintainability.

**Next Steps:**
1. Begin Day 1 implementation tasks
2. Set up testing infrastructure
3. Establish CI/CD pipeline for TUI builds
4. Plan user acceptance testing with beta users

---

*This blueprint serves as the definitive technical specification for ACI TUI development. All implementation decisions should reference this document to ensure architectural consistency and project success.*
import React, { useEffect } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { NavigationProvider, useNavigation } from './hooks/navigation.js';
import { KeyboardProvider } from './hooks/keyboard.js';
import { Layout } from './components/Layout.js';
import { Pane } from './components/Pane.js';
import { HomeView } from './components/views/HomeView.js';
import { LoginView } from './components/views/LoginView.js';
import { ServicesView } from './components/views/ServicesView.js';
import { UsersView } from './components/views/UsersView.js';
import { GroupsView } from './components/views/GroupsView.js';
import { ItemsView } from './components/views/ItemsView.js';
import { AdminView } from './components/views/AdminView.js';
import { InsightsView } from './components/views/InsightsView.js';
import { AnalyticsView } from './components/views/AnalyticsView.js';
import { DatastoresView } from './components/views/DatastoresView.js';
import { ThemePreview } from './components/ThemePreview.js';
import { SessionSync } from './utils/sessionSync.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { useTheme } from './themes/theme-manager.js';
import { HelpSystem, useHelpSystem } from './components/HelpSystem.js';
import { CommandPalette, useCommandPalette } from './components/CommandPalette.js';
import { OnboardingHints, useOnboarding } from './components/OnboardingHints.js';
import { QuickReference, useQuickReference } from './components/QuickReference.js';

function ParentPane() {
  const { state } = useNavigation();
  const { colors } = useTheme();
  
  // Show previous context or breadcrumb
  const parentContext = state.previousView || 'Root';
  
  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text color={colors.metadata}>← {parentContext}</Text>
      </Box>
      <Text color={colors.labels}>Navigation context and breadcrumbs will appear here</Text>
    </Box>
  );
}

function MiddlePane() {
  const { state } = useNavigation();
  
  // Route to appropriate view based on current state
  switch (state.currentView.id) {
    case 'home':
      return <HomeView />;
    case 'login':
      return <LoginView />;
    case 'services':
      return <ServicesView />;
    case 'users':
      return <UsersView />;
    case 'groups':
      return <GroupsView />;
    case 'items':
      return <ItemsView />;
    case 'admin':
      return <AdminView />;
    case 'insights':
      return <InsightsView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'datastores':
      return <DatastoresView />;
    case 'theme-preview':
      return <ThemePreview />;
    case 'service-detail':
      return <Text>Service Detail: {state.selection.serviceId || 'None'}</Text>;
    case 'user-detail':
      return <Text>User Detail: {state.selection.itemId || 'None'}</Text>;
    case 'group-detail':
      return <Text>Group Detail: {state.selection.itemId || 'None'}</Text>;
    case 'item-detail':
      return <Text>Item Detail: {state.selection.itemId || 'None'}</Text>;
    default:
      return <HomeView />;
  }
}

function RightPane() {
  const { state } = useNavigation();
  const { colors, current, name } = useTheme();
  
  // Context-sensitive help based on current view
  const getContextualHelp = () => {
    switch (state.currentView.id) {
      case 'home':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Quick Start Guide</Text>
            <Text dimColor>1. Login to your portal (l)</Text>
            <Text dimColor>2. Browse services (s)</Text>
            <Text dimColor>3. Manage users (u)</Text>
            <Text dimColor>4. Use Esc to navigate back</Text>
          </Box>
        );
      
      case 'login':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Authentication Help</Text>
            <Text dimColor>• API tokens are recommended for enterprise portals</Text>
            <Text dimColor>• Get tokens from Portal → My Profile → Security</Text>
            <Text dimColor>• Username/password works for direct portal auth</Text>
            <Text dimColor>• Supports federated authentication</Text>
          </Box>
        );
      
      case 'services':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Service Management</Text>
            <Text dimColor>• View all ArcGIS Server services</Text>
            <Text dimColor>• Check service status and health</Text>
            <Text dimColor>• Search and filter services</Text>
            <Text dimColor>• Inspect service metadata</Text>
          </Box>
        );
      
      case 'users':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>User Management</Text>
            <Text dimColor>• Requires portal authentication</Text>
            <Text dimColor>• View all portal users</Text>
            <Text dimColor>• Search by username, email, role</Text>
            <Text dimColor>• Inspect user profiles and groups</Text>
          </Box>
        );
      
      case 'groups':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Group Management</Text>
            <Text dimColor>• Requires portal authentication</Text>
            <Text dimColor>• View all portal groups</Text>
            <Text dimColor>• Search by title, owner, tags</Text>
            <Text dimColor>• View membership and access levels</Text>
          </Box>
        );
      
      case 'items':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Item Management</Text>
            <Text dimColor>• Requires portal authentication</Text>
            <Text dimColor>• Browse portal content</Text>
            <Text dimColor>• Filter by item type</Text>
            <Text dimColor>• Share and manage items</Text>
          </Box>
        );
      
      case 'admin':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Server Administration</Text>
            <Text dimColor>• Requires admin authentication</Text>
            <Text dimColor>• Monitor server status</Text>
            <Text dimColor>• Manage services</Text>
            <Text dimColor>• View server logs</Text>
          </Box>
        );
      
      case 'insights':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Enterprise Insights</Text>
            <Text dimColor>• Authentication failure analysis</Text>
            <Text dimColor>• Service health monitoring</Text>
            <Text dimColor>• Command usage trends</Text>
            <Text dimColor>• Resource utilization</Text>
          </Box>
        );
      
      case 'analytics':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Advanced Analytics</Text>
            <Text dimColor>• SQL query console</Text>
            <Text dimColor>• Pre-built analysis templates</Text>
            <Text dimColor>• Database schema explorer</Text>
            <Text dimColor>• Custom data analysis</Text>
          </Box>
        );
      
      case 'datastores':
        return (
          <Box flexDirection="column" gap={1}>
            <Text bold>Datastore Management</Text>
            <Text dimColor>• View all registered datastores</Text>
            <Text dimColor>• Validate connections</Text>
            <Text dimColor>• Monitor health status</Text>
            <Text dimColor>• Performance metrics</Text>
          </Box>
        );
      
      default:
        return (
          <Text dimColor>Context-sensitive help will appear here</Text>
        );
    }
  };
  
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Details & Support</Text>
      
      {getContextualHelp()}
      
      {/* Show current selection if any */}
      {Object.keys(state.selection).length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Current Selection:</Text>
          {state.selection.serviceId && (
            <Text>Service: <Text color="cyan">{state.selection.serviceId}</Text></Text>
          )}
          {state.selection.itemId && (
            <Text>User: <Text color="cyan">{state.selection.itemId}</Text></Text>
          )}
          {state.selection.datastoreId && (
            <Text>Datastore: <Text color="cyan">{state.selection.datastoreId}</Text></Text>
          )}
        </Box>
      )}
      
      {/* Show authentication status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Connection Status:</Text>
        <Text color={colors.primaryText}>Portal: {state.authStatus.portal ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Disconnected</Text>
        }</Text>
        <Text color={colors.primaryText}>Admin: {state.authStatus.admin ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Disconnected</Text>
        }</Text>
      </Box>

      {/* Show current theme */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Current Theme:</Text>
        <Text color={colors.highlights}>{current.scheme}</Text>
        <Text color={colors.metadata}>{name}</Text>
        <Text color={colors.metadata}>[ ] to cycle • r for random</Text>
      </Box>
    </Box>
  );
}

function TuiApp() {
  const { updateAuth, state, navigate } = useNavigation();
  const { exit } = useApp();
  const { nextTheme, previousTheme, randomTheme } = useTheme();
  
  // Help system and documentation features
  const { isVisible: helpVisible, showHelp, hideHelp, toggleHelp } = useHelpSystem();
  const { isVisible: paletteVisible, showPalette, hidePalette } = useCommandPalette();
  const { isVisible: referenceVisible, showReference, hideReference } = useQuickReference();
  const { 
    userInteractions, 
    trackSelection, 
    trackKeyboardUse, 
    resetViewTracking 
  } = useOnboarding();
  
  // Set up session monitoring
  useEffect(() => {
    const sessionSync = new SessionSync();
    
    // Initial session read
    sessionSync.readSession().then(updateAuth);
    
    // Start monitoring for changes
    const stopMonitoring = sessionSync.startMonitoring(updateAuth);
    
    return stopMonitoring;
  }, [updateAuth]);

  // Reset onboarding tracking when view changes
  useEffect(() => {
    resetViewTracking();
  }, [state.currentView.id, resetViewTracking]);
  
  // Global key handlers
  useInput((input, key) => {
    // Skip if any overlay is visible to prevent conflicts
    if (helpVisible || paletteVisible || referenceVisible) {
      return;
    }
    
    // Track keyboard usage for onboarding
    trackKeyboardUse();
    
    // Help system
    if (input === '?') {
      toggleHelp();
      return;
    }
    
    // Command palette
    if (input === ':') {
      showPalette();
      return;
    }
    
    // Quick reference (with auto-hide)
    if (key.ctrl && input === 'h') {
      showReference();
      return;
    }
    
    // Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }
    
    // Theme switching (only if no overlays are visible)
    if (input === ']') {
      nextTheme();
    } else if (input === '[') {
      previousTheme();
    } else if (input === 'r') {
      randomTheme();
    }
  }, { isActive: !helpVisible && !paletteVisible && !referenceVisible });
  
  // Handle command palette actions
  const handlePaletteAction = (action: string) => {
    switch (action) {
      case 'refresh':
        // Trigger refresh in current view
        break;
      case 'search':
        // TODO: Trigger search mode
        break;
      case 'help':
        showHelp();
        break;
      case 'quit':
        exit();
        break;
      case 'clearSelection':
        // TODO: Clear selection
        break;
      case 'selectAll':
        // TODO: Select all
        break;
      case 'changeTheme':
        nextTheme();
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <KeyboardProvider 
      viewId={state.currentView.id}
      onKeyPress={(key, action) => {
        // Track keyboard usage for onboarding
        trackKeyboardUse();
      }}
    >
      <Layout>
        <Pane title="Parent Context" width={25}>
          <ParentPane />
        </Pane>
        
        <Pane title="Active Workspace" width={50} isActive>
          <MiddlePane />
        </Pane>
        
        <Pane title="Detail & Support" width={25}>
          <RightPane />
        </Pane>
        
        {/* Overlay components */}
        <HelpSystem
          visible={helpVisible}
          onClose={hideHelp}
          currentView={state.currentView.id}
          currentMode="NAVIGATION"
        />
        
        <CommandPalette
          visible={paletteVisible}
          onClose={hidePalette}
          onNavigate={navigate}
          onAction={handlePaletteAction}
        />
        
        <QuickReference
          visible={referenceVisible}
          onClose={hideReference}
          viewId={state.currentView.id}
        />
        
        <OnboardingHints
          currentView={state.currentView.id}
          userInteractions={userInteractions}
        />
      </Layout>
    </KeyboardProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NavigationProvider>
        <TuiApp />
      </NavigationProvider>
    </ErrorBoundary>
  );
}

export async function startTui() {
  render(<App />);
}
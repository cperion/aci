import React, { useEffect } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { NavigationProvider, useNavigation } from './hooks/navigation.js';
import { Layout } from './components/Layout.js';
import { Pane } from './components/Pane.js';
import { HomeView } from './components/views/HomeView.js';
import { LoginView } from './components/views/LoginView.js';
import { ServicesView } from './components/views/ServicesView.js';
import { UsersView } from './components/views/UsersView.js';
import { SessionSync } from './utils/sessionSync.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

function ParentPane() {
  const { state } = useNavigation();
  
  // Show previous context or breadcrumb
  const parentContext = state.previousView || 'Root';
  
  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text dimColor>← {parentContext}</Text>
      </Box>
      <Text dimColor>Navigation context and breadcrumbs will appear here</Text>
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
    case 'service-detail':
      return <Text>Service Detail: {state.selection.serviceId || 'None'}</Text>;
    case 'user-detail':
      return <Text>User Detail: {state.selection.itemId || 'None'}</Text>;
    default:
      return <HomeView />;
  }
}

function RightPane() {
  const { state } = useNavigation();
  
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
        <Text bold>Connection Status:</Text>
        <Text>Portal: {state.authStatus.portal ? 
          <Text color="green">✓ Connected</Text> : 
          <Text color="yellow">○ Disconnected</Text>
        }</Text>
        <Text>Admin: {state.authStatus.admin ? 
          <Text color="green">✓ Connected</Text> : 
          <Text color="yellow">○ Disconnected</Text>
        }</Text>
      </Box>
    </Box>
  );
}

function TuiApp() {
  const { updateAuth } = useNavigation();
  const { exit } = useApp();
  
  // Set up session monitoring
  useEffect(() => {
    const sessionSync = new SessionSync();
    
    // Initial session read
    sessionSync.readSession().then(updateAuth);
    
    // Start monitoring for changes
    const stopMonitoring = sessionSync.startMonitoring(updateAuth);
    
    return stopMonitoring;
  }, [updateAuth]);
  
  // Global key handlers
  useInput((input, key) => {
    // Ctrl+C to exit
    if (key.ctrl && input === 'c') {
      exit();
    }
  });
  
  return (
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
    </Layout>
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
import React, { useEffect } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { AtomicContextProviders } from './contexts/index.js';
import { useAuth } from '../hooks/use-auth.js';
import { DatabaseService } from '../services/database-service.js';
import { useNavigation } from '../hooks/use-navigation.js';
// Removed useActionRegistry - using simplified keyboard handling now
import { useRecentTracking } from './hooks/useRecentTracking.js';
import { useAuthStatus, useCurrentView, useCurrentSelection, useSelectionCount, useActionContext } from './hooks/useContextSelector.js';
// Removed action resolvers - using simplified keyboard handling now
import { useKeyboardGateway } from './hooks/useKeyboardGateway.js';
import { Layout } from './components/Layout.js';
import { Pane } from './components/Pane.js';
import { getView } from './utils/view-registry.js';
import { SessionSync } from './utils/sessionSync.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { useTheme } from './themes/theme-manager.js';
import { HelpSystem, useHelpSystem } from './components/HelpSystem.js';
import { CommandPalette, useCommandPalette } from './components/CommandPalette.js';
import { OnboardingHints, useOnboarding } from './components/OnboardingHints.js';
import { QuickReference, useQuickReference } from './components/QuickReference.js';
import { UniversalSearch, useUniversalSearchModal } from './components/UniversalSearch.js';
import { NotificationSystem } from './components/NotificationSystem.js';

const NavigationPane = React.memo(() => {
  const { colors } = useTheme();
  const { currentView, navigate } = useNavigation();
  const authStatus = useAuthStatus();
  const recentItems = DatabaseService.getRecentItems('view', 5);
  const parentContext = 'Root'; // previousView was removed in simplification
  
  // Quick access handlers
  const quickAccess = {
    login: () => navigate('login', 'Authentication'),
    services: () => navigate('services', 'Service Browser'),
    users: () => navigate('users', 'User Management'),
    groups: () => navigate('groups', 'Group Management'),
    items: () => navigate('items', 'Item Management'),
    admin: () => navigate('admin', 'Server Administration'),
    insights: () => navigate('insights', 'Enterprise Insights'),
    analytics: () => navigate('analytics', 'Advanced Analytics'),
    datastores: () => navigate('datastores', 'Datastore Management')
  };
  
  return (
    <Box flexDirection="column" gap={1}>
      {/* Breadcrumb */}
      <Box>
        <Text color={colors.metadata}>← {parentContext}</Text>
      </Box>
      
      {/* Connection Status (moved from InspectionPane) */}
      <Box flexDirection="column">
        <Text bold color={colors.labels}>Connection Status:</Text>
        <Text color={colors.primaryText}>Portal: {authStatus.portal ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Disconnected</Text>
        }</Text>
        <Text color={colors.primaryText}>Admin: {authStatus.admin ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Disconnected</Text>
        }</Text>
      </Box>
      
      {/* Quick Access Menu - Now the single source of truth */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Quick Access:</Text>
        <Text color={colors.metadata}>[l] Login</Text>
        <Text color={colors.metadata}>[s] Services</Text>
        <Text color={colors.metadata}>[u] Users</Text>
        <Text color={colors.metadata}>[g] Groups</Text>
        <Text color={colors.metadata}>[i] Items</Text>
        <Text color={colors.metadata}>[a] Admin</Text>
        <Text color={colors.metadata}>[n] Insights</Text>
        <Text color={colors.metadata}>[t] Analytics</Text>
        <Text color={colors.metadata}>[d] Datastores</Text>
      </Box>
      
      {/* Recent items */}
      {recentItems.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={colors.labels}>Recent:</Text>
          {recentItems.slice(0, 4).map((item, i) => (
            <Text key={item.id} color={colors.metadata}>
              {i + 1}. {item.type === 'service' ? '⚙️' : 
                      item.type === 'user' ? '👤' : 
                      item.type === 'group' ? '👥' : 
                      item.type === 'item' ? '📄' : '🗄️'} {item.name}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
});

const ContentPane = React.memo(() => {
  const { colors } = useTheme();
  const { currentView } = useNavigation();
  const authStatus = useAuthStatus();
  const selectedCount = useSelectionCount();
  
  // Main content area - now using view registry
  const renderMainContent = () => {
    const ViewComponent = getView(currentView?.id || 'home');
    return <ViewComponent />;
  };
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Main content area */}
      <Box flexGrow={1}>
        {renderMainContent()}
      </Box>
      
      {/* Status bar as designed in Option B */}
      <Box borderStyle="single" borderTop borderColor={colors.metadata} paddingX={1}>
        <Text color={colors.metadata}>
          Portal:{authStatus.portal ? '✓' : '○'} | 
          {selectedCount > 0 && `${selectedCount} selected | `}
          Help:? | 
          <Text color={colors.labels}>{currentView?.id || 'home'}</Text>
        </Text>
      </Box>
    </Box>
  );
});

const InspectionPane = React.memo(() => {
  const { colors, current, name } = useTheme();
  const { currentView } = useNavigation();
  // Removed action registry - using simplified keyboard handling now
  
  // Stub values for now - will be replaced with proper selection state
  const selectionState: Record<string, string> = {};
  const availableActions: Array<{ id: string; label: string; shortcut?: string }> = [];
  
  return (
    <Box flexDirection="column" gap={1}>
      {/* Show current selection details first */}
      {Object.keys(selectionState).length > 0 ? (
        <Box flexDirection="column">
          <Text bold color={colors.labels}>Selection Details</Text>
          {selectionState['serviceId'] && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={colors.highlights}>Service: {selectionState['serviceId']}</Text>
              <Text color={colors.metadata}>Type: ArcGIS Service</Text>
              <Text color={colors.metadata}>Status: Active</Text>
            </Box>
          )}
          {selectionState['itemId'] && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={colors.highlights}>User: {selectionState['itemId']}</Text>
              <Text color={colors.metadata}>Type: Portal User</Text>
            </Box>
          )}
          {selectionState['datastoreId'] && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={colors.highlights}>Datastore: {selectionState['datastoreId']}</Text>
              <Text color={colors.metadata}>Type: Data Store</Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text bold color={colors.labels}>No Selection</Text>
          <Text color={colors.metadata}>Select an item to see details</Text>
        </Box>
      )}
      
      {/* Show available actions for current selection/context */}
      {availableActions.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={colors.labels}>Quick Actions</Text>
          {availableActions.slice(0, 5).map((action) => (
            <Text key={action.id} color={colors.metadata}>
              {action.shortcut && `[${action.shortcut}] `}{action.label}
            </Text>
          ))}
          {availableActions.length > 5 && (
            <Text color={colors.metadata}>... +{availableActions.length - 5} more</Text>
          )}
        </Box>
      )}
      
      {/* Contextual help - more concise */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Help</Text>
        {currentView?.id === 'home' && (
          <Text color={colors.metadata}>Use keyboard shortcuts to navigate</Text>
        )}
        {currentView?.id === 'services' && (
          <Text color={colors.metadata}>Select service to see actions</Text>
        )}
        {currentView?.id === 'users' && (
          <Text color={colors.metadata}>Portal auth required</Text>
        )}
        <Text color={colors.metadata}>Press ? for full help</Text>
      </Box>
      
      {/* Theme info - compact */}
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.metadata}>Theme: {current.scheme}</Text>
        <Text color={colors.metadata}>[ ] cycle • r random</Text>
      </Box>
    </Box>
  );
});

// Simplified keyboard handling with unified gateway
function KeyboardManager() {
  const { nextTheme, previousTheme, randomTheme } = useTheme();
  const { trackKeyboardUse } = useOnboarding();
  const { 
    isVisible: helpVisible 
  } = useHelpSystem();
  const { 
    isVisible: paletteVisible 
  } = useCommandPalette();
  const { 
    isVisible: referenceVisible 
  } = useQuickReference();
  const { 
    isVisible: searchVisible 
  } = useUniversalSearchModal();

  // Initialize keyboard gateway
  const { registerGlobalBindings } = useKeyboardGateway();

  // Register theme switching handlers
  useEffect(() => {
    registerGlobalBindings({
      ']': { key: ']', handler: nextTheme, description: 'Next Theme', category: 'ui' },
      '[': { key: '[', handler: previousTheme, description: 'Previous Theme', category: 'ui' },
      'R': { key: 'R', handler: randomTheme, description: 'Random Theme', category: 'ui' }, // Capital R to avoid conflict with refresh
    });
  }, [registerGlobalBindings, nextTheme, previousTheme, randomTheme]);

  // Handle special keys that need overlay awareness
  useInput((input, key) => {
    // Skip if any overlay is visible to prevent conflicts
    if (helpVisible || paletteVisible || referenceVisible || searchVisible) {
      return;
    }
    
    // Track keyboard usage for onboarding
    trackKeyboardUse();
  }, { isActive: !helpVisible && !paletteVisible && !referenceVisible && !searchVisible });

  return null; // This component doesn't render anything
}

function TuiApp() {
  const { updateAuth } = useAuth();
  const { currentView, navigate, goBack } = useNavigation();
  
  // Removed action registry integration - using simplified patterns now
  
  // Track recent items automatically
  useRecentTracking();
  
  // Help system and documentation features
  const { isVisible: helpVisible, showHelp, hideHelp, toggleHelp } = useHelpSystem();
  const { isVisible: paletteVisible, showPalette, hidePalette } = useCommandPalette();
  const { isVisible: referenceVisible, showReference, hideReference } = useQuickReference();
  const { isVisible: searchVisible, show: showSearch, hide: hideSearch, toggle: toggleSearch } = useUniversalSearchModal();
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
  }, [currentView?.id, resetViewTracking]);
  
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
        process.exit(0);
        break;
      case 'clearSelection':
        // TODO: Clear selection
        break;
      case 'selectAll':
        // TODO: Select all
        break;
      case 'changeTheme':
        // Theme change handled by keyboard manager
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const currentViewId = currentView?.id || 'home';

  return (
    <>
      <KeyboardManager />
      <Layout>
        <Pane title="Navigation" width={30}>
          <NavigationPane />
        </Pane>
        
        <Pane title="Content" width={50} isActive>
          <ContentPane />
        </Pane>
        
        <Pane title="Inspection" width={20}>
          <InspectionPane />
        </Pane>
        
        {/* Overlay components */}
        <HelpSystem
          visible={helpVisible}
          onClose={hideHelp}
          currentView={currentViewId}
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
          viewId={currentViewId}
        />
        
        <OnboardingHints
          currentView={currentViewId}
          userInteractions={userInteractions}
        />
        
        <UniversalSearch
          visible={searchVisible}
          onClose={hideSearch}
        />
        
        {/* Notification System - positioned as overlay */}
        <NotificationSystem position="top-right" maxNotifications={3} />
      </Layout>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AtomicContextProviders>
        <TuiApp />
      </AtomicContextProviders>
    </ErrorBoundary>
  );
}

export async function startTui() {
  render(<App />);
}
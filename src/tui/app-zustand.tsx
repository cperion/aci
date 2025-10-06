/**
 * TUI App with Zustand State Management
 * Migrated from hook-based state to centralized stores
 */

import React, { useEffect } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { useTheme } from './themes/theme-manager.js';
import { DatabaseService } from '../services/database-service.js';
import { 
  useAuthStore, 
  selectAuthStatus 
} from './stores/index.js';
import { 
  useNavigationStore, 
  selectCurrentView,
  useNavigationActions 
} from './stores/index.js';
import { 
  useUIStore, 
  selectOverlays,
  useOverlayActions,
  useThemeActions 
} from './stores/index.js';
import { 
  useEntityStore, 
  selectEntitySelection 
} from './stores/index.js';
import type { EntityState } from './stores/types.js';
import { Layout } from './components/Layout.js';
import { Pane } from './components/Pane.js';
import { getView } from './utils/view-registry.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { HelpSystem } from './components/HelpSystem.js';
import { CommandPalette } from './components/CommandPalette.js';
import { OnboardingHints, useOnboarding } from './components/OnboardingHints.js';
import { QuickReference } from './components/QuickReference.js';
import { UniversalSearch } from './components/UniversalSearch.js';
import { NotificationSystem } from './components/NotificationSystem.js';
import { useRecentTracking } from './hooks/useRecentTracking.js';

const NavigationPane = React.memo(() => {
  const { colors } = useTheme();
  const currentView = useNavigationStore(selectCurrentView);
  const authStatus = useAuthStore(selectAuthStatus);
  const { navigate } = useNavigationActions();
  const recentItems = DatabaseService.getRecentItems('view', 5);
  
  // Quick access handlers - stable references from store
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
        <Text color={colors.metadata}>← Root</Text>
      </Box>
      
      {/* Connection Status */}
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
      
      {/* Quick Access Menu */}
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
  const currentView = useNavigationStore(selectCurrentView);
  const authStatus = useAuthStore(selectAuthStatus);
  
  // Get selection count from entity store based on current view
  const getSelectionCount = () => {
    if (!currentView) return 0;
    
    const entityType = currentView.id;
    if (['users', 'groups', 'items', 'services', 'admin'].includes(entityType)) {
      const entityState = useEntityStore.getState()[entityType as keyof EntityState];
      const selection = entityState && typeof entityState === 'object' && 'selected' in entityState ? entityState.selected : undefined;
      return selection?.size || 0;
    }
    return 0;
  };
  
  const selectedCount = getSelectionCount();
  
  // Main content area
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
      
      {/* Status bar */}
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
  const currentView = useNavigationStore(selectCurrentView);
  
  // Get selection state from entity store
  const getSelectionState = () => {
    if (!currentView) return {};
    
    const entityType = currentView.id;
    if (['users', 'groups', 'items', 'services', 'admin'].includes(entityType)) {
      const entityState = useEntityStore.getState()[entityType as keyof EntityState];
      if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) return { selectedIds: [], currentItem: null, hasSelection: false };
      const selectedIds = Array.from(entityState.selected);
      const currentItem = useEntityStore.getState().getCurrentItem(entityType);
      
      return {
        selectedIds,
        currentItem,
        hasSelection: selectedIds.length > 0
      };
    }
    return { selectedIds: [], currentItem: null, hasSelection: false };
  };
  
  const { selectedIds, currentItem, hasSelection } = getSelectionState();
  
  // Available actions based on current context
  const getAvailableActions = () => {
    const actions: Array<{ id: string; label: string; shortcut?: string }> = [];
    
    if (currentView?.id === 'services' && currentItem) {
      actions.push(
        { id: 'inspect', label: 'Inspect Service', shortcut: 'i' },
        { id: 'query', label: 'Query Features', shortcut: 'q' }
      );
    }
    
    if (hasSelection) {
      actions.push(
        { id: 'export', label: 'Export Selected', shortcut: 'e' },
        { id: 'delete', label: 'Delete Selected', shortcut: 'd' }
      );
    }
    
    return actions;
  };
  
  const availableActions = getAvailableActions();
  
  return (
    <Box flexDirection="column" gap={1}>
      {/* Show current selection details */}
      {hasSelection && currentItem ? (
        <Box flexDirection="column">
          <Text bold color={colors.labels}>Selection Details</Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color={colors.highlights}>
              {currentView?.id === 'users' ? 'User: ' :
               currentView?.id === 'services' ? 'Service: ' :
               currentView?.id === 'groups' ? 'Group: ' :
               currentView?.id === 'items' ? 'Item: ' :
               'Selected: '}
              {currentItem.name || currentItem.title || currentItem.username || currentItem.id}
            </Text>
            <Text color={colors.metadata}>
              Type: {currentView?.id?.slice(0, -1) || 'Unknown'}
            </Text>
            <Text color={colors.metadata}>
              Status: Active
            </Text>
            {selectedIds.length > 1 && (
              <Text color={colors.metadata}>
                + {selectedIds.length - 1} more selected
              </Text>
            )}
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text bold color={colors.labels}>No Selection</Text>
          <Text color={colors.metadata}>Select an item to see details</Text>
        </Box>
      )}
      
      {/* Show available actions */}
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
      
      {/* Contextual help */}
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
      
      {/* Theme info */}
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.metadata}>Theme: {current.scheme}</Text>
        <Text color={colors.metadata}>[ ] cycle • r random</Text>
      </Box>
    </Box>
  );
});

// Simplified keyboard manager using store actions
function KeyboardManager() {
  const { exit } = useApp();
  const { nextTheme, previousTheme, randomTheme } = useThemeActions();
  const { trackKeyboardUse } = useOnboarding();
  const overlays = useUIStore(selectOverlays);
  const { navigate } = useNavigationActions();
  
  // Check if any overlay is visible
  const isOverlayVisible = Object.values(overlays).some(visible => visible);
  
  // Handle keyboard input with stable actions
  useInput((input, key) => {
    // Skip if overlay is visible
    if (isOverlayVisible) return;
    
    // Navigation shortcuts
    switch (input) {
      case 'l':
        navigate('login', 'Authentication');
        break;
      case 's':
        navigate('services', 'Service Browser');
        break;
      case 'u':
        navigate('users', 'User Management');
        break;
      case 'g':
        navigate('groups', 'Group Management');
        break;
      case 'i':
        navigate('items', 'Item Management');
        break;
      case 'a':
        navigate('admin', 'Server Administration');
        break;
      case 'n':
        navigate('insights', 'Enterprise Insights');
        break;
      case 't':
        navigate('analytics', 'Advanced Analytics');
        break;
      case 'd':
        navigate('datastores', 'Datastore Management');
        break;
      case 'h':
        navigate('home', 'Home');
        break;
      case '?':
        useUIStore.getState().showHelp();
        break;
      case ':':
        useUIStore.getState().showCommandPalette();
        break;
      case '/':
        useUIStore.getState().showUniversalSearch();
        break;
      case 'Escape':
        useNavigationStore.getState().goBack();
        break;
      case 'r':
        if (!key.ctrl) {
          // Regular 'r' for refresh
          window.location?.reload?.();
        }
        break;
      case 'R':
        randomTheme();
        break;
      case '[':
        previousTheme();
        break;
      case ']':
        nextTheme();
        break;
      default:
        // Track unhandled keys for onboarding
        trackKeyboardUse();
    }
    
    // Ctrl combinations
    if (key.ctrl) {
      switch (input) {
        case 'c':
          exit();
          break;
        case 'l':
          useAuthStore.getState().logoutAll();
          break;
        case 'k':
          useUIStore.getState().showCommandPalette();
          break;
        case 'f':
          useUIStore.getState().showUniversalSearch();
          break;
        case 'h':
          useUIStore.getState().showQuickReference();
          break;
      }
    }
  }, { isActive: !isOverlayVisible });

  return null;
}

function TuiApp() {
  // Session monitoring is now handled in the AuthStore
  // No need for useEffect here!
  
  // Use store selectors directly
  const currentView = useNavigationStore(selectCurrentView);
  const overlays = useUIStore(selectOverlays);
  
  // Actions from stores (stable references)
  const { showHelp, hideHelp, toggleHelp } = useOverlayActions();
  const { showPalette, hidePalette } = useOverlayActions();
  const { showReference, hideReference } = useOverlayActions();
  const { show: showSearch, hide: hideSearch, toggle: toggleSearch } = useOverlayActions();
  const { navigate } = useNavigationActions();
  
  // Onboarding (keep as is for now)
  const { 
    userInteractions, 
    trackKeyboardUse, 
    resetViewTracking 
  } = useOnboarding();
  
  // Track recent items
  useRecentTracking();
  
  // Reset onboarding tracking when view changes
  useEffect(() => {
    resetViewTracking();
  }, [currentView?.id, resetViewTracking]);
  
  // Handle command palette actions
  const handlePaletteAction = (action: string) => {
    switch (action) {
      case 'refresh':
        window.location?.reload?.();
        break;
      case 'search':
        showSearch();
        break;
      case 'help':
        showHelp();
        break;
      case 'quit':
        process.exit(0);
        break;
      case 'clearSelection':
        // Clear selection for current view
        if (currentView?.id) {
          useEntityStore.getState().clearSelection(currentView.id);
        }
        break;
      case 'selectAll':
        // Select all for current view
        if (currentView?.id) {
          useEntityStore.getState().selectAll(currentView.id);
        }
        break;
      case 'changeTheme':
        // Theme changes handled by keyboard manager
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
          visible={overlays.help}
          onClose={hideHelp}
          currentView={currentViewId}
          currentMode="NAVIGATION"
        />
        
        <CommandPalette
          visible={overlays.commandPalette}
          onClose={hidePalette}
          onNavigate={navigate}
          onAction={handlePaletteAction}
        />
        
        <QuickReference
          visible={overlays.quickReference}
          onClose={hideReference}
          viewId={currentViewId}
        />
        
        <OnboardingHints
          currentView={currentViewId}
          userInteractions={userInteractions}
        />
        
        <UniversalSearch
          visible={overlays.universalSearch}
          onClose={hideSearch}
        />
        
        {/* Notification System */}
        <NotificationSystem position="top-right" maxNotifications={3} />
      </Layout>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TuiApp />
    </ErrorBoundary>
  );
}

export async function startTui() {
  render(<App />);
}
import { useMemo } from 'react';
import { useAuthStore, useNavigationStore } from '../stores/index.js';

/**
 * Performance-optimized context selectors
 * These hooks allow components to subscribe to only specific parts of context state
 */

// Auth context selectors
export function useAuthStatus() {
  const portal = useAuthStore(state => state.portal);
  const admin = useAuthStore(state => state.admin);
  return useMemo(() => ({
    portal,
    admin
  }), [portal, admin]);
}

export function usePortalAuth() {
  const portal = useAuthStore(state => state.portal);
  return useMemo(() => portal, [portal]);
}

export function useAdminAuth() {
  const admin = useAuthStore(state => state.admin);
  return useMemo(() => admin, [admin]);
}

// Navigation context selectors
export function useCurrentView() {
  const currentView = useNavigationStore(state => state.currentView);
  return useMemo(() => ({
    id: currentView?.id || 'home',
    title: currentView?.title || 'ACI Dashboard'
  }), [currentView?.id, currentView?.title]);
}

export function useViewHistory() {
  const history = useNavigationStore(state => state.history);
  return useMemo(() => ({
    current: history[history.length - 1]?.id || 'home',
    previous: history.length > 1 ? history[history.length - 2]?.id : undefined
  }), [history]);
}

// Selection context selectors - simplified for new local state pattern
export function useCurrentSelection() {
  // With the new pattern, each component manages its own selection
  // This becomes a no-op since selection is now local to components
  return null;
}

export function useSelectionCount() {
  // With the new pattern, each component manages its own selection count
  // This becomes a placeholder since selection is now local to components
  return 0;
}

export function useHasSelection() {
  // With the new pattern, each component manages its own selection state
  // This becomes a placeholder since selection is now local to components
  return false;
}

// Combined selectors for common use cases
export function useActionContext() {
  const currentView = useCurrentView();
  const currentSelection = useCurrentSelection();
  const authStatus = useAuthStatus();
  
  return useMemo(() => ({
    viewId: currentView.id,
    selection: currentSelection,
    authState: authStatus
  }), [currentView.id, currentSelection, authStatus]);
}
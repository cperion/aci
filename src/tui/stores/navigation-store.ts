/**
 * Navigation Store - Centralized navigation state management
 * Handles navigation history with auth awareness and prevents unauthorized access
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useAuthStore } from './auth-store.js';
import type { NavigationState, StoreSetOptions } from './types.js';

interface NavigationStore extends NavigationState {
  // Actions
  navigate: (viewId: string, title?: string, params?: Record<string, any>) => void;
  goBack: () => void;
  navigateReplace: (viewId: string, title: string, params?: Record<string, any>) => void;
  goToRoot: () => void;
  
  // Computed
  canGoBack: boolean;
  currentView: NavigationState['history'][0] | null;
  
  
}

// Views that require authentication
const AUTH_REQUIRED_VIEWS = new Set([
  'users',
  'groups', 
  'items',
  'insights',
  'analytics'
]);

const ADMIN_REQUIRED_VIEWS = new Set([
  'admin',
  'datastores'
]);

// Debug instrumentation
const debugLog = (action: string, data: any, source: string = 'unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NavigationStore] ${action}`, {
      data,
      source,
      stack: new Error().stack?.split('\n').slice(3, 6).join('\n'),
      time: Date.now()
    });
  }
};

export const useNavigationStore = create<NavigationStore>()(
  subscribeWithSelector((set, get) => {
    return {
      // Initial state
      history: [
        { id: 'home', title: 'ACI Dashboard', params: {} }
      ],
      
      // Computed properties
      get canGoBack() {
        return get().history.length > 1;
      },
      
      get currentView() {
        const history = get().history;
        return history[history.length - 1] || null;
      },
      
      

      // Actions
      navigate: (viewId, title = viewId.charAt(0).toUpperCase() + viewId.slice(1), params = {}) => {
        const { portal, admin } = useAuthStore.getState();
        
        // Check auth requirements
        if (AUTH_REQUIRED_VIEWS.has(viewId) && !portal) {
          debugLog('navigate redirect', { from: viewId, to: 'login', reason: 'auth-required' }, 'auth-check');
          
          // Redirect to login with return intent
          set((state) => ({
            history: [
              ...state.history,
              { 
                id: 'login', 
                title: 'Authentication',
                params: { returnTo: viewId } 
              }
            ]
          }), false);
          return;
        }
        
        if (ADMIN_REQUIRED_VIEWS.has(viewId) && !admin) {
          debugLog('navigate redirect', { from: viewId, to: 'admin-login', reason: 'admin-required' }, 'auth-check');
          
          // Redirect to admin login
          set((state) => ({
            history: [
              ...state.history,
              { 
                id: 'admin-login', 
                title: 'Admin Authentication',
                params: { returnTo: viewId }
              }
            ]
          }), false);
          return;
        }
        
        debugLog('navigate', { viewId, title, params }, 'user');
        
        set((state) => ({
          history: [
            ...state.history,
            { id: viewId, title, params }
          ]
        }), false);
      },

      goBack: () => {
        const state = get();
        
        if (state.history.length > 1) {
          debugLog('goBack', { 
            from: state.currentView?.id, 
            to: state.history[state.history.length - 2]?.id 
          }, 'user');
          
          set({
            history: state.history.slice(0, -1),
            _debug: {
              lastUpdate: Date.now(),
              source: 'goBack'
            }
          }, false);
        }
      },

      navigateReplace: (viewId, title, params = {}) => {
        const { portal, admin } = useAuthStore.getState();
        
        // Check auth requirements
        if (AUTH_REQUIRED_VIEWS.has(viewId) && !portal) {
          debugLog('navigateReplace redirect', { from: viewId, to: 'login' }, 'auth-check');
          
          set((state) => ({
            history: [
              ...state.history.slice(0, -1),
              { 
                id: 'login', 
                title: 'Authentication',
                params: { returnTo: viewId }
              }
            ]
          }), false);
          return;
        }
        
        if (ADMIN_REQUIRED_VIEWS.has(viewId) && !admin) {
          debugLog('navigateReplace redirect', { from: viewId, to: 'admin-login' }, 'auth-check');
          
          set((state) => ({
            history: [
              ...state.history.slice(0, -1),
              { 
                id: 'admin-login', 
                title: 'Admin Authentication',
                params: { returnTo: viewId }
              }
            ]
          }), false);
          return;
        }
        
        debugLog('navigateReplace', { viewId, title, params }, 'user');
        
        set((state) => ({
          history: [
            ...state.history.slice(0, -1),
            { id: viewId, title, params }
          ]
        }), false);
      },

      goToRoot: () => {
        debugLog('goToRoot', {}, 'user');
        
        set({
          history: [
            { id: 'home', title: 'ACI Dashboard', params: {} }
          ]
        }, false);
      }
    };
  })
);

// Export selectors for common use cases
export const selectCurrentView = (state: NavigationStore) => state.currentView;

// Removed selectViewHistory as it creates new objects and isn't used

export const selectCanGoBack = (state: NavigationStore) => state.canGoBack;

// Hook for components that need navigation actions
export const useNavigationActions = () => {
  const navigate = useNavigationStore(state => state.navigate);
  const goBack = useNavigationStore(state => state.goBack);
  const navigateReplace = useNavigationStore(state => state.navigateReplace);
  const goToRoot = useNavigationStore(state => state.goToRoot);
  
  return { navigate, goBack, navigateReplace, goToRoot };
};
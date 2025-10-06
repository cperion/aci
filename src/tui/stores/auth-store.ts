/**
 * Auth Store - Centralized authentication state management
 * Replaces the useAuth hook with Zustand for stable references and better state control
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SessionManager } from '../../services/session-manager.js';
import { SessionSync } from '../utils/sessionSync.js';
import type { AuthState, StoreSetOptions } from './types.js';

interface AuthStore extends AuthState {
  // Actions
  loginPortal: (sessionData: any) => Promise<void>;
  loginAdmin: (sessionData: any) => Promise<void>;
  updateAuth: (authData: Partial<AuthState>, options?: StoreSetOptions) => void;
  logoutPortal: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  logoutAll: () => Promise<void>;
  
  // Internal
  _sessionSync: SessionSync | null;
}

// Debug instrumentation
const debugLog = (action: string, data: any, source: string = 'unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[AuthStore] ${action}`, {
      data,
      source,
      stack: new Error().stack?.split('\n').slice(3, 6).join('\n'),
      time: Date.now()
    });
  }
};

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => {
    // Initialize session sync
    const sessionSync = new SessionSync();
    
    return {
      // Initial state
      portal: false,
      admin: false,
      portalSession: null,
      adminSession: null,
      _sessionSync: sessionSync,
      

      // Actions
      loginPortal: async (sessionData) => {
        debugLog('loginPortal', { hasSession: !!sessionData }, 'user');
        
        set((state) => ({
          ...state,
          portal: true,
          portalSession: sessionData
        }), false);
        
        // Update session file
        try {
          const currentSession = await SessionManager.getSession() || {};
          await SessionManager.setSession({
            ...currentSession,
            portal: true,
            portalSession: sessionData
          });
        } catch (error) {
          console.warn('Failed to save portal session:', error);
        }
      },

      loginAdmin: async (sessionData) => {
        debugLog('loginAdmin', { hasSession: !!sessionData }, 'user');
        
        set((state) => ({
          ...state,
          admin: true,
          adminSession: sessionData,
          _debug: {
            lastUpdate: Date.now(),
            source: 'loginAdmin'
          }
        }), false);
        
        // Update session file
        try {
          const currentSession = await SessionManager.getSession() || {};
          await SessionManager.setSession({
            ...currentSession,
            admin: true,
            adminSession: sessionData
          });
        } catch (error) {
          console.warn('Failed to save admin session:', error);
        }
      },

      updateAuth: (authData, options = {}) => {
        const { silent = false, source = 'unknown' } = options;
        
        if (!silent) {
          debugLog('updateAuth', authData, source);
        }
        
        set((state) => {
          const newState = {
            ...state,
            ...authData,
            _debug: {
              lastUpdate: Date.now(),
              source: `updateAuth:${source}`
            }
          };
          
          return newState;
        }, false);
      },

      logoutPortal: async () => {
        debugLog('logoutPortal', {}, 'user');
        
        set((state) => ({
          ...state,
          portal: false,
          portalSession: null,
          _debug: {
            lastUpdate: Date.now(),
            source: 'logoutPortal'
          }
        }), false);
        
        // Update session file
        try {
          const currentSession = await SessionManager.getSession() || {};
          await SessionManager.setSession({
            ...currentSession,
            portal: false,
            portalSession: null
          });
        } catch (error) {
          console.warn('Failed to clear portal session:', error);
        }
      },

      logoutAdmin: async () => {
        debugLog('logoutAdmin', {}, 'user');
        
        set((state) => ({
          ...state,
          admin: false,
          adminSession: null,
          _debug: {
            lastUpdate: Date.now(),
            source: 'logoutAdmin'
          }
        }), false);
        
        // Update session file
        try {
          const currentSession = await SessionManager.getSession() || {};
          await SessionManager.setSession({
            ...currentSession,
            admin: false,
            adminSession: null
          });
        } catch (error) {
          console.warn('Failed to clear admin session:', error);
        }
      },

      logoutAll: async () => {
        debugLog('logoutAll', {}, 'user');
        
        set((state) => ({
          ...state,
          portal: false,
          admin: false,
          portalSession: null,
          adminSession: null,
          _debug: {
            lastUpdate: Date.now(),
            source: 'logoutAll'
          }
        }), false);
        
        // Clear session file
        try {
          await SessionManager.clearSession();
        } catch (error) {
          console.warn('Failed to clear session:', error);
        }
      }
    };
  })
);

// Initialize session monitoring when store is created
// This runs once and prevents the useEffect dependency issues
const initializeAuthMonitoring = () => {
  const store = useAuthStore.getState();
  
  // Load initial auth state
  const loadInitialState = async () => {
    try {
      const session = await SessionManager.getSession();
      if (session) {
        store.updateAuth({
          portal: !!session.portal,
          admin: !!session.admin,
          portalSession: session.portalSession || null,
          adminSession: session.adminSession || null
        }, { silent: true, source: 'initial-load' });
      }
    } catch (error) {
      console.warn('Failed to load initial auth state:', error);
    }
  };
  
  loadInitialState();
  
  // Start monitoring session changes
  if (store._sessionSync) {
    const stopMonitoring = store._sessionSync.startMonitoring((authData) => {
      // Use silent update to prevent feedback loops
      store.updateAuth(authData, { 
        silent: true, 
        source: 'session-sync' 
      });
    });
    
    // Return cleanup function
    return stopMonitoring;
  }
  
  return () => {};
};

// Start monitoring
initializeAuthMonitoring();

// Export selectors for common use cases
export const selectAuthStatus = (state: AuthState) => ({
  portal: state.portal,
  admin: state.admin
});

export const selectPortalAuth = (state: AuthState) => state.portal;

export const selectAdminAuth = (state: AuthState) => state.admin;

export const selectPortalSession = (state: AuthState) => state.portalSession;

export const selectAdminSession = (state: AuthState) => state.adminSession;
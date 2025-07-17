/**
 * Simplified Auth Hook
 * Replaces complex AuthProvider/AuthContext with simple useState patterns
 * Integrates with session management for persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { SessionManager } from '../services/session-manager.js';

/**
 * Simple auth hook with session integration
 * Provides authentication state without requiring context providers
 */
export function useAuth() {
  const [portalAuth, setPortalAuth] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [portalSession, setPortalSession] = useState(null);
  const [adminSession, setAdminSession] = useState(null);
  
  // Load auth state from session on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const session = await SessionManager.getSession();
        if (session) {
          setPortalAuth(!!session.portal);
          setAdminAuth(!!session.admin);
          setPortalSession(session.portalSession || null);
          setAdminSession(session.adminSession || null);
        }
      } catch (error) {
        console.warn('Failed to load auth state:', error);
      }
    };
    
    loadAuthState();
  }, []);
  
  // Login to portal
  const loginPortal = useCallback(async (sessionData) => {
    setPortalAuth(true);
    setPortalSession(sessionData);
    
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
  }, []);
  
  // Login to admin
  const loginAdmin = useCallback(async (sessionData) => {
    setAdminAuth(true);
    setAdminSession(sessionData);
    
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
  }, []);
  
  // Update auth status (for external session updates)
  const updateAuth = useCallback(async (authData) => {
    if (authData.portal !== undefined) {
      setPortalAuth(authData.portal);
    }
    if (authData.admin !== undefined) {
      setAdminAuth(authData.admin);
    }
    if (authData.portalSession !== undefined) {
      setPortalSession(authData.portalSession);
    }
    if (authData.adminSession !== undefined) {
      setAdminSession(authData.adminSession);
    }
  }, []);
  
  // Logout from portal
  const logoutPortal = useCallback(async () => {
    setPortalAuth(false);
    setPortalSession(null);
    
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
  }, []);
  
  // Logout from admin
  const logoutAdmin = useCallback(async () => {
    setAdminAuth(false);
    setAdminSession(null);
    
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
  }, []);
  
  // Logout from both
  const logoutAll = useCallback(async () => {
    setPortalAuth(false);
    setAdminAuth(false);
    setPortalSession(null);
    setAdminSession(null);
    
    // Clear session file
    try {
      await SessionManager.clearSession();
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }, []);
  
  // Computed auth state (matches old context interface)
  const authState = {
    portal: portalAuth,
    admin: adminAuth,
    portalSession,
    adminSession
  };
  
  return {
    authState,
    state: authState, // Alias for compatibility
    loginPortal,
    loginAdmin,
    updateAuth,
    logoutPortal,
    logoutAdmin,
    logoutAll
  };
}
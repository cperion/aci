/**
 * Navigation Hook
 * Simple navigation state management without complex contexts
 * Replaces NavProvider and NavContext patterns
 */

import { useState, useCallback } from 'react';

/**
 * Simple navigation hook with history stack
 * Provides navigation functions without requiring context providers
 */
export function useNavigation() {
  const [history, setHistory] = useState([
    { id: 'home', title: 'ACI Dashboard', params: {} }
  ]);
  
  const currentView = history[history.length - 1];
  
  const navigate = useCallback((viewId, title, params = {}) => {
    setHistory(prev => [...prev, { id: viewId, title, params }]);
  }, []);
  
  const goBack = useCallback(() => {
    setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);
  
  const navigateReplace = useCallback((viewId, title, params = {}) => {
    setHistory(prev => [...prev.slice(0, -1), { id: viewId, title, params }]);
  }, []);
  
  const goToRoot = useCallback(() => {
    setHistory([{ id: 'home', title: 'ACI Dashboard', params: {} }]);
  }, []);
  
  const canGoBack = history.length > 1;
  
  return {
    currentView,
    history,
    navigate,
    goBack,
    navigateReplace,
    goToRoot,
    canGoBack
  };
}
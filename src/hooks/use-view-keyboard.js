/**
 * View Keyboard Hook
 * React hook wrapper for keyboard manager
 * Handles automatic cleanup and handler memoization
 */

import { useEffect, useCallback, useRef } from 'react';
import { registerView, registerGlobalHandler, createKeyboardHandler } from '../utils/keyboard-manager.js';

/**
 * Register keyboard handler for a view
 * Automatically cleans up on component unmount
 */
export function useViewKeyboard(viewId, handler, dependencies = []) {
  const cleanupRef = useRef(null);
  
  // Memoize handler to prevent unnecessary re-registrations
  const memoizedHandler = useCallback(handler, dependencies);
  
  useEffect(() => {
    // Clean up previous registration if exists
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    
    // Register new handler
    cleanupRef.current = registerView(viewId, memoizedHandler);
    
    // Cleanup on unmount or dependency change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [viewId, memoizedHandler]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
}

/**
 * Register global keyboard handler
 * For shortcuts that work across all views
 */
export function useGlobalKeyboard(bindings, dependencies = []) {
  const cleanupFunctionsRef = useRef([]);
  
  useEffect(() => {
    // Clean up previous bindings
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];
    
    // Register new bindings
    Object.entries(bindings).forEach(([key, config]) => {
      const cleanup = registerGlobalHandler(
        key, 
        config.handler || config, // Support both object and function formats
        config.description || ''
      );
      cleanupFunctionsRef.current.push(cleanup);
    });
    
    // Cleanup on dependency change
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, dependencies);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    };
  }, []);
}

/**
 * Simplified keyboard hook with common patterns
 * Creates handler automatically from configuration
 */
export function useSimpleKeyboard(viewId, config, dependencies = []) {
  const handler = useCallback(
    createKeyboardHandler(config),
    dependencies
  );
  
  useViewKeyboard(viewId, handler, [handler]);
}

/**
 * Hook for navigation-based keyboard handling
 * Common pattern for list/table views
 */
export function useNavigationKeyboard(viewId, options, dependencies = []) {
  const {
    onMoveUp,
    onMoveDown,
    onSelect,
    onBack,
    onRefresh,
    onDelete,
    onEdit,
    customHandlers = {}
  } = options;
  
  const config = {
    // Arrow navigation
    onArrowUp: onMoveUp,
    onArrowDown: onMoveDown,
    
    // Actions
    onEnter: onSelect,
    onEscape: onBack,
    
    // Common shortcuts
    'r': onRefresh,
    'f5': onRefresh,
    'd': onDelete,
    'e': onEdit,
    
    // Custom handlers override defaults
    ...customHandlers
  };
  
  useSimpleKeyboard(viewId, config, dependencies);
}

/**
 * Hook for form-based keyboard handling
 * Common pattern for input/form views
 */
export function useFormKeyboard(viewId, options, dependencies = []) {
  const {
    onSubmit,
    onCancel,
    onNextField,
    onPrevField,
    customHandlers = {}
  } = options;
  
  const config = {
    onEnter: onSubmit,
    onEscape: onCancel,
    onTab: onNextField,
    
    // Shift+Tab for previous field (handled in onOther)
    onOther: (input, key) => {
      if (key?.shift && input === '\t' && onPrevField) {
        onPrevField();
        return true;
      }
      return false;
    },
    
    // Custom handlers
    ...customHandlers
  };
  
  useSimpleKeyboard(viewId, config, dependencies);
}
/**
 * Keyboard Manager
 * Simple view-based keyboard handling without complex action registries
 * Manages activeViewStack with proper cleanup and conflict resolution
 */

// Global view stack for keyboard handling
const activeViewStack = [];

// Global key handlers that work across all views
const globalHandlers = new Map();

/**
 * Register a view for keyboard input
 * Returns cleanup function
 */
export function registerView(viewId, handler) {
  const viewEntry = { viewId, handler, timestamp: Date.now() };
  
  // Add to top of stack
  activeViewStack.push(viewEntry);
  
  // Return cleanup function
  return () => {
    const index = activeViewStack.findIndex(v => v.viewId === viewId && v.timestamp === viewEntry.timestamp);
    if (index !== -1) {
      activeViewStack.splice(index, 1);
    }
  };
}

/**
 * Register global key handler
 * These work regardless of active view
 */
export function registerGlobalHandler(key, handler, description = '') {
  globalHandlers.set(key, { handler, description });
  
  return () => {
    globalHandlers.delete(key);
  };
}

/**
 * Handle keyboard input with proper priority
 * Called by main keyboard input handler
 */
export function handleKeyboardInput(input, key) {
  // Try global handlers first (for things like theme switching, help)
  if (globalHandlers.has(input)) {
    const globalHandler = globalHandlers.get(input);
    try {
      globalHandler.handler(input, key);
      return true; // Handled
    } catch (error) {
      console.error(`Global handler error for key '${input}':`, error);
    }
  }
  
  // Try active view handler (topmost view gets priority)
  if (activeViewStack.length > 0) {
    const activeView = activeViewStack[activeViewStack.length - 1];
    try {
      const handled = activeView.handler(input, key);
      return handled !== false; // Default to handled unless explicitly false
    } catch (error) {
      console.error(`View handler error for view '${activeView.viewId}', key '${input}':`, error);
    }
  }
  
  return false; // Not handled
}

/**
 * Get currently active view ID
 */
export function getActiveViewId() {
  if (activeViewStack.length === 0) return null;
  return activeViewStack[activeViewStack.length - 1].viewId;
}

/**
 * Get all registered view IDs (for debugging)
 */
export function getRegisteredViews() {
  return activeViewStack.map(v => ({ viewId: v.viewId, timestamp: v.timestamp }));
}

/**
 * Get all global handlers (for help/documentation)
 */
export function getGlobalHandlers() {
  const handlers = [];
  globalHandlers.forEach((handler, key) => {
    handlers.push({
      key,
      description: handler.description || 'No description'
    });
  });
  return handlers;
}

/**
 * Clear all view registrations (for testing/cleanup)
 */
export function clearAllViews() {
  activeViewStack.length = 0;
}

/**
 * Clear all global handlers (for testing/cleanup)
 */
export function clearAllGlobalHandlers() {
  globalHandlers.clear();
}

/**
 * Force remove a view by ID (emergency cleanup)
 */
export function forceRemoveView(viewId) {
  for (let i = activeViewStack.length - 1; i >= 0; i--) {
    if (activeViewStack[i].viewId === viewId) {
      activeViewStack.splice(i, 1);
    }
  }
}

/**
 * Check if a view is registered
 */
export function isViewRegistered(viewId) {
  return activeViewStack.some(v => v.viewId === viewId);
}

/**
 * Common keyboard shortcuts that views can use
 */
export const commonKeys = {
  ESCAPE: '\u001B',
  ENTER: '\r',
  TAB: '\t',
  BACKSPACE: '\u0008',
  DELETE: '\u007F',
  
  // Arrow keys (these come as key.* properties)
  isArrowUp: (key) => key && key.upArrow,
  isArrowDown: (key) => key && key.downArrow,
  isArrowLeft: (key) => key && key.leftArrow,
  isArrowRight: (key) => key && key.rightArrow,
  
  // Control keys
  isCtrlC: (input, key) => key && key.ctrl && input === 'c',
  isCtrlQ: (input, key) => key && key.ctrl && input === 'q',
  isCtrlR: (input, key) => key && key.ctrl && input === 'r',
  
  // Function keys
  isF1: (key) => key && key.f1,
  isF5: (key) => key && key.f5
};

/**
 * Keyboard handler factory for common patterns
 */
export function createKeyboardHandler(handlers) {
  return (input, key) => {
    // Try exact input match first
    if (handlers[input]) {
      handlers[input]();
      return true;
    }
    
    // Try special key combinations
    if (handlers.onArrowUp && commonKeys.isArrowUp(key)) {
      handlers.onArrowUp();
      return true;
    }
    
    if (handlers.onArrowDown && commonKeys.isArrowDown(key)) {
      handlers.onArrowDown();
      return true;
    }
    
    if (handlers.onEnter && input === commonKeys.ENTER) {
      handlers.onEnter();
      return true;
    }
    
    if (handlers.onEscape && input === commonKeys.ESCAPE) {
      handlers.onEscape();
      return true;
    }
    
    if (handlers.onTab && input === commonKeys.TAB) {
      handlers.onTab();
      return true;
    }
    
    // Try catch-all handler
    if (handlers.onOther) {
      return handlers.onOther(input, key);
    }
    
    return false; // Not handled
  };
}
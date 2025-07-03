import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useInput } from 'ink';
import { KeymapRegistry } from '../keyboard/keymap-registry.js';
import { ActionProcessor, type ActionContext } from '../keyboard/action-processor.js';
import { ModeDetector, type ViewState } from '../keyboard/mode-detector.js';
import type { ViewMode } from '../keyboard/keymap-registry.js';

// Register all keymaps
import { homeKeymap } from '../keyboard/view-keymaps/home-keymap.js';
import { servicesKeymap } from '../keyboard/view-keymaps/services-keymap.js';
import { usersKeymap } from '../keyboard/view-keymaps/users-keymap.js';

type KeyboardContextValue = {
  currentMode: ViewMode;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  toggleItemSelection: (item: string) => void;
  clearSelection: () => void;
  registerActionHandler: (action: string, handler: (action: string, context?: any) => void) => () => void;
  getAvailableShortcuts: (viewId: string) => Array<{key: string, label: string, action: string}>;
  viewState: ViewState;
  setViewState: (state: Partial<ViewState>) => void;
};

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

export function KeyboardProvider({ 
  children, 
  viewId,
  onKeyPress
}: { 
  children: React.ReactNode;
  viewId: string;
  onKeyPress?: (key: string, action: string | null) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewState, setViewStateInternal] = useState<ViewState>({
    selectedItems: [],
    searchActive: false,
    modalOpen: false,
    currentView: viewId
  });

  const keymapRegistry = KeymapRegistry.getInstance();
  const actionProcessor = ActionProcessor.getInstance();

  // Register keymaps on mount
  useEffect(() => {
    keymapRegistry.registerViewKeymap(homeKeymap);
    keymapRegistry.registerViewKeymap(servicesKeymap);
    keymapRegistry.registerViewKeymap(usersKeymap);
  }, [keymapRegistry]);

  // Update view state when selected items change
  useEffect(() => {
    setViewStateInternal(prev => ({
      ...prev,
      selectedItems,
      currentView: viewId
    }));
  }, [selectedItems, viewId]);

  const currentMode = ModeDetector.detectMode(viewState);

  const setViewState = useCallback((newState: Partial<ViewState>) => {
    setViewStateInternal(prev => ({ ...prev, ...newState }));
  }, []);

  const toggleItemSelection = useCallback((item: string) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const registerActionHandler = useCallback((action: string, handler: (action: string, context?: any) => void) => {
    actionProcessor.registerActionHandler(action, handler);
    
    // Return cleanup function
    return () => {
      actionProcessor.unregisterActionHandler(action);
    };
  }, [actionProcessor]);

  const getAvailableShortcuts = useCallback((currentViewId: string) => {
    return actionProcessor.getAvailableActions(currentViewId, viewState);
  }, [actionProcessor, viewState]);

  // Handle keyboard input with safe async processing
  useInput((input, key) => {
    // Skip if in input mode (synchronous check)
    if (ModeDetector.shouldBypassKeyboard(viewState)) {
      return;
    }

    const keyString = key.ctrl && input ? `Ctrl+${input}` : 
                     key.escape ? 'Escape' :
                     key.return ? 'Enter' :
                     key.tab ? 'Tab' :
                     input;

    const context: ActionContext = {
      viewId,
      state: viewState,
      selectedItems,
      currentItem: null // TODO: get from view state
    };

    // Process asynchronously but don't block input handling
    const handleKeyAsync = async () => {
      try {
        const processed = await actionProcessor.processKey(keyString, context);
        
        if (onKeyPress) {
          const action = processed ? 
            keymapRegistry.getActionForKey(viewId, keyString, currentMode, viewState) : 
            null;
          onKeyPress(keyString, action);
        }
      } catch (error) {
        console.error('Error in keyboard handler:', error);
      }
    };

    handleKeyAsync();
  });

  const value: KeyboardContextValue = {
    currentMode,
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    clearSelection,
    registerActionHandler,
    getAvailableShortcuts,
    viewState,
    setViewState
  };

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
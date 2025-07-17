import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useInput } from 'ink';
import { KeymapRegistry } from '../keyboard/keymap-registry.js';
import { ActionProcessor, type ActionContext } from '../keyboard/action-processor.js';
import { ModeDetector, type ViewState } from '../keyboard/mode-detector.js';
import type { ViewMode } from '../keyboard/keymap-registry.js';

// Register all keymaps
import { homeKeymap } from '../keyboard/view-keymaps/home-keymap.js';
import { servicesKeymap } from '../keyboard/view-keymaps/services-keymap.js';
import { usersKeymap } from '../keyboard/view-keymaps/users-keymap.js';
import { groupsKeymap } from '../keyboard/view-keymaps/groups-keymap.js';
import { itemsKeymap } from '../keyboard/view-keymaps/items-keymap.js';
import { analyticsKeymap } from '../keyboard/view-keymaps/analytics-keymap.js';
import { adminKeymap } from '../keyboard/view-keymaps/admin-keymap.js';
import { loginKeymap } from '../keyboard/view-keymaps/login-keymap.js';
import { datastoresKeymap } from '../keyboard/view-keymaps/datastores-keymap.js';
import { insightsKeymap } from '../keyboard/view-keymaps/insights-keymap.js';

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
  const [viewState, setViewStateInternal] = useState<ViewState>({
    selectedItems: [],
    searchActive: false,
    modalOpen: false,
    currentView: viewId
  });
  
  // selectedItems is now derived from viewState to avoid sync issues
  const selectedItems = viewState.selectedItems;

  const keymapRegistry = useMemo(() => KeymapRegistry.getInstance(), []);
  const actionProcessor = useMemo(() => ActionProcessor.getInstance(), []);

  // Register keymaps on mount
  useEffect(() => {
    keymapRegistry.registerViewKeymap(homeKeymap);
    keymapRegistry.registerViewKeymap(servicesKeymap);
    keymapRegistry.registerViewKeymap(usersKeymap);
    keymapRegistry.registerViewKeymap(groupsKeymap);
    keymapRegistry.registerViewKeymap(itemsKeymap);
    keymapRegistry.registerViewKeymap(analyticsKeymap);
    keymapRegistry.registerViewKeymap(adminKeymap);
    keymapRegistry.registerViewKeymap(loginKeymap);
    keymapRegistry.registerViewKeymap(datastoresKeymap);
    keymapRegistry.registerViewKeymap(insightsKeymap);
  }, []);

  // Update view state when viewId changes
  useEffect(() => {
    setViewStateInternal(prev => ({
      ...prev,
      currentView: viewId
    }));
  }, [viewId]);

  const currentMode = ModeDetector.detectMode(viewState);

  const setViewState = useCallback((newState: Partial<ViewState>) => {
    setViewStateInternal(prev => ({ ...prev, ...newState }));
  }, []);

  const setSelectedItems = useCallback((items: string[]) => {
    setViewStateInternal(prev => ({
      ...prev,
      selectedItems: items
    }));
  }, []);

  const toggleItemSelection = useCallback((item: string) => {
    setViewStateInternal(prev => {
      const currentItems = prev.selectedItems;
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
      
      return {
        ...prev,
        selectedItems: newItems
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setViewStateInternal(prev => ({
      ...prev,
      selectedItems: []
    }));
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
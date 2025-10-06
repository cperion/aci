/**
 * UI Store - Centralized UI state management
 * Handles overlays, modals, notifications, and theme state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useNavigationStore } from './navigation-store.js';
import { themeManager } from '../themes/theme-manager.js';
import type { UIState, StoreSetOptions } from './types.js';

interface UIStore extends UIState {
  // Overlay actions
  showHelp: () => void;
  hideHelp: () => void;
  toggleHelp: () => void;
  showCommandPalette: () => void;
  hideCommandPalette: () => void;
  showQuickReference: () => void;
  hideQuickReference: () => void;
  showUniversalSearch: () => void;
  hideUniversalSearch: () => void;
  toggleUniversalSearch: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Theme actions
  setTheme: (name: string) => void;
  nextTheme: () => void;
  previousTheme: () => void;
  randomTheme: () => void;
  
  // Keyboard shortcuts
  registerShortcut: (key: string, handler: () => void, description: string) => void;
  unregisterShortcut: (key: string) => void;
  
  // Internal
  _themeSubscription: (() => void) | null;
  _shortcuts: Map<string, { handler: () => void; description: string }>;
}

// Debug instrumentation
const debugLog = (operation: string, data: any, source: string = 'unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[UIStore] ${operation}`, {
      data,
      source,
      stack: new Error().stack?.split('\n').slice(3, 6).join('\n'),
      time: Date.now()
    });
  }
};

export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set, get) => {
    // Subscribe to theme changes
    const themeSubscription = themeManager.subscribe((themeState) => {
      set((state) => {
        // Prevent infinite loops by checking if theme actually changed
        const currentThemeName = state.theme.name;
        const currentThemeScheme = state.theme.current;
        const newThemeName = themeState.name || '';
        const newThemeScheme = themeState.current.scheme || '';
        
        if (currentThemeName === newThemeName && currentThemeScheme === newThemeScheme) {
          return state; // No change needed
        }
        
        return {
          ...state,
          theme: {
            current: newThemeScheme,
            name: newThemeName
          }
        };
      }, false);
    });
    
    return {
      // Initial state
      overlays: {
        help: false,
        commandPalette: false,
        quickReference: false,
        universalSearch: false
      },
      notifications: [],
      theme: {
        current: themeManager.theme.scheme,
        name: themeManager.name
      },
      _themeSubscription: themeSubscription,
      _shortcuts: new Map(),

      // Overlay actions
      showHelp: () => {
        debugLog('showHelp', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            help: true
          }
        }), false);
      },

      hideHelp: () => {
        debugLog('hideHelp', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            help: false
          }
        }), false);
      },

      toggleHelp: () => {
        const state = get();
        debugLog('toggleHelp', { willShow: !state.overlays.help }, 'user');
        
        set((s) => ({
          ...s,
          overlays: {
            ...s.overlays,
            help: !s.overlays.help
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'toggleHelp',
            operation: 'toggle-overlay'
          }
        }), false);
      },

      showCommandPalette: () => {
        debugLog('showCommandPalette', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            commandPalette: true
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'showCommandPalette',
            operation: 'show-overlay'
          }
        }), false);
      },

      hideCommandPalette: () => {
        debugLog('hideCommandPalette', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            commandPalette: false
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'hideCommandPalette',
            operation: 'hide-overlay'
          }
        }), false);
      },

      showQuickReference: () => {
        debugLog('showQuickReference', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            quickReference: true
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'showQuickReference',
            operation: 'show-overlay'
          }
        }), false);
      },

      hideQuickReference: () => {
        debugLog('hideQuickReference', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            quickReference: false
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'hideQuickReference',
            operation: 'hide-overlay'
          }
        }), false);
      },

      showUniversalSearch: () => {
        debugLog('showUniversalSearch', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            universalSearch: true
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'showUniversalSearch',
            operation: 'show-overlay'
          }
        }), false);
      },

      hideUniversalSearch: () => {
        debugLog('hideUniversalSearch', {}, 'user');
        
        set((state) => ({
          ...state,
          overlays: {
            ...state.overlays,
            universalSearch: false
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'hideUniversalSearch',
            operation: 'hide-overlay'
          }
        }), false);
      },

      toggleUniversalSearch: () => {
        const state = get();
        debugLog('toggleUniversalSearch', { willShow: !state.overlays.universalSearch }, 'user');
        
        set((s) => ({
          ...s,
          overlays: {
            ...s.overlays,
            universalSearch: !s.overlays.universalSearch
          },
          _debug: {
            lastUpdate: Date.now(),
            source: 'toggleUniversalSearch',
            operation: 'toggle-overlay'
          }
        }), false);
      },

      // Notification actions
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now()
        };
        
        debugLog('addNotification', newNotification, 'system');
        
        set((state) => ({
          ...state,
          notifications: [...state.notifications, newNotification].slice(-10) // Keep last 10
        }), false);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },

      removeNotification: (id) => {
        debugLog('removeNotification', { id }, 'system');
        
        set((state) => ({
          ...state,
          notifications: state.notifications.filter(n => n.id !== id)
        }), false);
      },

      clearNotifications: () => {
        debugLog('clearNotifications', {}, 'user');
        
        set((state) => ({
          ...state,
          notifications: []
        }), false);
      },

      // Theme actions (delegated to themeManager)
      setTheme: (name) => {
        debugLog('setTheme', { name }, 'user');
        
        if (themeManager.setTheme(name)) {
          // The actual theme update will come through the subscription
          set((state) => ({
            ...state,
            theme: {
              current: themeManager.theme.scheme,
              name: themeManager.name
            }
          }), false);
        }
      },

      nextTheme: () => {
        debugLog('nextTheme', {}, 'user');
        
        themeManager.nextTheme();
        // Update will come through subscription
      },

      previousTheme: () => {
        debugLog('previousTheme', {}, 'user');
        
        themeManager.previousTheme();
        // Update will come through subscription
      },

      randomTheme: () => {
        debugLog('randomTheme', {}, 'user');
        
        themeManager.randomTheme();
        // Update will come through subscription
      },

      // Keyboard shortcuts
      registerShortcut: (key, handler, description = 'Unknown shortcut') => {
        const state = get();
        
        debugLog('registerShortcut', { key, description }, 'system');
        
        state._shortcuts.set(key, { handler, description });
        
        set({
          _shortcuts: new Map(state._shortcuts)
        }, false);
      },

      unregisterShortcut: (key) => {
        const state = get();
        
        debugLog('unregisterShortcut', { key }, 'system');
        
        state._shortcuts.delete(key);
        
        set({
          _shortcuts: new Map(state._shortcuts)
        }, false);
      }
    };
  })
);

// Initialize global keyboard shortcuts
useUIStore.getState().registerShortcut('Escape', () => {
  const state = useUIStore.getState();
  
  // Close overlays in reverse order of importance
  if (state.overlays.commandPalette) {
    state.hideCommandPalette();
  } else if (state.overlays.universalSearch) {
    state.hideUniversalSearch();
  } else if (state.overlays.help) {
    state.hideHelp();
  } else if (state.overlays.quickReference) {
    state.hideQuickReference();
  } else {
    // If no overlays, go back in navigation
    useNavigationStore.getState().goBack();
  }
}, 'Close overlay or go back');

// Export selectors for common use cases
export const selectOverlays = (state: UIStore) => state.overlays;

export const selectNotifications = (state: UIStore) => state.notifications;

export const selectTheme = (state: UIStore) => state.theme;

export const selectOverlayVisible = (overlay: keyof UIStore['overlays']) => (state: UIStore) => 
  state.overlays[overlay];

// Hook for overlay actions
export const useOverlayActions = () => {
  const showHelp = useUIStore(state => state.showHelp);
  const hideHelp = useUIStore(state => state.hideHelp);
  const toggleHelp = useUIStore(state => state.toggleHelp);
  const showCommandPalette = useUIStore(state => state.showCommandPalette);
  const hideCommandPalette = useUIStore(state => state.hideCommandPalette);
  const showQuickReference = useUIStore(state => state.showQuickReference);
  const hideQuickReference = useUIStore(state => state.hideQuickReference);
  const showUniversalSearch = useUIStore(state => state.showUniversalSearch);
  const hideUniversalSearch = useUIStore(state => state.hideUniversalSearch);
  const toggleUniversalSearch = useUIStore(state => state.toggleUniversalSearch);
  
  return {
    showHelp, hideHelp, toggleHelp,
    showCommandPalette, hideCommandPalette,
    showQuickReference, hideQuickReference,
    showUniversalSearch, hideUniversalSearch, toggleUniversalSearch,
    // Aliases for compatibility
    showPalette: showCommandPalette,
    hidePalette: hideCommandPalette,
    showReference: showQuickReference,
    hideReference: hideQuickReference,
    show: showUniversalSearch,
    hide: hideUniversalSearch,
    toggle: toggleUniversalSearch
  };
};

// Hook for notification actions
export const useNotificationActions = () => {
  const addNotification = useUIStore(state => state.addNotification);
  const removeNotification = useUIStore(state => state.removeNotification);
  const clearNotifications = useUIStore(state => state.clearNotifications);
  
  return { addNotification, removeNotification, clearNotifications };
};

// Hook for theme actions
export const useThemeActions = () => {
  const setTheme = useUIStore(state => state.setTheme);
  const nextTheme = useUIStore(state => state.nextTheme);
  const previousTheme = useUIStore(state => state.previousTheme);
  const randomTheme = useUIStore(state => state.randomTheme);
  
  return { setTheme, nextTheme, previousTheme, randomTheme };
};
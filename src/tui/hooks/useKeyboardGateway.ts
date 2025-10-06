import { useInput, useApp } from 'ink';
import { useCallback, useRef, useEffect } from 'react';
import { useNavigationStore, useAuthStore } from '../stores/index.js';
// Removed useSelection import - components now manage their own selection now
import { useHelpSystem } from '../components/HelpSystem.js';
import { useCommandPalette } from '../components/CommandPalette.js';
import { useUniversalSearchModal } from '../components/UniversalSearch.js';
import { useQuickReference } from '../components/QuickReference.js';

export type KeyCommand = string;
export type KeyHandler = () => void;
export type KeyBinding = {
  key: string;
  handler: KeyHandler;
  description: string;
  category: 'navigation' | 'system' | 'ui' | 'view-specific';
  viewId?: string; // If undefined, it's global
};

/**
 * Unified keyboard gateway that consolidates all keyboard handling logic.
 * Replaces the complex KeyboardProvider + GlobalActionHandlers pattern.
 */
export function useKeyboardGateway(options: {
  isActive?: boolean;
} = {}) {
  const { exit } = useApp();
  const { navigate, goBack } = useNavigationStore(state => ({
    navigate: state.navigate,
    goBack: state.goBack
  }));
  const logoutAll = useAuthStore(state => state.logoutAll);
  // clearSelection removed - components manage their own selection now
  const { showHelp, toggleHelp } = useHelpSystem();
  const { showPalette } = useCommandPalette();
  const { show: showSearch } = useUniversalSearchModal();
  const { showReference } = useQuickReference();

  // Global keybindings registry with metadata
  const globalBindings = useRef(new Map<string, KeyBinding>([
    // Navigation shortcuts
    ['l', { key: 'l', handler: () => navigate('login', 'Authentication'), description: 'Login', category: 'navigation' }],
    ['s', { key: 's', handler: () => navigate('services', 'Service Browser'), description: 'Services', category: 'navigation' }],
    ['u', { key: 'u', handler: () => navigate('users', 'User Management'), description: 'Users', category: 'navigation' }],
    ['g', { key: 'g', handler: () => navigate('groups', 'Group Management'), description: 'Groups', category: 'navigation' }],
    ['i', { key: 'i', handler: () => navigate('items', 'Item Management'), description: 'Items', category: 'navigation' }],
    ['a', { key: 'a', handler: () => navigate('admin', 'Server Administration'), description: 'Admin', category: 'navigation' }],
    ['n', { key: 'n', handler: () => navigate('insights', 'Enterprise Insights'), description: 'Insights', category: 'navigation' }],
    ['t', { key: 't', handler: () => navigate('analytics', 'Advanced Analytics'), description: 'Analytics', category: 'navigation' }],
    ['d', { key: 'd', handler: () => navigate('datastores', 'Datastore Management'), description: 'Datastores', category: 'navigation' }],
    ['h', { key: 'h', handler: () => navigate('home', 'Home'), description: 'Home', category: 'navigation' }],

    // System actions
    ['Escape', { key: 'Escape', handler: goBack, description: 'Go Back', category: 'system' }],
    ['Ctrl+c', { key: 'Ctrl+c', handler: exit, description: 'Exit', category: 'system' }],
    ['Ctrl+l', { key: 'Ctrl+l', handler: logoutAll, description: 'Logout All', category: 'system' }],
    // Clear selection removed - components manage their own selection now

    // UI actions
    ['?', { key: '?', handler: toggleHelp, description: 'Help', category: 'ui' }],
    [':', { key: ':', handler: showPalette, description: 'Command Palette', category: 'ui' }],
    ['Ctrl+k', { key: 'Ctrl+k', handler: showPalette, description: 'Command Palette', category: 'ui' }],
    ['Ctrl+f', { key: 'Ctrl+f', handler: showSearch, description: 'Search', category: 'ui' }],
    ['Ctrl+h', { key: 'Ctrl+h', handler: showReference, description: 'Quick Reference', category: 'ui' }],
    ['/', { key: '/', handler: showSearch, description: 'Search', category: 'ui' }],

    // Refresh (for compatibility)
    ['r', { key: 'r', handler: () => { window.location?.reload?.(); }, description: 'Refresh', category: 'ui' }],
  ]));

  // View-specific bindings registry
  const viewBindings = useRef(new Map<string, Map<string, KeyBinding>>());

  // Register view-specific keybindings
  const registerViewBindings = useCallback((viewId: string, bindings: Record<string, KeyBinding>) => {
    if (!viewBindings.current.has(viewId)) {
      viewBindings.current.set(viewId, new Map());
    }
    
    const viewMap = viewBindings.current.get(viewId)!;
    Object.entries(bindings).forEach(([key, binding]) => {
      viewMap.set(key, { ...binding, viewId, category: 'view-specific' });
    });
  }, []);

  // Register global keybindings (for external components like theme switching)
  const registerGlobalBindings = useCallback((bindings: Record<string, KeyBinding>) => {
    Object.entries(bindings).forEach(([key, binding]) => {
      // Check for conflicts
      const existing = globalBindings.current.get(key);
      if (existing && process.env.NODE_ENV === 'development') {
        console.warn(`Keyboard shortcut conflict detected: "${key}" is already bound to "${existing.description}", overriding with "${binding.description}"`);
      }
      globalBindings.current.set(key, binding);
    });
  }, []);

  // Get available shortcuts for help system
  const getAvailableShortcuts = useCallback((viewId?: string) => {
    const shortcuts: Array<{key: string, description: string, category: string}> = [];
    
    // Add global shortcuts
    globalBindings.current.forEach((binding, key) => {
      shortcuts.push({
        key,
        description: binding.description,
        category: binding.category
      });
    });

    // Add view-specific shortcuts
    if (viewId && viewBindings.current.has(viewId)) {
      const viewMap = viewBindings.current.get(viewId)!;
      viewMap.forEach((binding, key) => {
        shortcuts.push({
          key,
          description: `${viewId}: ${binding.description}`,
          category: binding.category
        });
      });
    }

    return shortcuts;
  }, []);

  // Get shortcuts by category for better organization
  const getShortcutsByCategory = useCallback((viewId?: string) => {
    const shortcuts = getAvailableShortcuts(viewId);
    const categories: Record<string, Array<{key: string, description: string}>> = {};
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category]!.push({
        key: shortcut.key,
        description: shortcut.description
      });
    });

    return categories;
  }, [getAvailableShortcuts]);

  // Handle keyboard input - returns a handler function
  const handleInput = useCallback((input: string, key: any) => {
    // Skip if in input mode (basic check)
    if (shouldBypassKeyboard()) {
      return false;
    }

    // Normalize key input
    const keyString = normalizeKeyInput(input, key);

    // Try view-specific bindings first (if we had current view context)
    // For now, just use global bindings
    const binding = globalBindings.current.get(keyString);
    
    if (binding) {
      try {
        binding.handler();
        return true;
      } catch (error) {
        console.error(`Error in keyboard handler for ${keyString} (${binding.description}):`, error);
        return false;
      }
    }
    
    return false;
  }, []);

  return {
    registerViewBindings,
    registerGlobalBindings,
    getAvailableShortcuts,
    getShortcutsByCategory,
    handleInput,
  };
}

// Helper functions
function normalizeKeyInput(input: string, key: any): string {
  if (key.ctrl && input) return `Ctrl+${input}`;
  if (key.escape) return 'Escape';
  if (key.return) return 'Enter';
  if (key.tab) return 'Tab';
  if (key.upArrow) return 'ArrowUp';
  if (key.downArrow) return 'ArrowDown';
  if (key.leftArrow) return 'ArrowLeft';
  if (key.rightArrow) return 'ArrowRight';
  return input;
}

function shouldBypassKeyboard(): boolean {
  // Simple check - could be enhanced based on app state
  // For now, just return false to always handle input
  return false;
}


/**
 * Central keymap management system
 * Handles registration and lookup of view-specific keyboard shortcuts
 */

export type KeyAction = {
  key: string;
  label: string;
  action: string;
  available?: (state: any) => boolean;
  mode?: ViewMode[];
  priority?: number; // 0 (highest) - 10 (lowest), default 5
};

export type ViewMode = 'NAVIGATION' | 'INPUT' | 'SELECTION' | 'SEARCH';

export type ViewKeymap = {
  viewId: string;
  keys: Record<string, KeyAction>;
  globalKeys?: Record<string, KeyAction>;
};

export type GlobalKeymap = {
  keys: Record<string, KeyAction>;
};

class KeymapRegistry {
  private static instance: KeymapRegistry;
  private viewKeymaps = new Map<string, ViewKeymap>();
  private globalKeymap: GlobalKeymap;

  private constructor() {
    this.globalKeymap = {
      keys: {
        '?': { key: '?', label: 'Help', action: 'showHelp' },
        'Escape': { key: 'Escape', label: 'Back', action: 'goBack' },
        ':': { key: ':', label: 'Command', action: 'openCommandPalette' },
        'q': { key: 'q', label: 'Quit', action: 'quit' },
        'Ctrl+r': { key: 'Ctrl+r', label: 'Refresh', action: 'refresh' },
        'Ctrl+e': { key: 'Ctrl+e', label: 'Repeat', action: 'repeatLastAction' }
      }
    };
  }

  static getInstance(): KeymapRegistry {
    if (!KeymapRegistry.instance) {
      KeymapRegistry.instance = new KeymapRegistry();
    }
    return KeymapRegistry.instance;
  }

  registerViewKeymap(keymap: ViewKeymap) {
    this.viewKeymaps.set(keymap.viewId, keymap);
  }

  getKeysForView(viewId: string, mode: ViewMode, state?: any): KeyAction[] {
    const viewKeymap = this.viewKeymaps.get(viewId);
    const allKeys: KeyAction[] = [];

    // Add global keys
    Object.values(this.globalKeymap.keys).forEach(key => {
      if (!key.mode || key.mode.includes(mode)) {
        if (!key.available || key.available(state)) {
          allKeys.push(key);
        }
      }
    });

    // Add view-specific keys
    if (viewKeymap) {
      Object.values(viewKeymap.keys).forEach(key => {
        if (!key.mode || key.mode.includes(mode)) {
          if (!key.available || key.available(state)) {
            allKeys.push(key);
          }
        }
      });
    }

    return allKeys;
  }

  getActionForKey(viewId: string, key: string, mode: ViewMode, state?: any): string | null {
    // Check view-specific keys first
    const viewKeymap = this.viewKeymaps.get(viewId);
    if (viewKeymap && viewKeymap.keys[key]) {
      const keyAction = viewKeymap.keys[key];
      if (!keyAction.mode || keyAction.mode.includes(mode)) {
        if (!keyAction.available || keyAction.available(state)) {
          return keyAction.action;
        }
      }
    }

    // Check global keys
    if (this.globalKeymap.keys[key]) {
      const keyAction = this.globalKeymap.keys[key];
      if (!keyAction.mode || keyAction.mode.includes(mode)) {
        if (!keyAction.available || keyAction.available(state)) {
          return keyAction.action;
        }
      }
    }

    return null;
  }

  getAvailableShortcuts(viewId: string, mode: ViewMode, state?: any): KeyAction[] {
    return this.getKeysForView(viewId, mode, state)
      .filter(key => key.key.length === 1 || key.key.startsWith('Ctrl+'))
      .sort((a, b) => (a.priority || 5) - (b.priority || 5)) // Sort by priority
      .slice(0, 8); // Limit to prevent footer overflow
  }
}

export { KeymapRegistry };
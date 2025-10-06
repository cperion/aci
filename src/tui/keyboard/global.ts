/**
 * Global keyboard bindings
 * Active unless an overlay is open
 */

import type { KeyBinding } from './types.js';
import { themeManager } from '../themes/manager.js';
import { useUiStore } from '../state/ui.js';
import { useNavigationStore } from '../state/navigation.js';

export const globalBindings: KeyBinding[] = [
  // Help and overlays
  {
    key: '?',
    description: 'Toggle Help overlay',
    run: (ctx) => {
      useUiStore.getState().toggleOverlay('help');
    }
  },
  {
    key: 'p',
    description: 'Open Command Palette',
    run: (ctx) => {
      useUiStore.getState().toggleOverlay('palette');
    }
  },
  {
    key: '/',
    description: 'Universal Search',
    when: (ctx) => !ctx.millerActive,
    run: (ctx) => {
      useUiStore.getState().toggleOverlay('search');
    }
  },

  // Theme controls
  {
    key: ']',
    description: 'Next theme',
    run: () => {
      themeManager.next();
    }
  },
  {
    key: '[',
    description: 'Previous theme',
    run: () => {
      themeManager.previous();
    }
  },
  {
    key: 'r',
    description: 'Random theme',
    when: (ctx) => !ctx.millerActive, // Don't conflict with Miller refresh
    run: () => {
      themeManager.random();
    }
  },

  // Scope switching
  {
    key: 's',
    description: 'Switch to Server scope',
    run: (ctx) => {
      useNavigationStore.getState().setScope('server');
    }
  },
  {
    key: 'P',
    description: 'Switch to Portal scope',
    run: (ctx) => {
      useNavigationStore.getState().setScope('portal');
    }
  },

  // Application control
  {
    key: 'q',
    description: 'Quit application',
    run: (ctx) => {
      process.exit(0);
    }
  },

  // Escape for overlay handling
  {
    key: 'escape',
    description: 'Close overlay',
    when: (ctx) => ctx.overlayVisible,
    run: (ctx) => {
      const { overlays } = useUiStore.getState();
      const activeOverlay = Object.entries(overlays).find(([, active]) => active)?.[0];
      if (activeOverlay) {
        useUiStore.getState().hideOverlay(activeOverlay as any);
      }
    }
  }
];

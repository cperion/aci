/**
 * Global keyboard bindings
 * Active unless an overlay is open
 */

import type { KeyBinding } from './types.js';
import { themeManager } from '../themes/manager.js';

export const globalBindings: KeyBinding[] = [
  // Navigation
  {
    key: 'h',
    description: 'Navigate to Home',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('home');
    }
  },
  {
    key: 's',
    description: 'Navigate to Services',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('services');
    }
  },
  {
    key: 'u',
    description: 'Navigate to Users',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('users');
    }
  },
  {
    key: 'g',
    description: 'Navigate to Groups',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('groups');
    }
  },
  {
    key: 'i',
    description: 'Navigate to Items',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('items');
    }
  },
  {
    key: 'a',
    description: 'Navigate to Admin',
    run: (ctx) => {
      (global as any).tuiHandlers?.navigate?.('admin');
    }
  },

  // Help and overlays
  {
    key: '?',
    description: 'Toggle Help overlay',
    run: (ctx) => {
      (global as any).tuiHandlers?.toggleHelp?.();
    }
  },
  {
    key: 'p',
    description: 'Open Command Palette',
    run: (ctx) => {
      console.log('Open Command Palette');
    }
  },
  {
    key: '/',
    description: 'Universal Search',
    run: (ctx) => {
      console.log('Universal Search');
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
    run: () => {
      themeManager.random();
    }
  },

  // Application control
  {
    key: 'q',
    description: 'Quit application',
    run: (ctx) => {
      (global as any).tuiHandlers?.quit?.();
    }
  },

  // Escape for overlay handling
  {
    key: 'escape',
    description: 'Close overlay',
    when: (ctx) => ctx.overlayVisible,
    run: (ctx) => {
      (global as any).tuiHandlers?.closeOverlay?.();
    }
  }
];

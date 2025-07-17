/**
 * Auto-detection of keyboard input modes based on view state
 */

import type { ViewMode } from './keymap-registry.js';

export type ViewState = {
  focusedElement?: {
    type: 'text-input' | 'select' | 'button';
    id: string;
  };
  selectedItems: string[];
  searchActive: boolean;
  modalOpen: boolean;
  currentView: string;
  currentItem?: any;
};

export class ModeDetector {
  static detectMode(viewState: ViewState): ViewMode {
    // Input mode takes precedence - when user is typing in forms
    if (viewState.focusedElement?.type === 'text-input') {
      return 'INPUT';
    }

    // Selection mode when items are selected for bulk operations
    if (viewState.selectedItems.length > 0) {
      return 'SELECTION';
    }

    // Search mode when search is active
    if (viewState.searchActive) {
      return 'SEARCH';
    }

    // Default navigation mode
    return 'NAVIGATION';
  }

  static shouldBypassKeyboard(viewState: ViewState): boolean {
    // Bypass keyboard shortcuts when user is actively typing
    return viewState.focusedElement?.type === 'text-input' ||
           viewState.modalOpen;
  }

  static getModeDisplayName(mode: ViewMode): string {
    switch (mode) {
      case 'NAVIGATION': return 'Navigate';
      case 'INPUT': return 'Input';
      case 'SELECTION': return 'Selection';
      case 'SEARCH': return 'Search';
      default: return mode;
    }
  }

  static getModeColor(mode: ViewMode): string {
    switch (mode) {
      case 'NAVIGATION': return 'green';
      case 'INPUT': return 'yellow';
      case 'SELECTION': return 'blue';
      case 'SEARCH': return 'cyan';
      default: return 'white';
    }
  }
}
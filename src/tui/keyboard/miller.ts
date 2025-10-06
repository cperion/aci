/**
 * Miller columns keyboard bindings
 * Active when Miller columns navigation is focused
 */

import type { KeyBinding } from './types.js';
import { useNavigationStore } from '../state/navigation.js';

export const millerBindings: KeyBinding[] = [
  // Navigation within columns
  {
    key: 'j',
    description: 'Move selection down',
    run: (ctx) => {
      useNavigationStore.getState().moveSelection(1);
    }
  },
  {
    key: 'k',
    description: 'Move selection up',
    run: (ctx) => {
      useNavigationStore.getState().moveSelection(-1);
    }
  },
  {
    key: 'l',
    description: 'Enter selected item',
    run: (ctx) => {
      void useNavigationStore.getState().enter();
    }
  },
  {
    key: 'return',
    description: 'Enter selected item',
    run: (ctx) => {
      void useNavigationStore.getState().enter();
    }
  },
  {
    key: 'h',
    description: 'Go to parent column',
    run: (ctx) => {
      useNavigationStore.getState().up();
    }
  },
  {
    key: 'backspace',
    description: 'Go to parent column',
    run: (ctx) => {
      useNavigationStore.getState().up();
    }
  },

  // Column focus
  {
    key: 'tab',
    description: 'Focus next column',
    run: (ctx) => {
      const { activeColumn, columns } = useNavigationStore.getState();
      useNavigationStore.getState().focusColumn((activeColumn + 1) % columns.length);
    }
  },
  {
    key: 'shift-tab',
    description: 'Focus previous column',
    run: (ctx) => {
      const { activeColumn, columns } = useNavigationStore.getState();
      useNavigationStore.getState().focusColumn((activeColumn - 1 + columns.length) % columns.length);
    }
  },

  // Filtering
  {
    key: '/',
    description: 'Filter current column',
    run: (ctx) => {
      const { columns, activeColumn } = useNavigationStore.getState();
      const column = columns[activeColumn];
      if (column) {
        // Toggle filter mode - if filter exists, clear it, otherwise start filtering
        if (column.filter.length > 0) {
          useNavigationStore.getState().clearFilter();
        } else {
          useNavigationStore.getState().setFilter('');
        }
      }
    }
  },
  {
    key: 'escape',
    description: 'Clear filter',
    when: (ctx) => {
      const { columns, activeColumn } = useNavigationStore.getState();
      const column = columns[activeColumn];
      return column?.filter.length > 0;
    },
    run: (ctx) => {
      useNavigationStore.getState().clearFilter();
    }
  },

  // Jump navigation
  {
    key: 'g',
    description: 'Jump to first item',
    run: (ctx) => {
      useNavigationStore.getState().moveSelection(Number.NEGATIVE_INFINITY);
    }
  },
  {
    key: 'G',
    description: 'Jump to last item',
    run: (ctx) => {
      useNavigationStore.getState().moveSelection(Number.POSITIVE_INFINITY);
    }
  },

  // Actions
  {
    key: 'r',
    description: 'Refresh selected item',
    run: (ctx) => {
      void useNavigationStore.getState().refresh();
    }
  },
  {
    key: 'i',
    description: 'Toggle inspector',
    run: (ctx) => {
      useNavigationStore.getState().toggleInspector();
    }
  },

  // Copy/URL operations
  {
    key: 'y',
    description: 'Copy URL to clipboard',
    run: (ctx) => {
      const { activeColumn, columns } = useNavigationStore.getState();
      const column = columns[activeColumn];
      if (column) {
        const selectedNodeId = column.nodes[column.selectedIndex];
        // This would need clipboard integration
        console.log('Copy URL:', selectedNodeId);
      }
    }
  },
  {
    key: 'o',
    description: 'Open in browser',
    run: (ctx) => {
      const { activeColumn, columns } = useNavigationStore.getState();
      const column = columns[activeColumn];
      if (column) {
        const selectedNodeId = column.nodes[column.selectedIndex];
        // This would need to open the URL in browser
        console.log('Open in browser:', selectedNodeId);
      }
    }
  },
];
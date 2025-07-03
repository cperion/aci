import type { ViewKeymap } from '../keymap-registry.js';

export const servicesKeymap: ViewKeymap = {
  viewId: 'services',
  keys: {
    // Single service actions (NAVIGATION mode)
    'd': {
      key: 'd',
      label: 'Delete',
      action: 'deleteSelectedService',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'r': {
      key: 'r',
      label: 'Restart',
      action: 'restartSelectedService',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'i': {
      key: 'i',
      label: 'Inspect',
      action: 'inspectSelectedService',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    's': {
      key: 's',
      label: 'Search',
      action: 'toggleSearchMode',
      mode: ['NAVIGATION']
    },
    'e': {
      key: 'e',
      label: 'Edit',
      action: 'editSelectedService',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    
    // Navigation
    'j': {
      key: 'j',
      label: 'Down',
      action: 'moveDown',
      mode: ['NAVIGATION']
    },
    'k': {
      key: 'k',
      label: 'Up',
      action: 'moveUp',
      mode: ['NAVIGATION']
    },
    
    // Selection operations
    ' ': {
      key: ' ',
      label: 'Select',
      action: 'toggleServiceSelection',
      mode: ['NAVIGATION', 'SELECTION']
    },
    
    // Bulk operations (SELECTION mode)
    'D': {
      key: 'D',
      label: 'Delete All',
      action: 'deleteBulkServices',
      mode: ['SELECTION'],
      available: (state) => state.selectedItems?.length > 0
    },
    'R': {
      key: 'R',
      label: 'Restart All',
      action: 'restartBulkServices',
      mode: ['SELECTION'],
      available: (state) => state.selectedItems?.length > 0
    },
    
    // View controls
    'f': {
      key: 'f',
      label: 'Filter',
      action: 'toggleFilterPanel',
      mode: ['NAVIGATION']
    },
    'Ctrl+r': {
      key: 'Ctrl+r',
      label: 'Refresh',
      action: 'refreshServiceList',
      mode: ['NAVIGATION', 'SELECTION']
    }
  }
};
import type { ViewKeymap } from '../keymap-registry.js';

export const itemsKeymap: ViewKeymap = {
  viewId: 'items',
  keys: {
    // Item operations
    'd': {
      key: 'd',
      label: 'Delete',
      action: 'deleteSelectedItem',
      mode: ['NAVIGATION'],
      priority: 2,
      available: (state) => state?.currentItem
    },
    'e': {
      key: 'e',
      label: 'Edit',
      action: 'editSelectedItem',
      mode: ['NAVIGATION'],
      priority: 3,
      available: (state) => state?.currentItem
    },
    'v': {
      key: 'v',
      label: 'View Details',
      action: 'viewItemDetails',
      mode: ['NAVIGATION'],
      priority: 4,
      available: (state) => state?.currentItem
    },
    's': {
      key: 's',
      label: 'Share',
      action: 'shareSelectedItem',
      mode: ['NAVIGATION'],
      priority: 5,
      available: (state) => state?.currentItem
    },
    'o': {
      key: 'o',
      label: 'Open in Browser',
      action: 'openItemInBrowser',
      mode: ['NAVIGATION'],
      priority: 6,
      available: (state) => state?.currentItem
    },
    'u': {
      key: 'u',
      label: 'Update',
      action: 'updateSelectedItem',
      mode: ['NAVIGATION'],
      priority: 7,
      available: (state) => state?.currentItem
    },
    
    // Navigation
    'j': {
      key: 'j',
      label: 'Down',
      action: 'moveDown',
      mode: ['NAVIGATION'],
      priority: 0
    },
    'k': {
      key: 'k',
      label: 'Up',
      action: 'moveUp',
      mode: ['NAVIGATION'],
      priority: 0
    },
    'Enter': {
      key: 'Enter',
      label: 'Open',
      action: 'openItem',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // Selection and bulk operations
    'Space': {
      key: 'Space',
      label: 'Select',
      action: 'toggleItemSelection',
      mode: ['NAVIGATION', 'SELECTION'],
      priority: 1
    },
    'A': {
      key: 'A',
      label: 'Select All',
      action: 'selectAllItems',
      mode: ['NAVIGATION'],
      priority: 8
    },
    
    // Bulk operations (SELECTION mode)
    'D': {
      key: 'D',
      label: 'Delete All',
      action: 'deleteBulkItems',
      mode: ['SELECTION'],
      priority: 1,
      available: (state) => state?.selectedItems?.length > 0
    },
    'S': {
      key: 'S',
      label: 'Share All',
      action: 'shareBulkItems',
      mode: ['SELECTION'],
      priority: 2,
      available: (state) => state?.selectedItems?.length > 0
    },
    'U': {
      key: 'U',
      label: 'Update All',
      action: 'updateBulkItems',
      mode: ['SELECTION'],
      priority: 3,
      available: (state) => state?.selectedItems?.length > 0
    },
    
    // View controls
    'f': {
      key: 'f',
      label: 'Filter',
      action: 'filterItems',
      mode: ['NAVIGATION'],
      priority: 9
    },
    'c': {
      key: 'c',
      label: 'Create',
      action: 'createNewItem',
      mode: ['NAVIGATION'],
      priority: 10
    },
    't': {
      key: 't',
      label: 'Filter by Type',
      action: 'filterByType',
      mode: ['NAVIGATION'],
      priority: 11
    }
  }
};
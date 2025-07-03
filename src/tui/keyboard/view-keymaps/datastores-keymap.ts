import type { ViewKeymap } from '../keymap-registry.js';

export const datastoresKeymap: ViewKeymap = {
  viewId: 'datastores',
  keys: {
    // Datastore operations
    'v': {
      key: 'v',
      label: 'Validate',
      action: 'validateDatastore',
      mode: ['NAVIGATION'],
      priority: 2,
      available: (state) => state.currentItem
    },
    'h': {
      key: 'h',
      label: 'Health Check',
      action: 'checkDatastoreHealth',
      mode: ['NAVIGATION'],
      priority: 3,
      available: (state) => state.currentItem
    },
    'e': {
      key: 'e',
      label: 'Edit',
      action: 'editDatastore',
      mode: ['NAVIGATION'],
      priority: 4,
      available: (state) => state.currentItem
    },
    'd': {
      key: 'd',
      label: 'Delete',
      action: 'deleteDatastore',
      mode: ['NAVIGATION'],
      priority: 5,
      available: (state) => state.currentItem
    },
    'r': {
      key: 'r',
      label: 'Restart',
      action: 'restartDatastore',
      mode: ['NAVIGATION'],
      priority: 6,
      available: (state) => state.currentItem
    },
    'i': {
      key: 'i',
      label: 'Info',
      action: 'viewDatastoreInfo',
      mode: ['NAVIGATION'],
      priority: 7,
      available: (state) => state.currentItem
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
      action: 'openDatastore',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // Connection testing
    't': {
      key: 't',
      label: 'Test Connection',
      action: 'testConnection',
      mode: ['NAVIGATION'],
      priority: 8,
      available: (state) => state.currentItem
    },
    'p': {
      key: 'p',
      label: 'Ping',
      action: 'pingDatastore',
      mode: ['NAVIGATION'],
      priority: 9,
      available: (state) => state.currentItem
    },
    
    // Management operations
    'c': {
      key: 'c',
      label: 'Create',
      action: 'createDatastore',
      mode: ['NAVIGATION'],
      priority: 10
    },
    'n': {
      key: 'n',
      label: 'Register New',
      action: 'registerDatastore',
      mode: ['NAVIGATION'],
      priority: 11
    },
    's': {
      key: 's',
      label: 'Sync',
      action: 'syncDatastore',
      mode: ['NAVIGATION'],
      priority: 12,
      available: (state) => state.currentItem
    },
    
    // Bulk operations
    'Space': {
      key: 'Space',
      label: 'Select',
      action: 'toggleDatastoreSelection',
      mode: ['NAVIGATION', 'SELECTION'],
      priority: 1
    },
    'A': {
      key: 'A',
      label: 'Select All',
      action: 'selectAllDatastores',
      mode: ['NAVIGATION'],
      priority: 13
    },
    'V': {
      key: 'V',
      label: 'Validate All',
      action: 'validateBulkDatastores',
      mode: ['SELECTION'],
      priority: 1,
      available: (state) => state.selectedItems?.length > 0
    },
    'H': {
      key: 'H',
      label: 'Health Check All',
      action: 'healthCheckBulkDatastores',
      mode: ['SELECTION'],
      priority: 2,
      available: (state) => state.selectedItems?.length > 0
    }
  }
};
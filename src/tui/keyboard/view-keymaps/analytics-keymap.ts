import type { ViewKeymap } from '../keymap-registry.js';

export const analyticsKeymap: ViewKeymap = {
  viewId: 'analytics',
  keys: {
    // Analysis actions
    'a': {
      key: 'a',
      label: 'Run Analysis',
      action: 'runAnalysis',
      mode: ['NAVIGATION'],
      priority: 1
    },
    'e': {
      key: 'e',
      label: 'Export Results',
      action: 'exportResults',
      mode: ['NAVIGATION'],
      priority: 2,
      available: (state) => state.hasResults
    },
    'v': {
      key: 'v',
      label: 'Visualize Data',
      action: 'visualizeData',
      mode: ['NAVIGATION'],
      priority: 3,
      available: (state) => state.hasResults
    },
    's': {
      key: 's',
      label: 'Save Query',
      action: 'saveQuery',
      mode: ['NAVIGATION'],
      priority: 4,
      available: (state) => state.currentQuery
    },
    'l': {
      key: 'l',
      label: 'Load Query',
      action: 'loadSavedQuery',
      mode: ['NAVIGATION'],
      priority: 5
    },
    'p': {
      key: 'p',
      label: 'Parameters',
      action: 'editParameters',
      mode: ['NAVIGATION'],
      priority: 6
    },
    'h': {
      key: 'h',
      label: 'History',
      action: 'viewQueryHistory',
      mode: ['NAVIGATION'],
      priority: 7
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
      label: 'Execute',
      action: 'executeQuery',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // View controls
    'r': {
      key: 'r',
      label: 'Refresh Data',
      action: 'refreshData',
      mode: ['NAVIGATION'],
      priority: 8
    },
    'f': {
      key: 'f',
      label: 'Toggle Filters',
      action: 'toggleFilters',
      mode: ['NAVIGATION'],
      priority: 9
    },
    'c': {
      key: 'c',
      label: 'Clear Results',
      action: 'clearResults',
      mode: ['NAVIGATION'],
      priority: 10,
      available: (state) => state.hasResults
    },
    
    // Template operations
    't': {
      key: 't',
      label: 'Templates',
      action: 'showTemplates',
      mode: ['NAVIGATION'],
      priority: 11
    },
    'n': {
      key: 'n',
      label: 'New Template',
      action: 'createTemplate',
      mode: ['NAVIGATION'],
      priority: 12
    }
  }
};
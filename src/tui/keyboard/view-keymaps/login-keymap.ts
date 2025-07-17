import type { ViewKeymap } from '../keymap-registry.js';

export const loginKeymap: ViewKeymap = {
  viewId: 'login',
  keys: {
    // Login actions
    'Enter': {
      key: 'Enter',
      label: 'Login',
      action: 'submitLogin',
      mode: ['NAVIGATION'],
      priority: 1,
      available: (state) => state.formValid
    },
    'l': {
      key: 'l',
      label: 'Login',
      action: 'submitLogin',
      mode: ['NAVIGATION'],
      priority: 1,
      available: (state) => state.formValid
    },
    't': {
      key: 't',
      label: 'Token Login',
      action: 'switchToTokenAuth',
      mode: ['NAVIGATION'],
      priority: 2
    },
    'u': {
      key: 'u',
      label: 'Username Login',
      action: 'switchToUsernameAuth',
      mode: ['NAVIGATION'],
      priority: 3
    },
    
    // Form navigation
    'Tab': {
      key: 'Tab',
      label: 'Next Field',
      action: 'nextField',
      mode: ['NAVIGATION'],
      priority: 0
    },
    'j': {
      key: 'j',
      label: 'Next Field',
      action: 'nextField',
      mode: ['NAVIGATION'],
      priority: 0
    },
    'k': {
      key: 'k',
      label: 'Previous Field',
      action: 'previousField',
      mode: ['NAVIGATION'],
      priority: 0
    },
    
    // Convenience actions
    'c': {
      key: 'c',
      label: 'Clear Form',
      action: 'clearForm',
      mode: ['NAVIGATION'],
      priority: 4
    },
    's': {
      key: 's',
      label: 'Save Credentials',
      action: 'toggleSaveCredentials',
      mode: ['NAVIGATION'],
      priority: 5
    },
    'h': {
      key: 'h',
      label: 'Help',
      action: 'showLoginHelp',
      mode: ['NAVIGATION'],
      priority: 6
    },
    
    // Quick portal selection
    '1': {
      key: '1',
      label: 'ArcGIS Online',
      action: 'selectArcGISOnline',
      mode: ['NAVIGATION'],
      priority: 7
    },
    '2': {
      key: '2',
      label: 'Portal 1',
      action: 'selectPortal1',
      mode: ['NAVIGATION'],
      priority: 8,
      available: (state) => state.savedPortals?.length > 0
    },
    '3': {
      key: '3',
      label: 'Portal 2',
      action: 'selectPortal2',
      mode: ['NAVIGATION'],
      priority: 9,
      available: (state) => state.savedPortals?.length > 1
    }
  }
};
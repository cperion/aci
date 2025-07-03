import type { ViewKeymap } from '../keymap-registry.js';

export const homeKeymap: ViewKeymap = {
  viewId: 'home',
  keys: {
    'l': {
      key: 'l',
      label: 'Login',
      action: 'navigateToLogin',
      mode: ['NAVIGATION'],
      priority: 1
    },
    's': {
      key: 's',
      label: 'Services',
      action: 'navigateToServices',
      mode: ['NAVIGATION'],
      priority: 2
    },
    'u': {
      key: 'u',
      label: 'Users',
      action: 'navigateToUsers',
      mode: ['NAVIGATION'],
      priority: 3
    },
    'g': {
      key: 'g',
      label: 'Groups',
      action: 'navigateToGroups',
      mode: ['NAVIGATION'],
      priority: 4
    },
    'i': {
      key: 'i',
      label: 'Items',
      action: 'navigateToItems',
      mode: ['NAVIGATION'],
      priority: 5
    },
    'a': {
      key: 'a',
      label: 'Admin',
      action: 'navigateToAdmin',
      mode: ['NAVIGATION'],
      priority: 6
    },
    'n': {
      key: 'n',
      label: 'Insights',
      action: 'navigateToInsights',
      mode: ['NAVIGATION'],
      priority: 7
    },
    't': {
      key: 't',
      label: 'Analytics',
      action: 'navigateToAnalytics',
      mode: ['NAVIGATION'],
      priority: 8
    },
    'd': {
      key: 'd',
      label: 'Datastores',
      action: 'navigateToDatastores',
      mode: ['NAVIGATION'],
      priority: 9
    }
  }
};
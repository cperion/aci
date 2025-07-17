import type { ViewKeymap } from '../keymap-registry.js';

export const insightsKeymap: ViewKeymap = {
  viewId: 'insights',
  keys: {
    // Insights operations
    'a': {
      key: 'a',
      label: 'Auth Failures',
      action: 'viewAuthFailures',
      mode: ['NAVIGATION'],
      priority: 1
    },
    's': {
      key: 's',
      label: 'Service Health',
      action: 'viewServiceHealth',
      mode: ['NAVIGATION'],
      priority: 2
    },
    'c': {
      key: 'c',
      label: 'Command Trends',
      action: 'viewCommandTrends',
      mode: ['NAVIGATION'],
      priority: 3
    },
    'r': {
      key: 'r',
      label: 'Resource Trends',
      action: 'viewResourceTrends',
      mode: ['NAVIGATION'],
      priority: 4
    },
    'u': {
      key: 'u',
      label: 'User Activity',
      action: 'viewUserActivity',
      mode: ['NAVIGATION'],
      priority: 5
    },
    'p': {
      key: 'p',
      label: 'Performance',
      action: 'viewPerformanceMetrics',
      mode: ['NAVIGATION'],
      priority: 6
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
      label: 'Open Report',
      action: 'openReport',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // Time range controls
    '1': {
      key: '1',
      label: 'Last Hour',
      action: 'setTimeRangeHour',
      mode: ['NAVIGATION'],
      priority: 7
    },
    '2': {
      key: '2',
      label: 'Last Day',
      action: 'setTimeRangeDay',
      mode: ['NAVIGATION'],
      priority: 8
    },
    '3': {
      key: '3',
      label: 'Last Week',
      action: 'setTimeRangeWeek',
      mode: ['NAVIGATION'],
      priority: 9
    },
    '4': {
      key: '4',
      label: 'Last Month',
      action: 'setTimeRangeMonth',
      mode: ['NAVIGATION'],
      priority: 10
    },
    
    // Export and sharing
    'e': {
      key: 'e',
      label: 'Export',
      action: 'exportReport',
      mode: ['NAVIGATION'],
      priority: 11,
      available: (state) => state.currentReport
    },
    'd': {
      key: 'd',
      label: 'Download CSV',
      action: 'downloadCSV',
      mode: ['NAVIGATION'],
      priority: 12,
      available: (state) => state.currentReport
    },
    
    // View controls
    'f': {
      key: 'f',
      label: 'Filter',
      action: 'toggleFilters',
      mode: ['NAVIGATION'],
      priority: 13
    },
    'x': {
      key: 'x',
      label: 'Refresh',
      action: 'refreshInsights',
      mode: ['NAVIGATION'],
      priority: 14
    }
  }
};
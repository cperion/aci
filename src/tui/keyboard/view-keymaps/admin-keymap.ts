import type { ViewKeymap } from '../keymap-registry.js';

export const adminKeymap: ViewKeymap = {
  viewId: 'admin',
  keys: {
    // Server operations
    'r': {
      key: 'r',
      label: 'Restart Server',
      action: 'restartServer',
      mode: ['NAVIGATION'],
      priority: 1
    },
    's': {
      key: 's',
      label: 'Server Status',
      action: 'viewServerStatus',
      mode: ['NAVIGATION'],
      priority: 2
    },
    'l': {
      key: 'l',
      label: 'View Logs',
      action: 'viewServerLogs',
      mode: ['NAVIGATION'],
      priority: 3
    },
    'c': {
      key: 'c',
      label: 'Configuration',
      action: 'viewServerConfig',
      mode: ['NAVIGATION'],
      priority: 4
    },
    'h': {
      key: 'h',
      label: 'Health Check',
      action: 'runHealthCheck',
      mode: ['NAVIGATION'],
      priority: 5
    },
    
    // Service management
    'd': {
      key: 'd',
      label: 'Deploy Service',
      action: 'deployService',
      mode: ['NAVIGATION'],
      priority: 6
    },
    'u': {
      key: 'u',
      label: 'Undeploy Service',
      action: 'undeployService',
      mode: ['NAVIGATION'],
      priority: 7,
      available: (state) => state.currentItem
    },
    'e': {
      key: 'e',
      label: 'Edit Service',
      action: 'editService',
      mode: ['NAVIGATION'],
      priority: 8,
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
      label: 'Select',
      action: 'selectItem',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // Monitoring
    'm': {
      key: 'm',
      label: 'Monitor',
      action: 'openMonitoring',
      mode: ['NAVIGATION'],
      priority: 9
    },
    'p': {
      key: 'p',
      label: 'Performance',
      action: 'viewPerformance',
      mode: ['NAVIGATION'],
      priority: 10
    },
    'a': {
      key: 'a',
      label: 'Alerts',
      action: 'viewAlerts',
      mode: ['NAVIGATION'],
      priority: 11
    },
    
    // System operations
    'b': {
      key: 'b',
      label: 'Backup',
      action: 'createBackup',
      mode: ['NAVIGATION'],
      priority: 12
    },
    'x': {
      key: 'x',
      label: 'Maintenance Mode',
      action: 'toggleMaintenanceMode',
      mode: ['NAVIGATION'],
      priority: 13
    }
  }
};
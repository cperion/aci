import type { ViewKeymap } from '../keymap-registry.js';

export const usersKeymap: ViewKeymap = {
  viewId: 'users',
  keys: {
    // User operations
    'd': {
      key: 'd',
      label: 'Delete',
      action: 'deleteSelectedUser',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'e': {
      key: 'e',
      label: 'Edit',
      action: 'editSelectedUser',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'p': {
      key: 'p',
      label: 'Permissions',
      action: 'viewUserPermissions',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'g': {
      key: 'g',
      label: 'Groups',
      action: 'viewUserGroups',
      mode: ['NAVIGATION'],
      available: (state) => state.currentItem
    },
    'r': {
      key: 'r',
      label: 'Reset Password',
      action: 'resetUserPassword',
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
    
    // Selection
    'Space': {
      key: 'Space',
      label: 'Select',
      action: 'toggleUserSelection',
      mode: ['NAVIGATION', 'SELECTION'],
      priority: 1
    },
    
    // Bulk operations (SELECTION mode)
    'D': {
      key: 'D',
      label: 'Delete All',
      action: 'deleteBulkUsers',
      mode: ['SELECTION'],
      available: (state) => state.selectedItems?.length > 0
    },
    'G': {
      key: 'G',
      label: 'Add to Group',
      action: 'addUsersToGroup',
      mode: ['SELECTION'],
      available: (state) => state.selectedItems?.length > 0
    },
    
    // View controls
    's': {
      key: 's',
      label: 'Search',
      action: 'searchUsers',
      mode: ['NAVIGATION']
    },
    'f': {
      key: 'f',
      label: 'Filter',
      action: 'filterUsers',
      mode: ['NAVIGATION']
    },
    'c': {
      key: 'c',
      label: 'Create',
      action: 'createNewUser',
      mode: ['NAVIGATION']
    }
  }
};
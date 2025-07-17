import type { ViewKeymap } from '../keymap-registry.js';

export const groupsKeymap: ViewKeymap = {
  viewId: 'groups',
  keys: {
    // Group operations
    'd': {
      key: 'd',
      label: 'Delete',
      action: 'deleteSelectedGroup',
      mode: ['NAVIGATION'],
      priority: 2,
      available: (state) => state?.currentItem
    },
    'e': {
      key: 'e',
      label: 'Edit',
      action: 'editSelectedGroup',
      mode: ['NAVIGATION'],
      priority: 3,
      available: (state) => state?.currentItem
    },
    'm': {
      key: 'm',
      label: 'Members',
      action: 'viewGroupMembers',
      mode: ['NAVIGATION'],
      priority: 4,
      available: (state) => state?.currentItem
    },
    'p': {
      key: 'p',
      label: 'Permissions',
      action: 'viewGroupPermissions',
      mode: ['NAVIGATION'],
      priority: 5,
      available: (state) => state?.currentItem
    },
    'a': {
      key: 'a',
      label: 'Add Members',
      action: 'addMembersToGroup',
      mode: ['NAVIGATION'],
      priority: 6,
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
      action: 'openGroup',
      mode: ['NAVIGATION'],
      priority: 1
    },
    
    // Selection and bulk operations
    'Space': {
      key: 'Space',
      label: 'Select',
      action: 'toggleGroupSelection',
      mode: ['NAVIGATION', 'SELECTION'],
      priority: 1
    },
    'A': {
      key: 'A',
      label: 'Select All',
      action: 'selectAllGroups',
      mode: ['NAVIGATION'],
      priority: 7
    },
    
    // Bulk operations (SELECTION mode)
    'D': {
      key: 'D',
      label: 'Delete All',
      action: 'deleteBulkGroups',
      mode: ['SELECTION'],
      priority: 1,
      available: (state) => state?.selectedItems?.length > 0
    },
    'M': {
      key: 'M',
      label: 'Merge Groups',
      action: 'mergeSelectedGroups',
      mode: ['SELECTION'],
      priority: 2,
      available: (state) => state?.selectedItems?.length > 1
    },
    
    // View controls
    's': {
      key: 's',
      label: 'Search',
      action: 'searchGroups',
      mode: ['NAVIGATION'],
      priority: 8
    },
    'f': {
      key: 'f',
      label: 'Filter',
      action: 'filterGroups',
      mode: ['NAVIGATION'],
      priority: 9
    },
    'c': {
      key: 'c',
      label: 'Create',
      action: 'createNewGroup',
      mode: ['NAVIGATION'],
      priority: 10
    }
  }
};
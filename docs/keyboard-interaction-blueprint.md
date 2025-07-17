# TUI Keyboard Interaction Blueprint

> **Status**: Implementation Ready  
> **Date**: 2025-07-03  
> **Consultation**: DeepSeek Analysis on Vim Philosophy vs Pragmatic TUI Design

## Executive Summary

After deep analysis of vim philosophy, lazygit patterns, and Enterprise ArcGIS workflows, we're implementing a **pragmatic context-aware keyboard system** that prioritizes immediate productivity over compositional complexity.

**Core Decision**: Abandon vim's verb-object grammar in favor of lazygit's context-specific single-letter shortcuts with selection-first bulk operations.

## Design Philosophy

### Primary Principles
1. **Immediate Action**: No timeout-based key sequences (0ms delay)
2. **Context Determines Meaning**: `d` means different things in different views
3. **Selection-First Bulk Operations**: Space to select, then action key for bulk ops
4. **Visual Discovery**: Permanent action hints, not memorized combinations
5. **Optimistic UI**: Instant visual feedback while background operations continue

### Rejected Approaches
- ❌ Universal verb-object grammar (`d` + `w` patterns)
- ❌ 850ms timeout sequences 
- ❌ Hidden key combinations requiring memorization
- ❌ Strict modal enforcement for forms
- ❌ Complex operator algebra (`3da` patterns)

## Global Key Bindings

### Universal Keys (Work Everywhere)
```typescript
const globalKeys = {
  '?': 'showHelp',           // Help overlay
  'Escape': 'goBack',        // Navigate back
  ':': 'openCommandPalette', // Vim-style command mode
  'q': 'quit',               // Quick quit (context-aware)
  'Ctrl+r': 'refresh',       // Refresh current view
  'Ctrl+e': 'repeatLastAction' // Repeat without memorizing
};
```

### Navigation Keys
```typescript
const navigationKeys = {
  // Vim motion (when not in forms)
  'h': 'left',
  'j': 'down', 
  'k': 'up',
  'l': 'right',
  
  // Arrow keys (always work)
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  
  // Selection
  'Space': 'toggleSelection',
  'Enter': 'executeDefault',
  'Tab': 'nextPane'
};
```

## View-Specific Key Maps

### HomeView
```typescript
const homeViewKeys = {
  'l': 'navigateToLogin',
  's': 'navigateToServices', 
  'u': 'navigateToUsers',
  'g': 'navigateToGroups',
  'i': 'navigateToItems',
  'a': 'navigateToAdmin',
  'n': 'navigateToInsights',
  't': 'navigateToAnalytics',
  'd': 'navigateToDatastores'
};
```

### ServicesView
```typescript
const servicesViewKeys = {
  // Single service actions
  'd': 'deleteSelectedService',     // Instant delete (with confirmation)
  'r': 'restartSelectedService',    // Restart service
  'i': 'inspectSelectedService',    // Show service details
  's': 'toggleSearchMode',          // Enter/exit search
  'e': 'editSelectedService',       // Edit service properties
  
  // Bulk operations (when items selected)
  'Space': 'toggleServiceSelection', // Select multiple
  // When selections exist:
  'd': 'deleteBulkServices',        // Bulk delete
  'r': 'restartBulkServices',       // Bulk restart
  
  // View controls
  'f': 'toggleFilterPanel',
  'R': 'refreshServiceList'         // Capital R for full refresh
};
```

### LoginView  
```typescript
const loginViewKeys = {
  // Form navigation (when in text fields)
  'Tab': 'nextField',
  'Shift+Tab': 'previousField',
  'Enter': 'submitCurrentStep',
  
  // Quick actions (when not in fields)
  'Ctrl+r': 'refreshPortalStatus',
  't': 'switchToTokenAuth',         // Toggle auth method
  'u': 'switchToUsernameAuth'
};
```

### UsersView
```typescript
const usersViewKeys = {
  // User operations
  'd': 'deleteSelectedUser',
  'e': 'editSelectedUser', 
  'p': 'viewUserPermissions',
  'g': 'viewUserGroups',
  'r': 'resetUserPassword',
  
  // Bulk operations
  'Space': 'toggleUserSelection',
  // When selections exist:
  'd': 'deleteBulkUsers',
  'g': 'addUsersToGroup',
  
  // View controls
  's': 'searchUsers',
  'f': 'filterUsers',
  'c': 'createNewUser'
};
```

### GroupsView
```typescript
const groupsViewKeys = {
  // Group operations  
  'd': 'deleteSelectedGroup',
  'e': 'editSelectedGroup',
  'm': 'viewGroupMembers',
  'p': 'viewGroupPermissions',
  
  // Bulk operations
  'Space': 'toggleGroupSelection',
  'd': 'deleteBulkGroups',
  
  // View controls
  's': 'searchGroups',
  'c': 'createNewGroup'
};
```

### ItemsView
```typescript
const itemsViewKeys = {
  // Item operations
  'd': 'deleteSelectedItem',
  'e': 'editSelectedItem',
  'v': 'viewItemDetails', 
  's': 'shareSelectedItem',
  'o': 'openItemInBrowser',
  
  // Bulk operations
  'Space': 'toggleItemSelection',
  'd': 'deleteBulkItems',
  's': 'shareBulkItems',
  
  // View controls
  'f': 'filterItems',
  'c': 'createNewItem'
};
```

### AnalyticsView
```typescript
const analyticsViewKeys = {
  // Analysis actions
  'a': 'runAnalysis',
  'e': 'exportResults',
  'v': 'visualizeData',
  's': 'saveQuery',
  'l': 'loadSavedQuery',
  
  // View controls
  'r': 'refreshData',
  'f': 'toggleFilters'
};
```

## Mode Management

### Simplified Modal System
```typescript
type ViewMode = 
  | 'NAVIGATION'  // Default: keyboard shortcuts active
  | 'INPUT'       // Text fields: shortcuts disabled
  | 'SELECTION'   // Multiple items selected: bulk shortcuts
  | 'SEARCH'      // Search active: filter keystrokes

// Auto-detection rules
function detectMode(viewState: ViewState): ViewMode {
  if (viewState.focusedElement?.type === 'text-input') return 'INPUT';
  if (viewState.selectedItems.length > 0) return 'SELECTION';  
  if (viewState.searchActive) return 'SEARCH';
  return 'NAVIGATION';
}
```

### Mode Transitions
- **INPUT**: Auto-enter when focusing text fields, auto-exit on blur
- **SELECTION**: Enter with Space, exit with Escape or action completion
- **SEARCH**: Enter with `s`, exit with Escape or Enter
- **NAVIGATION**: Default state

## UI Components

### Action Footer
Every view shows available shortcuts at bottom:
```jsx
<ActionFooter
  mode={currentMode}
  shortcuts={[
    { key: 'd', label: 'Delete', available: hasSelection },
    { key: 'r', label: 'Restart', available: hasSelection },
    { key: 's', label: 'Search' },
    { key: '?', label: 'Help' }
  ]}
  selections={selectedItems.length}
/>
```

### Selection Indicator
When items are selected:
```jsx
<SelectionBar>
  <Text>{selectedItems.length} items selected</Text>
  <Text>[d] Delete  [r] Restart  [Esc] Clear</Text>
</SelectionBar>
```

### Mode Indicator (Optional)
Small indicator in header:
```jsx
<ModeIndicator>
  {mode === 'SELECTION' && <Text color="blue">[SEL]</Text>}
  {mode === 'SEARCH' && <Text color="yellow">[SEARCH]</Text>}
</ModeIndicator>
```

## Error Handling

### Invalid Key Presses
Show helpful hints instead of generic errors:
```jsx
function handleInvalidKey(key: string, context: string) {
  showTemporaryHint({
    title: `"${key}" not available here`,
    suggestions: [
      `Try [d] Delete`,
      `Try [s] Search`, 
      `Press [?] for help`
    ],
    duration: 2000
  });
}
```

### Bulk Operation Confirmations
```jsx
function confirmBulkAction(action: string, count: number) {
  return showConfirmation({
    title: `${action} ${count} items?`,
    shortcuts: ['y', 'n', 'Escape'],
    defaultAction: 'n'
  });
}
```

## Performance Requirements

### Response Times
- **Key press to visual feedback**: <50ms
- **Local actions** (selection, navigation): <100ms  
- **API actions** (delete, restart): Optimistic UI + background
- **Search filtering**: <200ms (debounced)

### Optimistic Updates
```typescript
// Immediate UI update
function deleteService(serviceId: string) {
  // 1. Remove from UI immediately
  removeServiceFromList(serviceId);
  showTemporarySuccess('Service deleted');
  
  // 2. Background API call
  api.deleteService(serviceId)
    .catch(() => {
      // 3. Rollback on failure
      addServiceToList(service);
      showError('Delete failed - service restored');
    });
}
```

## Implementation Files

### New Files to Create
```
src/tui/keyboard/
├── keymap-registry.ts      # Central keymap management
├── mode-detector.ts        # Auto-mode detection
├── action-processor.ts     # Key to action mapping
└── view-keymaps/
    ├── home-keymap.ts
    ├── services-keymap.ts  
    ├── users-keymap.ts
    ├── groups-keymap.ts
    ├── items-keymap.ts
    ├── login-keymap.ts
    └── analytics-keymap.ts

src/tui/components/
├── ActionFooter.tsx        # Permanent shortcut display
├── SelectionBar.tsx        # Bulk operation hints
├── ModeIndicator.tsx       # Current mode display
└── ConfirmationDialog.tsx  # Bulk action confirmations
```

### Files to Modify
```
src/tui/hooks/
├── navigation.tsx          # Add mode management
└── keyboard.tsx            # New: centralized key handling

src/tui/components/views/
├── HomeView.tsx           # Replace current key handlers
├── ServicesView.tsx       # Add selection system
├── LoginView.tsx          # Smart form handling
├── UsersView.tsx          # Implement bulk operations
├── GroupsView.tsx         # Implement bulk operations
└── ItemsView.tsx          # Implement bulk operations

src/tui/components/
├── Layout.tsx             # Add ActionFooter
└── Pane.tsx               # Mode-aware styling
```

## Testing Strategy

### Key Sequence Tests
```typescript
describe('ServiceView Keyboard', () => {
  test('d deletes selected service', () => {
    selectService('service-1');
    pressKey('d');
    expect(confirmationShown()).toBe(true);
    pressKey('y');
    expect(serviceDeleted('service-1')).toBe(true);
  });
  
  test('Space+d bulk deletes', () => {
    pressKey('Space'); // Select first
    pressKey('j');     // Move down  
    pressKey('Space'); // Select second
    pressKey('d');     // Bulk delete
    expect(bulkConfirmationShown()).toBe(true);
  });
});
```

### Mode Transition Tests  
```typescript
test('auto-enters input mode on text focus', () => {
  focusTextInput();
  expect(getCurrentMode()).toBe('INPUT');
  pressKey('d'); // Should type 'd', not delete
  expect(inputValue()).toBe('d');
});
```

## Migration Strategy

### Phase 1: Core Infrastructure
1. Create keymap registry system
2. Add mode detection to navigation hook
3. Implement ActionFooter component

### Phase 2: View-by-View Migration  
1. Start with ServicesView (most complex)
2. Add selection system and bulk operations
3. Migrate remaining views one by one

### Phase 3: Polish & Optimization
1. Add confirmation dialogs
2. Implement optimistic updates
3. Performance tuning and error handling

### Phase 4: Documentation & Training
1. Update help system with new shortcuts
2. Create quick reference cards
3. Add onboarding hints for new users

## Success Metrics

### User Experience
- ✅ New users productive within 5 minutes
- ✅ Common actions complete in <3 keystrokes  
- ✅ No timeout frustration (0ms delays)
- ✅ Error recovery under 10 seconds

### Technical Performance
- ✅ Key press response <50ms
- ✅ Mode transitions <100ms
- ✅ Bulk operations handle 100+ items
- ✅ Memory usage stable during extended sessions

## Conclusion

This blueprint prioritizes immediate productivity over vim purity, embracing lazygit's proven patterns while maintaining ArcGIS workflow efficiency. The system scales from novice (guided shortcuts) to expert (muscle memory) without forcing complex grammar learning.

**Next Steps**: Begin Phase 1 implementation with keymap registry and mode detection infrastructure.
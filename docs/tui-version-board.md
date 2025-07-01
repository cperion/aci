# ACI Triptych: Architectural Design Document

**Target Audience:** Development Team, UI/UX Stakeholders
**Focus:** Technical Architecture, State Management, Rendering Logic, Visual Fidelity

---

## 1. Introduction: The Unwavering Focus Vision

The **ACI Triptych** embodies a radical yet intuitive approach to TUI design: **Unwavering Focus**. The user's interaction point is permanently fixed on the **Middle Pane**. This central panel serves as the active workspace, presenting lists for navigation, detailed views for inspection, or interactive forms for actions. The Left and Right panes are not interactive destinations but rather **reactive, contextual display surfaces** that automatically provide relevant information based on the Middle Pane's content.

This design directly maps to a clean, predictable state management model, ensuring that the UI is always a direct and deterministic function of the application's internal state.

## 2. Core Architectural Principles

### 2.1. Unwavering Focus: The Single Interaction Point

* **Rule:** All keyboard input, cursor navigation (`j`/`k`), and primary actions (`l`/`h`, `/`, `:`) occur *exclusively* within the Middle Pane.
* **Implication:** This simplifies user mental models. The user never has to `Tab` between panes; their interaction focus is constant. This leads to significantly faster and more fluid navigation.

### 2.2. Hierarchical Navigation with Inherited Context (`l` / `h`)

* **Rule:** Navigation is a journey up and down a conceptual hierarchy represented by a `navigationStack`.
  * **Drill Down (`l` / `→` / `Enter`):** When the user selects an item in the Middle Pane and drills down, the Middle Pane's *current content* (the list or view they were just on, with their selection highlighted) automatically shifts to the **Left Pane (Parent Context)**. The Middle Pane then renders the *next level down* (the details or children of the selected item).
  * **Go Up (`h` / `←` / `Esc`):** The content of the Left Pane moves back into the Middle Pane, effectively "popping" one level up the hierarchy.
* **Implication:** This creates a consistent, intuitive spatial memory. The Left Pane always shows "where you came from" with the original selection preserved, like the breadcrumbs of a file manager. This eliminates confusion and provides constant orientation.

### 2.3. Reactive Side Panes (Purely Display)

* **Left Pane:** Always displays the `ViewComponent` of the item immediately preceding the current Middle Pane's content in the `navigationStack`. It acts as the "parent context," rendered in a dimmed, non-interactive state but retaining the visual highlight of the item that was drilled down from.
* **Right Pane:** Always displays the `PreviewComponent` of the *currently selected item within the Middle Pane*. Its content dynamically changes based on the Middle Pane's cursor position. In "Action Mode," it provides crucial contextual help and warnings for the action being processed in the Middle Pane.

### 2.4. State-Driven UI with Polymorphic Components

* **Principle:** The entire UI is a pure function of the application state (`UI = f(State)`). There are no direct DOM manipulations or imperative updates.
* **Architecture:** The core `AppState` contains a `navigationStack`. Each "navigable entity type" (e.g., Services, Data Stores, Home Menu) is represented by a consistent interface. The main application layout component intelligently renders content in each pane by invoking the appropriate components based on the `navigationStack` and the active `mode`.

## 3. Application State Model (React-Ink / Zustand Conceptual)

The central piece of application state is managed as a single, immutable object.

```typescript
interface AppState {
  // --- Global Context ---
  currentEnvironment: string;
  authStatus: { portal: { loggedIn: boolean; username?: string }; admin: { loggedIn: boolean; username?: string }; };
  
  // --- Navigation State (Core of Unwavering Focus) ---
  // A stack representing the hierarchy: [home, services_list, service_detail, ...]
  navigationStack: NavigableState[]; 

  // --- Current Interaction State ---
  mode: 'navigation' | 'action'; // Determines main Middle Pane content type
  selectedIndex: number; // The index of the currently highlighted item in the Middle Pane's list
  
  // --- Action Mode Specifics ---
  currentAction: ActionPayload | null; // Details of the action being performed
  actionResult: ActionResult | null; // For displaying toast notifications
}

// Represents a specific view/list/detail state in the navigation stack
interface NavigableState<T = any> {
  type: NavigableEntityTypeEnum; // E.g., 'HOME', 'SERVICES_LIST', 'SERVICE_DETAIL'
  data: T; // The actual data for this view (e.g., array of services, or a single service object)
  selectedIndex: number; // The item selected *in this view* when it was in the Middle Pane
  filterQuery?: string; // If a filter was active when drilling down
  // Other view-specific state (e.g., sort order, pagination)
}

// Represents a pending action during 'action' mode
interface ActionPayload {
  type: ActionTypeEnum; // E.g., 'RESTART_SERVICE', 'LOGIN_ADMIN', 'QUERY_FEATURES'
  target?: any; // The item the action is performed on
  formData?: Record<string, any>; // Form inputs for the action
  // Other action-specific state
}
```

## 4. Component Architecture: The Polymorphic Contract

Every "Navigable Entity Type" (conceptual screen/list/detail) implements a common interface, allowing the main layout to render them polymorphically.

```typescript
// Enum for all possible navigable types
enum NavigableEntityTypeEnum {
  HOME = 'HOME',
  PORTAL_MENU = 'PORTAL_MENU',
  SEARCH_VIEW = 'SEARCH_VIEW',
  INSPECT_URL_VIEW = 'INSPECT_URL_VIEW',
  ITEM_DETAIL_VIEW = 'ITEM_DETAIL_VIEW',
  LAYER_QUERY_VIEW = 'LAYER_QUERY_VIEW',
  ADMIN_MENU = 'ADMIN_MENU',
  SERVICES_LIST = 'SERVICES_LIST',
  DATASTORES_LIST = 'DATASTORES_LIST',
  DATASTORE_DETAIL_VIEW = 'DATASTORE_DETAIL_VIEW',
  DATASTORE_MACHINES_LIST = 'DATASTORE_MACHINES_LIST',
  LOGS_VIEW = 'LOGS_VIEW',
  HEALTH_VIEW = 'HEALTH_VIEW',
  BACKUP_VIEW = 'BACKUP_VIEW',
  HISTORY_VIEW = 'HISTORY_VIEW'
}

// Props passed to a ViewComponent
interface ViewProps {
  navState: NavigableState;
  // Controls how the component is rendered:
  // - If true, it's in the Left Pane (dimmed, non-interactive, highlight based on navState.selectedIndex)
  // - If false, it's in the Middle Pane (active, interactive, highlight based on appState.selectedIndex)
  isParentContext: boolean; 
  onAction?: (actionType: ActionTypeEnum, target?: any) => void; // Callback for actions initiated in this view
  onDrillDown?: (target: any, type: NavigableEntityTypeEnum) => void; // Callback for drill-downs
  onGoUp?: () => void; // Callback for going up
  // ... other context props
}

// Props passed to a PreviewComponent
interface PreviewProps {
  selectedItem: any | null; // The item currently selected in the Middle Pane
  // ... other context props
}

// The core contract for each Navigable Entity
interface INavigableEntityType {
  type: NavigableEntityTypeEnum; // Unique identifier for this entity type
  
  // The React-Ink component responsible for rendering the main view
  // It handles both Middle Pane (active) and Left Pane (parent context) rendering based on `isParentContext`
  ViewComponent: React.FC<ViewProps>; 

  // The React-Ink component responsible for rendering the preview in the Right Pane
  PreviewComponent: React.FC<PreviewProps>;

  // Function to get the list of context-aware actions for the Command Palette
  getActions(item: any | null): { key: string; label: string; action: ActionTypeEnum; }[];

  // Optional: Function to determine the next drill-down type/payload from a selected item
  getDrillDownTarget?(item: any): { type: NavigableEntityTypeEnum; payload: any }; 
}

// Global map to retrieve the entity type handler
const EntityTypeMap: Record<NavigableEntityTypeEnum, INavigableEntityType> = {
  // ... (implementations for each enum value)
};
```

## 5. The Triptych Layout Logic (Render Flow)

The main application component orchestrates the rendering of the three panes based on `AppState`.

```jsx
// Simplified render logic of the top-level <App> component
function App() {
  const [appState, updateAppState] = useAppState(); // Custom hook for state management

  // Determine current and parent navigation states
  const currentNavState = appState.navigationStack[appState.navigationStack.length - 1];
  const parentNavState = appState.navigationStack.length > 1
    ? appState.navigationStack[appState.navigationStack.length - 2]
    : null;

  // Retrieve the component handlers for current and parent views
  const CurrentEntity = EntityTypeMap[currentNavState.type];
  const ParentEntity = parentNavState ? EntityTypeMap[parentNavState.type] : null;

  // Find the currently selected item (for Right Pane preview)
  const selectedItemInMiddle = currentNavState.data && currentNavState.data.length > 0
    ? currentNavState.data[appState.selectedIndex]
    : null;

  // Handlers for interaction (passed down to components)
  const handleDrillDown = useCallback((targetItem, targetType) => {
    // Logic to push new NavigableState onto stack
    updateAppState(s => ({ 
      ...s, 
      navigationStack: [...s.navigationStack, { type: targetType, data: targetItem, selectedIndex: 0 }],
      selectedIndex: 0 // Reset selection for new view
    }));
  }, [updateAppState]);

  const handleGoUp = useCallback(() => {
    // Logic to pop from stack
    updateAppState(s => {
      const newStack = s.navigationStack.slice(0, -1);
      if (newStack.length === 0) return s; // Cannot go up from home
      return { 
        ...s, 
        navigationStack: newStack,
        selectedIndex: newStack[newStack.length - 1].selectedIndex // Restore previous selection
      };
    });
  }, [updateAppState]);

  const handleAction = useCallback((actionType, target) => {
    // Transition to 'action' mode, set currentAction payload
    updateAppState(s => ({
      ...s,
      mode: 'action',
      currentAction: { type: actionType, target },
    }));
  }, [updateAppState]);

  // Render the layout based on current mode
  return (
    <TriptychLayout
      header={<Header authStatus={appState.authStatus} environment={appState.currentEnvironment} />}
      
      // LEFT PANE: Inherited Parent Context
      leftPane={
        ParentEntity ? (
          <ParentEntity.ViewComponent
            navState={parentNavState!}
            isParentContext={true} // Render as dimmed, non-interactive
            onAction={handleAction} // Actions are disabled in parent context
            onDrillDown={() => { /* no drill-down from parent */ }}
            onGoUp={() => { /* no go-up from parent */ }}
          />
        ) : (
          <EmptyLeftPane /> // For Level 1: Home
        )
      }

      // MIDDLE PANE: Active Workspace (Navigation or Action)
      middlePane={
        appState.mode === 'navigation' ? (
          <CurrentEntity.ViewComponent
            navState={currentNavState}
            isParentContext={false} // Render as active, interactive
            onAction={handleAction}
            onDrillDown={handleDrillDown}
            onGoUp={handleGoUp}
          />
        ) : (
          <ActionFormView 
            actionPayload={appState.currentAction!} 
            onConfirm={() => updateAppState(s => ({ ...s, mode: 'navigation', currentAction: null }))}
            onCancel={() => updateAppState(s => ({ ...s, mode: 'navigation', currentAction: null }))}
          />
        )
      }

      // RIGHT PANE: Detail & Contextual Support
      rightPane={
        appState.mode === 'navigation' ? (
          <CurrentEntity.PreviewComponent selectedItem={selectedItemInMiddle} />
        ) : (
          <ActionContextView actionPayload={appState.currentAction!} />
        )
      }

      footer={<Footer navigationStack={appState.navigationStack} />}
    />
  );
}
```

## 6. Interaction Flow Example: Restarting a Service

This walkthrough demonstrates the seamless interaction under the "Unwavering Focus" architecture.

1. **Initial State (Home Menu):**
    * `navigationStack: [ { type: 'HOME', data: HomeMenuData, selectedIndex: 0 } ]`
    * **Middle Pane:** Renders `HomeMenu.ViewComponent`.
    * **Left Pane:** `EmptyLeftPane`.
    * **Right Pane:** `HomeMenu.PreviewComponent` (Global Status).
    * **Footer:** `> Home`

2. **User Drills Down to Services List:**
    * **Action:** User navigates to `Admin` -> `Services` in Middle Pane, presses `l`.
    * **State Change:** `updateAppState` pushes `SERVICES_LIST` onto stack.
    * `navigationStack: [ { type: 'HOME', ... }, { type: 'SERVICES_LIST', data: ServiceListData, selectedIndex: 0 } ]`
    * **Middle Pane:** Re-renders `ServicesList.ViewComponent` (showing the list of services).
    * **Left Pane:** Re-renders `HomeMenu.ViewComponent` (showing the Home Menu as parent context).
    * **Right Pane:** Renders `ServiceList.PreviewComponent` (for the first service).
    * **Footer:** `> Home > Services`

3. **User Drills Down to Service Detail:**
    * **Action:** User selects `PLANNING/Zoning` in Middle Pane, presses `l`.
    * **State Change:** `updateAppState` pushes `SERVICE_DETAIL` onto stack.
    * `navigationStack: [ { type: 'HOME', ... }, { type: 'SERVICES_LIST', data: ServiceListData, selectedIndex: selectedIndexOfPlanningZoning }, { type: 'SERVICE_DETAIL', data: PlanningZoningDetail } ]`
    * **Middle Pane:** Renders `ServiceDetail.ViewComponent` (detailed view of `PLANNING/Zoning`).
    * **Left Pane:** Re-renders `ServiceList.ViewComponent` (showing the services list, with `PLANNING/Zoning` still highlighted).
    * **Right Pane:** Renders `ServiceDetail.PreviewComponent` (showing infrastructure info for `PLANNING/Zoning`).
    * **Footer:** `> Home > Services > PLANNING/Zoning`

4. **User Initiates Restart Action:**
    * **Action:** User presses `:` in Middle Pane, types `restart`, hits `Enter`. `handleAction` is triggered.
    * **State Change:** `updateAppState` changes `mode: 'action'` and sets `currentAction`.
    * `appState.mode: 'action'`, `appState.currentAction: { type: 'RESTART_SERVICE', target: PlanningZoningDetail }`
    * **Middle Pane:** Switches to `ActionFormView` (the "Confirm Restart Service" modal).
    * **Left Pane:** *Remains unchanged* (still showing the services list).
    * **Right Pane:** Switches to `ActionContextView` (showing "Service Interruption Warning" and CLI command).
    * **Footer:** Updates to Action Mode hints (`Submit: [Enter] or [y]`).

5. **User Confirms Action:**
    * **Action:** User presses `y` or `Enter` on `( Confirm Restart )` button. `onConfirm` callback is triggered.
    * **State Change:** `updateAppState` sets `mode: 'navigation'`, clears `currentAction`.
    * **Toast:** A temporary `ActionResult` is pushed to state for the toast notification.
    * **Middle Pane:** Reverts to `ServiceDetail.ViewComponent` (showing updated status for `PLANNING/Zoning`).
    * **Left/Right Panes:** Revert to their corresponding views for `ServiceDetail`.
    * **Footer:** Updates navigation hints.

## 7. Graphics & Visual Design Choices

The ACI Triptych leverages the full capabilities of modern terminal emulators to provide a rich yet uncluttered visual experience.

### 7.1. Character Set & Borders

* **Standard:** Full **UTF-8** support for icons and subtle graphical elements.
* **Borders:** Minimalist, single-line ASCII characters to define pane boundaries and sections.
  * `─` (Horizontal), `│` (Vertical), `┌`, `┐`, `└`, `┘` (Corners)
  * `├`, `┤`, `┬`, `┴`, `┼` (Intersections)
* **Separators:** Light `---` or `===` lines for sub-sections within panes.

### 7.2. Color Palette (Implied)

A carefully selected, low-contrast color palette for background elements, with a distinct accent color for interactive elements and status indicators. This will be configurable via themes.

* **Backgrounds:**
  * `Dim Gray`: Default text color.
  * `Dark Gray / Black`: Background for most panes.
  * `Light Gray / Off-white`: Subtle background for headers or special sections.
* **Highlighting:**
  * `Primary Accent (e.g., bright blue/cyan)`: Selected item in the Middle Pane, active input fields, primary action buttons.
  * `Secondary Accent (e.g., purple/magenta)`: Hints, hotkeys, inactive interactive elements.
* **Status & Feedback:**
  * `Success (Green)`: `✓ Healthy`, `✓ Started`, success toast.
  * `Warning (Yellow/Orange)`: `⚠ Degraded`, warning toast.
  * `Error (Red)`: `✗ Unhealthy`, `✗ Failed`, error toast, critical warnings.
  * `Info (Light Blue)`: Informational messages, non-critical tips.
* **Parent Context (Left Pane):** Content in the Left Pane will be rendered in a slightly `dimmer` shade of the main text color to visually indicate its non-interactive, contextual role.

### 7.3. Icons (UTF-8)

* **Status:**
  * `✓` (U+2713 CHECK MARK): Healthy, Started, Success.
  * `⚠` (U+26A0 WARNING SIGN): Warning, Degraded, Issues.
  * `✗` (U+2717 BALLOT X): Error, Stopped, Failed.
  * `ℹ️` (U+2139 INFORMATION SOURCE): Informational.
* **Navigation / Hierarchy:**
  * `▸` (U+25B8 BLACK RIGHT-POINTING SMALL TRIANGLE): Collapsed section, drill-down indicator.
  * `▾` (U+25BE BLACK DOWN-POINTING SMALL TRIANGLE): Expanded section.
  * `>` (U+003E GREATER-THAN SIGN): Cursor/selection indicator.
* **Spinners (for background tasks):**
  * Standard set: `⣷`, `⣯`, `⣟`, `⡿`, `⢿`, `⡟`, `⣴`, `⣄`. Selected character will rotate.
  * Placed contextually next to the item or in the footer to show global activity.

### 7.4. Typography & Spacing

* **Font:** Relies on the user's terminal emulator's monospace font.
* **Consistency:** Strict adherence to consistent padding and alignment for readability (e.g., columns in lists).
* **Whitespace:** Generous use of empty lines and columns to visually separate logical blocks of information, reducing clutter.

### 7.5. Layout Fluidity

* Panes will adapt their width dynamically to terminal resizing using percentage-based divisions (e.g., 25% Left, 50% Middle, 25% Right).
* Minimum pane widths will be defined to prevent unreadable squishing, triggering scrollbars or content truncation if the terminal is too small.

---

This architectural and visual specification provides a complete guide for implementing the ACI Triptych. The "Unwavering Focus" and "Deliberate Action" principles, combined with a robust component architecture and thoughtful visual design, will deliver a powerful, intuitive, and highly efficient TUI experience for ArcGIS professionals.

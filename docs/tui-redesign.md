# ACI TUI Redesign

This document defines the complete redesign of the ACI Terminal User Interface (TUI): principles, information architecture, interaction patterns, visual system, state management, migration plan, and acceptance criteria. It replaces the legacy TUI with a consistent, resilient, keyboard-first interface aligned with the app’s functionality.

## Objectives

- Establish a coherent design system (tokens, roles, primitives) for consistency and maintainability.
- Simplify navigation, overlays, and keyboard interactions around clear, predictable patterns.
- Reduce redundancy and brittle logic; centralize shared behavior and theming.
- Preserve current core capabilities while enabling incremental migration and testing.
- Improve accessibility, contrast, and discoverability of shortcuts/actions.

## Design Principles

- Single source of truth
  - Centralized color roles and spacing tokens; no ad‑hoc colors in components.
  - Single keyboard/action layer per scope: global first, then view-scoped.
- Predictable layout
  - Standard 3‑pane layout (Sidebar / Content / Inspector) across views.
  - Global overlays (Help, Command Palette, Search, Notifications) with consistent behavior.
- Progressive disclosure
  - Show core actions inline; advanced actions via Command Palette / Quick Reference.
- Safety and clarity
  - Clear selection state, confirmation for destructive ops, consistent error presentation.
- Performance and responsiveness
  - Avoid needless re-renders; use selector-based state and memoized lists.

## Information Architecture

- Primary Views
  - Home (overview and quick links)
  - Services (discovery, inspect, query)
  - Users (list/search, view, bulk actions)
  - Groups (list/search, view, membership)
  - Items (list/search, view, ownership)
  - Admin (server/enterprise admin operations)

- Global Overlays
  - Help (contextual + global, searchable)
  - Command Palette (actions + navigation)
  - Universal Search (cross-entity, fuzzy)
  - Notifications (stack, timeouts, positions)

- Navigation
  - Sidebar: top-level view selection + recent items.
  - Content: primary data display and actions.
  - Inspector: selection details, quick actions, contextual help.

## Visual Design System

The TUI uses semantic “roles” mapped from the existing theme manager. Components use roles, never raw theme colors.

- Tokens
  - Spacing: none, xs, sm, md, lg
  - Border: width=1, style=single
  - Radii: none, sm (where applicable)
  - Z-index: base, overlay, toast
  - Sizes (percent): sidebar=28, content=52, inspector=20 (tunable)

- Color Roles (examples)
  - Surfaces: bg, surface, border
  - Text: text, textMuted, textAccent, label
  - States: accent, success, warning, danger
  - Affordance: selection, focus

- Components must only consume roles; mapping from theme → roles is a single adapter.

### Implementation Details

- File: `src/tui/design/tokens.ts`
  - Export `spacing`, `borders`, `radii`, `zIndex`, `sizes` constants as readonly objects.
  - Types: `SpacingKey = keyof typeof spacing`.

- File: `src/tui/design/roles.ts`
  - Purpose: Map ThemeManager colors to semantic roles.
  - Interface:
    ```ts
    export type ColorRoles = {
      bg: string;
      surface: string;
      border: string;
      text: string;
      textMuted: string;
      textAccent: string;
      label: string;
      accent: string;
      success: string;
      warning: string;
      danger: string;
      selection: string;
      focus: string;
    };
    ```
  - Hook:
    ```ts
    import { useTheme } from '../themes/theme-manager.js';
    export function useColorRoles(): ColorRoles {
      const { colors } = useTheme();
      return {
        bg: colors.background,
        surface: colors.secondaryBackground,
        border: colors.separators,
        text: colors.primaryText,
        textMuted: colors.metadata,
        textAccent: colors.highlights,
        label: colors.labels,
        accent: colors.portals,
        success: colors.success,
        warning: colors.warnings,
        danger: colors.errors ?? colors.warnings,
        selection: colors.highlights,
        focus: colors.labels,
      };
    }
    ```
  - Contrast helper: `assertRoleContrast(fg, bg)` logs warnings in dev when below threshold.

## Components

- Primitives
  - Panel: titled container with optional footer/actions
  - Separator: horizontal/vertical lines using role border
  - StatusBar: single-line footer for status and hints
  - Badge/Tag: small labeled chips for status/metadata
  - KeyHint: visual representation of a key/shortcut

- Layout
  - AppShell: header (env + auth), main (three panes), footer (status/shortcuts)
  - Sidebar: navigation, auth status, recents
  - Content: view renderer with list/detail regions
  - Inspector: selection state, contextual actions, help snippet

- Data Views
  - EntityList: virtualized list with selection, filters, loading, errors
  - DetailPanel: key/value sections, collapsible groups, error boundary
  - EmptyState: consistent placeholder visuals and guidance

- Overlays
  - Help: tabs (shortcuts, commands, tips) + search
  - Command Palette: fuzzy find actions + navigation
  - Universal Search: cross-entity quick lookup
  - Notifications: non-blocking, stack with timeouts

### Implementation Details

- Primitives
  - File: `src/tui/primitives/Panel.tsx`
    - Props:
      ```ts
      export type PanelProps = {
        title?: string;
        footer?: React.ReactNode;
        children: React.ReactNode;
        padding?: SpacingKey;
        width?: number | string; // percent or columns
        border?: boolean; // default true
      };
      ```
    - Behavior: Draw title bold, border using role `border`, default padding `sm`.
  - File: `src/tui/primitives/Separator.tsx`
    - Props: `{ direction?: 'horizontal'|'vertical' }`; uses Ink borders.
  - File: `src/tui/primitives/StatusBar.tsx`
    - Props: `{ left: React.ReactNode; right?: React.ReactNode }` single-line footer.
  - File: `src/tui/primitives/Badge.tsx`
    - Props: `{ color?: keyof ColorRoles; children: React.ReactNode }`.
  - File: `src/tui/primitives/KeyHint.tsx`
    - Props: `{ keyLabel: string; desc?: string }` rendered as `[k] Desc`.

- Layout
  - `src/tui/layout/AppShell.tsx`: header, three panes, footer.
  - `src/tui/layout/HeaderBar.tsx`: env and auth indicators, help hint.
  - `src/tui/layout/Sidebar.tsx`: navigation + recents.
  - `src/tui/layout/Content.tsx`: renders current view.
  - `src/tui/layout/Inspector.tsx`: selection details + actions.

- Overlays
  - `src/tui/overlays/HelpOverlay.tsx`: `{ visible; onClose; currentView }` with tabs and search.
  - `src/tui/overlays/CommandPaletteOverlay.tsx`: `{ visible; onClose; onAction; onNavigate }`.
  - `src/tui/overlays/SearchOverlay.tsx`: `{ visible; onClose }` universal search.
  - `src/tui/overlays/NotificationsOverlay.tsx`: `{ position; max }` shows notifications queue.

- Views
  - `src/tui/views/<view>/index.tsx`, `List.tsx`, `Detail.tsx`.
  - Registry at `src/tui/views/registry.ts` exposing `getView(id)`.

## Interaction & Keyboard Model

- Global Shortcuts (always active unless overlay is open)
  - Navigation: l=Login, s=Services, u=Users, g=Groups, i=Items, a=Admin
  - Help: ?
  - Command Palette: p
  - Universal Search: /
  - Theme: ] next, [ previous, r random
  - App: q quit (with confirmation if pending ops)

- View-Scoped (active when inside a list/content area)
  - Selection: j/k move, space toggle, A select all, C clear
  - Actions: e export, d delete, i inspect/query (contextual)
  - Paging: n/p next/prev page; f filter

- Overlay Behavior
  - Overlays capture input; Esc closes the top-most overlay.
  - Command Palette and Help support incremental search; Enter applies.

### Implementation Details

- File: `src/tui/keyboard/types.ts`
  - `export type Scope = 'global'|'home'|'services'|'users'|'groups'|'items'|'admin';`
  - `export type KeyBinding = { key: string; when?: (ctx:any)=>boolean; run:(ctx:any)=>void; description?: string }`.
- File: `src/tui/keyboard/global.ts`
  - Implement global bindings: navigation, help, palette, search, theme, quit.
- File: `src/tui/keyboard/scope-*.ts`
  - Per-view bindings for selection/actions.
- File: `src/tui/keyboard/manager.ts`
  - Single `useInput` host that resolves bindings by precedence: overlay → current scope → global.

## State Management & Data Flow

- Keep Zustand; define narrower selectors per component to avoid re-renders.
- Store Contracts
  - navigation: currentView, history, navigate/goBack
  - auth: portal/admin status, login/logout, session status
  - entities: per-type cache, selection (ids), pagination, loading/error
  - ui: overlays state, theme selection, notifications queue

- Selection Model
  - Public shape: selectedIds string[] for stability; internal Set for speed
  - Always expose value-stable selectors to components

### Implementation Details

- Folder: `src/tui/state/`
  - `types.ts`: Root interfaces for navigation/auth/ui/entities.
  - `navigation.ts`: `navigate(viewId, title)`, `goBack()`.
  - `auth.ts`: session integration; `login`, `logoutAll`; `portal/admin` flags.
  - `ui.ts`: overlays show/hide/toggle; theme; notifications queue ops.
  - `entities.ts`: list data, loading/error, selection ops; per-entity slices.
  - `selectors.ts`: narrow selectors.
- Data: reuse `src/services` and command wrappers; write adapters that map to `CommandResult` and store slices.

## Theming Strategy

- Use existing ThemeManager as source of truth for themes.
- Add a single adapter function that maps theme → roles used by the design system.
- Enforce contrast checks on critical role pairs; fallback or warn when inadequate.
- Guarantee light/dark parity where possible; document limits.

## Error Handling & Resilience

- Global ErrorBoundary wraps AppShell and views; non-fatal errors render friendly panels with retry.
- Command failures handled via unified CommandResult → error panel + notification.
- Destructive actions require confirmation; show exact impact (count, names when small).

### Implementation Details

- `src/tui/components/ErrorBoundary.tsx`: wraps AppShell and views; friendly fallback panel with retry.
- List and overlay components render consistent EmptyState on errors; retry hooks re-dispatch load actions.

## Performance Considerations

- Virtualize large lists; render only visible rows.
- Memoize role mapping and tokens; avoid re-deriving per render.
- Selector-based subscription for stores; avoid broad state reads.
- Batch async operations; debounce keystroke-driven searches.

## Folder Structure (proposed)

```
src/
  tui/                       # new TUI (replaces legacy)
    design/                  # tokens, roles, adapters, utilities
    primitives/              # Panel, Separator, StatusBar, Badge, KeyHint
    layout/                  # AppShell, HeaderBar, Sidebar, Content, Inspector
    overlays/                # HelpOverlay, CommandPaletteOverlay, SearchOverlay, NotificationsOverlay
    views/                   # services, users, groups, items, admin
    state/                   # narrowed selectors, store adapters
    keyboard/                # types, global, scope-*, manager
    app.tsx                  # new entry point
```

This is an in-place rewrite. The legacy `src/tui/` is deleted and replaced by the new structure.

## Rewrite Plan (in place)

Phase 0 — Spec and sign-off
- Approve this document (IA, principles, components, keyboard map).

Phase 1 — Replace legacy shell
- Remove legacy `src/tui/` implementation.
- Scaffold new `src/tui/` with AppShell, design tokens, role adapter, and primitives.
- Ensure `aci --tui` launches a minimal but functional shell (header, panes, footer).

Deliverables (Phase 1)
- Files created: `design/tokens.ts`, `design/roles.ts`, primitives (Panel, StatusBar, Separator, Badge, KeyHint), layout (AppShell, HeaderBar, Sidebar, Content, Inspector), `keyboard/manager.ts` with `?` help and `q` quit, `app.tsx` entry.
- CLI integration: `src/cli.ts` continues importing `./tui/app.js` and calling `startTui()`.
- Minimal Home view stub.

Phase 2 — Core views and overlays
- Implement Services view first (list, selection, inspect basics; CommandResult wiring).
- Add global overlays: Help, Command Palette, Notifications, Universal Search.
- Implement global keyboard layer + services scoped layer.

Deliverables (Phase 2)
- `views/services` with List + Detail, selection and paging working.
- Overlays functional with Esc to close; global keymap wired.
- Notifications displayed from queue; actions push success/error notices.

Phase 3 — Remaining entities
- Users, Groups, Items views following Services pattern.
- Inspector context actions per entity type.

Phase 4 — Admin & polish
- Admin operations UI; confirmations and progress.
- Accessibility passes, contrast checks, empty states, docs.

Phase 5 — Hardening
- Performance tuning, error handling edge cases, and documentation.

Deliverables (Phase 5)
- Verified keyboard precedence (overlay > view > global).
- Contrast warnings logged in dev; critical role pairs meet targets.

## Acceptance Criteria

- Consistency
  - All panes and overlays use primitives and roles; no raw theme colors in components.
  - Keyboard shortcuts behave consistently across views and overlays.

- Functionality
  - Feature parity for Services, Users, Groups, Items, Admin baseline flows.
  - Help and Command Palette available everywhere; Search is global.
  - Notifications show actionable feedback and errors.

- Performance
  - Large lists scroll smoothly; no noticeable input lag.
  - View transitions and overlays render within 50ms median on target environment.

- Accessibility
  - Contrast for text/surfaces meets AA where possible; documented exceptions if any.
  - Key hints and help make shortcuts discoverable.

## Risks & Mitigations

- Scope creep in component library
  - Keep primitives minimal; delay advanced widgets until needed.
- Theming complexity
  - Limit role count; enforce role usage via lint/docs; single mapping file.
- Keyboard conflicts
  - Central registry per scope; overlay precedence; tested in Help.

## Testing Strategy

- Unit: role adapter, primitives props behavior, store selectors.
- Integration: keyboard handling, overlay capture/escape, selection flows.
- Snapshot: core layouts, empty states, error panels.
- Manual: contrast check, terminal compatibility (color depth), resize behavior.

## Decommission Plan (Legacy TUI)

- Delete the legacy `src/tui/` codebase immediately as part of Phase 1.
- Replace with the new structure and minimal shell that compiles and runs.
- Verify `--tui` launches the new app; iterate in-place.

## Open Questions

- Must the IA remain identical, or can we reorganize views (e.g., merge Users/Groups management)?
- Any terminal constraints we must respect (color depth, Windows support)?
- Non-goals for v1 (e.g., advanced analytics UI)?

## Next Steps

1) Confirm this redesign spec and in-place rewrite approach.
2) On approval, remove the legacy `src/tui/` and scaffold the new `src/tui/` structure with a minimal AppShell.
3) Implement the Services view first to validate patterns, then expand to other views.

---

# Engineering Playbook (for the implementing AI)

A step-by-step, file-by-file guide for implementing the rewrite.

## Global Constraints
- TypeScript ESM, JSX runtime `react-jsx`, Ink v6, React 19, Zustand v5.
- Entry point must export `startTui(): Promise<void>` from `src/tui/app.tsx`.
- No direct usage of themeManager colors in components; use `useColorRoles()` from `design/roles.ts`.

## Phase 1 Tasks
1. Delete existing `src/tui/` folder entirely.
2. Create folder structure under `src/tui/` (as above).
3. Add `design/tokens.ts` with spacing/borders/radii/zIndex/sizes.
4. Add `design/roles.ts` with `ColorRoles` and `useColorRoles()`.
5. Implement primitives: `Panel`, `Separator`, `StatusBar`, `Badge`, `KeyHint`.
6. Implement layout: `HeaderBar`, `Sidebar` (static links), `Content` (renders Home), `Inspector` (placeholder), `AppShell` composing them.
7. Keyboard: `keyboard/manager.ts` with Ink `useInput` and handling for `?` (toggle help overlay), `q` (quit with confirmation placeholder).
8. Overlays: `HelpOverlay` (visible toggle only, content placeholder) and `NotificationsOverlay` (empty queue handling).
9. Entry: `app.tsx` mounting `AppShell` inside `components/ErrorBoundary.tsx`.

## Phase 2 Tasks
1. State layer in `state/` with slices for `navigation`, `auth`, `ui`, `entities` and `selectors.ts`.
2. Hook `Sidebar` to `navigation`; `HeaderBar` to `auth`; `NotificationsOverlay` to `ui.notifications`.
3. Implement Services view with `List.tsx` (fetch via existing services/TUI command adapters), selection actions, and `Detail.tsx`.
4. Implement overlays: `CommandPaletteOverlay`, `SearchOverlay` with minimal functionality.
5. Keyboard: `keyboard/global.ts` and `keyboard/scope-services.ts`; register in `manager.ts`.

## Coding Interfaces (copy into files)

Panel.tsx
```ts
export type PanelProps = {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: import('../design/tokens').SpacingKey;
  width?: number | string;
  border?: boolean;
};
```

StatusBar.tsx
```ts
export type StatusBarProps = { left: React.ReactNode; right?: React.ReactNode };
```

Keyboard types
```ts
export type Scope = 'global'|'home'|'services'|'users'|'groups'|'items'|'admin';
export type KeyBinding = { key: string; when?: (ctx:any)=>boolean; run:(ctx:any)=>void; description?: string };
```

Selectors (examples)
```ts
export const selectCurrentView = (s: RootState) => s.navigation.current;
export const selectOverlays = (s: RootState) => s.ui.overlays;
export const selectAuthStatus = (s: RootState) => s.auth;
export const selectServicesList = (s: RootState) => s.entities.services;
```

## Removal Checklist (legacy)
- Delete all `src/tui/**` old files and directories.
- Remove any legacy imports in other modules referencing previous `src/tui/...` paths.

## Review Checklist (post-implementation)
- Build and run `bun run dev -- --tui` launches without errors.
- AppShell shows header, three panes, and status bar.
- `?` opens Help overlay; `Esc` closes; `q` quits with confirmation.
- Services view lists items, supports selection; inspector reflects selection.
- Overlays do not accept input when hidden; visible overlay blocks global keys.
- No direct usage of themeManager colors in components (only via roles hook).
- State selectors are narrow; components do not subscribe to entire stores.

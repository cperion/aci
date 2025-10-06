# ACI TUI — Miller Columns Navigation Spec

This document specifies a full-screen, ranger/yazi-style Miller columns layout for the ACI TUI. It defines the UX, layout, keyboard model, state/data structures, ArcGIS hierarchy mapping (Server and Portal), Base16 theming usage, implementation plan, and acceptance criteria. It complements the broader redesign in `docs/tui-redesign.md` and narrows the scope to hierarchical navigation.

## Goals

- Full-height, full-screen layout (no wasted vertical space) with a one-line header and one-line footer.
- Miller columns navigation for hierarchical resources mirroring ArcGIS Enterprise REST and Portal URL structure.
- Slim, compact visual style: minimal padding, thin separators, one-line header/footer, unboxed lists.
- Notifications integrated in the Sidebar/column area (not floating), with a simple count in the footer.
- Consistent Base16-driven color roles with high-contrast selection and subtle separators.

## Layout Overview

- Header (1 line): scope badge (Server/Portal), breadcrumb path, optional filter indicator.
- Columns (2–3 visible): siblings → children → grandchildren. Resizable widths, dense rows.
- Inspector (optional): collapses automatically when the third column is visible on narrow terminals; toggled via a key.
- Footer (1 line): contextual key hints, mode indicator, notifications count, short status/errors.

ASCII sketch

```
+----------------------------------------------------------------------------------+
| arcgis • Server: https://host/arcgis/rest/services • Services ▸ Parcels ▸ 3      |
+---------------------------+------------------------------+-----------------------+
| Services                  | Layers (Parcels.MapServer)   | Operations (Layer 3) |
| ▸ Admin                   | 0  Parcels (MapServer)       | • query              |
| ▸ Utilities               | 1  Zoning (FeatureServer)    | • queryRelated       |
|   Parcels (MapServer)     | 2  Addresses (FeatureServer) | • statistics         |
|   Imagery (ImageServer)   | 3  Parcel Fabric (FS)        | • metadata           |
|   Hydrology (MapServer)   | ...                          | ...                  |
+---------------------------+------------------------------+-----------------------+
| j/k: move  h/l: in/out  Tab: focus col  /: filter  p: palette  q: quit  · 2      |
+----------------------------------------------------------------------------------+
```

- Dense rows: one-line per item, small left gutter for selection highlight.
- Thin separators between columns; active column highlighted subtly.
- No boxes around lists; use borders only for column separators and header/footer lines.

## ArcGIS Hierarchy Mapping

We mirror REST URL structures so that navigating columns feels like walking URLs.

Server (ArcGIS Server)
- Root: `https://host/arcgis/rest/services`
- Folders/Services: `/[folder?]/{serviceName}/{type}` where `type ∈ {MapServer, FeatureServer, ImageServer, GPServer, ...}`
- Layers/Tables: `/{id}` under a service
- Operations: `/query`, `/queryRelatedRecords`, `/statistics`, `/metadata`, etc.

Portal (ArcGIS Portal)
- Root: `https://host/portal/sharing/rest`
- Top: `users`, `groups`, `content/items`
- User content: `/content/users/{username}` → items
- Item: `/content/items/{itemId}` → `data`, `resources`, `relatedItems`, `info`, etc.

Node kinds (subset)
- `serverRoot`, `serverFolder`, `serverService`, `serverLayer`, `serverTable`, `serverOperation`
- `portalRoot`, `portalUsers`, `portalUser`, `portalGroups`, `portalGroup`, `portalItems`, `portalItem`, `portalOperation`

Each node knows how to enumerate children via a loader that returns child nodes and counts.

## Node Model and Loaders

Node shape (cached in a normalized store)
- `id: string` — stable key (usually the URL)
- `kind: NodeKind`
- `name: string` — short label for rows
- `url: string` — canonical REST URL
- `meta?: Record<string, unknown>` — small metadata set (e.g., service type, layer count)
- `childrenKind?: NodeKind` — expected child kind (if uniform)
- `children?: string[]` — child node ids (filled when loaded)
- `childrenLoaded?: boolean`
- `childrenCount?: number`
- `error?: { message: string; code?: number }`

Loader contracts
- `loadChildren(url: string, kind: NodeKind): Promise<{ nodes: Node[] }>`
- Implementations under `src/tui/data/arcgis/`
  - `server.ts`: list folders/services; service children (layers/tables); layer/table operations
  - `portal.ts`: users, groups, items; item operations (data/resources/related)
- Caching by `id=url`; subsequent navigation uses cache; `r` refresh invalidates and reloads.

## Navigation State

Miller navigation state
- `scope: 'server' | 'portal'`
- `activeColumn: number` (0, 1, 2)
- `columns: ColumnState[]`
  - `parentId: string | null` — node id of the column’s parent (null for root)
  - `nodes: string[]` — ordered node ids in this column
  - `selectedIndex: number` — focused row in this column
  - `filter: string` — inline filter value for the column (optional)
  - `loading: boolean`
  - `error?: string`
- `path: string[]` — ordered node ids from root to current selection (breadcrumb)
- `inspectorVisible: boolean`

Derived behavior
- Changing `selectedIndex` in column N updates column N+1 with children of the selected node.
- Pressing `h` activates column N-1 (up) and keeps prior selection; `l` activates column N+1 (into).
- Breadcrumb renders `path` names; copy URL with `y`; open system browser with `o` (optional).

## Keyboard Model

Global keys (always, unless an overlay is active)
- `?` toggle Help overlay
- `p` Command Palette
- `/` Global Search overlay
- `]`/`[` next/prev Base16 theme; `r` random
- `q` Quit (confirm if pending ops)
- `s` switch scope → Server; `P` switch scope → Portal

Miller keys (when focus is in columns)
- `j/k` move selection within the active column
- `h` go to parent column (if any) and focus prior selection
- `l` go into children for the selected node (load if needed)
- `Enter` enter/go into (same as `l`); `Backspace` go up (same as `h`)
- `Tab` / `Shift-Tab` cycle focus across visible columns
- `/` filter within the active column; `Esc` clears filter; `n/N` next/prev match
- `g/G` jump to first/last
- `r` refresh selected node’s children and reload column N+1
- `i` toggle Inspector

Precedence
- overlay handlers → miller scope → global

## Visual and Density Rules

- Header: single line, slim separators; breadcrumb separated with `▸`; truncation with left-ellipsis on narrow widths.
- Footer: single line, compact key hints and notification count (e.g., `· 2`).
- Columns: unboxed lists; 0–1 char gutters; single-character or small glyphs for types (svc, lyr, tbl, op).
- Selection: high-contrast bar using `roles.selection` background and readable foreground.
- Separators: thin lines using `roles.border` (mapped to Base16 subtle ramps).

## Base16 Integration (practical mapping)

We reuse the Base16 philosophy and roles mapping defined in `docs/tui-redesign.md`. Summary:
- Shades
  - `bg = base00`, `surface = base01`, `selectionBg = base02`, `textMuted = base03`, `text = base05`
- Accents
  - `accentPrimary = base0D`, `focus = base0E`, `success = base0B`, `warning = base0A`, `danger = base08`, `info = base0C`
- Selection foreground should maintain ≥ 4.5:1 contrast vs `selectionBg` (pick `base05` or fallback to `base07`/`base00` depending on contrast).
- We assume truecolor terminals; no manual light/dark flipping (theme provides intent).

Implementation
- Use `src/tui/themes/manager.ts` and `src/tui/design/roles.ts` (single adapter).
- Dev-only contrast warnings: text/bg, text/surface, selectionFg/selectionBg.

## Filtering and Search

Inline column filter (`/`)
- Starts an in-column filter mode; narrows items live as the user types.
- `Esc` exits filter mode and clears input; `n/N` cycle matches.

Global search (overlay)
- Opens with `/` when columns are not focused, or with `Ctrl-/` universally.
- Supports jumping by URL or fuzzy name; selecting a result computes full `path` and populates columns.

## Notifications

- Reside in the Sidebar bottom or a dedicated compact column panel; not a floating box.
- Footer shows a count (e.g., `· 2`) and the most recent short status when space allows.
- Types: info/success/warn/error; colored bullets using Base16 roles.

## Resizing & Responsiveness

- Default widths: 30% / 35% / 35% when 3 columns; 50% / 50% when 2 columns.
- `Ctrl-Left/Right` adjust active column width; persist per scope (server/portal).
- Inspector auto-collapses on narrow terminals; user can toggle it with `i`.

## Implementation Plan (file-by-file)

New data loaders
- `src/tui/data/arcgis/server.ts`
  - `listRoot(host)`, `listFolder(url)`, `getService(url)`, `listServiceChildren(url)` (layers, tables), `listLayerOperations(url)`
- `src/tui/data/arcgis/portal.ts`
  - `listRoot(host)`, `listUsers()`, `listGroups()`, `listItems()`, `getItem(id)`, `listItemOperations(id)`

State layer (Zustand slices)
- `src/tui/state/navigation.ts`
  - Miller state: `scope`, `activeColumn`, `columns[]`, `path[]`, `inspectorVisible`
  - Actions: `setScope`, `focusColumn`, `moveSelection`, `enter`, `up`, `setFilter`, `clearFilter`, `refresh`
- `src/tui/state/entities.ts`
  - Node cache keyed by `id=url`; `upsertNodes`, `getNode`, `invalidate(url)`
- `src/tui/state/selectors.ts`
  - Narrow selectors for header breadcrumb, visible columns, active column rows, notification count

Layout and components
- `src/tui/layout/BreadcrumbHeader.tsx` — one-line header with scope badge and breadcrumb
- `src/tui/layout/ColumnsShell.tsx` — lays out 2–3 columns + optional Inspector
- `src/tui/components/ColumnList.tsx` — dense list with selection, filter mode, loading/error row
- `src/tui/layout/Inspector.tsx` — compact detail for selected node (key fields)
- `src/tui/primitives/StatusBar.tsx` — ensure single-line, compact hints, and notif count

Keyboard
- `src/tui/keyboard/scope-miller.ts` — bindings for j/k/h/l/Enter/Backspace/Tab/Shift-Tab// / n/N / g/G / r / i
- `src/tui/keyboard/global.ts` — ensure scope switch (s/P), help, palette, search, theme, quit
- `src/tui/keyboard/manager.ts` — precedence: overlay → miller → global; inject callbacks via context (no globals)

Shell integration
- `src/tui/layout/AppShell.tsx` — replace center content with `ColumnsShell` when in Miller mode
- `src/tui/app.tsx` — wire initial scope and host; expose `startTui()` entry

Notifications
- `src/tui/layout/Sidebar.tsx` (or a dedicated panel area) — compact list of notifications; footer shows count

Theming
- Reuse `src/tui/design/roles.ts` and `src/tui/themes/manager.ts`; verify selection and borders with Base16 roles

Removal/cleanup
- Remove any legacy Triptych-only assumptions in `Content` and unused pane scaffolding

## Data Flow Examples

Server example
- Select Server scope → Column 0 loads folders/services from root
- Select a service (MapServer) → Column 1 loads layers/tables
- Select a layer (id=3) → Column 2 lists operations (`query`, `statistics`, `metadata`)
- Press `y` to copy the full URL; `o` to open in browser (optional)

Portal example
- Select Portal scope → Column 0 shows Users/Groups/Items entry points
- Select Items → Column 1 lists items; selection updates Inspector with key fields
- Select an item → Column 2 lists operations (`data`, `resources`, `relatedItems`)

## Error Handling & Auth

- Inline row at top of a column shows error with `r` to retry and `d` for details
- When a loader receives 401/403, trigger a minimal auth prompt flow; status indicator in header
- Timeouts/cancellation when moving rapidly across nodes; cancel in-flight requests for previous selection

## Acceptance Criteria

- Full-screen, one-line header and footer; columns fill remaining height with no extra padding
- Ranger-like navigation: j/k/h/l/Enter/Backspace/Tab work as specified; overlay precedence respected
- Hierarchical mapping mirrors ArcGIS Server and Portal URLs; breadcrumb path matches current selection
- Inline filters per column; global search can jump to any URL or name
- Notifications listed in-pane; footer reflects count; no floating notification boxes
- Base16 role mapping applied; selection and separators are legible with dev contrast warnings
- Theme switching works (]/[ and r) and causes a single re-render for affected components

## Testing Plan

- Keyboard precedence: overlay > miller > global; `Esc` closes overlay and returns focus
- Theme: validate Base16 → roles mapping and contrast thresholds for key pairs
- Navigation: moving selection updates child column; enter/up preserve previous indices
- Filters: `/` enters filter mode; yields narrowed list; `Esc` clears
- Performance: large columns virtualize; theme switching triggers minimal re-renders
- Notifications: queue updates reflect in the Sidebar and footer count

## Performance Notes

- Use value-stable selectors for columns, path, and notifications
- Virtualize large lists (thousands of items)
- Debounce filter input; batch updates when loading children

## Open Questions

- Primary entry hosts: fixed via config or selectable in UI? Multiple hosts?
- Should we allow executing operations (e.g., run `query`) inline, or keep navigation-only for v1?
- Persist widths and last path per scope? If yes, use file-based persistence (e.g., `~/.aci/tui.json`).

## Rollout Steps

1) Implement state slices, loaders, and column components as above
2) Replace the center content with `ColumnsShell` and wire keyboard scope
3) Verify acceptance criteria locally (`bun run dev -- --tui`)
4) Iterate on inspector content per node types (service/layer/item)

---

# Engineering Playbook (AI implementer)

This section provides explicit types, function signatures, scaffolding hints, request rules, and UI logic so the agent can implement without ambiguity.

## Configuration & CLI

- Flags
  - `--tui` enable TUI mode
  - `--theme <scheme>` set initial Base16 scheme
  - `--server-host <url>` ArcGIS Server root (e.g., https://host/arcgis/rest/services)
  - `--portal-host <url>` ArcGIS Portal root (e.g., https://host/portal/sharing/rest)
- Theme persistence
  - Read/write `~/.aci/theme.json` with `{ scheme: string }`
  - If `--theme` is provided, it takes precedence for the session and is written on exit

## Networking & Auth

- Always request JSON: append `f=json` (or `f=pjson`) to ArcGIS REST endpoints
- Basic GET wrapper: `fetchJson(url: string, opts?: { signal?: AbortSignal; headers?: Record<string,string> })`
- Auth tokens (future): if configured, append `token=<...>` as query param; keep a pluggable `getAuthParams(url)` function
- Abort rapidly when selection changes to avoid stale updates; use an `AbortController` per column load

## Types (authoritative)

Node kinds
```ts
export type NodeKind =
  | 'serverRoot' | 'serverFolder' | 'serverService' | 'serverLayer' | 'serverTable' | 'serverOperation'
  | 'portalRoot' | 'portalUsers' | 'portalUser' | 'portalGroups' | 'portalGroup' | 'portalItems' | 'portalItem' | 'portalOperation';
```

Node
```ts
export type Node = {
  id: string;            // stable, usually the URL
  kind: NodeKind;
  name: string;          // label for row
  url: string;           // canonical REST URL
  meta?: Record<string, unknown>;
  childrenKind?: NodeKind;
  children?: string[];   // child node ids
  childrenLoaded?: boolean;
  childrenCount?: number;
  error?: { message: string; code?: number };
};
```

ColumnState and MillerState
```ts
export type ColumnState = {
  parentId: string | null;
  nodes: string[];
  selectedIndex: number;
  filter: string;
  loading: boolean;
  error?: string;
};

export type MillerState = {
  scope: 'server' | 'portal';
  activeColumn: number;         // 0..2
  columns: ColumnState[];       // length 2 or 3 depending on visible depth
  path: string[];               // node ids from root → selection
  inspectorVisible: boolean;
};
```

Notifications
```ts
export type NoticeLevel = 'info' | 'success' | 'warn' | 'error';
export type Notice = { id: string; level: NoticeLevel; text: string; ts: number };
```

## State Stores (Zustand) — interfaces

Navigation slice
```ts
export type NavigationSlice = MillerState & {
  setScope(scope: 'server'|'portal'): void;
  focusColumn(index: number): void;
  moveSelection(delta: number): void;   // j/k
  enter(): Promise<void>;               // l/Enter
  up(): void;                           // h/Backspace
  setFilter(value: string): void;       // '/'
  clearFilter(): void;                  // Esc in filter
  refresh(): Promise<void>;             // r
};
```

Entities slice
```ts
export type EntitiesSlice = {
  byId: Record<string, Node>;
  upsertNodes(nodes: Node[]): void;
  getNode(id: string): Node | undefined; // selector wrapper should be used in components
  invalidate(id: string): void;          // mark childrenLoaded=false and clear children
};
```

UI slice
```ts
export type UiSlice = {
  overlays: { help: boolean; palette: boolean; search: boolean };
  theme: { scheme: string };
  notices: Notice[];
  showOverlay(name: keyof UiSlice['overlays']): void;
  hideOverlay(name: keyof UiSlice['overlays']): void;
  toggleOverlay(name: keyof UiSlice['overlays']): void;
  pushNotice(n: Omit<Notice,'id'|'ts'>): void;
  removeNotice(id: string): void;
};
```

Selectors (examples)
```ts
export const selectBreadcrumb = (s: { navigation: MillerState; entities: EntitiesSlice }) => s.navigation.path.map(id => s.entities.byId[id]?.name ?? '');
export const selectActiveColumn = (s: { navigation: MillerState }) => s.navigation.columns[s.navigation.activeColumn];
export const selectVisibleColumns = (s: { navigation: MillerState }) => s.navigation.columns;
export const selectNoticeCount = (s: { ui: UiSlice }) => s.ui.notices.length;
```

## Data Loaders — contracts and REST shapes

General rules
- Append `?f=json` to directory endpoints (services, folders) and item endpoints
- Directory listing (Server root/folder): returns `{ folders: string[]; services: { name: string; type: string }[] }`
- Service (MapServer/FeatureServer) info: returns `{ layers: { id:number; name:string }[]; tables: { id:number; name:string }[] }`
- Portal items listing varies by endpoint; for v1, begin with a simple list `{ results: Item[], nextStart? }`

Server loader signatures
```ts
export async function listServerRoot(host: string): Promise<Node[]>;              // folders + services
export async function listServerFolder(url: string): Promise<Node[]>;             // services in folder
export async function listServiceChildren(url: string): Promise<Node[]>;          // layers + tables
export async function listLayerOperations(url: string): Promise<Node[]>;          // query, statistics, metadata
```

Portal loader signatures
```ts
export async function listPortalRoot(host: string): Promise<Node[]>;              // Users/Groups/Items entry
export async function listPortalUsers(host: string): Promise<Node[]>;
export async function listPortalUserItems(url: string): Promise<Node[]>;
export async function listPortalItems(host: string): Promise<Node[]>;             // simple baseline
export async function listPortalItemOperations(idOrUrl: string): Promise<Node[]>; // data/resources/relatedItems
```

## Keyboard — bindings and precedence

Global (sample)
```ts
export const globalBindings: KeyBinding[] = [
  { key: '?', run: ctx => ctx.ui.toggleOverlay('help'), description: 'Help' },
  { key: 'p', run: ctx => ctx.ui.toggleOverlay('palette'), description: 'Command Palette' },
  { key: '/', when: ctx => !ctx.scopeIsMiller, run: ctx => ctx.ui.toggleOverlay('search'), description: 'Search' },
  { key: ']', run: ctx => ctx.theme.next(), description: 'Next theme' },
  { key: '[', run: ctx => ctx.theme.prev(), description: 'Prev theme' },
  { key: 'r', run: ctx => ctx.theme.random(), description: 'Random theme' },
  { key: 'q', run: ctx => ctx.app.requestQuit(), description: 'Quit' },
  { key: 's', run: ctx => ctx.navigation.setScope('server'), description: 'Server scope' },
  { key: 'P', run: ctx => ctx.navigation.setScope('portal'), description: 'Portal scope' },
];
```

Miller scope (sample)
```ts
export const millerBindings: KeyBinding[] = [
  { key: 'j', run: ctx => ctx.navigation.moveSelection(+1), description: 'Down' },
  { key: 'k', run: ctx => ctx.navigation.moveSelection(-1), description: 'Up' },
  { key: 'l', run: ctx => ctx.navigation.enter(), description: 'Into' },
  { key: 'enter', run: ctx => ctx.navigation.enter(), description: 'Open' },
  { key: 'h', run: ctx => ctx.navigation.up(), description: 'Up' },
  { key: 'backspace', run: ctx => ctx.navigation.up(), description: 'Up' },
  { key: 'tab', run: ctx => ctx.navigation.focusColumn((ctx.navigation.activeColumn + 1) % ctx.navigation.columns.length), description: 'Next column' },
  { key: 'S-tab', run: ctx => ctx.navigation.focusColumn((ctx.navigation.activeColumn - 1 + ctx.navigation.columns.length) % ctx.navigation.columns.length), description: 'Prev column' },
  { key: '/', run: ctx => ctx.navigation.setFilter(''), description: 'Filter' },
  { key: 'g', run: ctx => ctx.navigation.moveSelection(Number.NEGATIVE_INFINITY), description: 'Top' },
  { key: 'G', run: ctx => ctx.navigation.moveSelection(Number.POSITIVE_INFINITY), description: 'Bottom' },
  { key: 'r', run: ctx => ctx.navigation.refresh(), description: 'Refresh' },
  { key: 'i', run: ctx => ctx.navigation.toggleInspector(), description: 'Inspector' },
];
```

Keyboard manager
- Precedence order: if any overlay visible → use overlay bindings; else if in Miller scope → miller bindings; else → global
- Inject callbacks/context via a provider; avoid globals

## Column Rendering Rules

- Compute available rows: `termHeight - header(1) - footer(1)`
- Keep a separate `scrollOffset` so selection stays visible without jumping
- Visible window = `nodes.slice(scrollOffset, scrollOffset + availableRows)`
- Selection highlight uses `roles.selection` with readable foreground; do not render extra blank rows
- Use short glyphs per kind: `svc`, `lyr`, `tbl`, `op`, `usr`, `grp`, `itm`

## Inspector Content (initial)

- serverService: type, layer/table counts, capabilities
- serverLayer/serverTable: id, geometryType (if known), fields count
- portalItem: type, owner, modified, size, sharing
- For operations, show method and short description

## Base16 Roles — adapter specifics

- Map `base00..base0F` → roles as summarized above. Ensure:
  - `text` on `bg` and `surface` ≥ 4.5:1
  - `selectionFg` on `selectionBg` ≥ 4.5:1; pick fallback automatically if needed
- Roles consumed by components only; do not access raw theme in components
- Theme manager must support `getCurrent()`, `setTheme(name)`, `next()`, `prev()`, `random()`, `subscribe(listener)`

## Testing Tasks

- Keyboard precedence and Esc behavior across overlays
- Loader adapters: validate URL building and `f=json` param; cache correctness; refresh invalidation
- Theme switching triggers a single pass of updates (verify subscribers)
- Windowed list rendering correctness for large columns
- Notifications queue add/remove and footer count update

## Migration & Cleanup

- Remove any remaining references to the legacy Triptych content renderer
- Ensure entry point `src/tui/app.tsx` still exports `startTui()` and wires Miller by default
- Respect CLI flags and file-based theme persistence

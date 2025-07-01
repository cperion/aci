# Appendix A: ACI Triptych - ASCII Art Blueprints

This appendix provides a visual "planche" detailing the layout, components, and interaction states of the ACI Triptych TUI. These diagrams serve as the definitive blueprint for the application's user interface.

---

## 1. The Core Triptych Layout - Global Structure

This diagram illustrates the fundamental three-pane structure, constant header, and dynamic footer that define the ACI Triptych at all times.

```ascii
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ACI [ENVIRONMENT] ─ P:[AUTH_STATUS] A:[ADMIN_STATUS] ───────────────── [?] Help │  <- GLOBAL HEADER
├──────────────────────────┬──────────────────────────┬──────────────────────────┤
│                          │                          │                          │
│     LEFT PANE            │     MIDDLE PANE          │     RIGHT PANE           │
│   (Parent Context)       │   (Active Workspace)     │   (Detail / Support)     │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
│                          │                          │                          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
 [NAV HINTS] > Breadcrumbs > Current Location                               [⣟]  <- GLOBAL FOOTER
```

* **Pane Proportions:** Left (~25%), Middle (~50%), Right (~25%). (Flexible with terminal width)
* **Purpose:** The persistent structure facilitates spatial memory and reduces cognitive load by always knowing where to find information.

---

## 2. Navigation Mode - General Flow

This illustrates how the panes react during typical hierarchical navigation using `l`/`h` (or arrow keys/Enter/Esc).

**State A: Parent List (e.g., Home Menu)**

* Middle Pane: Active list.
* Left Pane: Empty or previous context.
* Right Pane: Global summary / preview of selected item.

```ascii
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│                          │ > Item A                 │ Item A Preview           │
│                          │   Item B                 │ ----------------------   │
│ (Empty or Past Context)  │   Item C                 │ Desc: Lorem ipsum...     │
│                          │                          │                          │
│                          │                          │                          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

**User Action:** Selects "Item A" and presses `l` (Drill Down).

**State B: Child Detail/List (e.g., Services List)**

* Middle Pane: Shows the details/list of "Item A".
* Left Pane: Now displays the content that was previously in the Middle Pane (Parent context), with "Item A" still highlighted.
* Right Pane: Shows preview/details of the selected item within the *new* Middle Pane list.

```ascii
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ > Item A                 │ > Child Item A1          │ Child Item A1 Preview    │
│   Item B                 │   Child Item A2          │ ----------------------   │
│   Item C                 │   Child Item A3          │ Details: xyz             │
│                          │                          │                          │
│                          │                          │                          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

* **`l` (Drill Down):** Pushes current Middle Pane content to Left. New content appears in Middle.
* **`h` (Go Up):** Pulls Left Pane content back to Middle. Left Pane becomes empty (or previous parent).

---

## 3. Action Mode - General Flow

This shows the transformation when an action is initiated. The structure remains constant, but content roles shift.

**State A: Before Action (Navigation Mode)**

* Middle Pane: List/detail view, with an item selected.
* Left Pane: Parent context.
* Right Pane: Preview/detail of selected item.

```ascii
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│                          │ > Selected Item          │ Selected Item Preview    │
│                          │   Item 2                 │ ----------------------   │
│ (Parent List/Context)    │   Item 3                 │ Action Hints: [:]        │
│                          │                          │                          │
│                          │                          │                          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

**User Action:** Initiates an action (e.g., presses `:` then types `restart`).

**State B: During Action (Action Mode)**

* Middle Pane: Transforms into an Action Form or Confirmation Dialog.
* Left Pane: Remains unchanged, providing persistent context.
* Right Pane: Provides essential "Consequences & Info" for the action.

```ascii
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│                          │  ┌─( Action Title )───┐   │ 💡 Consequences & Info  │
│                          │  │                     │   │ ----------------------   │
│ (Parent List/Context)    │  │ Form Input / Prompt │   │ This action will:        │
│                          │  │                     │   │ • Consequence 1          │
│                          │  │  ( Submit ) [Cancel]│   │ • Consequence 2          │
│                          │  └─────────────────────┘   │                          │
│                          │                          │ Equivalent CLI:          │
│                          │                          │  `aci ...`               │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
 Submit: [Enter] or [y]  Cancel: [Esc] or [n]
```

---

## 4. Middle Pane Anatomy - Filterable List (Navigation Mode)

This blueprint details the components within a typical list view in the Middle Pane, including live filtering.

```ascii
┌──────────────────────────┐
│ Filter: <query>█ (N found)│  <- FILTER PROMPT (appears after '/')
├──────────────────────────┤
│> ✓ Service Name 1        │  <- SELECTED ITEM
│  ✓ Another Service       │     ✓ (Healthy) / ⚠ (Warning) / ✗ (Error) Status
│  ⚠ Service with Warn     │     > (Cursor/Selection)
│  ✗ Stopped Service       │
│                          │
│  ────────────            │  <- SUB-SECTION / FOLDER separator
│  Folder: MyFolder        │  <- SUB-SECTION HEADER
│  ✓ Service in Folder     │
│                          │
│                          │
│                          │
└──────────────────────────┘
```

* **`Filter: <query>█ (N found)`:** Appears when `/` is pressed. `█` is cursor. `(N found)` is live match count.
* **`> ✓ Service Name`:** Example list item. `>` indicates focus. `✓` is status icon.

---

## 5. Middle Pane Anatomy - Detail View (Navigation Mode)

This blueprint outlines a typical detailed inspection view in the Middle Pane.

```ascii
┌──────────────────────────┐
│ Inspect: Service Name    │  <- TITLE (matches breadcrumbs)
├──────────────────────────┤
│ ▾ Section 1 Details      │  <- COLLAPSIBLE SECTION HEADER (use l/h to expand/collapse)
│   Name:   Value          │
│   Type:   Value          │
│   Status: ✓ Healthy      │  <- Key-value pair, Status icon
│                          │
│ ▾ Section 2 List (N)     │  <- SECTION WITH A LIST
│   > Item A               │     Cursor for navigating list within detail
│     Item B               │
│                          │
│ ▾ Section 3 Info         │
│   Long Description Text  │
│   ... (scrollable)       │
└──────────────────────────┘
```

* **`▾` / `▸`:** UTF-8 triangles to indicate collapsible sections.
* **`[l]` / `[h]`:** Press `l` on a section to expand/collapse.

---

## 6. Middle Pane Anatomy - Action Form (Action Mode)

This blueprint details the structure of a generic action confirmation or input form in the Middle Pane.

```ascii
┌──────────────────────────┐
│  ┌─( Action Title )───┐   │  <- MODAL WINDOW (rendered in middle pane)
│  │                     │   │
│  │ Target: Service XYZ │   │  <- Contextual info about the action target
│  │                     │   │
│  │ Input Field 1: [    █] │  <- Input field with cursor
│  │ Input Field 2: [     ] │  <- Another input field
│  │                     │   │
│  │ Proceed?  (y/N)      │   │  <- Yes/No confirmation prompt (for destructive actions)
│  │                     │   │
│  │   (  Confirm  )      │   │  <- PRIMARY ACTION BUTTON (highlighted)
│  │   [   Cancel  ]      │   │  <- SECONDARY ACTION BUTTON
│  │                     │   │
│  └─────────────────────┘   │
└──────────────────────────┘
```

* **`█`:** Cursor inside the active input field.
* **`( )` vs `[ ]`:** Parentheses for primary, highlighted buttons. Brackets for secondary actions.

---

## 7. Global Header & Footer Anatomy

Detailed breakdown of the elements in the persistent header and footer bars.

### 7.1. Global Header

```ascii
 ACI [recette] ─ P:✓ jsmith A:✓ admin ───────────────────────────────── [?] Help
```

* **`ACI`**: Application name.
* **`[recette]`**: Current active environment.
* **`P:✓ jsmith`**: Portal authentication status. (`✓` connected / `✗` not connected).
* **`A:✓ admin`**: Admin authentication status. (`✓` connected / `✗` not connected).
* **`[?] Help`**: Hotkey hint for global help.

### 7.2. Global Footer

```ascii
 > Home > Services > PLANNING/Zoning               [↑/↓] Nav  [l] Drill  [h] Up  [c] Copy  [:] Act  [⣟]
```

* **`> Home > Services > PLANNING/Zoning`**: Breadcrumbs (dynamic, indicates current position).
* **`[↑/↓] Nav`**: General navigation hint for scrolling.
* **`[l] Drill`**: Hint for drilling down.
* **`[h] Up`**: Hint for going up the hierarchy.
* **`[c] Copy`**: Hint for Universal Copy.
* **`[:] Act`**: Hint for Command Palette / Actions.
* **`[⣟]`**: Spinner for global background tasks.

---

## 8. Visual Elements & Iconography Legend

A quick reference for the standard UTF-8 icons and implied colors used throughout the TUI.

* **Status Icons:**
  * `✓` (U+2713 CHECK MARK): Healthy, Started, Success.
  * `⚠` (U+26A0 WARNING SIGN): Warning, Degraded, Issues.
  * `✗` (U+2717 BALLOT X): Error, Stopped, Failed.
  * `ℹ️` (U+2139 INFORMATION SOURCE): Informational.
* **Navigation & Hierarchy:**
  * `>` (U+003E GREATER-THAN SIGN): Cursor / Currently Selected Item.
  * `▾` (U+25BE BLACK DOWN-POINTING SMALL TRIANGLE): Expanded / Open / Collapsible Section (when expanded).
  * `▸` (U+25B8 BLACK RIGHT-POINTING SMALL TRIANGLE): Collapsed / Closed / Collapsible Section (when collapsed).
* **Spinners (indicate ongoing background process):**
  * `⣷`, `⣯`, `⣟`, `⡿`, `⢿`, `⡟`, `⣴`, `⣄` (Animated sequence).
* **Implied Color Usage (Terminal Dependent):**
  * **Green:** Success, Healthy status.
  * **Yellow/Orange:** Warning, Degraded status.
  * **Red:** Error, Stopped, Critical warnings.
  * **Blue/Cyan:** Active elements, hints, primary highlights.
  * **Gray/Dim:** Inactive elements, parent context pane, non-interactive text.

---

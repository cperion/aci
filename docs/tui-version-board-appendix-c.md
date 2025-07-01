# Appendix C: ACI Triptych - UI Component & Behavioral Specifications

This appendix provides detailed guidelines for the design and behavior of individual UI components and common interaction patterns within the ACI Triptych TUI. Its purpose is to ensure visual consistency, predictable behavior, and a high-quality user experience across the entire application.

---

## 1. General Component Principles

* **Reusability:** Design components to be as generic and reusable as possible (e.g., `ListItem`, `InputField`, `Button`).
* **Context-Aware Rendering:** Components should accept props that dictate their rendering based on their context (e.g., `isParentContext` for Left Pane, `isActive` for Middle Pane selection).
* **Minimal State:** Components should ideally be "dumb" (presentational), receiving all necessary data via props. State management should reside higher up the component tree (e.g., in `AppState`).
* **Responsiveness:** Components must adapt gracefully to varying terminal widths and heights.

## 2. Pane Rendering Guidelines

### 2.1. Active (Middle) Pane

* **Appearance:** Full brightness for text and colors.
* **Highlighting:** The `>` cursor and selection highlight for the active item.
* **Interaction:** Fully interactive for all navigation (`j`/`k`, `l`/`h`), typing, filtering (`/`), and actions (`:`).

### 2.2. Parent Context (Left) Pane

* **Appearance:** Text and colors rendered in a noticeably `dimmer` shade (e.g., lower opacity, darker grey) to visually indicate non-interactivity.
* **Highlighting:** The `>` cursor and selection highlight *of the item that was drilled down from* must be maintained, but also in a dimmer state.
* **Interaction:** Read-only. No direct keyboard interaction or cursor navigation.

### 2.3. Detail/Support (Right) Pane

* **Appearance:** Full brightness for text and colors.
* **Highlighting:** No internal selection highlighting; it's purely informational or action-triggering via a context menu (`:`).
* **Interaction:** Read-only for display. May contain action hints that relate to the Middle Pane's selection, which are triggered by global hotkeys (e.g., `l`, `c`, `:`) operating on the Middle Pane.

## 3. Core UI Components Specifications

### 3.1. List Items

* **Structure:** Typically `[Status Icon] [Primary Name] [Secondary Info] [Tertiary Info]`.
* **Status Icons:** (`✓`, `⚠`, `✗`) are mandatory for any list representing entities with a health or operational status.
* **Highlighting:** `>` prefix and background color change for the selected item in the Middle Pane. A dimmer highlight in the Left Pane.
* **Spacing:** Consistent padding between columns.
* **Truncation:** Long names/info should be truncated with `...` if they exceed column width, ensuring column alignment is maintained.

    ```ascii
    > ✓ ServiceNameLong...  FeatureSvc 1/4  Running
    ```

### 3.2. Input Fields

* **Cursor:** A block cursor `█` indicates the active input field.
* **Placeholder/Default:** Display default values or hints (e.g., `[ 10 ]` for limit).
* **Highlighting:** Active input field's border or background is highlighted (e.g.,**Toast Notifications:** Short-lived, non-blocking toast messages (`✓ Success`, `⚠ Warning`, `✗ Error`) at the bottom of the screen for operation results. Manage a queue of toasts.
  * **Error Boundaries:** Use React Error Boundaries to gracefully catch and display unhandled component errors without crashing the entire TUI.
* **Background Fetching/Polling:** For `LOGS_VIEW` and potentially `HEALTH_VIEW` or `SERVICE_DETAIL` (for live status), implement intelligent polling mechanisms with configurable intervals. Ensure polling can be paused/resumed (e.g., `f` key for `LOGS_VIEW`).

## 4. Clipboard Integration (`c` / `C` Keys)

Direct clipboard access from a TUI typically requires platform-specific commands.

* **Cross-Platform Abstraction:** Create a utility module for clipboard operations that abstracts away OS differences.
  * **Linux:** Often involves `xclip` or `xsel`. Check for availability and fallback to warning if not found.
  * **macOS:** `pbcopy`.
  * **Windows:** `clip.exe`.
* **Security & Permissions:** Be mindful of potential security implications depending on how clipboard access is implemented. Assume necessary permissions are in place.
* **Confirmation:** Display a brief toast notification after a successful copy action (e.g., `✓ Copied CLI command.`).

## 5. Environment & Configuration Management

The TUI should be configurable to enhance user experience and adhere to enterprise standards.

* **`.acirc` File Parsing:** Robust parsing of the INI-style `.acirc` file for environment definitions. This should be done at application startup and potentially reloaded if changes are detected.
* **Environment Variables:** Support for `ACI_ENV` and `ARCGIS_CA_BUNDLE` as per the CLI reference.
* **TUI-Specific Configuration (Future):** Implement a separate configuration file (e.g., `~/.acitui-config`) for TUI-specific preferences:
  * **Theming:** Custom color palettes (e.g., "dark", "light", "high-contrast").
  * **Default View:** User-defined starting view (e.g., always start on `Admin > Services`).
  * **Keybinding Customization:** (Advanced feature, not for initial release).
  * **Polling Intervals:** User-configurable update frequencies for live views.

## 6. Input Handling & Command Palette

* **Robust Input Components:** Custom React-Ink input components are needed for:
  * Text fields (with cursor, selection, typing).
  * Password fields (masked input).
  * Dropdowns (with `fzf`-like live filtering for options).
* **Command Palette Logic:** The `:` command palette will require sophisticated logic:
  * **Contextual Suggestions:** Dynamically generate suggestions (`restart`, `stop`, `query`, etc.) based on the `currentNavState.type` and `selectedItemInMiddle`.
  * **Fuzzy Matching:** Implement fuzzy string matching for palette commands.
  * **Execution Mapping:** Map the typed command to the corresponding internal `ActionTypeEnum` and trigger `handleAction`.

## 7. Accessibility (Considerations for TUI)

While TUIs have inherent limitations compared to graphical interfaces, optimizing for keyboard navigation is a core accessibility feature.

* **Full Keyboard Control:** Ensure every single action and navigation path is reachable purely via keyboard. No mouse required.
* **Logical Tab Order (if applicable):** For multi-field forms, ensure `Tab` key moves focus in a logical sequence.
* **Color Contrast:** For theme development, ensure sufficient color contrast to meet accessibility guidelines (WCAG) for users with visual impairments.
* **Clear Focus Indication:** The `>` symbol for selection is good. Ensure active input fields are clearly distinguishable (e.g., through a block cursor `█`).

## 8. Testing Strategy

The state-driven, component-based architecture is highly testable.

* **Unit Tests:** Focus on individual components (e.g., `ServiceList.ViewComponent`, `ServicePreview.PreviewComponent`) and helper functions (e.g., data formatting, `getActions`).
* **State Logic Tests:** Test the `useAppState` hook or state reducer independently to ensure state transitions are correct.
* **Integration Tests:** Simulate user interactions (key presses, drills, actions) and assert that the correct components are rendered and the state changes as expected. (e.g., using a testing library like `react-test-renderer` or specific Ink testing utilities).

---

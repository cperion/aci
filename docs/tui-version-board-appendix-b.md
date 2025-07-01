# Appendix B: ACI Triptych - Interaction & Keybinding Guide

This appendix serves as a concise, comprehensive reference for navigating and interacting with the ACI Triptych TUI. It is designed to be a quick-reference "cheat sheet" for all keybindings and interaction patterns.

---

## 1. Introduction: Mastering Unwavering Focus

The ACI Triptych is built for speed and intuition. Your primary point of interaction is always the **Middle Pane**. The Left and Right panes provide context and detail, reacting automatically to your actions in the center. Mastering a few core keybindings will unlock the full power of the Triptych.

---

## 2. General Navigation: The Core `h/j/k/l` Flow

These keybindings are fundamental to moving through the application's hierarchical structure.

| Keybinding | Action                  | Description                               |
| :--------- | :---------------------- | :---------------------------------------- |
| `↑` or `k` | Move Selection Up       | Navigate to the previous item in the Middle Pane's list. |
| `↓` or `j` | Move Selection Down     | Navigate to the next item in the Middle Pane's list.     |
| `→` or `l` | **Drill Down**          | Move *deeper* into the hierarchy. <br>The Middle Pane's content moves to the **Left Pane** (parent context).<br> The Middle Pane displays the details or children of the selected item. |
| `←` or `h` | **Go Up**               | Move *up* the hierarchy. <br>The **Left Pane's** content moves into the Middle Pane.<br> The Middle Pane's content is discarded. |
| `Enter`    | Drill Down / Confirm    | Behaves identically to `l` for drilling down. Also confirms input/selection in forms. |
| `Esc`      | Go Up / Cancel          | Behaves identically to `h` for going up. Cancels current action/form or dismisses a modal. |

**Visualizing the Flow (`l` for Drill Down, `h` for Go Up):**

```ascii
     +-----------------+       +-----------------+       +-----------------+
     |   Parent        |       |   Current       |       |   Child         |
     |   (Left Pane)   | <---- |   (Middle Pane) | <---- |   (Middle Pane) |
     |                 |       |                 |       |                 |
     +-----------------+       +-----------------+       +-----------------+
           ^                           ^                           ^
           | (h / Esc)                 | (j / k)                   | (j / k)
           |                           |                           |
           +---------------------------+---------------------------+
               Go Up             Navigate list           Navigate list
```

---

## 3. Contextual Actions: Filtering & Copying

These actions operate directly on the content of the Middle Pane without changing the navigational hierarchy.

| Keybinding | Action                  | Description                               |
| :--------- | :---------------------- | :---------------------------------------- |
| `/`        | **Initiate Live Filter**| Activates a real-time filter prompt at the top of the Middle Pane. Type to instantly filter the list.<br>`Enter` to confirm selected item and exit filter.<br>`Esc` to clear filter and restore full list. |
| `c`        | **Universal Copy**      | Copies data to clipboard based on context:<br>• **Selected List Item (Actionable):** Copies the equivalent `aci` CLI command for a primary action (e.g., `aci admin services restart <service>`).<br>• **Selected List Item (Data):** Copies key data as CSV string.<br>• **Log Line:** Copies the full log entry text.<br>• **Active Form:** Copies the generated CLI command based on form inputs. |
| `C` (Shift+c)| **Copy As...**        | Opens a small, context-aware menu in the footer to select an output format for copying (e.g., JSON, CSV, Markdown Table, GeoJSON, URL). |

---

## 4. Action Mode: Command Palette & Confirmations

These trigger the "Action Mode" in the Middle Pane for deliberate state-changing operations.

| Keybinding | Action                  | Description                               |
| :--------- | :---------------------- | :---------------------------------------- |
| `:`        | **Command Palette**     | Activates an input prompt in the global footer. <br>Type a command (e.g., `restart`, `login`) to initiate an action. Suggestions appear based on context.<br>`Enter` to execute.<br>`Esc` to cancel the palette. |
| `y`        | **Yes (Confirm)**       | **Exclusively** used inside confirmation dialogs to confirm the primary action. |
| `n`        | **No (Deny)**           | **Exclusively** used inside confirmation dialogs to deny the primary action. |

---

## 5. Global Commands

These actions affect the entire application state or provide global utilities.

| Keybinding | Action                  | Description                               |
| :--------- | :---------------------- | :---------------------------------------- |
| `Ctrl+L`   | Portal Login            | Opens the Portal Login form in the Middle Pane. |
| `Ctrl+A`   | Admin Login             | Opens the Admin Login form in the Middle Pane. |
| `q`        | Quit ACI Triptych       | Exits the application.                    |
| `?`        | Open Help Modal         | Displays a modal overlay with general help, keybindings, and version info. |

---

## 6. Icon & Symbol Legend

A quick guide to the visual cues used in the TUI.

* **Status Icons:**
  * `✓` : Healthy, Started, Success.
  * `⚠` : Warning, Degraded, Issues.
  * `✗` : Error, Stopped, Failed.
  * `ℹ️` : Informational.
* **Navigation & Hierarchy:**
  * `>` : Cursor / Currently Selected Item.
  * `▾` : Expanded / Open Section.
  * `▸` : Collapsed / Closed Section.
* **Activity:**
  * `⣟` : Spinner (indicates ongoing background process).

---

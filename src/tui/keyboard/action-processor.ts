/**
 * Processes keyboard actions and executes corresponding functions
 */

import { KeymapRegistry } from './keymap-registry.js';
import { ModeDetector, type ViewState } from './mode-detector.js';
import type { ViewMode } from './keymap-registry.js';

export type ActionHandler = (action: string, context?: any) => void | Promise<void>;

export type ActionContext = {
  viewId: string;
  state: ViewState;
  selectedItems?: string[];
  currentItem?: any;
};

export class ActionProcessor {
  private static instance: ActionProcessor;
  private keymapRegistry: KeymapRegistry;
  private actionHandlers = new Map<string, ActionHandler>();
  private lastAction: { action: string; context?: any } | null = null;
  private actionQueue: Promise<void> = Promise.resolve();

  private constructor() {
    this.keymapRegistry = KeymapRegistry.getInstance();
  }

  static getInstance(): ActionProcessor {
    if (!ActionProcessor.instance) {
      ActionProcessor.instance = new ActionProcessor();
    }
    return ActionProcessor.instance;
  }

  registerActionHandler(action: string, handler: ActionHandler) {
    this.actionHandlers.set(action, handler);
  }

  unregisterActionHandler(action: string) {
    this.actionHandlers.delete(action);
  }

  clearAllHandlers() {
    this.actionHandlers.clear();
  }

  async processKey(
    key: string, 
    context: ActionContext
  ): Promise<boolean> {
    // Queue all actions to prevent race conditions
    const result = this.actionQueue.then(async () => {
      return this.processKeyInternal(key, context);
    }).catch(error => {
      console.error('Error processing key:', error);
      return false;
    });
    
    this.actionQueue = result.then(() => {});
    return result;
  }

  private async processKeyInternal(
    key: string,
    context: ActionContext
  ): Promise<boolean> {
    const { viewId, state } = context;
    
    // Skip processing if in input mode (let forms handle it)
    if (ModeDetector.shouldBypassKeyboard(state)) {
      return false;
    }

    // Create immutable context to prevent mutations
    const safeContext: ActionContext = {
      viewId,
      state: JSON.parse(JSON.stringify(state)),
      selectedItems: [...(context.selectedItems || [])],
      currentItem: context.currentItem
    };

    const mode = ModeDetector.detectMode(safeContext.state);
    const action = this.keymapRegistry.getActionForKey(viewId, key, mode, safeContext.state);

    if (!action) {
      return false;
    }

    // Handle special actions
    if (action === 'repeatLastAction' && this.lastAction) {
      await this.executeAction(this.lastAction.action, this.lastAction.context);
      return true;
    }

    await this.executeAction(action, safeContext);
    
    // Store for repeat functionality (except for navigation actions)
    if (!['goBack', 'showHelp', 'quit'].includes(action)) {
      this.lastAction = { action, context: safeContext };
    }

    return true;
  }

  private async executeAction(action: string, context?: any): Promise<void> {
    const handler = this.actionHandlers.get(action);
    
    if (handler) {
      try {
        await handler(action, context);
      } catch (error) {
        console.error(`Error executing action ${action}:`, error);
        this.emergencyReset();
        // TODO: Show user-friendly error message in UI
      }
    } else {
      console.warn(`No handler registered for action: ${action}`);
    }
  }

  private emergencyReset(): void {
    // Reset state on critical errors
    this.lastAction = null;
    // Clear any pending actions
    this.actionQueue = Promise.resolve();
  }

  getAvailableActions(viewId: string, state: ViewState): Array<{key: string, label: string, action: string}> {
    const mode = ModeDetector.detectMode(state);
    return this.keymapRegistry.getAvailableShortcuts(viewId, mode, state);
  }
}
/**
 * Keyboard manager
 * Centralizes all keyboard input handling with proper precedence
 */

import { useInput } from 'ink';
import type { KeyBinding, KeyBindingMap, KeyboardContext, KeyboardManager, Scope } from './types.js';
import { globalBindings } from './global.js';

export class DefaultKeyboardManager implements KeyboardManager {
  private globalBindings: KeyBinding[] = [];
  private scopeBindings: Map<Scope, KeyBinding[]> = new Map();
  private context: KeyboardContext;

  constructor(initialContext: KeyboardContext) {
    this.context = initialContext;
    this.globalBindings = [...globalBindings];
  }

  registerGlobalBinding(binding: KeyBinding): void {
    this.globalBindings.push(binding);
  }

  registerScopeBinding(scope: Scope, binding: KeyBinding): void {
    if (!this.scopeBindings.has(scope)) {
      this.scopeBindings.set(scope, []);
    }
    this.scopeBindings.get(scope)!.push(binding);
  }

  updateContext(updates: Partial<KeyboardContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getCurrentContext(): KeyboardContext {
    return { ...this.context };
  }

  handleInput(input: string): boolean {
    // Normalize input
    const normalizedInput = input.toLowerCase();
    
    // Get relevant bindings in precedence order
    const bindings = this.getRelevantBindings();
    
    // Find matching binding
    for (const binding of bindings) {
      if (binding.key.toLowerCase() === normalizedInput) {
        // Check condition if present
        if (binding.when && !binding.when(this.context)) {
          continue;
        }
        
        // Execute the binding
        binding.run(this.context);
        return true;
      }
    }
    
    return false;
  }

  private getRelevantBindings(): KeyBinding[] {
    const { currentScope, overlayVisible } = this.context;
    
    // If overlay is visible, only overlay-related bindings should work
    if (overlayVisible) {
      return [...this.globalBindings.filter(b => 
        b.key === 'escape' || b.key === '?'
      )];
    }
    
    // Get bindings in precedence order:
    // 1. Scope-specific bindings
    // 2. Global bindings
    
    const scopeBindings = this.scopeBindings.get(currentScope) || [];
    return [...scopeBindings, ...this.globalBindings];
  }

  getBindingsForScope(scope: Scope): KeyBinding[] {
    return this.scopeBindings.get(scope) || [];
  }

  getAllBindings(): Record<string, KeyBinding[]> {
    const result: Record<string, KeyBinding[]> = {
      global: [...this.globalBindings]
    };
    
    for (const [scope, bindings] of this.scopeBindings.entries()) {
      result[scope] = [...bindings];
    }
    
    return result;
  }
}

/**
 * React hook for using the keyboard manager
 */
export function useKeyboardManager(
  initialContext: KeyboardContext
): {
  manager: KeyboardManager;
  updateContext: (updates: Partial<KeyboardContext>) => void;
} {
  const manager = new DefaultKeyboardManager(initialContext);
  
  // Set up Ink input handling
  useInput((input, key) => {
    let inputStr = input;
    
    // Handle special keys
    if (key.escape) {
      inputStr = 'escape';
    } else if (key.return) {
      inputStr = 'return';
    } else if (key.tab) {
      inputStr = 'tab';
    } else if (key.ctrl && input) {
      inputStr = `ctrl-${input}`;
    }
    
    manager.handleInput(inputStr);
  });

  return {
    manager,
    updateContext: (updates: Partial<KeyboardContext>) => manager.updateContext(updates)
  };
}

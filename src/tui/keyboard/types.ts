/**
 * Keyboard system types
 */

export type Scope = 'global' | 'miller';

export type KeyBinding = {
  key: string;
  when?: (ctx: KeyboardContext) => boolean;
  run: (ctx: KeyboardContext) => void;
  description?: string;
};

export type KeyboardContext = {
  currentScope: Scope;
  overlayVisible: boolean;
  activeOverlay?: string;
  // Miller-specific context
  millerActive?: boolean;
  // Additional context can be added as needed
};

export type KeyBindingMap = Map<string, KeyBinding[]>;

export interface KeyboardManager {
  registerGlobalBinding(binding: KeyBinding): void;
  registerScopeBinding(scope: Scope, binding: KeyBinding): void;
  handleInput(input: string, context: KeyboardContext): boolean;
  getBindingsForScope(scope: Scope): KeyBinding[];
  getAllBindings(): Record<string, KeyBinding[]>;
  updateContext(updates: Partial<KeyboardContext>): void;
  getCurrentContext(): KeyboardContext;
}

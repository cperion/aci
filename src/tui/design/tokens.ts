/**
 * Design tokens for the ACI TUI
 * Centralized spacing, borders, radii, zIndex, and sizes
 */

export const spacing = Object.freeze({
  none: 0,
  xs: 0,
  sm: 1,
  md: 1,
  lg: 2,
} as const);

export type SpacingKey = keyof typeof spacing;

export const borders = Object.freeze({
  width: 1,
  style: 'single',
} as const);

export const radii = Object.freeze({
  none: 0,
  sm: 1,
} as const);

export const zIndex = Object.freeze({
  base: 1,
  overlay: 10,
  toast: 100,
} as const);

export const sizes = Object.freeze({
  sidebar: 28, // percent
  content: 52, // percent
  inspector: 20, // percent
} as const);

export type ZIndexKey = keyof typeof zIndex;
export type SizeKey = keyof typeof sizes;

/**
 * Color roles adapter for ACI TUI
 * Maps Base16 schemes to semantic UI roles
 */

import { useEffect, useMemo, useState } from 'react';
import type { Base16Scheme } from '../themes/base16-schemes.js';
import { themeManager } from '../themes/manager.js';

export type ColorRoles = {
  // Surfaces and backgrounds
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSubtle: string;
  borderEmphasis: string;
  
  // Text colors
  text: string;
  textMuted: string;
  textAccent: string;
  textAltDark: string;
  textAltLight: string;
  label: string;
  
  // Selection states
  selectionBg: string;
  selection: string;
  focus: string;
  
  // Semantic colors
  accent: string;
  accentPrimary: string;
  accentStrong: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

/**
 * Map Base16 scheme colors to semantic roles according to canonical Base16 semantics
 */
export function mapBase16ToRoles(scheme: Base16Scheme): ColorRoles {
  const { base00, base01, base02, base03, base04, base05, base06, base07,
          base08, base09, base0A, base0B, base0C, base0D, base0E, base0F } = scheme.colors;

  return {
    // Surfaces and backgrounds
    bg: base00,                    // Default Background
    surface: base01,               // Lighter Background (status bars, chrome)
    surfaceAlt: base07,            // Light Background (rare)
    border: base03,                // Comments / Invisibles / Line Highlighting
    borderSubtle: base02,          // Selection Background (subtle borders)
    borderEmphasis: base03,        // Comments / Invisibles (emphasis borders)
    
    // Text colors
    text: base05,                  // Default Foreground (primary text)
    textMuted: base03,             // Comments / Invisibles / Line Highlighting (muted)
    textAccent: base0D,            // Functions, methods, headings (accent text)
    textAltDark: base04,           // Dark Foreground (status bars)
    textAltLight: base06,          // Light Foreground (rare)
    label: base04,                 // Dark Foreground (labels)
    
    // Selection states
    selectionBg: base02,           // Selection Background
    selection: base05,             // Default Foreground (selection text)
    focus: base0E,                 // Keywords, storage, selectors (focus)
    
    // Semantic colors
    accent: base0D,                // Functions, methods, headings (primary accent)
    accentPrimary: base0D,         // Functions, methods, headings
    accentStrong: base0E,          // Keywords, storage, selectors (strong accent)
    success: base0B,               // Strings, inserted (success)
    warning: base0A,               // Classes, bold, search highlight (warning)
    danger: base08,                // Variables, tags, deleted (danger)
    info: base0C,                  // Support, regex, escapes, quotes (info)
  };
}

/**
 * React hook to get current color roles
 */
export function useColorRoles(): ColorRoles {
  const [scheme, setScheme] = useState(themeManager.getCurrent());

  // Subscribe to theme changes to trigger re-render with new roles
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((next) => setScheme(next));
    return unsubscribe;
  }, []);

  return useMemo(() => mapBase16ToRoles(scheme), [scheme]);
}

/**
 * Utility function to check contrast ratio between two colors
 * Returns true if contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export function checkContrast(foreground: string, background: string): number {
  // Simple relative luminance calculation
  const normalizeHex = (hex: string): string => {
    // Ensure leading '#', support 6-hex style inputs
    const clean = hex.startsWith('#') ? hex : `#${hex}`;
    return clean.length === 7 ? clean : clean.slice(0, 7);
  };

  const getLuminance = (hex: string): number => {
    const norm = normalizeHex(hex);
    const rgb = parseInt(norm.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    
    // Normalize to 0-1 range
    const normalized = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const [rs = 0, gs = 0, bs = 0] = normalized;
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const fgLum = getLuminance(foreground);
  const bgLum = getLuminance(background);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Development-time contrast checker that logs warnings
 */
export function assertRoleContrast(
  fg: keyof ColorRoles,
  bg: keyof ColorRoles,
  roles: ColorRoles,
  label: string = 'Contrast check'
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const contrast = checkContrast(roles[fg], roles[bg]);
  const threshold = 4.5; // WCAG AA for normal text
  
  if (contrast < threshold) {
    console.warn(
      `${label}: Low contrast detected (${contrast.toFixed(2)}:1) between ${fg} and ${bg}. ` +
      `Should be ≥ ${threshold}:1. ` +
      `Colors: ${roles[fg]} on ${roles[bg]}`
    );
  }
}

/**
 * Validate critical role pairs meet contrast requirements
 */
export function validateThemeContrast(roles: ColorRoles): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Critical text contrast checks
  assertRoleContrast('text', 'bg', roles, 'Primary text');
  assertRoleContrast('textMuted', 'bg', roles, 'Muted text');
  assertRoleContrast('text', 'surface', roles, 'Text on surface');
  assertRoleContrast('selection', 'selectionBg', roles, 'Selection text');
  
  // Accent contrast checks
  assertRoleContrast('success', 'bg', roles, 'Success text');
  assertRoleContrast('warning', 'bg', roles, 'Warning text');
  assertRoleContrast('danger', 'bg', roles, 'Danger text');
  assertRoleContrast('info', 'bg', roles, 'Info text');
}

/**
 * Theme manager for ACI TUI
 * Manages Base16 scheme selection and lifecycle
 */

import { base16Schemes, getDefaultScheme } from './base16-schemes.js';
import type { Base16Scheme } from './base16-schemes.js';

const getSchemeByName = (name: string): Base16Scheme | undefined => {
  return base16Schemes.find(scheme => scheme.name.toLowerCase() === name.toLowerCase());
};

export type ThemeChangeListener = (scheme: Base16Scheme) => void;

export class ThemeManager {
  private currentScheme: Base16Scheme;
  private listeners: Set<ThemeChangeListener> = new Set();
  private storageKey = 'aci-tui-theme';

  constructor() {
    // Try to load from localStorage, fallback to default
    const savedName = this.loadSavedTheme();
    this.currentScheme = savedName ? (getSchemeByName(savedName) ?? getDefaultScheme()) : getDefaultScheme();
  }

  getCurrent(): Base16Scheme {
    return this.currentScheme;
  }

  setTheme(name: string): boolean {
    const scheme = getSchemeByName(name);
    if (!scheme) {
      return false;
    }

    this.currentScheme = scheme;
    this.saveTheme(name);
    this.notifyListeners();
    return true;
  }

  setThemeByIndex(index: number): boolean {
    if (index < 0 || index >= base16Schemes.length) {
      return false;
    }

    this.currentScheme = base16Schemes[index]!;
    this.saveTheme(this.currentScheme.name);
    this.notifyListeners();
    return true;
  }

  getAvailable(): readonly Base16Scheme[] {
    return base16Schemes;
  }

  next(): void {
    const currentIndex = base16Schemes.indexOf(this.currentScheme);
    const nextIndex = (currentIndex + 1) % base16Schemes.length;
    this.setThemeByIndex(nextIndex);
  }

  previous(): void {
    const currentIndex = base16Schemes.indexOf(this.currentScheme);
    const prevIndex = currentIndex === 0 ? base16Schemes.length - 1 : currentIndex - 1;
    this.setThemeByIndex(prevIndex);
  }

  random(): void {
    const randomIndex = Math.floor(Math.random() * base16Schemes.length);
    this.setThemeByIndex(randomIndex);
  }

  subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentScheme);
    }
  }

  private saveTheme(name: string): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const configDir = path.join(os.homedir(), '.aci');
      const configFile = path.join(configDir, 'theme.json');
      
      // Ensure config directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configFile, JSON.stringify({ scheme: name }, null, 2));
    } catch {
      // Ignore persistence errors
    }
  }

  private loadSavedTheme(): string | null {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const configFile = path.join(os.homedir(), '.aci', 'theme.json');
      
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        const parsed = JSON.parse(content);
        return parsed.scheme || null;
      }
    } catch {
      // Ignore persistence errors
    }
    return null;
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();

import { themeLoader } from './theme-loader.js';
import type { Base16Theme, ArcGISColorMapping } from './theme-loader.js';

export interface ThemeState {
  current: Base16Theme;
  colors: ArcGISColorMapping;
  name: string;
  contrastIssues?: Array<{
    pair: [string, string];
    ratio: number;
    adjusted: boolean;
  }>;
}

export class ThemeManager {
  private static instance: ThemeManager;
  private state: ThemeState;
  private listeners: Array<(state: ThemeState) => void> = [];

  private constructor() {
    // Initialize with gruvbox-light-medium if available, otherwise first theme
    const defaultTheme = themeLoader.setTheme('gruvbox-light-medium') 
      ? 'gruvbox-light-medium' 
      : themeLoader.getAvailableThemes()[0]?.name || '';
    
    if (defaultTheme) {
      themeLoader.setTheme(defaultTheme);
    }

    const current = themeLoader.getCurrentTheme();
    if (!current) {
      throw new Error('No themes available');
    }

    const colorMapping = themeLoader.mapToArcGIS(current);
    this.state = {
      current,
      colors: colorMapping,
      name: defaultTheme,
      contrastIssues: colorMapping.contrastIssues
    };
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public getCurrentState(): ThemeState {
    return { ...this.state };
  }

  public setTheme(themeName: string): boolean {
    if (themeLoader.setTheme(themeName)) {
      const current = themeLoader.getCurrentTheme();
      if (!current) return false;
      const colorMapping = themeLoader.mapToArcGIS(current);
      this.state = {
        current,
        colors: colorMapping,
        name: themeName,
        contrastIssues: colorMapping.contrastIssues
      };
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public nextTheme(): void {
    const themes = themeLoader.getAvailableThemes();
    const currentIndex = themes.findIndex(t => t.name === this.state.name);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    if (nextTheme) {
      this.setTheme(nextTheme.name);
    }
  }

  public previousTheme(): void {
    const themes = themeLoader.getAvailableThemes();
    const currentIndex = themes.findIndex(t => t.name === this.state.name);
    const prevIndex = (currentIndex - 1 + themes.length) % themes.length;
    const prevTheme = themes[prevIndex];
    if (prevTheme) {
      this.setTheme(prevTheme.name);
    }
  }

  public randomTheme(): void {
    const randomTheme = themeLoader.getRandomTheme();
    if (!randomTheme) return;
    
    const themes = themeLoader.getAvailableThemes();
    const themeName = themes.find(t => t.scheme === randomTheme.scheme)?.name;
    if (themeName) {
      this.setTheme(themeName);
    }
  }

  public getAvailableThemes() {
    return themeLoader.getAvailableThemes();
  }

  public getThemesByCategory() {
    return themeLoader.getThemesByCategory();
  }

  public searchThemes(query: string) {
    return themeLoader.searchThemes(query);
  }

  public subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Convenience methods for easy color access
  public get colors(): ArcGISColorMapping {
    return this.state.colors;
  }

  public get theme(): Base16Theme {
    return this.state.current;
  }

  public get name(): string {
    return this.state.name;
  }
}

// Create a React hook for theme management
import React, { useState, useEffect } from 'react';

export function useTheme(): ThemeState & {
  setTheme: (name: string) => boolean;
  nextTheme: () => void;
  previousTheme: () => void;
  randomTheme: () => void;
} {
  const manager = ThemeManager.getInstance();
  const [state, setState] = useState(manager.getCurrentState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  return {
    ...state,
    setTheme: manager.setTheme.bind(manager),
    nextTheme: manager.nextTheme.bind(manager),
    previousTheme: manager.previousTheme.bind(manager),
    randomTheme: manager.randomTheme.bind(manager),
  };
}

// Singleton export
export const themeManager = ThemeManager.getInstance();
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export interface Base16Theme {
  scheme: string;
  author: string;
  base00: string; // Default Background
  base01: string; // Lighter Background
  base02: string; // Selection Background
  base03: string; // Comments, Invisibles
  base04: string; // Dark Foreground
  base05: string; // Default Foreground
  base06: string; // Light Foreground
  base07: string; // Light Background
  base08: string; // Variables, XML Tags (Red)
  base09: string; // Integers, Boolean (Orange)
  base0A: string; // Classes, Search (Yellow)
  base0B: string; // Strings, Inherited (Green)
  base0C: string; // Support, Regex (Cyan)
  base0D: string; // Functions, Methods (Blue)
  base0E: string; // Keywords, Storage (Purple)
  base0F: string; // Deprecated, Language Tags (Brown)
}

export interface ArcGISColorMapping {
  // Background layers (geological strata)
  mainBackground: string;      // base00 - obsidian bedrock
  panelBackground: string;     // base01 - magmatic strata
  workspaceBackground: string; // base02 - rusted topsoil
  
  // Text hierarchy (organic materials)
  metadata: string;            // base03 - twilight dusk
  labels: string;             // base04 - fossilized amber
  primaryText: string;        // base05 - moonlit birch
  highlights: string;         // base06 - sun pillar
  separators: string;         // base07 - glacial meltwater
  
  // Semantic elements (atmospheric phenomena)
  errors: string;             // base08 - caldera eruption
  warnings: string;           // base09 - desert canyon
  servers: string;            // base0A - harvested wheat
  success: string;            // base0B - permafrost moss
  features: string;           // base0C - fjord springs
  portals: string;            // base0D - stratospheric ice
  users: string;              // base0E - midnight bloom
  selections: string;         // base0F - magnetospheric flare
}

export class ThemeLoader {
  private static readonly SCHEMES_PATH = path.join(process.cwd(), 'submodules/base-16-schemes');
  private themes: Map<string, Base16Theme> = new Map();
  private currentTheme: Base16Theme | undefined = undefined;

  constructor() {
    this.loadAllThemes();
  }

  private loadAllThemes(): void {
    try {
      const files = fs.readdirSync(ThemeLoader.SCHEMES_PATH);
      const yamlFiles = files.filter(f => f.endsWith('.yaml'));
      
      for (const file of yamlFiles) {
        try {
          const filePath = path.join(ThemeLoader.SCHEMES_PATH, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const theme = yaml.parse(content) as Base16Theme;
          
          // Validate theme has all required colors
          if (this.isValidTheme(theme)) {
            // Use filename without extension as key
            const themeName = path.basename(file, '.yaml');
            this.themes.set(themeName, theme);
          }
        } catch (error) {
          console.warn(`Failed to load theme ${file}:`, error);
        }
      }
      
      console.log(`Loaded ${this.themes.size} Base16 themes`);
    } catch (error) {
      console.error('Failed to load themes directory:', error);
    }
  }

  private isValidTheme(theme: any): theme is Base16Theme {
    const requiredKeys = [
      'scheme', 'author',
      'base00', 'base01', 'base02', 'base03',
      'base04', 'base05', 'base06', 'base07',
      'base08', 'base09', 'base0A', 'base0B',
      'base0C', 'base0D', 'base0E', 'base0F'
    ];
    
    return requiredKeys.every(key => 
      key in theme && 
      typeof theme[key] === 'string' && 
      (key === 'scheme' || key === 'author' || /^[0-9a-fA-F]{6}$/.test(theme[key]))
    );
  }

  public getAvailableThemes(): Array<{name: string, scheme: string, author: string}> {
    return Array.from(this.themes.entries()).map(([name, theme]) => ({
      name,
      scheme: theme.scheme,
      author: theme.author
    }));
  }

  public getThemesByCategory(): Record<string, Array<{name: string, scheme: string}>> {
    const categories = {
      'Popular': [] as Array<{name: string, scheme: string}>,
      'Dark': [] as Array<{name: string, scheme: string}>,
      'Light': [] as Array<{name: string, scheme: string}>,
      'Colorful': [] as Array<{name: string, scheme: string}>,
      'Monochrome': [] as Array<{name: string, scheme: string}>,
      'Nature': [] as Array<{name: string, scheme: string}>,
      'Other': [] as Array<{name: string, scheme: string}>
    };

    for (const [name, theme] of this.themes) {
      const schemeLower = theme.scheme.toLowerCase();
      
      if (['gruvbox', 'nord', 'dracula', 'solarized', 'catppuccin', 'monokai', 'tomorrow'].some(p => schemeLower.includes(p))) {
        categories.Popular.push({name, scheme: theme.scheme});
      } else if (schemeLower.includes('light') || ['github', 'papercolor-light'].includes(name)) {
        categories.Light.push({name, scheme: theme.scheme});
      } else if (['grayscale', 'black-metal'].some(p => schemeLower.includes(p))) {
        categories.Monochrome.push({name, scheme: theme.scheme});
      } else if (['forest', 'ocean', 'mountain', 'brushtrees', 'everforest'].some(p => schemeLower.includes(p))) {
        categories.Nature.push({name, scheme: theme.scheme});
      } else if (['unikitty', 'circus', 'fruit-soda', 'rebecca'].some(p => schemeLower.includes(p))) {
        categories.Colorful.push({name, scheme: theme.scheme});
      } else if (schemeLower.includes('dark') || !schemeLower.includes('light')) {
        categories.Dark.push({name, scheme: theme.scheme});
      } else {
        categories.Other.push({name, scheme: theme.scheme});
      }
    }

    return categories;
  }

  public setTheme(themeName: string): boolean {
    const theme = this.themes.get(themeName);
    if (theme) {
      this.currentTheme = theme;
      return true;
    }
    return false;
  }

  public getCurrentTheme(): Base16Theme | null {
    return this.currentTheme ?? null;
  }

  public getRandomTheme(): Base16Theme | null {
    const themes = Array.from(this.themes.values());
    if (themes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * themes.length);
    return themes[randomIndex] ?? null;
  }

  public mapToArcGIS(theme: Base16Theme): ArcGISColorMapping {
    return {
      // Background layers (geological strata)
      mainBackground: `#${theme.base00}`,      // obsidian bedrock
      panelBackground: `#${theme.base01}`,     // magmatic strata  
      workspaceBackground: `#${theme.base02}`, // rusted topsoil
      
      // Text hierarchy (organic materials)
      metadata: `#${theme.base03}`,            // twilight dusk
      labels: `#${theme.base04}`,              // fossilized amber
      primaryText: `#${theme.base05}`,         // moonlit birch
      highlights: `#${theme.base06}`,          // sun pillar
      separators: `#${theme.base07}`,          // glacial meltwater
      
      // Semantic elements (atmospheric phenomena)
      errors: `#${theme.base08}`,              // caldera eruption
      warnings: `#${theme.base09}`,            // desert canyon
      servers: `#${theme.base0A}`,             // harvested wheat
      success: `#${theme.base0B}`,             // permafrost moss
      features: `#${theme.base0C}`,            // fjord springs
      portals: `#${theme.base0D}`,             // stratospheric ice
      users: `#${theme.base0E}`,               // midnight bloom
      selections: `#${theme.base0F}`,          // magnetospheric flare
    };
  }

  public searchThemes(query: string): Array<{name: string, scheme: string, author: string}> {
    const queryLower = query.toLowerCase();
    return this.getAvailableThemes().filter(theme => 
      theme.name.toLowerCase().includes(queryLower) ||
      theme.scheme.toLowerCase().includes(queryLower) ||
      theme.author.toLowerCase().includes(queryLower)
    );
  }
}

// Singleton instance
export const themeLoader = new ThemeLoader();
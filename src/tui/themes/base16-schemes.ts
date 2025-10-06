/**
 * Curated Base16 color schemes for ACI TUI
 * A selection of popular, high-contrast themes optimized for terminal use
 */

export interface Base16Scheme {
  name: string;
  author: string;
  colors: {
    base00: string; // Default Background
    base01: string; // Lighter Background (status bars)
    base02: string; // Selection Background
    base03: string; // Comments / Invisibles / Muted
    base04: string; // Dark Foreground (status bars)
    base05: string; // Default Foreground (primary text)
    base06: string; // Light Foreground (rare)
    base07: string; // Light Background (rare)
    base08: string; // Variables, deleted (danger)
    base09: string; // Numbers, constants, attributes
    base0A: string; // Classes, bold, search highlight (warning)
    base0B: string; // Strings, inserted (success)
    base0C: string; // Support, regex, escapes (info)
    base0D: string; // Functions, methods, headings (primary accent)
    base0E: string; // Keywords, storage, selectors (focus/strong)
    base0F: string; // Deprecated, embedded tags (deprecated)
  };
}

export const base16Schemes: readonly Base16Scheme[] = [
  // Dark themes
  {
    name: "Catppuccin Mocha",
    author: "https://github.com/catppuccin/catppuccin",
    colors: {
      base00: "1e1e2e", base01: "181825", base02: "313244", base03: "45475a",
      base04: "585b70", base05: "cdd6f4", base06: "f5e0dc", base07: "b4befe",
      base08: "f38ba8", base09: "fab387", base0A: "f9e2af", base0B: "a6e3a1",
      base0C: "94e2d5", base0D: "89b4fa", base0E: "cba6f7", base0F: "f2cdcd"
    }
  },
  {
    name: "Gruvbox Dark Hard",
    author: "Dawid Kurek (dawikur@gmail.com), morhetz (https://github.com/morhetz/gruvbox)",
    colors: {
      base00: "1d2021", base01: "3c3836", base02: "504945", base03: "665c54",
      base04: "bdae93", base05: "d5c4a1", base06: "ebdbb2", base07: "fbf1c7",
      base08: "fb4934", base09: "fe8019", base0A: "fabd2f", base0B: "b8bb26",
      base0C: "8ec07c", base0D: "83a598", base0E: "d3869b", base0F: "d65d0e"
    }
  },
  {
    name: "Tokyo Night Dark",
    author: "Michaël Ball",
    colors: {
      base00: "1A1B26", base01: "16161E", base02: "2F3549", base03: "444B6A",
      base04: "787C99", base05: "A9B1D6", base06: "CBCCD1", base07: "D5D6DB",
      base08: "F7768E", base09: "A9B1D6", base0A: "0DB9D7", base0B: "9ECE6A",
      base0C: "B4F9F8", base0D: "2AC3DE", base0E: "BB9AF7", base0F: "C0CAF5"
    }
  },
  {
    name: "Nord",
    author: "arcticicestudio",
    colors: {
      base00: "2E3440", base01: "3B4252", base02: "434C5E", base03: "4C566A",
      base04: "D8DEE9", base05: "E5E9F0", base06: "ECEFF4", base07: "8FBCBB",
      base08: "88C0D0", base09: "81A1C1", base0A: "88C0D0", base0B: "A3BE8C",
      base0C: "8FBCBB", base0D: "5E81AC", base0E: "B48EAD", base0F: "BF616A"
    }
  },
  {
    name: "Dracula",
    author: "Mike Barkmin (http://github.com/mikebarkmin)",
    colors: {
      base00: "282a36", base01: "44475a", base02: "6272a4", base03: "7979a5",
      base04: "93a4c3", base05: "f8f8f2", base06: "f8f8f2", base07: "f8f8f2",
      base08: "ff5555", base09: "ffb86c", base0A: "f1fa8c", base0B: "50fa7b",
      base0C: "8be9fd", base0D: "bd93f9", base0E: "ff79c6", base0F: "ff5555"
    }
  },
  {
    name: "One Dark",
    author: "Daniel Pfeifer (daniel@pfeifer.pm)",
    colors: {
      base00: "282c34", base01: "353b45", base02: "3e4451", base03: "545862",
      base04: "565c64", base05: "abb2bf", base06: "b6bdca", base07: "c8ccd4",
      base08: "e06c75", base09: "d19a66", base0A: "e5c07b", base0B: "98c379",
      base0C: "56b6c2", base0D: "61afef", base0E: "c678dd", base0F: "be5046"
    }
  },
  {
    name: "Material Darker",
    author: "Nate Peterson",
    colors: {
      base00: "212121", base01: "303030", base02: "353535", base03: "4A4A4A",
      base04: "B2CCD6", base05: "EEFFFF", base06: "EEFFFF", base07: "FFFFFF",
      base08: "F07178", base09: "F78C6C", base0A: "FFCB6B", base0B: "C3E88D",
      base0C: "89DDFF", base0D: "82AAFF", base0E: "C792EA", base0F: "FF5370"
    }
  },
  {
    name: "Solarized Dark",
    author: "Ethan Schoonover (modified by aramisgithub)",
    colors: {
      base00: "002b36", base01: "073642", base02: "586e75", base03: "657b83",
      base04: "839496", base05: "93a1a1", base06: "eee8d5", base07: "fdf6e3",
      base08: "dc322f", base09: "cb4b16", base0A: "b58900", base0B: "859900",
      base0C: "2aa198", base0D: "268bd2", base0E: "6c71c4", base0F: "d33682"
    }
  },
  
  // Light themes
  {
    name: "Catppuccin Latte",
    author: "https://github.com/catppuccin/catppuccin",
    colors: {
      base00: "eff1f5", base01: "e6e9ef", base02: "ccd0da", base03: "bcc0cc",
      base04: "acb0be", base05: "4c4f69", base06: "dc8a78", base07: "7287fd",
      base08: "d20f39", base09: "fe640b", base0A: "df8e1d", base0B: "40a02b",
      base0C: "179299", base0D: "1e66f5", base0E: "8839ef", base0F: "dd7878"
    }
  },
  {
    name: "Gruvbox Light Hard",
    author: "Dawid Kurek (dawikur@gmail.com), morhetz (https://github.com/morhetz/gruvbox)",
    colors: {
      base00: "f9f5d7", base01: "ebdbb2", base02: "d5c4a1", base03: "bdae93",
      base04: "665c54", base05: "3c3836", base06: "282828", base07: "1d2021",
      base08: "cc241d", base09: "d65d0e", base0A: "d79921", base0B: "98971a",
      base0C: "689d6a", base0D: "458588", base0E: "b16286", base0F: "9d0006"
    }
  },
  {
    name: "Tokyo Night Light",
    author: "Michaël Ball",
    colors: {
      base00: "D5D6DB", base01: "CBCCD1", base02: "9699A3", base03: "787C99",
      base04: "444B6A", base05: "2F3549", base06: "1A1B26", base07: "16161E",
      base08: "F7768E", base09: "9AA5CE", base0A: "0DB9D7", base0B: "9ECE6A",
      base0C: "B4F9F8", base0D: "2AC3DE", base0E: "BB9AF7", base0F: "C0CAF5"
    }
  },
  {
    name: "Solarized Light",
    author: "Ethan Schoonover (modified by aramisgithub)",
    colors: {
      base00: "fdf6e3", base01: "eee8d5", base02: "93a1a1", base03: "839496",
      base04: "657b83", base05: "586e75", base06: "073642", base07: "002b36",
      base08: "dc322f", base09: "cb4b16", base0A: "b58900", base0B: "859900",
      base0C: "2aa198", base0D: "268bd2", base0E: "6c71c4", base0F: "d33682"
    }
  },
  {
    name: "GitHub Light",
    author: "Defman21",
    colors: {
      base00: "ffffff", base01: "f5f5f5", base02: "c8c8c8", base03: "969696",
      base04: "e8e8e8", base05: "333333", base06: "ffffff", base07: "ffffff",
      base08: "ed6a43", base09: "005cc5", base0A: "d19a66", base0B: "28a745",
      base0C: "005cc5", base0D: "0366d6", base0E: "5a32a3", base0F: "d73a49"
    }
  }
] as const;

export const getSchemeByName = (name: string): Base16Scheme | undefined => {
  return base16Schemes.find(scheme => scheme.name.toLowerCase() === name.toLowerCase());
};

export const getDefaultScheme = (): Base16Scheme => {
  return base16Schemes[0]!; // Catppuccin Mocha - guaranteed to exist
};

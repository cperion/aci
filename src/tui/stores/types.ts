// Type definitions for TUI stores
export interface AuthState {
  portal: boolean;
  admin: boolean;
  portalSession: any;
  adminSession: any;
}

export interface NavigationState {
  history: Array<{
    id: string;
    title: string;
    params?: Record<string, any>;
  }>;
}

export interface EntitySearchState {
  [entityType: string]: {
    items: any[];
    filteredItems: any[];
    currentIndex: number;
    searchTerm: string;
    isLoading: boolean;
    error: string;
    hasSearched: boolean;
    activeFilters: Record<string, string>;
  };
}

export interface UIState {
  overlays: {
    help: boolean;
    commandPalette: boolean;
    quickReference: boolean;
    universalSearch: boolean;
  };
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
  }>;
  theme: {
    current: string;
    name: string;
  };
}

export interface StoreSetOptions {
  silent?: boolean;
  source?: string;
}

export interface EntityState {
  users: {
    items: any[];
    selected: Set<string>;
    selectedIds: string[];
    selectedMap: Record<string, true>;
    filters: Record<string, string>;
    search: {
      term: string;
      debouncedTerm: string;
      isLoading: boolean;
      error: string | null;
    };
    currentIndex: number;
  };
  groups: {
    items: any[];
    selected: Set<string>;
    selectedIds: string[];
    selectedMap: Record<string, true>;
    filters: Record<string, string>;
    search: {
      term: string;
      debouncedTerm: string;
      isLoading: boolean;
      error: string | null;
    };
    currentIndex: number;
  };
  items: {
    items: any[];
    selected: Set<string>;
    selectedIds: string[];
    selectedMap: Record<string, true>;
    filters: Record<string, string>;
    search: {
      term: string;
      debouncedTerm: string;
      isLoading: boolean;
      error: string | null;
    };
    currentIndex: number;
  };
  services: {
    items: any[];
    selected: Set<string>;
    selectedIds: string[];
    selectedMap: Record<string, true>;
    filters: Record<string, string>;
    search: {
      term: string;
      debouncedTerm: string;
      isLoading: boolean;
      error: string | null;
    };
    currentIndex: number;
  };
  admin: {
    items: any[];
    selected: Set<string>;
    selectedIds: string[];
    selectedMap: Record<string, true>;
    filters: Record<string, string>;
    search: {
      term: string;
      debouncedTerm: string;
      isLoading: boolean;
      error: string | null;
    };
    currentIndex: number;
  };
}
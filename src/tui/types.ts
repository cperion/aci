// TUI Type Definitions

export interface AppState {
  currentView: { id: string; title: string; data?: unknown };
  previousView?: string;
  selection: { serviceId?: string; datastoreId?: string; itemId?: string };
  environment: string;
  authStatus: { portal: boolean; admin: boolean };
}

export interface NavigationAction {
  type: 'navigate' | 'back' | 'select' | 'refresh' | 'auth_update';
  payload?: {
    viewId?: string;
    title?: string;
    data?: unknown;
    selection?: Partial<AppState['selection']>;
    authStatus?: Partial<AppState['authStatus']>;
  };
}

export interface ViewConfig {
  id: string;
  title: string;
  component: React.ComponentType<{ data?: unknown }>;
  dataLoader?: () => Promise<unknown>;
}

export interface PaneProps {
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
  width?: number;
}

export interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: string;
  output?: string;
}
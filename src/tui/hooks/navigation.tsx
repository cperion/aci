import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, NavigationAction } from '../types.js';

// Initial state following blueprint design
const initialState: AppState = {
  currentView: { id: 'home', title: 'ACI Dashboard' },
  selection: {},
  environment: process.env.NODE_ENV || 'development',
  authStatus: { portal: false, admin: false }
};

// State reducer implementing flat navigation pattern
function navigationReducer(state: AppState, action: NavigationAction): AppState {
  switch (action.type) {
    case 'navigate':
      return {
        ...state,
        previousView: state.currentView.id,
        currentView: {
          id: action.payload?.viewId || state.currentView.id,
          title: action.payload?.title || state.currentView.title,
          data: action.payload?.data
        }
      };
    
    case 'back':
      return {
        ...state,
        currentView: { 
          id: state.previousView || 'home', 
          title: 'ACI Dashboard' 
        },
        previousView: undefined
      };
    
    case 'select':
      return {
        ...state,
        selection: { ...state.selection, ...action.payload?.selection }
      };
    
    case 'auth_update':
      return {
        ...state,
        authStatus: { ...state.authStatus, ...action.payload?.authStatus }
      };
    
    case 'refresh':
      return { ...state }; // Trigger re-render
    
    default:
      return state;
  }
}

// Navigation context
const NavigationContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<NavigationAction>;
} | null>(null);

// Navigation provider component
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  
  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Custom hook for navigation
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  
  const { state, dispatch } = context;
  
  // Convenience methods
  const navigate = (viewId: string, title: string, data?: unknown) => {
    dispatch({ type: 'navigate', payload: { viewId, title, data } });
  };
  
  const goBack = () => {
    dispatch({ type: 'back' });
  };
  
  const setSelection = (selection: Partial<AppState['selection']>) => {
    dispatch({ type: 'select', payload: { selection } });
  };
  
  const updateAuth = (authStatus: Partial<AppState['authStatus']>) => {
    dispatch({ type: 'auth_update', payload: { authStatus } });
  };
  
  const refresh = () => {
    dispatch({ type: 'refresh' });
  };
  
  return {
    state,
    navigate,
    goBack,
    setSelection,
    updateAuth,
    refresh
  };
}
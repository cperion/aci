/**
 * ACI TUI Application Entry Point
 * Main application component with error boundary and state management
 */

import React, { useState, useEffect } from 'react';
import { render } from 'ink';
import { AppShell } from './layout/index.js';
import { HelpOverlay } from './overlays/index.js';
import type { Notification } from './overlays/index.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useKeyboardManager } from './keyboard/index.js';
import type { Scope } from './keyboard/index.js';
import { themeManager } from './themes/manager.js';
import { validateThemeContrast } from './design/roles.js';

export type TUIAppProps = {
  portal?: string;
  username?: string;
  isAdmin?: boolean;
};

function TUIApp({ portal, username, isAdmin }: TUIAppProps) {
  const [currentView, setCurrentView] = useState<string>('home');
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Keyboard context
  const keyboardContext = {
    currentScope: currentView as Scope,
    overlayVisible: showHelp,
    currentView,
  };

  const { updateContext } = useKeyboardManager(keyboardContext);

  // Update keyboard context when state changes
  useEffect(() => {
    updateContext({
      currentScope: currentView as Scope,
      overlayVisible: showHelp,
      currentView,
    });
  }, [currentView, showHelp, updateContext]);

  // Validate theme contrast in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const roles = themeManager.getCurrent();
      import('./design/roles.js').then(({ mapBase16ToRoles }) => {
        const mappedRoles = mapBase16ToRoles(roles);
        validateThemeContrast(mappedRoles);
      });
    }
  }, []);

  // Add notification helper
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after timeout
    const timeout = notification.timeout || 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, timeout);
  };

  // Handle view changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    addNotification({
      type: 'info',
      title: 'Navigation',
      message: `Switched to ${view} view`,
    });
  };

  // Override global keyboard handlers for our app
  useEffect(() => {
    // Register custom keyboard handlers
    const handlers = {
      toggleHelp: () => setShowHelp((v) => !v),
      closeOverlay: () => setShowHelp(false),
      quit: () => {
        if (showHelp) {
          setShowHelp(false);
        } else {
          process.exit(0);
        }
      },
      navigate: (view: string) => {
        handleViewChange(view);
      }
    } as const;

    // These will be called by the keyboard manager
    (global as any).tuiHandlers = handlers;

    return () => {
      delete (global as any).tuiHandlers;
    };
  }, [showHelp]);

  return (
    <ErrorBoundary>
      <AppShell
        initialView={currentView}
        portal={portal}
        username={username}
        isAdmin={isAdmin}
        onViewChange={handleViewChange}
        notifications={notifications}
      />

      <HelpOverlay
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        currentView={currentView}
      />
    </ErrorBoundary>
  );
}

/**
 * Start the TUI application
 */
export async function startTui(props: TUIAppProps = {}): Promise<void> {
  // Validate theme contrast at startup
  const currentTheme = themeManager.getCurrent();
  import('./design/roles.js').then(({ mapBase16ToRoles, validateThemeContrast }) => {
    const roles = mapBase16ToRoles(currentTheme);
    validateThemeContrast(roles);
  });

  // Render once
  render(<TUIApp {...props} />);
}

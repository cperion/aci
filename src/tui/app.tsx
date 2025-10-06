/**
 * ACI TUI Application Entry Point
 * Main application component with error boundary and state management
 */

import React, { useEffect } from 'react';
import { render } from 'ink';
import { AppShell } from './layout/index.js';
import { HelpOverlay } from './overlays/index.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useKeyboardManager } from './keyboard/index.js';
import { useUiStore } from './state/ui.js';
import { themeManager } from './themes/manager.js';
import { validateThemeContrast } from './design/roles.js';

export type TUIAppProps = {
  portal?: string;
  username?: string;
  isAdmin?: boolean;
};

function TUIApp({ portal, username, isAdmin }: TUIAppProps) {
  const { overlays } = useUiStore();
  const showHelp = overlays.help;

  // Keyboard context for Miller columns
  const keyboardContext = {
    currentScope: 'miller' as const,
    overlayVisible: Object.values(overlays).some(Boolean),
    millerActive: true,
  };

  const { updateContext } = useKeyboardManager(keyboardContext);

  // Update keyboard context when overlays change
  useEffect(() => {
    updateContext({
      overlayVisible: Object.values(overlays).some(Boolean),
    });
  }, [overlays, updateContext]);

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

  return (
    <ErrorBoundary>
      <AppShell
        portal={portal}
        username={username}
        isAdmin={isAdmin}
      />

      <HelpOverlay
        visible={showHelp}
        onClose={() => useUiStore.getState().hideOverlay('help')}
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

/**
 * AppShell layout component
 * Main application shell with header, three panes, and footer
 */

import React, { useState } from 'react';
import { Box } from 'ink';
import { HeaderBar } from './HeaderBar.js';
import { Sidebar } from './Sidebar.js';
import { Content } from './Content.js';
import { Inspector } from './Inspector.js';
import { StatusBar } from '../primitives/index.js';
import { sizes, spacing } from '../design/tokens.js';
import { useColorRoles } from '../design/roles.js';
import type { Notification } from '../overlays/index.js';
import { themeManager } from '../themes/manager.js';

export type AppShellProps = {
  initialView?: string;
  portal?: string;
  username?: string;
  isAdmin?: boolean;
  onViewChange?: (view: string) => void;
  notifications?: Notification[];
};

export function AppShell({ 
  initialView = 'home',
  portal,
  username,
  isAdmin,
  onViewChange,
  notifications,
}: AppShellProps) {
  const roles = useColorRoles();
  const [currentView, setCurrentView] = useState(initialView);
  const [recentItems, setRecentItems] = useState<string[]>([]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    onViewChange?.(view);
    
    // Add to recent items
    setRecentItems(prev => {
      const filtered = prev.filter(item => item !== view);
      return [view, ...filtered].slice(0, 10);
    });
  };

  const sampleSelection = currentView !== 'home' ? {
    type: currentView,
    name: `${currentView.charAt(0).toUpperCase() + currentView.slice(1)} Item`,
    id: 'sample-123',
    status: 'online' as const,
    metadata: {
      Created: new Date().toLocaleDateString(),
      Modified: new Date().toLocaleDateString(),
      Type: currentView,
    }
  } : undefined;

  const sampleActions = currentView !== 'home' ? [
    { key: 'e', label: 'Export', description: 'Export selected item' },
    { key: 'd', label: 'Delete', description: 'Delete selected item' },
    { key: 'i', label: 'Inspect', description: 'View details' },
  ] : [];

  return (
    <Box 
      flexDirection="column" 
      height="100%"
      width="100%"
    >
      {/* Header */}
      <HeaderBar 
        portal={portal}
        username={username}
        isAdmin={isAdmin}
      />

      {/* Main content area with three panes */}
      <Box 
        flexDirection="row" 
        flexGrow={1}
        paddingX={spacing.sm}
        paddingTop={spacing.xs}
      >
        {/* Sidebar - 28% */}
        <Box width={`${sizes.sidebar}%`}>
          <Sidebar 
            currentView={currentView}
            recentItems={recentItems}
            onNavigate={handleNavigate}
            notifications={notifications}
          />
        </Box>

        {/* Content - 52% */}
        <Box width={`${sizes.content}%`}>
          <Content currentView={currentView} />
        </Box>

        {/* Inspector - 20% */}
        <Box width={`${sizes.inspector}%`}>
          <Inspector 
            selection={sampleSelection}
            actions={sampleActions}
          />
        </Box>
      </Box>

      {/* Status bar */}
      <StatusBar 
        left={`View: ${currentView}`}
        right={`Theme: ${themeManager.getCurrent().name}`}
      />
    </Box>
  );
}

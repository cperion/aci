/**
 * AppShell layout component
 * Main application shell with Miller columns navigation
 */

import React from 'react';
import { Box } from 'ink';
import { BreadcrumbHeader } from './BreadcrumbHeader.js';
import { MillerColumns } from '../components/MillerColumns.js';
import { NotificationProvider } from '../components/NotificationProvider.js';
import { SearchOverlay } from '../components/SearchOverlay.js';
import { StatusBar } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { selectBreadcrumb, selectScope, selectNoticeCount, selectActiveOverlay } from '../../state/selectors.js';
import { useUiStore } from '../../state/ui.js';
import { themeManager } from '../themes/manager.js';

export type AppShellProps = {
  portal?: string;
  username?: string;
  isAdmin?: boolean;
};

export function AppShell({ 
  portal,
  username,
  isAdmin,
}: AppShellProps) {
  const roles = useColorRoles();
  const breadcrumb = selectBreadcrumb();
  const scope = selectScope();
  const noticeCount = selectNoticeCount();
  const activeOverlay = selectActiveOverlay();
  const { hideOverlay } = useUiStore();

  return (
    <NotificationProvider>
      <Box 
        flexDirection="column" 
        height="100%"
        width="100%"
      >
        {/* Header with breadcrumb */}
        <BreadcrumbHeader 
          scope={scope}
          breadcrumb={breadcrumb}
          portal={portal}
          username={username}
          isAdmin={isAdmin}
          filterActive={false} // TODO: Add filter state tracking
        />

        {/* Miller columns navigation */}
        <Box flexGrow={1}>
          <MillerColumns height="100%" width="100%" />
        </Box>

        {/* Status bar */}
        <StatusBar 
          left={`Scope: ${scope}`}
          right={`Theme: ${themeManager.getCurrent().name}${noticeCount > 0 ? ` · ${noticeCount} notices` : ''}`}
        />

        {/* Overlays */}
        {activeOverlay === 'search' && (
          <SearchOverlay onClose={() => hideOverlay('search')} />
        )}
      </Box>
    </NotificationProvider>
  );
}

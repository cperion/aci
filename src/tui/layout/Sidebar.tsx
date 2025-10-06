/**
 * Sidebar layout component
 * Navigation, auth status, and recents
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Panel, KeyHint } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { themeManager } from '../themes/manager.js';
import { useUiStore } from '../state/ui.js';
import { spacing } from '../design/tokens.js';

export type SidebarProps = {
  currentView?: string;
  recentItems?: string[];
  onNavigate?: (view: string) => void;
};

export function Sidebar({ currentView, recentItems = [], onNavigate }: SidebarProps) {
  const roles = useColorRoles();
  const notices = useUiStore((s) => s.notices);

  const navigationItems = [
    { key: 'h', label: 'Home', id: 'home' },
    { key: 's', label: 'Services', id: 'services' },
    { key: 'u', label: 'Users', id: 'users' },
    { key: 'g', label: 'Groups', id: 'groups' },
    { key: 'i', label: 'Items', id: 'items' },
    { key: 'a', label: 'Admin', id: 'admin' },
  ];

  return (
    <Panel title="Navigation" width="100%" padding="xs">
      <Box flexDirection="column" gap={spacing.xs}>
        {navigationItems.map(item => (
          <Box key={item.id}>
            <KeyHint 
              keyLabel={item.key}
              desc={item.label}
              active={currentView === item.id}
            />

          </Box>
        ))}
      </Box>

      {recentItems.length > 0 && (
        <>
          <Box>
            <Text color={roles.textMuted} bold>Recent</Text>
          </Box>
          <Box flexDirection="column" gap={spacing.xs}>
            {recentItems.slice(0, 5).map((item, index) => (
              <Text key={index} color={roles.textMuted} dimColor>
                {item}
              </Text>
            ))}
          </Box>
        </>
      )}

      {notices.length > 0 && (
        <>
          <Box>
            <Text color={roles.textMuted} bold>Notifications</Text>
          </Box>
          <Box flexDirection="column" gap={spacing.xs}>
            {notices.slice(0, 5).map((n) => (
              <Text key={n.id}>
                <Text color={
                  n.level === 'success' ? roles.success :
                  n.level === 'warn'    ? roles.warning :
                  n.level === 'error'   ? roles.danger  : roles.info
                }>● </Text>
                <Text color={roles.text}>{n.text}</Text>
              </Text>
            ))}
          </Box>
        </>
      )}

      <Box>
        <Text color={roles.textMuted}>
          <Text bold>Theme:</Text> {themeManager.getCurrent().name}
        </Text>
        <Text color={roles.textMuted} dimColor>
          [ ] prev [ ] next [ ] random
        </Text>
      </Box>
    </Panel>
  );
}

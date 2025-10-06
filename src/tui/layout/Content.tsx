/**
 * Content layout component
 * Renders the current view with proper context
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';

export type ContentProps = {
  currentView?: string;
  children?: React.ReactNode;
};

export function Content({ currentView = 'home', children }: ContentProps) {
  const roles = useColorRoles();

  if (children) {
    return <>{children}</>;
  }

  // Default Home view
  return (
    <Panel title="Welcome to ACI" width="100%" padding="xs">
      <Box flexDirection="column" gap={spacing.xs}>
        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.text}>
            ArcGIS Command Interface
          </Text>
          <Text color={roles.textMuted}>
            Interactive terminal UI for ArcGIS Enterprise and Online operations
          </Text>
        </Box>

        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.accent}>Quick Start</Text>
          <Text color={roles.textMuted}>
            1. Press <Text color={roles.accent}>l</Text> to login to your portal
          </Text>
          <Text color={roles.textMuted}>
            2. Press <Text color={roles.accent}>s</Text> to browse services
          </Text>
          <Text color={roles.textMuted}>
            3. Press <Text color={roles.accent}>?</Text> for help and shortcuts
          </Text>
        </Box>

        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.accent}>Navigation</Text>
          <Text color={roles.textMuted}>
            Use sidebar keys or <Text color={roles.accent}>p</Text> for command palette
          </Text>
        </Box>
      </Box>
    </Panel>
  );
}

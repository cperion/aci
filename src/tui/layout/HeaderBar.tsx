/**
 * HeaderBar layout component
 * Displays ACI branding, environment info, and auth indicators
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';
import { Separator } from '../primitives/Separator.js';

export type HeaderBarProps = {
  portal?: string;
  username?: string;
  isAdmin?: boolean;
};

export function HeaderBar({ portal, username, isAdmin }: HeaderBarProps) {
  const roles = useColorRoles();

  return (
    <Box flexDirection="column" width="100%">
      <Box
        paddingX={spacing.sm}
        paddingY={spacing.xs}
        justifyContent="space-between"
        width="100%"
      >
        <Box flexDirection="row" alignItems="center">
          <Text bold color={roles.accent}>ACI</Text>
          <Text color={roles.textMuted}> · ArcGIS Command Interface</Text>
        </Box>
        
        <Box flexDirection="row" alignItems="center">
          {portal && (
            <Text color={roles.textMuted}>
              portal: <Text color={roles.text}>{portal}</Text>
            </Text>
          )}
          {username && (
            <>
              <Text color={roles.textMuted}> · </Text>
              <Text color={roles.textMuted}>
                user: <Text color={roles.text}>{username}</Text>
                {isAdmin && (
                  <Text color={roles.accent} bold> (admin)</Text>
                )}
              </Text>
            </>
          )}
          <Text color={roles.textMuted}> · [?] Help</Text>
        </Box>
      </Box>
      <Separator />
    </Box>
  );
}

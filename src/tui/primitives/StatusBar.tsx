/**
 * StatusBar primitive component
 * Single-line footer for status and hints
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';
import { Separator } from './Separator.js';

export type StatusBarProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
};

export function StatusBar({ left, right }: StatusBarProps) {
  const roles = useColorRoles();

  return (
    <Box flexDirection="column" width="100%">
      <Separator />
      <Box
        paddingX={spacing.sm}
        paddingY={spacing.xs}
        justifyContent="space-between"
        width="100%"
      >
        <Box flexDirection="row">
          <Text color={roles.textMuted}>{left}</Text>
        </Box>
        {right && (
          <Box flexDirection="row">
            <Text color={roles.textMuted}>{right}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Separator primitive component
 * Horizontal or vertical lines using role border colors
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useColorRoles } from '../design/roles.js';

export type SeparatorProps = {
  direction?: 'horizontal' | 'vertical';
  label?: string;
  length?: number;
};

export function Separator({
  direction = 'horizontal',
  label,
  length,
}: SeparatorProps) {
  const roles = useColorRoles();

  if (direction === 'vertical') {
    return (
      <Box flexDirection="column">
        <Text color={roles.borderSubtle}>│</Text>
        {label && (
          <Text color={roles.textMuted} dimColor>
            {'\n' + label}
          </Text>
        )}
      </Box>
    );
  }

  // Horizontal separator
  const cols = typeof process !== 'undefined' && process.stdout?.columns
    ? process.stdout.columns
    : 80;
  const total = length ?? cols;
  const line = '─'.repeat(Math.max(1, Math.min(total, 500)));

  return (
    <Box flexDirection="row" width="100%">
      {label ? (
        <>
          <Text color={roles.borderSubtle}>{line}</Text>
          <Text color={roles.textMuted}> {label} </Text>
          <Text color={roles.borderSubtle}>{line}</Text>
        </>
      ) : (
        <Text color={roles.borderSubtle}>{line}</Text>
      )}
    </Box>
  );
}

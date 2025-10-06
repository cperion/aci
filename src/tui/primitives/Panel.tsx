/**
 * Panel primitive component
 * A titled container with optional footer/actions
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';
import type { SpacingKey } from '../design/tokens.js';

export type PanelProps = {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: SpacingKey;
  width?: number | string;
  height?: number | string;
  border?: boolean;
};

export function Panel({
  title,
  footer,
  children,
  padding = 'xs',
  width = '100%',
  height,
  border = false,
}: PanelProps) {
  const roles = useColorRoles();
  const paddingValue = spacing[padding];

  return (
    <Box width={width} height={height} flexDirection="column">
      {title && (
        <Box paddingX={paddingValue} paddingY={paddingValue}>
          <Text bold color={roles.text}>{title}</Text>
        </Box>
      )}

      <Box paddingX={paddingValue} paddingY={paddingValue} flexDirection="column" flexGrow={1}>
        {children}
      </Box>

      {footer && (
        <Box paddingX={paddingValue} paddingY={paddingValue}>
          {footer}
        </Box>
      )}
    </Box>
  );
}

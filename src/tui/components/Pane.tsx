import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import type { PaneProps } from '../types.js';

export function Pane({ title, children, isActive = false, width = 25 }: PaneProps) {
  const { colors } = useTheme();
  
  // Create vertical separators using borderLeft for middle and right panes
  const showLeftBorder = width === 50 || width === 20; // Content and Inspection panes
  
  return (
    <Box
      flexDirection="column"
      width={`${width}%`}
      paddingX={1}
      borderLeft={showLeftBorder}
      borderColor={colors.separators}
    >
      <Box 
        borderBottom 
        paddingBottom={1} 
        marginBottom={1}
        borderColor={colors.separators}
        paddingX={isActive ? 1 : 0}
      >
        <Text bold color={isActive ? colors.highlights : colors.labels}>
          {title}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {children}
      </Box>
    </Box>
  );
}
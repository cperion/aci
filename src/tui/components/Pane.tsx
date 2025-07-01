import React from 'react';
import { Box, Text } from 'ink';
import type { PaneProps } from '../types.js';

export function Pane({ title, children, isActive = false, width = 25 }: PaneProps) {
  return (
    <Box
      flexDirection="column"
      width={`${width}%`}
      paddingX={1}
      borderStyle="single"
      borderColor={isActive ? "blue" : "gray"}
    >
      <Box borderBottom paddingBottom={1} marginBottom={1}>
        <Text bold color={isActive ? "blue" : "gray"}>
          {title}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}
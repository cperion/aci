import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import type { KeyAction, ViewMode } from '../keyboard/keymap-registry.js';

export type ActionFooterProps = {
  shortcuts: KeyAction[];
  mode: ViewMode;
  selectedCount?: number;
};

export function ActionFooter({ shortcuts, mode, selectedCount = 0 }: ActionFooterProps) {
  const { colors } = useTheme();

  // Filter and prioritize shortcuts based on mode and selection
  const displayShortcuts = shortcuts
    .filter(shortcut => {
      if (!shortcut.mode || shortcut.mode.includes(mode)) {
        return true;
      }
      return false;
    })
    .slice(0, 6); // Limit to prevent overflow

  if (displayShortcuts.length === 0) {
    return null;
  }

  return (
    <Box
      justifyContent="space-between"
      paddingX={2}
      paddingY={1}
      borderColor={colors.separators}
      borderTop
    >
      <Box gap={2}>
        {displayShortcuts.map((shortcut) => (
          <Text key={shortcut.key} color={colors.primaryText}>
            <Text color={colors.highlights}>[{shortcut.key}]</Text> {shortcut.label}
          </Text>
        ))}
      </Box>
      
      <Box gap={2}>
        {selectedCount > 0 && (
          <Text color={colors.selections}>
            {selectedCount} selected
          </Text>
        )}
        <Text color={colors.metadata}>
          Mode: <Text color={colors.highlights}>{mode}</Text>
        </Text>
      </Box>
    </Box>
  );
}
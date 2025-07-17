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

  // Memoize filtering and prioritization to avoid re-computation on every render
  const displayShortcuts = React.useMemo(() => {
    return shortcuts
      .filter(shortcut => {
        // Safe mode checking with null guards
        if (!shortcut.mode || shortcut.mode.includes(mode)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => (a.priority || 5) - (b.priority || 5))
      .slice(0, 6); // Limit to prevent overflow
  }, [shortcuts, mode]);

  if (displayShortcuts.length === 0) {
    return null;
  }

  const hasMoreShortcuts = shortcuts.length > displayShortcuts.length;

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
        {hasMoreShortcuts && (
          <Text color={colors.metadata}>
            +{shortcuts.length - displayShortcuts.length} more
          </Text>
        )}
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
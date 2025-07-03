import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import type { ViewMode } from '../keyboard/keymap-registry.js';

export type ModeIndicatorProps = {
  mode: ViewMode;
  selectedCount?: number;
  visible?: boolean;
};

export function ModeIndicator({ mode, selectedCount = 0, visible = true }: ModeIndicatorProps) {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  const getModeColor = (currentMode: ViewMode): string => {
    switch (currentMode) {
      case 'NAVIGATION':
        return colors.success;
      case 'SELECTION':
        return colors.selections;
      case 'INPUT':
        return colors.warnings;
      case 'SEARCH':
        return colors.highlights;
      default:
        return colors.metadata;
    }
  };

  const getModeSymbol = (currentMode: ViewMode): string => {
    switch (currentMode) {
      case 'NAVIGATION':
        return '→';
      case 'SELECTION':
        return '◉';
      case 'INPUT':
        return '✎';
      case 'SEARCH':
        return '🔍';
      default:
        return '•';
    }
  };

  const getModeDescription = (currentMode: ViewMode): string => {
    switch (currentMode) {
      case 'NAVIGATION':
        return 'Navigate with j/k, select with Space';
      case 'SELECTION':
        return 'Bulk operations available';
      case 'INPUT':
        return 'Text input mode';
      case 'SEARCH':
        return 'Search mode active';
      default:
        return '';
    }
  };

  const modeColor = getModeColor(mode);
  const symbol = getModeSymbol(mode);
  const description = getModeDescription(mode);

  return (
    <Box gap={2} alignItems="center">
      <Text color={modeColor} bold>
        {symbol} {mode.toUpperCase()}
      </Text>
      
      {selectedCount > 0 && (
        <Text color={colors.selections}>
          ({selectedCount} selected)
        </Text>
      )}
      
      {description && (
        <Text color={colors.metadata} italic>
          {description}
        </Text>
      )}
    </Box>
  );
}
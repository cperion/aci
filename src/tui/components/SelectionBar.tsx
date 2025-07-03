import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

export type SelectionBarProps = {
  selectedItems: string[];
  onClearSelection: () => void;
  bulkActions?: Array<{
    key: string;
    label: string;
    action: string;
  }>;
};

export function SelectionBar({ selectedItems, onClearSelection, bulkActions = [] }: SelectionBarProps) {
  const { colors } = useTheme();

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <Box
      paddingX={2}
      paddingY={1}
      borderColor={colors.selections}
      borderBottom
      justifyContent="space-between"
    >
      <Box>
        <Text color={colors.selections} bold>
          {selectedItems.length} items selected
        </Text>
      </Box>
      
      <Box gap={2}>
        {bulkActions.map((action) => (
          <Text key={action.key} color={colors.primaryText}>
            <Text color={colors.highlights}>[{action.key}]</Text> {action.label}
          </Text>
        ))}
        <Text color={colors.primaryText}>
          <Text color={colors.warnings}>[Esc]</Text> Clear
        </Text>
      </Box>
    </Box>
  );
}
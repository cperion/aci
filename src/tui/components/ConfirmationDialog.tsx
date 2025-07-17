import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

export type ConfirmationDialogProps = {
  title: string;
  message: string;
  itemCount?: number;
  itemType?: string;
  confirmKey?: string;
  cancelKey?: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
  destructive?: boolean;
};

export function ConfirmationDialog({
  title,
  message,
  itemCount,
  itemType,
  confirmKey = 'y',
  cancelKey = 'n',
  onConfirm,
  onCancel,
  visible,
  destructive = false
}: ConfirmationDialogProps) {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  const warningColor = destructive ? colors.errors : colors.warnings;
  const confirmColor = destructive ? colors.errors : colors.success;

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      minHeight="100%"
    >
      {/* Dialog */}
      <Box
        width={60}
        borderColor={warningColor}
        borderStyle="double"
        paddingX={3}
        paddingY={2}
        flexDirection="column"
        gap={1}
      >
        <Text bold color={warningColor}>
          {title}
        </Text>
        
        <Text color={colors.primaryText}>
          {message}
        </Text>
        
        {itemCount && itemType && (
          <Text color={colors.metadata}>
            This will affect {itemCount} {itemType}.
          </Text>
        )}
        
        <Box marginTop={1} gap={4} justifyContent="center">
          <Text color={colors.primaryText}>
            <Text color={confirmColor} bold>[{confirmKey}]</Text> Confirm
          </Text>
          <Text color={colors.primaryText}>
            <Text color={colors.metadata} bold>[{cancelKey}]</Text> Cancel
          </Text>
          <Text color={colors.primaryText}>
            <Text color={colors.metadata} bold>[Esc]</Text> Cancel
          </Text>
        </Box>
        
        {destructive && (
          <Box marginTop={1} justifyContent="center">
            <Text color={colors.errors} italic>
              ⚠ This action cannot be undone
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
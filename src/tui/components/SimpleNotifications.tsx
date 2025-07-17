import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import { useNotification } from '../../hooks/use-notification.js';

interface SimpleNotificationsProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export function SimpleNotifications({ position = 'top-right' }: SimpleNotificationsProps) {
  const { colors } = useTheme();
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return colors.success;
      case 'error': return colors.errors;
      case 'warning': return colors.warnings;
      case 'info': return colors.metadata;
      default: return colors.primaryText;
    }
  };

  const positionStyles = {
    'top-right': { position: 'absolute' as const, top: 1, right: 1 },
    'bottom-right': { position: 'absolute' as const, bottom: 1, right: 1 },
    'top-left': { position: 'absolute' as const, top: 1, left: 1 },
    'bottom-left': { position: 'absolute' as const, bottom: 1, left: 1 }
  };

  return (
    <Box
      flexDirection="column"
      width={40}
      {...positionStyles[position]}
    >
      {notifications.map((notification: any) => (
        <Box
          key={notification.id}
          borderStyle="round"
          borderColor={getColor(notification.type)}
          paddingX={1}
          marginBottom={1}
        >
          <Text color={getColor(notification.type)} bold>
            {getIcon(notification.type)} {notification.message}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
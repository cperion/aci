import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import { useNotification } from '../../hooks/use-notification.js';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
    duration?: number;
  };
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { colors } = useTheme();
  
  const getNotificationColor = (type: NotificationItemProps['notification']['type']) => {
    switch (type) {
      case 'success': return colors.success;
      case 'error': return colors.errors;
      case 'warning': return colors.warnings;
      case 'info': return colors.metadata;
      default: return colors.primaryText;
    }
  };

  const getIcon = (type: NotificationItemProps['notification']['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  useEffect(() => {
    // Auto-dismiss after duration if specified
    if (notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  return (
    <Box
      borderStyle="round"
      borderColor={getNotificationColor(notification.type)}
      paddingX={1}
      paddingY={0}
      marginBottom={1}
    >
      <Box flexDirection="column" width="100%">
        {notification.title && (
          <Box>
            <Text color={getNotificationColor(notification.type)} bold>
              {getIcon(notification.type)} {notification.title}
            </Text>
          </Box>
        )}
        <Box>
          <Text color={colors.primaryText}>
            {notification.message}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

interface NotificationSystemProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  maxNotifications?: number;
}

export function NotificationSystem({ 
  position = 'top-right',
  maxNotifications = 5 
}: NotificationSystemProps) {
  const { notifications, removeNotification } = useNotification();
  
  // Limit the number of notifications displayed
  const displayNotifications = notifications.slice(-maxNotifications);

  if (displayNotifications.length === 0) {
    return null;
  }

  // Position styling
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
      {displayNotifications.map((notification: any) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
        />
      ))}
    </Box>
  );
}

/**
 * Hook for easy notification management
 * Re-exports the useNotification hook for convenience
 */
export { useNotification as useNotifications } from '../../hooks/use-notification.js';
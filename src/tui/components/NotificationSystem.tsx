import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import { OptimisticUIService, type NotificationMessage } from '../services/optimistic-ui.js';

interface NotificationItemProps {
  notification: NotificationMessage;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { colors } = useTheme();
  
  const getNotificationColor = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'success': return colors.successes;
      case 'error': return colors.errors;
      case 'warning': return colors.warnings;
      case 'info': return colors.metadata;
      default: return colors.primaryText;
    }
  };

  const getIcon = (type: NotificationMessage['type']) => {
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
        <Box>
          <Text color={getNotificationColor(notification.type)} bold>
            {getIcon(notification.type)} {notification.title}
          </Text>
        </Box>
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
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  
  // Use singleton reference to prevent re-render loops
  const optimisticUI = React.useMemo(() => OptimisticUIService.getInstance(), []);

  useEffect(() => {
    // Subscribe to notification changes
    const unsubscribe = optimisticUI.onNotificationsChange((newNotifications) => {
      // Limit the number of notifications displayed
      setNotifications(newNotifications.slice(-maxNotifications));
    });

    // Get initial notifications
    setNotifications(optimisticUI.getNotifications().slice(-maxNotifications));

    return unsubscribe;
  }, [maxNotifications, optimisticUI]);

  const handleDismiss = (id: string) => {
    optimisticUI.removeNotification(id);
  };

  if (notifications.length === 0) {
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
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </Box>
  );
}

/**
 * Hook for easy notification management
 */
export function useNotifications() {
  const optimisticUI = OptimisticUIService.getInstance();

  const showSuccess = (title: string, message: string, duration?: number) => {
    return optimisticUI.showNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    return optimisticUI.showNotification({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    return optimisticUI.showNotification({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return optimisticUI.showNotification({ type: 'info', title, message, duration });
  };

  const clearAll = () => {
    optimisticUI.clearNotifications();
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };
}
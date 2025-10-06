/**
 * NotificationsOverlay component
 * Displays notification queue with timeouts and positioning
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';

export type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  timeout?: number;
  timestamp: Date;
};

export type NotificationsOverlayProps = {
  notifications: Notification[];
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
};

export function NotificationsOverlay({ 
  notifications, 
  maxVisible = 5,
  position = 'top-right'
}: NotificationsOverlayProps) {
  const roles = useColorRoles();
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const visible = notifications.slice(0, maxVisible);
    setVisibleNotifications(visible);
  }, [notifications, maxVisible]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return roles.success;
      case 'warning': return roles.warning;
      case 'error': return roles.danger;
      case 'info':
      default: return roles.info;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { 
          flexDirection: 'column' as const,
          alignItems: 'flex-start' as const
        };
      case 'bottom-right':
        return { 
          flexDirection: 'column' as const,
          alignItems: 'flex-end' as const
        };
      case 'bottom-left':
        return { 
          flexDirection: 'column' as const,
          alignItems: 'flex-start' as const
        };
      case 'top-right':
      default:
        return { 
          flexDirection: 'column' as const,
          alignItems: 'flex-end' as const
        };
    }
  };

  return (
    <Box {...getPositionStyles()} gap={spacing.xs}>
      {visibleNotifications.map((notification) => (
        <Box
          key={notification.id}
          borderStyle="single"
          borderColor={getNotificationColor(notification.type)}
          paddingX={spacing.sm}
          paddingY={1}
          flexDirection="column"
          minWidth={40}
        >
          {notification.title && (
            <Text bold color={getNotificationColor(notification.type)}>
              {notification.title}
            </Text>
          )}
          <Text color={roles.text}>
            {notification.message}
          </Text>
          <Text color={roles.textMuted} dimColor>
            {formatTime(notification.timestamp)}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

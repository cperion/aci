/**
 * Notification provider component
 * Manages notification display and auto-dismissal
 */

import React, { useEffect } from 'react';
import { Box } from 'ink';
import { useUiStore } from '../state/ui';
import { NotificationsOverlay } from '../overlays/NotificationsOverlay';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notices } = useUiStore();

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {children}
      
      {/* Notifications overlay */}
      <NotificationsOverlay
        notifications={notices.map((notice: any) => ({
          id: notice.id,
          type: notice.level,
          message: notice.text,
          timestamp: new Date(notice.ts),
        }))}
        position="top-right"
        maxVisible={3}
      />
    </Box>
  );
};
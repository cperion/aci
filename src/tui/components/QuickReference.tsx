import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

interface QuickReferenceProps {
  visible: boolean;
  onClose: () => void;
  viewId: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    key: string;
    action: string;
  }>;
}

export function QuickReference({ visible, onClose, viewId }: QuickReferenceProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  // Define quick reference cards for each view
  const referenceCards: Record<string, ShortcutGroup[]> = {
    home: [
      {
        title: 'Navigation',
        shortcuts: [
          { key: 'l', action: 'Login' },
          { key: 's', action: 'Services' },
          { key: 'u', action: 'Users' },
          { key: 'g', action: 'Groups' },
          { key: 'i', action: 'Items' },
          { key: 'a', action: 'Admin' }
        ]
      },
      {
        title: 'Global',
        shortcuts: [
          { key: '?', action: 'Help' },
          { key: 'q', action: 'Quit' },
          { key: ':', action: 'Command' },
          { key: 'Ctrl+r', action: 'Refresh' }
        ]
      }
    ],
    services: [
      {
        title: 'Service Actions',
        shortcuts: [
          { key: 'd', action: 'Delete' },
          { key: 'r', action: 'Restart' },
          { key: 'i', action: 'Inspect' },
          { key: 'e', action: 'Edit' },
          { key: 's', action: 'Search' }
        ]
      },
      {
        title: 'Selection',
        shortcuts: [
          { key: 'Space', action: 'Select' },
          { key: 'D', action: 'Bulk Delete' },
          { key: 'R', action: 'Bulk Restart' },
          { key: 'Esc', action: 'Clear' }
        ]
      },
      {
        title: 'Navigation',
        shortcuts: [
          { key: 'j/↓', action: 'Down' },
          { key: 'k/↑', action: 'Up' },
          { key: 'f', action: 'Filter' },
          { key: 'Ctrl+r', action: 'Refresh' }
        ]
      }
    ],
    users: [
      {
        title: 'User Actions',
        shortcuts: [
          { key: 'd', action: 'Delete User' },
          { key: 'e', action: 'Edit User' },
          { key: 'p', action: 'Permissions' },
          { key: 'g', action: 'Groups' },
          { key: 'r', action: 'Reset Password' }
        ]
      },
      {
        title: 'Management',
        shortcuts: [
          { key: 'c', action: 'Create User' },
          { key: 's', action: 'Search' },
          { key: 'f', action: 'Filter' },
          { key: 'Space', action: 'Select' }
        ]
      }
    ],
    groups: [
      {
        title: 'Group Actions',
        shortcuts: [
          { key: 'd', action: 'Delete Group' },
          { key: 'e', action: 'Edit Group' },
          { key: 'm', action: 'Members' },
          { key: 'p', action: 'Permissions' },
          { key: 'c', action: 'Create' }
        ]
      }
    ],
    items: [
      {
        title: 'Item Actions',
        shortcuts: [
          { key: 'd', action: 'Delete Item' },
          { key: 'e', action: 'Edit Item' },
          { key: 'v', action: 'View Details' },
          { key: 's', action: 'Share' },
          { key: 'o', action: 'Open in Browser' }
        ]
      }
    ],
    analytics: [
      {
        title: 'Analysis',
        shortcuts: [
          { key: 'a', action: 'Run Analysis' },
          { key: 'e', action: 'Export Results' },
          { key: 'v', action: 'Visualize' },
          { key: 's', action: 'Save Query' },
          { key: 'l', action: 'Load Query' }
        ]
      }
    ],
    admin: [
      {
        title: 'Admin Actions',
        shortcuts: [
          { key: 's', action: 'Services' },
          { key: 'l', action: 'Logs' },
          { key: 'h', action: 'Health' },
          { key: 'r', action: 'Restart' }
        ]
      }
    ]
  };

  const currentReference = referenceCards[viewId] || referenceCards.home;

  return (
    <Box
      width={60}
      borderStyle="round"
      borderColor={colors.highlights}
      flexDirection="column"
      padding={1}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color={colors.highlights}>
          Quick Reference - {viewId.charAt(0).toUpperCase() + viewId.slice(1)}
        </Text>
        <Text color={colors.metadata}>
          [Press ? for full help]
        </Text>
      </Box>

      {/* Shortcut groups */}
      <Box flexDirection="row" gap={2}>
        {currentReference?.map((group, groupIndex) => (
          <Box key={group.title} flexDirection="column" flexGrow={1}>
            <Box marginBottom={1}>
              <Text bold color={colors.features}>
                {group.title}
              </Text>
            </Box>
            {group.shortcuts.map((shortcut) => (
              <Box key={shortcut.key} marginBottom={0}>
                <Box width={8}>
                  <Text color={colors.highlights} bold>
                    {shortcut.key}
                  </Text>
                </Box>
                <Text color={colors.primaryText}>
                  {shortcut.action}
                </Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop paddingTop={1}>
        <Text color={colors.metadata} dimColor>
          Press any key to dismiss
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Hook for quick reference management
 */
export function useQuickReference() {
  const [isVisible, setIsVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef(true);

  const showReference = React.useCallback((autoHide = true) => {
    if (!isMountedRef.current) return;
    
    // Clear any existing timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
    
    setIsVisible(true);
    
    if (autoHide) {
      // Auto-hide after 5 seconds with unmount guard
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setIsVisible(false);
          setAutoHideTimer(null);
        }
      }, 5000);
      
      setAutoHideTimer(timer);
    }
  }, [autoHideTimer]);

  const hideReference = React.useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsVisible(false);
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
  }, [autoHideTimer]);

  React.useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [autoHideTimer]);

  return {
    isVisible,
    showReference,
    hideReference
  };
}
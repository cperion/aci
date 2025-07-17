import React from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../../hooks/use-navigation.js';
import { useAuth } from '../../hooks/use-auth.js';
import { useTheme } from '../themes/theme-manager.js';
import { Pane } from './Pane.js';
import { ActionFooter } from './ActionFooter.js';

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentView } = useNavigation();
  const { authState } = useAuth();
  const { portal: portalAuth, admin: adminAuth } = authState;
  const { colors } = useTheme();
  
  // Calculate selected items for footer - simplified for now
  const selectedItems: string[] = [];
  
  // Static shortcuts for now - can be enhanced later
  const getBasicShortcuts = () => [
    { key: 'l', label: 'Login', action: 'login' },
    { key: 's', label: 'Services', action: 'services' },
    { key: 'u', label: 'Users', action: 'users' },
    { key: '?', label: 'Help', action: 'help' }
  ];
  
  // Build breadcrumb from navigation state
  const breadcrumb = currentView;
  
  // Auth status indicators
  const portalStatus = portalAuth ? "P:✓" : "P:○";
  const adminStatus = adminAuth ? "A:✓" : "A:○";
  
  return (
    <Box flexDirection="column" height="100%">
      {/* Header bar */}
      <Box 
        justifyContent="space-between" 
        paddingX={2} 
        paddingY={1}
        borderColor={colors.separators}
        borderBottom
      >
        <Text bold color={colors.portals}>
          ACI [PRODUCTION] ─ 
          <Text color={portalAuth ? colors.success : colors.warnings}> {portalStatus}</Text>
          <Text color={adminAuth ? colors.success : colors.warnings}> {adminStatus}</Text>
        </Text>
        <Text color={colors.metadata}>[?] Help</Text>
      </Box>
      
      {/* Main three-pane unified layout with shared borders */}
      <Box flexGrow={1} flexDirection="row" borderStyle="single" borderColor={colors.separators}>
        {children}
      </Box>
      
      {/* ActionFooter with basic shortcuts */}
      <ActionFooter
        shortcuts={getBasicShortcuts()}
        mode="NAVIGATION"
        selectedCount={selectedItems.length}
      />
    </Box>
  );
}
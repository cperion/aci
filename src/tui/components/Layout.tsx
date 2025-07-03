import React from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../hooks/navigation.js';
import { useTheme } from '../themes/theme-manager.js';
import { useKeyboard } from '../hooks/keyboard.js';
import { Pane } from './Pane.js';
import { ActionFooter } from './ActionFooter.js';

export function Layout({ children }: { children: React.ReactNode }) {
  const { state } = useNavigation();
  const { colors } = useTheme();
  const { currentMode, selectedItems, getAvailableShortcuts } = useKeyboard();
  
  // Build breadcrumb from navigation state
  const breadcrumb = state.previousView 
    ? `${state.previousView} > ${state.currentView.title}`
    : state.currentView.title;
  
  // Auth status indicators
  const portalStatus = state.authStatus.portal ? "P:✓" : "P:○";
  const adminStatus = state.authStatus.admin ? "A:✓" : "A:○";
  
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
          ACI [{state.environment.toUpperCase()}] ─ 
          <Text color={state.authStatus.portal ? colors.success : colors.warnings}> {portalStatus}</Text>
          <Text color={state.authStatus.admin ? colors.success : colors.warnings}> {adminStatus}</Text>
        </Text>
        <Text color={colors.metadata}>[?] Help</Text>
      </Box>
      
      {/* Main three-pane layout */}
      <Box flexGrow={1}>
        {children}
      </Box>
      
      {/* ActionFooter with dynamic shortcuts */}
      <ActionFooter
        shortcuts={getAvailableShortcuts(state.currentView.id)}
        mode={currentMode}
        selectedCount={selectedItems.length}
      />
    </Box>
  );
}
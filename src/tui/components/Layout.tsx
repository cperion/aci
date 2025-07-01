import React from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../hooks/navigation.js';
import { Pane } from './Pane.js';

export function Layout({ children }: { children: React.ReactNode }) {
  const { state } = useNavigation();
  
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
      <Box justifyContent="space-between" paddingX={2} borderBottom>
        <Text bold color="blue">
          ACI [{state.environment.toUpperCase()}] ─ {portalStatus} {adminStatus}
        </Text>
        <Text dimColor>[?] Help</Text>
      </Box>
      
      {/* Main three-pane layout */}
      <Box flexGrow={1}>
        {children}
      </Box>
      
      {/* Footer with navigation hints */}
      <Box justifyContent="space-between" paddingX={2} borderTop>
        <Text dimColor>
          [NAV HINTS] {'>'}  {breadcrumb}
        </Text>
        <Text dimColor>[⣟]</Text>
      </Box>
    </Box>
  );
}
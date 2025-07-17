import React from 'react';
import { Box, Text } from 'ink';
import { useAuth } from '../../../hooks/use-auth.js';
import { useTheme } from '../../themes/theme-manager.js';

export function HomeView() {
  const { authState } = useAuth();
  const { portal: portalAuth } = authState;
  const { colors } = useTheme();
  
  return (
    <Box flexDirection="column" gap={1} padding={2}>
      <Text bold color={colors.portals}>Welcome to ACI TUI</Text>
      <Text color={colors.metadata}>Enterprise ArcGIS Command Line Interface</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.highlights}>Getting Started</Text>
        <Text color={colors.primaryText}>• Use the <Text color={colors.highlights}>Navigation pane</Text> (left) for quick access</Text>
        <Text color={colors.primaryText}>• All keyboard shortcuts are shown in the navigation area</Text>
        <Text color={colors.primaryText}>• Connection status is always visible in the left pane</Text>
        <Text color={colors.primaryText}>• Recent items appear automatically as you work</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.highlights}>Next Steps</Text>
        {!portalAuth ? (
          <Text color={colors.warnings}>→ Press <Text color={colors.portals}>l</Text> to authenticate with your portal</Text>
        ) : (
          <Text color={colors.success}>→ You're connected! Try <Text color={colors.servers}>s</Text> for services or <Text color={colors.users}>u</Text> for users</Text>
        )}
        <Text color={colors.primaryText}>→ Press <Text color={colors.metadata}>?</Text> for detailed help anytime</Text>
        <Text color={colors.primaryText}>→ Use <Text color={colors.metadata}>Esc</Text> to navigate back</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.highlights}>Workflow Philosophy</Text>
        <Text color={colors.metadata}>Left: Navigate & Access | Center: Work & Content | Right: Inspect & Act</Text>
      </Box>
    </Box>
  );
}
import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { useNavigation } from '../../hooks/navigation.js';
import { useKeyboard } from '../../hooks/keyboard.js';
import { useTheme } from '../../themes/theme-manager.js';

export function HomeView() {
  const { navigate, state } = useNavigation();
  const { colors } = useTheme();
  const { registerActionHandler } = useKeyboard();
  
  // Register action handlers for this view
  useEffect(() => {
    const cleanupFunctions = [
      registerActionHandler('navigateToLogin', () => navigate('login', 'Authentication')),
      registerActionHandler('navigateToServices', () => navigate('services', 'Service Browser')),
      registerActionHandler('navigateToUsers', () => navigate('users', 'User Management')),
      registerActionHandler('navigateToGroups', () => navigate('groups', 'Group Management')),
      registerActionHandler('navigateToItems', () => navigate('items', 'Item Management')),
      registerActionHandler('navigateToAdmin', () => navigate('admin', 'Server Administration')),
      registerActionHandler('navigateToInsights', () => navigate('insights', 'Enterprise Insights')),
      registerActionHandler('navigateToAnalytics', () => navigate('analytics', 'Advanced Analytics')),
      registerActionHandler('navigateToDatastores', () => navigate('datastores', 'Datastore Management')),
      registerActionHandler('quit', () => process.exit(0))
    ];
    
    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [navigate, registerActionHandler]);
  
  return (
    <Box flexDirection="column" gap={1} padding={2}>
      <Text bold color={colors.portals}>Welcome to ACI TUI</Text>
      <Text color={colors.metadata}>Enterprise ArcGIS Command Line Interface</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.highlights}>Quick Actions:</Text>
        <Text color={colors.primaryText}>  <Text color={colors.portals}>l</Text> - Login / Authentication</Text>
        <Text color={colors.primaryText}>  <Text color={colors.servers}>s</Text> - Browse Services</Text>
        <Text color={colors.primaryText}>  <Text color={colors.users}>u</Text> - User Management</Text>
        <Text color={colors.primaryText}>  <Text color={colors.users}>g</Text> - Group Management</Text>
        <Text color={colors.primaryText}>  <Text color={colors.features}>i</Text> - Item Management</Text>
        <Text color={colors.primaryText}>  <Text color={colors.warnings}>a</Text> - Server Administration</Text>
        <Text color={colors.primaryText}>  <Text color={colors.features}>n</Text> - Enterprise Insights</Text>
        <Text color={colors.primaryText}>  <Text color={colors.selections}>t</Text> - Advanced Analytics</Text>
        <Text color={colors.primaryText}>  <Text color={colors.servers}>d</Text> - Datastore Management</Text>
        <Text color={colors.primaryText}>  <Text color={colors.errors}>q</Text> - Quit</Text>
      </Box>
      
      {/* Show current auth status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.highlights}>Current Status:</Text>
        <Text color={colors.primaryText}>Portal: {state.authStatus.portal ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Not authenticated</Text>
        }</Text>
        <Text color={colors.primaryText}>Admin: {state.authStatus.admin ? 
          <Text color={colors.success}>✓ Connected</Text> : 
          <Text color={colors.warnings}>○ Not authenticated</Text>
        }</Text>
      </Box>
    </Box>
  );
}
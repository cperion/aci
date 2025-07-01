import React from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { useNavigation } from '../../hooks/navigation.js';

export function HomeView() {
  const { navigate, state } = useNavigation();
  
  useInput((input, key) => {
    if (key.return) {
      return;
    }
    
    // Navigation shortcuts
    switch (input.toLowerCase()) {
      case 'l':
        navigate('login', 'Authentication');
        break;
      case 's':
        navigate('services', 'Service Browser');
        break;
      case 'u':
        navigate('users', 'User Management');
        break;
      case 'q':
        process.exit(0);
        break;
    }
  });
  
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">Welcome to ACI TUI</Text>
      <Text dimColor>Enterprise ArcGIS Command Line Interface</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold>Quick Actions:</Text>
        <Text>  <Text color="cyan">l</Text> - Login / Authentication</Text>
        <Text>  <Text color="cyan">s</Text> - Browse Services</Text>
        <Text>  <Text color="cyan">u</Text> - User Management</Text>
        <Text>  <Text color="cyan">q</Text> - Quit</Text>
      </Box>
      
      {/* Show current auth status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Current Status:</Text>
        <Text>Portal: {state.authStatus.portal ? 
          <Text color="green">✓ Connected</Text> : 
          <Text color="yellow">○ Not authenticated</Text>
        }</Text>
        <Text>Admin: {state.authStatus.admin ? 
          <Text color="green">✓ Connected</Text> : 
          <Text color="yellow">○ Not authenticated</Text>
        }</Text>
      </Box>
    </Box>
  );
}
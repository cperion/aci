import React, { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert } from '@inkjs/ui';
import { useNavigationActions } from '../../stores/index.js';
import { useAuthStore, selectAuthStatus } from '../../stores/index.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult } from '../../../types/command-result.js';

export function LoginView() {
  const { goBack } = useNavigationActions();
  const { portal: portalAuth } = useAuthStore(selectAuthStatus);
  const [step, setStep] = useState<'portal' | 'token' | 'username' | 'password' | 'loading'>('portal');
  const [portal, setPortal] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const commandService = useMemo(() => new TuiCommandService(), []);

  // Set up keyboard handlers
  useViewKeyboard({
    deps: [],
    handlers: {
      escape: () => goBack()
    }
  });

  const handlePortalSubmit = async (portalUrl: string) => {
    if (!portalUrl.trim()) return;
    
    setPortal(portalUrl);
    setError('');
    
    // Check if portal is reachable and determine auth method
    setStep('token');
  };

  const handleTokenSubmit = async (tokenValue: string) => {
    if (!tokenValue.trim()) {
      // No token provided, switch to username/password
      setStep('username');
      return;
    }

    setToken(tokenValue);
    setStep('loading');
    setIsLoading(true);
    setError('');

    try {
      const result: CommandResult = await commandService.loginPortal({ portal, token: tokenValue });
      
      if (result.success) {
        // Auth state is handled by the command service
        goBack();
      } else {
        setError(result.error || 'Login failed');
        setStep('token');
      }
    } catch (err) {
      setError('Network error during authentication');
      setStep('token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = async (usernameValue: string) => {
    if (!usernameValue.trim()) return;
    
    setUsername(usernameValue);
    setStep('password');
  };

  const handlePasswordSubmit = async (passwordValue: string) => {
    if (!passwordValue.trim()) return;

    setPassword(passwordValue);
    setStep('loading');
    setIsLoading(true);
    setError('');

    try {
      const result = await commandService.login(portal, undefined, username);
      
      if (result.success) {
        // Auth state is handled by the command service
        goBack();
      } else {
        setError(result.error || 'Login failed');
        setStep('username');
      }
    } catch (err) {
      setError('Network error during authentication');
      setStep('username');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Authenticating...</Text>
        <Spinner label="Connecting to portal" />
        <Text dimColor>Please wait while we authenticate your credentials</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">ArcGIS Portal Authentication</Text>
      <Text dimColor>Connect to your enterprise portal or ArcGIS Online</Text>
      
      {error && (
        <Alert variant="error" title="Authentication Error">
          {error}
        </Alert>
      )}

      {step === 'portal' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Step 1: Portal URL</Text>
          <Text dimColor>Enter your ArcGIS Portal URL:</Text>
          <TextInput
            placeholder="https://your-portal.company.com"
            onChange={setPortal}
            onSubmit={handlePortalSubmit}
          />
          <Text dimColor>Examples: https://company.maps.arcgis.com, https://portal.company.com</Text>
        </Box>
      )}

      {step === 'token' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Step 2: API Token (Recommended)</Text>
          <Text dimColor>Portal: {portal}</Text>
          <Text dimColor>Enter your API token (or press Enter to use username/password):</Text>
          <TextInput
            placeholder="Your API token or press Enter to skip"
            onChange={setToken}
            onSubmit={handleTokenSubmit}
          />
          <Text dimColor>Get your token from: Portal → My Profile → Security → Generate Token</Text>
        </Box>
      )}

      {step === 'username' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Step 2: Username</Text>
          <Text dimColor>Portal: {portal}</Text>
          <Text dimColor>Enter your username:</Text>
          <TextInput
            placeholder="Username"
            onChange={setUsername}
            onSubmit={handleUsernameSubmit}
          />
        </Box>
      )}

      {step === 'password' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Step 3: Password</Text>
          <Text dimColor>Portal: {portal}</Text>
          <Text dimColor>User: {username}</Text>
          <Text dimColor>Enter your password:</Text>
          <TextInput
            placeholder="Password"
            onChange={setPassword}
            onSubmit={handlePasswordSubmit}
          />
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
      </Box>
    </Box>
  );
}
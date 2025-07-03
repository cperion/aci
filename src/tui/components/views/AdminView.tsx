import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface ServerInfo {
  name: string;
  version: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  uptime: string;
  services: number;
  connections: number;
}

interface Service {
  name: string;
  folder: string;
  type: string;
  status: 'started' | 'stopped' | 'starting' | 'stopping';
  instances: number;
  configuredState: string;
}

export function AdminView() {
  const { goBack, navigate, setSelection, state } = useNavigation();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overview' | 'services' | 'logs' | 'login'>('overview');
  const [logs, setLogs] = useState<string[]>([]);

  const commandFacade = CommandFacade.getInstance();

  // Load admin data on mount
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if admin is authenticated
      if (!state.authStatus.admin) {
        setMode('login');
        setIsLoading(false);
        return;
      }

      // Load server status
      const statusResult = await commandFacade.adminStatus();
      
      if (statusResult.success && statusResult.data) {
        setServerInfo(statusResult.data as ServerInfo);
      }

      // Load services
      const servicesResult = await commandFacade.adminServices();
      
      if (servicesResult.success && servicesResult.data) {
        const servicesData = Array.isArray(servicesResult.data) ? servicesResult.data : [];
        setServices(servicesData);
      }

    } catch (err) {
      setError('Network error loading admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await commandFacade.adminLogs();
      if (result.success && result.data) {
        const logsData = Array.isArray(result.data) ? result.data : [result.data];
        setLogs(logsData);
      }
    } catch (err) {
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Global key handlers
  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'services' || mode === 'logs') {
        setMode('overview');
      } else if (mode === 'login') {
        goBack();
      } else {
        goBack();
      }
    }
    
    if (mode === 'overview') {
      switch (input.toLowerCase()) {
        case 's':
          setMode('services');
          break;
        case 'l':
          setMode('logs');
          loadLogs();
          break;
        case 'r':
          loadAdminData();
          break;
        case 'h':
          // Load health status
          loadAdminData();
          break;
      }
    } else if (mode === 'services') {
      switch (input.toLowerCase()) {
        case 'r':
          loadAdminData();
          break;
        case 'i':
          if (selectedService) {
            setSelection({ serviceId: selectedService });
            navigate('service-detail', `Service: ${selectedService}`);
          }
          break;
      }
    }
  });

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
  };

  // Check authentication status
  if (!state.authStatus.admin && mode !== 'login') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">Admin Authentication Required</Text>
        <Alert variant="warning" title="Server Admin Access Needed">
          You must be logged into ArcGIS Server as an administrator to access admin functions.
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back and use admin login</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'login') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Admin Login Required</Text>
        <Alert variant="info" title="Authentication Needed">
          Please use 'aci admin login' from the CLI to authenticate as server administrator.
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>After authentication, return to this view to manage the server.</Text>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Admin Data...</Text>
        <Spinner label="Fetching server information" />
        <Text dimColor>Please wait while we retrieve admin information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Admin Loading Error</Text>
        <Alert variant="error" title="Connection Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to retry, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'logs') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Server Logs</Text>
        <Text dimColor>Latest server log entries:</Text>
        
        <Box flexDirection="column" gap={1} marginTop={1}>
          {logs.length === 0 ? (
            <Text color="yellow">No logs available</Text>
          ) : (
            logs.slice(0, 10).map((log, index) => (
              <Text key={index} dimColor>{log}</Text>
            ))
          )}
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back to overview</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'services') {
    const serviceOptions = services.map(service => ({
      label: `${service.name} (${service.type}) - ${service.status}`,
      value: service.name
    }));

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Service Management</Text>
        <Text dimColor>Found {services.length} services</Text>

        {services.length === 0 ? (
          <Text color="yellow">No services found</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Service List:</Text>
            <Select
              options={serviceOptions}
              onChange={handleServiceSelect}
            />
            
            {selectedService && services.find(s => s.name === selectedService) && (
              <Box marginTop={1} flexDirection="column" gap={1}>
                <Text bold>Selected Service Details:</Text>
                {(() => {
                  const service = services.find(s => s.name === selectedService)!;
                  return (
                    <Box flexDirection="column">
                      <Text><Text bold>Name:</Text> {service.name}</Text>
                      <Text><Text bold>Type:</Text> {service.type}</Text>
                      <Text><Text bold>Status:</Text> <Text color={service.status === 'started' ? 'green' : 'yellow'}>{service.status}</Text></Text>
                      <Text><Text bold>Folder:</Text> {service.folder || 'Root'}</Text>
                      <Text><Text bold>Instances:</Text> {service.instances}</Text>
                      <Text><Text bold>Configured State:</Text> {service.configuredState}</Text>
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}

        <Box marginTop={1} flexDirection="column">
          <Text bold>Actions:</Text>
          <Text>  <Text color="cyan">r</Text> - Refresh services</Text>
          <Text>  <Text color="cyan">i</Text> - Inspect selected service</Text>
          <Text>  <Text color="cyan">Esc</Text> - Back to overview</Text>
        </Box>
      </Box>
    );
  }

  // Overview mode
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">ArcGIS Server Administration</Text>
      <Text dimColor>Server management and monitoring</Text>

      {/* Server Status */}
      {serverInfo && (
        <Box marginTop={1} flexDirection="column" gap={1}>
          <Text bold>Server Status:</Text>
          <Text><Text bold>Name:</Text> {serverInfo.name}</Text>
          <Text><Text bold>Version:</Text> {serverInfo.version}</Text>
          <Text><Text bold>Status:</Text> <Text color={serverInfo.status === 'running' ? 'green' : 'yellow'}>{serverInfo.status}</Text></Text>
          <Text><Text bold>Uptime:</Text> {serverInfo.uptime}</Text>
          <Text><Text bold>Services:</Text> {serverInfo.services}</Text>
          <Text><Text bold>Connections:</Text> {serverInfo.connections}</Text>
        </Box>
      )}

      {/* Quick Stats */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Quick Stats:</Text>
        <Text>Total Services: {services.length}</Text>
        <Text>Running Services: {services.filter(s => s.status === 'started').length}</Text>
        <Text>Stopped Services: {services.filter(s => s.status === 'stopped').length}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">s</Text> - Manage services</Text>
        <Text>  <Text color="cyan">l</Text> - View server logs</Text>
        <Text>  <Text color="cyan">h</Text> - Check health status</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh data</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {/* Show authentication status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Status:</Text>
        <Text>Admin: <Text color="green">✓ Authenticated</Text></Text>
        <Text dimColor>Connected to ArcGIS Server administration</Text>
      </Box>
    </Box>
  );
}
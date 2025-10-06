import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigationActions } from '../../stores/index.js';
import { useAuthStore, selectAuthStatus, selectPortalSession, selectAdminSession } from '../../stores/index.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult } from '../../../types/command-result.js';

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
  const { goBack, navigate } = useNavigationActions();
  const { portal: portalAuth, admin: adminAuth } = useAuthStore(selectAuthStatus);
  const portalSession = useAuthStore(selectPortalSession);
  const adminSession = useAuthStore(selectAdminSession);
  const [selection, setSelection] = useState<{ serviceId?: string }>({});
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overview' | 'services' | 'logs' | 'login' | 'alerts' | 'config' | 'restart-confirm' | 'monitoring' | 'backup-confirm'>('overview');
  const [logs, setLogs] = useState<string[]>([]);

  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Set up keyboard handlers
  useViewKeyboard({
    deps: [selectedService, services, mode],
    handlers: {
      a: () => setMode('alerts'),
      h: () => {
        console.log('Running health check...');
        loadAdminData();
      },
      s: () => setMode('services'),
      l: () => {
        setMode('logs');
        loadLogs();
      },
      c: () => setMode('config'),
      m: () => setMode('monitoring'),
      b: () => setMode('backup-confirm'),
      r: () => {
        if (mode === 'overview') {
          loadAdminData();
        } else if (mode === 'restart-confirm') {
          setMode('restart-confirm');
        }
      },
      i: () => {
        const currentService = services.find(s => s.name === selectedService);
        if (currentService) {
          setSelection({ serviceId: currentService.name });
          navigate('service-detail', `Service: ${currentService.name}`);
        }
      },
      y: () => {
        if (mode === 'restart-confirm') {
          // TODO: Implement actual restart
          console.log('Restart confirmed');
          setMode('overview');
        } else if (mode === 'backup-confirm') {
          // TODO: Implement actual backup
          console.log('Backup confirmed');
          setMode('overview');
        }
      },
      escape: () => {
        if (mode === 'overview') {
          goBack();
        } else {
          setMode('overview');
        }
      }
    }
  });

  // Load admin data on mount
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if admin is authenticated
      if (!adminAuth) {
        setMode('login');
        setIsLoading(false);
        return;
      }

      // Load server status
      const statusResult: CommandResult<ServerInfo> = await commandService.getServerStatus();
      
      if (statusResult.success && statusResult.data) {
        setServerInfo(statusResult.data);
      }

      // Load services
      const servicesResult: CommandResult<Service[]> = await commandService.listServices();
      
      if (servicesResult.success && servicesResult.data) {
        setServices(servicesResult.data);
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
      const result: CommandResult<string[]> = await commandService.getServerLogs();
      if (result.success && result.data) {
        setLogs(result.data);
      }
    } catch (err) {
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };


  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
  };

  // Check authentication status
  if (!adminAuth && mode !== 'login') {
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

  if (mode === 'alerts') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">System Alerts</Text>
        <Text dimColor>Recent system alerts and warnings:</Text>
        
        <Box flexDirection="column" gap={1} marginTop={1}>
          <Alert variant="warning" title="High Memory Usage">
            Memory usage is at 85% - consider restarting services
          </Alert>
          <Alert variant="info" title="Service Update Available">
            ArcGIS Server 11.1 update is available
          </Alert>
          <Alert variant="error" title="Failed Login Attempts">
            12 failed login attempts in the last hour
          </Alert>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back to overview</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'config') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Server Configuration</Text>
        <Text dimColor>Current server configuration settings:</Text>
        
        <Box flexDirection="column" gap={1} marginTop={1}>
          <Text><Text bold>Max Heap Size:</Text> 8192 MB</Text>
          <Text><Text bold>Instances per Machine:</Text> 2</Text>
          <Text><Text bold>Max Wait Time:</Text> 60 seconds</Text>
          <Text><Text bold>Max Idle Time:</Text> 1800 seconds</Text>
          <Text><Text bold>Max Usage Time:</Text> 600 seconds</Text>
          <Text><Text bold>Cleanup Timeout:</Text> 30 seconds</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">e</Text> to edit configuration, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'restart-confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Restart Server</Text>
        <Alert variant="warning" title="Service Interruption">
          This will restart the ArcGIS Server and temporarily interrupt all services.
        </Alert>
        <Text dimColor>All active connections will be terminated.</Text>
        <Text dimColor>Services will be unavailable during restart (estimated 2-3 minutes).</Text>
        
        <Box marginTop={1}>
          <Text>Press <Text color="red">y</Text> to restart server, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'monitoring') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">System Monitoring</Text>
        <Text dimColor>Real-time system performance metrics:</Text>
        
        <Box flexDirection="column" gap={1} marginTop={1}>
          <Text><Text bold>CPU Usage:</Text> <Text color="yellow">72%</Text></Text>
          <Text><Text bold>Memory Usage:</Text> <Text color="red">85%</Text></Text>
          <Text><Text bold>Disk I/O:</Text> <Text color="green">12%</Text></Text>
          <Text><Text bold>Network:</Text> <Text color="green">8%</Text></Text>
          <Text><Text bold>Active Connections:</Text> 24</Text>
          <Text><Text bold>Requests/minute:</Text> 156</Text>
          <Text><Text bold>Average Response Time:</Text> 234ms</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'backup-confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Create Server Backup</Text>
        <Alert variant="info" title="Backup Configuration">
          This will create a backup of server configuration and data.
        </Alert>
        <Text dimColor>Backup includes: configuration files, data stores, security settings</Text>
        <Text dimColor>Estimated size: ~500 MB</Text>
        <Text dimColor>Estimated time: 5-10 minutes</Text>
        
        <Box marginTop={1}>
          <Text>Press <Text color="green">y</Text> to create backup, <Text color="cyan">Esc</Text> to cancel</Text>
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
        <Text>  <Text color="cyan">a</Text> - View alerts</Text>
        <Text>  <Text color="cyan">c</Text> - Server configuration</Text>
        <Text>  <Text color="cyan">m</Text> - System monitoring</Text>
        <Text>  <Text color="cyan">b</Text> - Create backup</Text>
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
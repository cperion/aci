import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface AuthFailure {
  timestamp: string;
  username: string;
  reason: string;
  ip: string;
  count: number;
}

interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  errorRate: number;
  uptime: number;
}

interface CommandTrend {
  command: string;
  count: number;
  avgDuration: number;
  lastUsed: string;
}

interface ResourceTrend {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
}

export function InsightsView() {
  const { goBack, state } = useNavigation();
  const [authFailures, setAuthFailures] = useState<AuthFailure[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [commandTrends, setCommandTrends] = useState<CommandTrend[]>([]);
  const [resourceTrends, setResourceTrends] = useState<ResourceTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overview' | 'auth-failures' | 'service-health' | 'command-trends' | 'resource-trends'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const commandFacade = CommandFacade.getInstance();

  // Load insights data on mount
  useEffect(() => {
    loadInsightsData();
  }, [timeRange]);

  const loadInsightsData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load all insights data concurrently
      const [authResult, healthResult, trendsResult, resourceResult] = await Promise.allSettled([
        commandFacade.insightsAuthFailures(timeRange),
        commandFacade.insightsServiceHealth(timeRange),
        commandFacade.insightsCommandTrends(timeRange),
        commandFacade.insightsResourceTrends(timeRange)
      ]);

      // Process auth failures
      if (authResult.status === 'fulfilled' && authResult.value.success) {
        setAuthFailures(Array.isArray(authResult.value.data) ? authResult.value.data : []);
      }

      // Process service health
      if (healthResult.status === 'fulfilled' && healthResult.value.success) {
        setServiceHealth(Array.isArray(healthResult.value.data) ? healthResult.value.data : []);
      }

      // Process command trends
      if (trendsResult.status === 'fulfilled' && trendsResult.value.success) {
        setCommandTrends(Array.isArray(trendsResult.value.data) ? trendsResult.value.data : []);
      }

      // Process resource trends
      if (resourceResult.status === 'fulfilled' && resourceResult.value.success) {
        setResourceTrends(Array.isArray(resourceResult.value.data) ? resourceResult.value.data : []);
      }

    } catch (err) {
      setError('Network error loading insights data');
    } finally {
      setIsLoading(false);
    }
  };

  // Global key handlers
  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'overview') {
        goBack();
      } else {
        setMode('overview');
      }
    }
    
    if (mode === 'overview') {
      switch (input.toLowerCase()) {
        case '1':
          setMode('auth-failures');
          break;
        case '2':
          setMode('service-health');
          break;
        case '3':
          setMode('command-trends');
          break;
        case '4':
          setMode('resource-trends');
          break;
        case 'r':
          loadInsightsData();
          break;
        case 't':
          // Cycle through time ranges
          const timeRanges: Array<'1h' | '24h' | '7d' | '30d'> = ['1h', '24h', '7d', '30d'];
          const currentIndex = timeRanges.indexOf(timeRange);
          const nextIndex = (currentIndex + 1) % timeRanges.length;
          setTimeRange(timeRanges[nextIndex]!);
          break;
      }
    } else {
      switch (input.toLowerCase()) {
        case 'r':
          loadInsightsData();
          break;
      }
    }
  });

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Insights...</Text>
        <Spinner label="Analyzing system data" />
        <Text dimColor>Please wait while we gather analytics</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Insights Loading Error</Text>
        <Alert variant="error" title="Analytics Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to retry, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'auth-failures') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Authentication Failures ({timeRange})</Text>
        <Text dimColor>Recent authentication failure analysis</Text>
        
        {authFailures.length === 0 ? (
          <Text color="green">No authentication failures in this time period</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Recent Failures:</Text>
            {authFailures.slice(0, 10).map((failure, index) => (
              <Box key={index} flexDirection="column">
                <Text><Text bold>User:</Text> {failure.username} <Text bold>IP:</Text> {failure.ip}</Text>
                <Text><Text bold>Reason:</Text> {failure.reason} <Text bold>Count:</Text> {failure.count}</Text>
                <Text dimColor>{failure.timestamp}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Summary:</Text>
          <Text>Total Failures: {authFailures.length}</Text>
          <Text>Unique Users: {new Set(authFailures.map(f => f.username)).size}</Text>
          <Text>Unique IPs: {new Set(authFailures.map(f => f.ip)).size}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'service-health') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Service Health ({timeRange})</Text>
        <Text dimColor>Service performance and availability metrics</Text>
        
        {serviceHealth.length === 0 ? (
          <Text color="yellow">No service health data available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Service Status:</Text>
            {serviceHealth.map((service, index) => (
              <Box key={index} flexDirection="column">
                <Text><Text bold>Service:</Text> {service.serviceName}</Text>
                <Text><Text bold>Status:</Text> <Text color={service.status === 'healthy' ? 'green' : service.status === 'warning' ? 'yellow' : 'red'}>{service.status}</Text></Text>
                <Text><Text bold>Response Time:</Text> {service.responseTime}ms <Text bold>Error Rate:</Text> {service.errorRate}%</Text>
                <Text><Text bold>Uptime:</Text> {service.uptime}%</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Summary:</Text>
          <Text>Healthy: {serviceHealth.filter(s => s.status === 'healthy').length}</Text>
          <Text>Warning: {serviceHealth.filter(s => s.status === 'warning').length}</Text>
          <Text>Critical: {serviceHealth.filter(s => s.status === 'critical').length}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'command-trends') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Command Usage Trends ({timeRange})</Text>
        <Text dimColor>Most frequently used commands</Text>
        
        {commandTrends.length === 0 ? (
          <Text color="yellow">No command usage data available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Top Commands:</Text>
            {commandTrends.slice(0, 10).map((trend, index) => (
              <Box key={index} flexDirection="column">
                <Text><Text bold>{index + 1}.</Text> {trend.command}</Text>
                <Text><Text bold>Count:</Text> {trend.count} <Text bold>Avg Duration:</Text> {trend.avgDuration}ms</Text>
                <Text dimColor>Last used: {trend.lastUsed}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Summary:</Text>
          <Text>Total Commands: {commandTrends.reduce((sum, t) => sum + t.count, 0)}</Text>
          <Text>Unique Commands: {commandTrends.length}</Text>
          <Text>Avg Duration: {Math.round(commandTrends.reduce((sum, t) => sum + t.avgDuration, 0) / commandTrends.length)}ms</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'resource-trends') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Resource Usage Trends ({timeRange})</Text>
        <Text dimColor>System resource utilization over time</Text>
        
        {resourceTrends.length === 0 ? (
          <Text color="yellow">No resource usage data available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Latest Metrics:</Text>
            {resourceTrends.slice(-5).map((trend, index) => (
              <Box key={index} flexDirection="column">
                <Text dimColor>{trend.timestamp}</Text>
                <Text><Text bold>CPU:</Text> {trend.cpuUsage}% <Text bold>Memory:</Text> {trend.memoryUsage}%</Text>
                <Text><Text bold>Disk:</Text> {trend.diskUsage}% <Text bold>Connections:</Text> {trend.activeConnections}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Averages ({timeRange}):</Text>
          <Text>CPU: {Math.round(resourceTrends.reduce((sum, t) => sum + t.cpuUsage, 0) / resourceTrends.length)}%</Text>
          <Text>Memory: {Math.round(resourceTrends.reduce((sum, t) => sum + t.memoryUsage, 0) / resourceTrends.length)}%</Text>
          <Text>Disk: {Math.round(resourceTrends.reduce((sum, t) => sum + t.diskUsage, 0) / resourceTrends.length)}%</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  // Overview mode
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Enterprise Insights & Analytics</Text>
      <Text dimColor>Operational intelligence and system monitoring</Text>
      <Text><Text bold>Time Range:</Text> {timeRange} <Text dimColor>(press t to cycle)</Text></Text>

      {/* Quick Stats */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Quick Stats:</Text>
        <Text>Auth Failures: <Text color={authFailures.length > 0 ? 'red' : 'green'}>{authFailures.length}</Text></Text>
        <Text>Service Health: {serviceHealth.filter(s => s.status === 'healthy').length}/{serviceHealth.length} healthy</Text>
        <Text>Commands Run: {commandTrends.reduce((sum, t) => sum + t.count, 0)}</Text>
        <Text>Avg CPU Usage: {resourceTrends.length > 0 ? Math.round(resourceTrends.reduce((sum, t) => sum + t.cpuUsage, 0) / resourceTrends.length) : 0}%</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Available Reports:</Text>
        <Text>  <Text color="cyan">1</Text> - Authentication Failures</Text>
        <Text>  <Text color="cyan">2</Text> - Service Health Status</Text>
        <Text>  <Text color="cyan">3</Text> - Command Usage Trends</Text>
        <Text>  <Text color="cyan">4</Text> - Resource Usage Trends</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">t</Text> - Change time range ({timeRange})</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh all data</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {/* Alert for any critical issues */}
      {authFailures.length > 10 && (
        <Box marginTop={1}>
          <Alert variant="warning" title="Security Alert">
            High number of authentication failures detected ({authFailures.length})
          </Alert>
        </Box>
      )}

      {serviceHealth.filter(s => s.status === 'critical').length > 0 && (
        <Box marginTop={1}>
          <Alert variant="error" title="Service Alert">
            {serviceHealth.filter(s => s.status === 'critical').length} service(s) in critical state
          </Alert>
        </Box>
      )}
    </Box>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../../hooks/use-navigation.js';
import { useAuth } from '../../../hooks/use-auth.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult } from '../../../types/command-result.js';

interface Datastore {
  id: string;
  name: string;
  type: 'database' | 'file' | 'cloud' | 'web';
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  path: string;
  lastValidated: string;
  connectionString?: string;
  itemCount?: number;
  totalSize?: number;
  health: 'healthy' | 'warning' | 'critical';
}

interface ValidationResult {
  datastoreId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  connectionTime?: number;
  lastChecked: string;
}

export function DatastoresView() {
  const { goBack, navigate } = useNavigation();
  const { authState } = useAuth();
  const { portal: portalAuth, admin: adminAuth, portalSession, adminSession } = authState;
  const [selection, setSelection] = useState<{ datastoreId?: string }>({});
  const [datastores, setDatastores] = useState<Datastore[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [selectedDatastore, setSelectedDatastore] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'validate' | 'health' | 'details'>('list');

  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Load datastores on mount
  useEffect(() => {
    loadDatastores();
  }, []);

  const loadDatastores = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if admin is authenticated for some datastore operations
      if (!adminAuth && !portalAuth) {
        setError('Authentication required. Please login to view datastores.');
        setIsLoading(false);
        return;
      }

      const result: CommandResult<Datastore[]> = await commandService.listDatastores();
      
      if (result.success && result.data) {
        setDatastores(result.data);
      } else {
        setError(result.error || 'Failed to load datastores');
      }
    } catch (err) {
      setError('Network error loading datastores');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDatastores = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result: CommandResult<ValidationResult[]> = await commandService.validateDatastores();
      
      if (result.success && result.data) {
        setValidationResults(result.data);
      } else {
        setError(result.error || 'Failed to validate datastores');
      }
    } catch (err) {
      setError('Validation error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async () => {
    setIsLoading(true);
    setError('');

    try {
      // For now, check health of the selected datastore only
      if (!selectedDatastore) {
        setError('Please select a datastore to check health');
        setIsLoading(false);
        return;
      }
      
      const result: CommandResult<any> = await commandService.checkDatastoreHealth(selectedDatastore);
      
      if (result.success && result.data) {
        // Update datastores with health information
        setDatastores(prev => prev.map(ds => {
          const health = result.data!.find((h: any) => h.id === ds.id);
          return health ? { ...ds, health: health.status as any } : ds;
        }));
      } else {
        setError(result.error || 'Failed to check datastore health');
      }
    } catch (err) {
      setError('Health check error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up keyboard handlers
  useViewKeyboard({
    deps: [mode, selectedDatastore],
    handlers: {
      v: () => {
        if (mode === 'list') {
          setMode('validate');
          validateDatastores();
        }
      },
      h: () => {
        if (mode === 'list') {
          setMode('health');
          checkHealth();
        }
      },
      r: () => {
        if (mode === 'validate') {
          validateDatastores();
        } else if (mode === 'health') {
          checkHealth();
        } else {
          loadDatastores();
        }
      },
      i: () => {
        if (mode === 'list' && selectedDatastore) {
          setSelection({ datastoreId: selectedDatastore });
          setMode('details');
        }
      },
      escape: () => {
        if (mode === 'list') {
          goBack();
        } else {
          setMode('list');
        }
      }
    }
  });

  const handleDatastoreSelect = (datastoreId: string) => {
    setSelectedDatastore(datastoreId);
  };

  // Check authentication status
  if (!adminAuth && !portalAuth) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">Authentication Required</Text>
        <Alert variant="warning" title="Access Required">
          You must be authenticated to access datastore management.
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back and authenticate</Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Datastores...</Text>
        <Spinner label="Fetching datastore information" />
        <Text dimColor>Please wait while we retrieve datastore data</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Datastore Loading Error</Text>
        <Alert variant="error" title="Connection Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to retry, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'validate') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Datastore Validation Results</Text>
        <Text dimColor>Connection and accessibility validation</Text>
        
        {validationResults.length === 0 ? (
          <Text color="yellow">No validation results available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            {validationResults.map((result, index) => (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Text><Text bold>Datastore:</Text> {result.datastoreId}</Text>
                <Text><Text bold>Status:</Text> <Text color={result.isValid ? 'green' : 'red'}>{result.isValid ? 'Valid' : 'Invalid'}</Text></Text>
                {result.connectionTime && (
                  <Text><Text bold>Connection Time:</Text> {result.connectionTime}ms</Text>
                )}
                {result.errors.length > 0 && (
                  <Box flexDirection="column">
                    <Text color="red">Errors:</Text>
                    {result.errors.map((error, i) => (
                      <Text key={i} dimColor>• {error}</Text>
                    ))}
                  </Box>
                )}
                {result.warnings.length > 0 && (
                  <Box flexDirection="column">
                    <Text color="yellow">Warnings:</Text>
                    {result.warnings.map((warning, i) => (
                      <Text key={i} dimColor>• {warning}</Text>
                    ))}
                  </Box>
                )}
                <Text dimColor>Last checked: {result.lastChecked}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Summary:</Text>
          <Text>Valid: {validationResults.filter(r => r.isValid).length}</Text>
          <Text>Invalid: {validationResults.filter(r => !r.isValid).length}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to re-validate, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'health') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Datastore Health Status</Text>
        <Text dimColor>Performance and availability monitoring</Text>
        
        {datastores.length === 0 ? (
          <Text color="yellow">No datastore health data available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            {datastores.map((datastore, index) => (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Text><Text bold>Name:</Text> {datastore.name}</Text>
                <Text><Text bold>Type:</Text> {datastore.type}</Text>
                <Text><Text bold>Health:</Text> <Text color={datastore.health === 'healthy' ? 'green' : datastore.health === 'warning' ? 'yellow' : 'red'}>{datastore.health}</Text></Text>
                <Text><Text bold>Status:</Text> <Text color={datastore.status === 'connected' ? 'green' : 'yellow'}>{datastore.status}</Text></Text>
                {datastore.itemCount && (
                  <Text><Text bold>Items:</Text> {datastore.itemCount}</Text>
                )}
                {datastore.totalSize && (
                  <Text><Text bold>Size:</Text> {(datastore.totalSize / 1024 / 1024).toFixed(2)} MB</Text>
                )}
                <Text dimColor>Last validated: {datastore.lastValidated}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text bold>Health Summary:</Text>
          <Text>Healthy: {datastores.filter(d => d.health === 'healthy').length}</Text>
          <Text>Warning: {datastores.filter(d => d.health === 'warning').length}</Text>
          <Text>Critical: {datastores.filter(d => d.health === 'critical').length}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to refresh, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'details' && selectedDatastore) {
    const datastore = datastores.find(d => d.id === selectedDatastore);
    if (!datastore) {
      setMode('list');
      return null;
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Datastore Details</Text>
        <Text dimColor>Detailed information for {datastore.name}</Text>
        
        <Box flexDirection="column" gap={1}>
          <Text><Text bold>ID:</Text> {datastore.id}</Text>
          <Text><Text bold>Name:</Text> {datastore.name}</Text>
          <Text><Text bold>Type:</Text> {datastore.type}</Text>
          <Text><Text bold>Status:</Text> <Text color={datastore.status === 'connected' ? 'green' : 'yellow'}>{datastore.status}</Text></Text>
          <Text><Text bold>Health:</Text> <Text color={datastore.health === 'healthy' ? 'green' : datastore.health === 'warning' ? 'yellow' : 'red'}>{datastore.health}</Text></Text>
          <Text><Text bold>Path:</Text> {datastore.path}</Text>
          {datastore.connectionString && (
            <Text><Text bold>Connection:</Text> {datastore.connectionString.substring(0, 50)}...</Text>
          )}
          {datastore.itemCount && (
            <Text><Text bold>Item Count:</Text> {datastore.itemCount}</Text>
          )}
          {datastore.totalSize && (
            <Text><Text bold>Total Size:</Text> {(datastore.totalSize / 1024 / 1024).toFixed(2)} MB</Text>
          )}
          <Text><Text bold>Last Validated:</Text> {datastore.lastValidated}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back to list</Text>
        </Box>
      </Box>
    );
  }

  // List mode
  const datastoreOptions = datastores.map(datastore => ({
    label: `${datastore.name} (${datastore.type}) - ${datastore.status}`,
    value: datastore.id
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Datastore Management</Text>
      <Text dimColor>Enterprise data source operations and monitoring</Text>
      <Text>Found {datastores.length} datastores</Text>

      {datastores.length === 0 ? (
        <Text color="yellow">No datastores found</Text>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text bold>Datastore List:</Text>
          <Select
            options={datastoreOptions}
            onChange={handleDatastoreSelect}
          />
          
          {selectedDatastore && datastores.find(d => d.id === selectedDatastore) && (
            <Box marginTop={1} flexDirection="column" gap={1}>
              <Text bold>Quick Info:</Text>
              {(() => {
                const datastore = datastores.find(d => d.id === selectedDatastore)!;
                return (
                  <Box flexDirection="column">
                    <Text><Text bold>Name:</Text> {datastore.name}</Text>
                    <Text><Text bold>Type:</Text> {datastore.type}</Text>
                    <Text><Text bold>Status:</Text> <Text color={datastore.status === 'connected' ? 'green' : 'yellow'}>{datastore.status}</Text></Text>
                    <Text><Text bold>Health:</Text> <Text color={datastore.health === 'healthy' ? 'green' : datastore.health === 'warning' ? 'yellow' : 'red'}>{datastore.health}</Text></Text>
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">v</Text> - Validate connections</Text>
        <Text>  <Text color="cyan">h</Text> - Check health status</Text>
        <Text>  <Text color="cyan">i</Text> - View detailed info</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {/* Show summary stats */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Summary:</Text>
        <Text>Connected: {datastores.filter(d => d.status === 'connected').length}</Text>
        <Text>Types: {[...new Set(datastores.map(d => d.type))].join(', ')}</Text>
        <Text>Auth: {adminAuth ? 'Admin' : 'Portal'}</Text>
      </Box>
    </Box>
  );
}
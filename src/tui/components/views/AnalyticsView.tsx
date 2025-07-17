import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../../hooks/use-navigation.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult } from '../../../types/command-result.js';

interface DatabaseSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  rowCount: number;
}

interface AnalysisTemplate {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'usage' | 'compliance';
  query: string;
}

export function AnalyticsView() {
  const { goBack } = useNavigation();
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overview' | 'templates' | 'sql' | 'schema'>('overview');

  const commandService = useMemo(() => new TuiCommandService(), []);

  // Load analytics data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load database schema
      const schemaResult: CommandResult<DatabaseSchema[]> = await commandService.getDbSchema();
      if (schemaResult.success && schemaResult.data) {
        setSchemas(schemaResult.data);
      }

      // Load analysis templates
      const templatesResult: CommandResult<AnalysisTemplate[]> = await commandService.getAnalysisTemplates();
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

    } catch (err) {
      setError('Network error loading analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async (query: string) => {
    setIsLoading(true);
    setError('');

    try {
      const result: CommandResult<any[]> = await commandService.executeSqlQuery(query);
      if (result.success && result.data) {
        setQueryResult(result.data);
      } else {
        setError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setError('Query execution error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up keyboard handlers
  useViewKeyboard({
    deps: [mode, selectedTemplate, sqlQuery, templates],
    handlers: {
      '1': () => {
        if (mode === 'overview') setMode('templates');
      },
      '2': () => {
        if (mode === 'overview') setMode('sql');
      },
      '3': () => {
        if (mode === 'overview') setMode('schema');
      },
      r: () => {
        if (mode === 'overview') {
          loadAnalyticsData();
        }
      },
      e: () => {
        if (mode === 'templates' && selectedTemplate) {
          const template = templates.find(t => t.id === selectedTemplate);
          if (template) {
            executeQuery(template.query);
          }
        } else if (mode === 'sql' && sqlQuery.trim()) {
          executeQuery(sqlQuery);
        }
      },
      escape: () => {
        if (mode === 'overview') {
          goBack();
        } else {
          setMode('overview');
          setQueryResult([]);
        }
      }
    }
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Analytics...</Text>
        <Spinner label="Preparing analytical environment" />
        <Text dimColor>Please wait while we set up analytics tools</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Analytics Error</Text>
        <Alert variant="error" title="Execution Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to retry, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'templates') {
    const templateOptions = templates.map(template => ({
      label: `${template.name} (${template.category})`,
      value: template.id
    }));

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Analysis Templates</Text>
        <Text dimColor>Pre-built analytical queries for common insights</Text>
        
        {templates.length === 0 ? (
          <Text color="yellow">No analysis templates available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Available Templates:</Text>
            <Select
              options={templateOptions}
              onChange={handleTemplateSelect}
            />
            
            {selectedTemplate && templates.find(t => t.id === selectedTemplate) && (
              <Box marginTop={1} flexDirection="column" gap={1}>
                <Text bold>Template Details:</Text>
                {(() => {
                  const template = templates.find(t => t.id === selectedTemplate)!;
                  return (
                    <Box flexDirection="column">
                      <Text><Text bold>Name:</Text> {template.name}</Text>
                      <Text><Text bold>Category:</Text> {template.category}</Text>
                      <Text><Text bold>Description:</Text> {template.description}</Text>
                      <Box marginTop={1}>
                        <Text bold>Query Preview:</Text>
                        <Text dimColor>{template.query.substring(0, 100)}...</Text>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}

        {queryResult.length > 0 && (
          <Box marginTop={1} flexDirection="column" gap={1}>
            <Text bold>Query Results:</Text>
            {queryResult.slice(0, 5).map((row, index) => (
              <Text key={index} dimColor>{JSON.stringify(row).substring(0, 80)}...</Text>
            ))}
            {queryResult.length > 5 && (
              <Text dimColor>... and {queryResult.length - 5} more rows</Text>
            )}
          </Box>
        )}
        
        <Box marginTop={1} flexDirection="column">
          <Text bold>Actions:</Text>
          <Text>  <Text color="cyan">e</Text> - Execute selected template</Text>
          <Text>  <Text color="cyan">Esc</Text> - Back to overview</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'sql') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">SQL Analytics Console</Text>
        <Text dimColor>Direct SQL query execution (read-only)</Text>
        
        <Alert variant="info" title="Read-Only Mode">
          Only SELECT queries are allowed for security reasons.
        </Alert>
        
        <Box marginTop={1} flexDirection="column">
          <Text bold>Enter SQL Query:</Text>
          <TextInput
            placeholder="SELECT * FROM audit_logs WHERE timestamp > '2024-01-01' LIMIT 10"
            onChange={setSqlQuery}
            onSubmit={executeQuery}
          />
        </Box>

        {queryResult.length > 0 && (
          <Box marginTop={1} flexDirection="column" gap={1}>
            <Text bold>Query Results ({queryResult.length} rows):</Text>
            {queryResult.slice(0, 10).map((row, index) => (
              <Text key={index} dimColor>{JSON.stringify(row)}</Text>
            ))}
            {queryResult.length > 10 && (
              <Text dimColor>... and {queryResult.length - 10} more rows</Text>
            )}
          </Box>
        )}
        
        <Box marginTop={1} flexDirection="column">
          <Text bold>Sample Queries:</Text>
          <Text dimColor>SELECT * FROM audit_logs WHERE status = 'error'</Text>
          <Text dimColor>SELECT command, COUNT(*) FROM command_metrics GROUP BY command</Text>
          <Text dimColor>SELECT DATE(timestamp), COUNT(*) FROM auth_failures GROUP BY DATE(timestamp)</Text>
        </Box>
        
        <Box marginTop={1} flexDirection="column">
          <Text bold>Actions:</Text>
          <Text>  <Text color="cyan">e</Text> - Execute query</Text>
          <Text>  <Text color="cyan">Esc</Text> - Back to overview</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'schema') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Database Schema</Text>
        <Text dimColor>ACI database structure and table information</Text>
        
        {schemas.length === 0 ? (
          <Text color="yellow">No schema information available</Text>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold>Available Tables:</Text>
            {schemas.map((schema, index) => (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Text><Text bold>{schema.tableName}</Text> ({schema.rowCount} rows)</Text>
                <Text dimColor>Columns: {schema.columns.map(c => c.name).join(', ')}</Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  // Overview mode
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Advanced Analytics & Data Exploration</Text>
      <Text dimColor>Expert-level data analysis and SQL exploration tools</Text>

      {/* Quick Stats */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Available Data:</Text>
        <Text>Analysis Templates: {templates.length}</Text>
        <Text>Database Tables: {schemas.length}</Text>
        <Text>Total Records: {schemas.reduce((sum, s) => sum + s.rowCount, 0)}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Analytics Tools:</Text>
        <Text>  <Text color="cyan">1</Text> - Guided Template Analysis</Text>
        <Text>  <Text color="cyan">2</Text> - Expert SQL Console</Text>
        <Text>  <Text color="cyan">3</Text> - Database Schema Explorer</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Template Categories:</Text>
        <Text>Security: {templates.filter(t => t.category === 'security').length}</Text>
        <Text>Performance: {templates.filter(t => t.category === 'performance').length}</Text>
        <Text>Usage: {templates.filter(t => t.category === 'usage').length}</Text>
        <Text>Compliance: {templates.filter(t => t.category === 'compliance').length}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh data</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      <Box marginTop={1}>
        <Alert variant="info" title="Expert Mode">
          These tools provide direct access to the ACI database for advanced analysis.
        </Alert>
      </Box>
    </Box>
  );
}
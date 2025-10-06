/**
 * Inspector layout component
 * Selection details, contextual actions, and help snippets
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Panel, Badge, KeyHint } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';

export type InspectorProps = {
  selection?: {
    type: string;
    name: string;
    id: string;
    status?: string;
    metadata?: Record<string, string>;
  };
  actions?: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
};

export function Inspector({ selection, actions = [] }: InspectorProps) {
  const roles = useColorRoles();

  if (!selection) {
    return (
      <Panel title="Inspector" width="100%" padding="xs">
        <Box flexDirection="column" gap={spacing.xs}>
          <Text color={roles.textMuted}>
            No selection. Use arrow keys to navigate and press Space to select items.
          </Text>
          
          <Box flexDirection="column" gap={spacing.xs}>
            <Text bold color={roles.accent}>Global Shortcuts</Text>
            <KeyHint keyLabel="?" desc="Help" />
            <KeyHint keyLabel="p" desc="Command Palette" />
            <KeyHint keyLabel="/" desc="Search" />
            <KeyHint keyLabel="q" desc="Quit" />
          </Box>
        </Box>
      </Panel>
    );
  }

  return (
    <Panel title="Inspector" width="100%" padding="xs">
      <Box flexDirection="column" gap={spacing.xs}>
        <Box flexDirection="column">
          <Text bold color={roles.text}>{selection.name}</Text>
          <Text color={roles.textMuted}>{selection.type}</Text>
          {selection.status && (
            <Badge 
              color={selection.status === 'online' ? 'success' : 'warning'}
            >
              {selection.status}
            </Badge>
          )}
        </Box>

        {selection.metadata && Object.keys(selection.metadata).length > 0 && (
          <Box flexDirection="column" gap={spacing.xs}>
            <Text bold color={roles.accent}>Details</Text>
            {Object.entries(selection.metadata).map(([key, value]) => (
              <Box key={key} flexDirection="row" gap={spacing.xs}>
                <Text color={roles.textMuted}>{key}:</Text>
                <Text color={roles.text}>{value}</Text>
              </Box>
            ))}
          </Box>
        )}

        {actions.length > 0 && (
          <Box flexDirection="column" gap={spacing.xs}>
            <Text bold color={roles.accent}>Actions</Text>
            {actions.map(action => (
              <KeyHint 
                key={action.key}
                keyLabel={action.key}
                desc={action.label}
              />
            ))}
          </Box>
        )}
      </Box>
    </Panel>
  );
}

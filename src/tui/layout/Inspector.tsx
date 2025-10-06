/**
 * Inspector layout component
 * Selection details, contextual actions, and help snippets
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Panel, Badge, KeyHint } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';
import { Node } from '../../data/types.js';

export type InspectorProps = {
  node: Node;
  height: number;
};

export function Inspector({ node, height }: InspectorProps) {
  const roles = useColorRoles();

  const getKindDisplay = (kind: string): string => {
    switch (kind) {
      case 'serverRoot': return 'Server Root';
      case 'serverFolder': return 'Folder';
      case 'serverService': return 'Service';
      case 'serverLayer': return 'Layer';
      case 'serverTable': return 'Table';
      case 'serverOperation': return 'Operation';
      case 'portalRoot': return 'Portal Root';
      case 'portalUsers': return 'Users';
      case 'portalUser': return 'User';
      case 'portalGroups': return 'Groups';
      case 'portalGroup': return 'Group';
      case 'portalItems': return 'Items';
      case 'portalItem': return 'Item';
      case 'portalOperation': return 'Operation';
      default: return kind;
    }
  };

  const renderNodeDetails = () => {
    const details: Array<{ key: string; value: string }> = [];

    // Add URL
    details.push({ key: 'URL', value: node.url });

    // Add kind-specific details
    switch (node.kind) {
      case 'serverService':
        if (node.meta?.type) {
          details.push({ key: 'Type', value: String(node.meta.type) });
        }
        if (node.childrenCount !== undefined) {
          details.push({ key: 'Layers/Tables', value: String(node.childrenCount) });
        }
        break;
      
      case 'serverLayer':
      case 'serverTable':
        if (node.meta?.id !== undefined) {
          details.push({ key: 'ID', value: String(node.meta.id) });
        }
        if (node.meta?.geometryType) {
          details.push({ key: 'Geometry', value: String(node.meta.geometryType) });
        }
        break;
      
      case 'portalItem':
        if (node.meta?.type) {
          details.push({ key: 'Type', value: String(node.meta.type) });
        }
        if (node.meta?.owner) {
          details.push({ key: 'Owner', value: String(node.meta.owner) });
        }
        if (node.meta?.modified) {
          details.push({ key: 'Modified', value: String(node.meta.modified) });
        }
        break;
      
      case 'portalUser':
        if (node.meta?.fullName) {
          details.push({ key: 'Full Name', value: String(node.meta.fullName) });
        }
        if (node.meta?.email) {
          details.push({ key: 'Email', value: String(node.meta.email) });
        }
        if (node.meta?.role) {
          details.push({ key: 'Role', value: String(node.meta.role) });
        }
        break;
    }

    return details;
  };

  const getActions = () => {
    const actions = [
      { key: 'y', label: 'Copy URL' },
      { key: 'o', label: 'Open Browser' },
    ];

    if (node.childrenLoaded || node.childrenKind) {
      actions.push({ key: 'r', label: 'Refresh' });
    }

    if (node.kind === 'serverOperation' || node.kind === 'portalOperation') {
      actions.push({ key: 'Enter', label: 'Execute' });
    }

    return actions;
  };

  return (
    <Panel title="Inspector" width="100%" padding="xs">
      <Box flexDirection="column" gap={spacing.xs}>
        {/* Node header */}
        <Box flexDirection="column">
          <Text bold color={roles.text}>{node.name}</Text>
          <Text color={roles.textMuted}>{getKindDisplay(node.kind)}</Text>
          {node.childrenCount !== undefined && (
            <Badge color="info">
              {node.childrenCount} items
            </Badge>
          )}
        </Box>

        {/* Node details */}
        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.accent}>Details</Text>
          {renderNodeDetails().map(({ key, value }) => (
            <Box key={key} flexDirection="row" gap={spacing.xs}>
              <Text color={roles.textMuted}>{key}:</Text>
              <Text color={roles.text}>{value}</Text>
            </Box>
          ))}
        </Box>

        {/* Actions */}
        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.accent}>Actions</Text>
          {getActions().map(action => (
            <KeyHint 
              key={action.key}
              keyLabel={action.key}
              desc={action.label}
            />
          ))}
        </Box>

        {/* Global shortcuts */}
        <Box flexDirection="column" gap={spacing.xs}>
          <Text bold color={roles.accent}>Navigation</Text>
          <KeyHint keyLabel="j/k" desc="Move up/down" />
          <KeyHint keyLabel="h/l" desc="Go up/into" />
          <KeyHint keyLabel="Tab" desc="Next column" />
          <KeyHint keyLabel="/" desc="Filter" />
          <KeyHint keyLabel="i" desc="Toggle inspector" />
        </Box>
      </Box>
    </Panel>
  );
}

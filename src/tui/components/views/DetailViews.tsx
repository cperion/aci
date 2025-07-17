import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes/theme-manager.js';

interface DetailViewProps {
  selectionState?: any;
}

/**
 * Service Detail View - Shows comprehensive service information
 */
export function ServiceDetailView({ selectionState }: DetailViewProps) {
  const { colors } = useTheme();
  const serviceId = selectionState?.serviceId;

  if (!serviceId) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warnings}>No service selected</Text>
        <Text color={colors.metadata}>Select a service to view details</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.labels}>Service Details</Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.highlights}>Service ID: {serviceId}</Text>
        <Text color={colors.metadata}>Type: ArcGIS Service</Text>
        <Text color={colors.metadata}>Status: Active</Text>
        <Text color={colors.metadata}>Endpoint: Feature Server</Text>
        <Text color={colors.metadata}>Capabilities: Query, Create, Update, Delete</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Available Operations</Text>
        <Text color={colors.metadata}>• Query features</Text>
        <Text color={colors.metadata}>• Export data</Text>
        <Text color={colors.metadata}>• View metadata</Text>
        <Text color={colors.metadata}>• Check permissions</Text>
      </Box>
    </Box>
  );
}

/**
 * User Detail View - Shows comprehensive user information
 */
export function UserDetailView({ selectionState }: DetailViewProps) {
  const { colors } = useTheme();
  const userId = selectionState?.itemId;

  if (!userId) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warnings}>No user selected</Text>
        <Text color={colors.metadata}>Select a user to view details</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.labels}>User Details</Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.highlights}>User ID: {userId}</Text>
        <Text color={colors.metadata}>Type: Portal User</Text>
        <Text color={colors.metadata}>Role: Member</Text>
        <Text color={colors.metadata}>Last Login: 2 hours ago</Text>
        <Text color={colors.metadata}>Credits: 1,500 remaining</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>User Information</Text>
        <Text color={colors.metadata}>• Profile complete</Text>
        <Text color={colors.metadata}>• Email verified</Text>
        <Text color={colors.metadata}>• Active license</Text>
        <Text color={colors.metadata}>• Group memberships: 3</Text>
      </Box>
    </Box>
  );
}

/**
 * Group Detail View - Shows comprehensive group information
 */
export function GroupDetailView({ selectionState }: DetailViewProps) {
  const { colors } = useTheme();
  const groupId = selectionState?.itemId;

  if (!groupId) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warnings}>No group selected</Text>
        <Text color={colors.metadata}>Select a group to view details</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.labels}>Group Details</Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.highlights}>Group ID: {groupId}</Text>
        <Text color={colors.metadata}>Type: Portal Group</Text>
        <Text color={colors.metadata}>Access: Public</Text>
        <Text color={colors.metadata}>Members: 24 users</Text>
        <Text color={colors.metadata}>Created: 6 months ago</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Group Properties</Text>
        <Text color={colors.metadata}>• Content sharing enabled</Text>
        <Text color={colors.metadata}>• Member invitations allowed</Text>
        <Text color={colors.metadata}>• Moderated content</Text>
        <Text color={colors.metadata}>• Active discussions: 12</Text>
      </Box>
    </Box>
  );
}

/**
 * Item Detail View - Shows comprehensive item information
 */
export function ItemDetailView({ selectionState }: DetailViewProps) {
  const { colors } = useTheme();
  const itemId = selectionState?.itemId;

  if (!itemId) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warnings}>No item selected</Text>
        <Text color={colors.metadata}>Select an item to view details</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.labels}>Item Details</Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.highlights}>Item ID: {itemId}</Text>
        <Text color={colors.metadata}>Type: Feature Layer</Text>
        <Text color={colors.metadata}>Owner: Current User</Text>
        <Text color={colors.metadata}>Views: 1,247</Text>
        <Text color={colors.metadata}>Last Modified: 3 days ago</Text>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Item Properties</Text>
        <Text color={colors.metadata}>• Publicly shared</Text>
        <Text color={colors.metadata}>• Download enabled</Text>
        <Text color={colors.metadata}>• Comments allowed</Text>
        <Text color={colors.metadata}>• Tags: 8 keywords</Text>
      </Box>
    </Box>
  );
}
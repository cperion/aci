/**
 * BreadcrumbHeader layout component
 * Displays scope badge, breadcrumb path, and optional filter indicator
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Badge } from '../primitives/Badge.js';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';
import { Separator } from '../primitives/Separator.js';

export type BreadcrumbHeaderProps = {
  scope: 'server' | 'portal';
  breadcrumb: string[];
  portal?: string;
  username?: string;
  isAdmin?: boolean;
  filterActive?: boolean;
};

export function BreadcrumbHeader({ 
  scope, 
  breadcrumb, 
  portal,
  username,
  isAdmin,
  filterActive = false,
}: BreadcrumbHeaderProps) {
  const roles = useColorRoles();

  const formatBreadcrumb = () => {
    if (breadcrumb.length === 0) {
      return scope === 'server' ? 'Server' : 'Portal';
    }
    return breadcrumb.join(' ▸ ');
  };

  return (
    <Box flexDirection="column" width="100%">
      <Box
        paddingX={spacing.sm}
        paddingY={spacing.xs}
        justifyContent="space-between"
        width="100%"
      >
        <Box flexDirection="row" alignItems="center" flexGrow={1}>
          {/* Scope badge */}
          <Badge color={scope === 'server' ? 'info' : 'accent'}>
            arcgis • {scope === 'server' ? 'Server' : 'Portal'}
          </Badge>
          
          <Text color={roles.textMuted}> </Text>
          
          {/* Breadcrumb */}
          <Text color={roles.text}>
            {formatBreadcrumb()}
          </Text>
          
          {/* Filter indicator */}
          {filterActive && (
            <>
              <Text color={roles.textMuted}> </Text>
              <Badge color="warning">Filter</Badge>
            </>
          )}
        </Box>
        
        <Box flexDirection="row" alignItems="center">
          {portal && (
            <Text color={roles.textMuted}>
              {portal}
            </Text>
          )}
          {username && (
            <>
              <Text color={roles.textMuted}> · </Text>
              <Text color={roles.textMuted}>
                {username}
                {isAdmin && (
                  <Text color={roles.accent} bold> (admin)</Text>
                )}
              </Text>
            </>
          )}
        </Box>
      </Box>
      <Separator />
    </Box>
  );
}
/**
 * Badge primitive component
 * Small labeled chips for status/metadata
 */

import React from 'react';
import { Text } from 'ink';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';

export type BadgeProps = {
  color?: keyof Omit<typeof useColorRoles extends () => infer T ? T : never, 'bg' | 'surface' | 'text' | 'textMuted' | 'textAltLight' | 'textAltDark' | 'surfaceAlt' | 'border' | 'borderSubtle' | 'borderEmphasis'>;
  children: React.ReactNode;
  inverse?: boolean;
};

export function Badge({ color = 'accent', children, inverse = false }: BadgeProps) {
  const roles = useColorRoles();
  const padding = spacing.xs;

  // Get the appropriate colors
  const bgColor = inverse ? roles[color] : roles.surface;
  const textColor = inverse ? roles.surface : roles[color];

  return (
    <Text backgroundColor={bgColor} color={textColor}>
      {' '.repeat(padding)}
      {children}
      {' '.repeat(padding)}
    </Text>
  );
}

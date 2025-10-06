/**
 * KeyHint primitive component
 * Visual representation of a key/shortcut
 */

import React from 'react';
import { Text } from 'ink';
import { useColorRoles } from '../design/roles.js';

export type KeyHintProps = {
  keyLabel: string;
  desc?: string;
  active?: boolean;
};

export function KeyHint({ keyLabel, desc, active = false }: KeyHintProps) {
  const roles = useColorRoles();

  return (
    <Text>
      <Text 
        backgroundColor={active ? roles.selection : roles.surface}
        color={active ? roles.text : roles.textMuted}
        bold={active}
      >
        {'['}
        {keyLabel}
        {']'}
      </Text>
      {desc && (
        <Text color={roles.textMuted}>
          {' '}{desc}
        </Text>
      )}
    </Text>
  );
}

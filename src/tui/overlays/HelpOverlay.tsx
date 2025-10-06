/**
 * HelpOverlay component
 * Contextual and global help with tabs and search
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel, Separator, KeyHint } from '../primitives/index.js';
import { useColorRoles } from '../design/roles.js';
import { spacing } from '../design/tokens.js';

export type HelpOverlayProps = {
  visible: boolean;
  onClose: () => void;
  currentView?: string;
};

export function HelpOverlay({ visible, onClose, currentView = 'home' }: HelpOverlayProps) {
  const roles = useColorRoles();
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'commands' | 'tips'>('shortcuts');

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    }
    
    // Tab navigation
    if (input === '1') setActiveTab('shortcuts');
    if (input === '2') setActiveTab('commands');
    if (input === '3') setActiveTab('tips');
  });

  if (!visible) return null;

  const shortcuts = [
    { key: '?', desc: 'Show/Hide this help' },
    { key: 'q', desc: 'Quit ACI' },
    { key: 'p', desc: 'Command Palette' },
    { key: '/', desc: 'Universal Search' },
    { key: '[', desc: 'Previous theme' },
    { key: ']', desc: 'Next theme' },
    { key: 'r', desc: 'Random theme' },
  ];

  const viewShortcuts = [
    { key: 'h', desc: 'Home view' },
    { key: 's', desc: 'Services view' },
    { key: 'u', desc: 'Users view' },
    { key: 'g', desc: 'Groups view' },
    { key: 'i', desc: 'Items view' },
    { key: 'a', desc: 'Admin view' },
  ];

  const navigationShortcuts = [
    { key: 'j/k', desc: 'Move up/down in lists' },
    { key: 'space', desc: 'Select item' },
    { key: 'enter', desc: 'Confirm action' },
    { key: 'escape', desc: 'Cancel/Go back' },
  ];

  const commands = [
    { cmd: 'aci login', desc: 'Authenticate with ArcGIS portal' },
    { cmd: 'aci search <term>', desc: 'Search for services' },
    { cmd: 'aci inspect <url>', desc: 'View service metadata' },
    { cmd: 'aci query <url>', desc: 'Query feature service' },
    { cmd: 'aci users list', desc: 'List portal users' },
    { cmd: 'aci groups list', desc: 'List portal groups' },
    { cmd: 'aci items list', desc: 'List portal items' },
  ];

  const tips = [
    'Use the Command Palette (p) for quick access to all actions',
    'Themes are automatically saved and restored on restart',
    'Use Tab/Shift+Tab to navigate between focusable elements',
    'Press Escape to close overlays and cancel actions',
    'The Inspector panel shows details for selected items',
    'Recent navigation history is kept in the sidebar',
  ];

  const renderShortcuts = () => (
    <Box flexDirection="column" gap={spacing.sm}>
      <Box flexDirection="column" gap={spacing.xs}>
        <Text bold color={roles.accent}>Global Shortcuts</Text>
        {shortcuts.map(shortcut => (
          <KeyHint key={shortcut.key} keyLabel={shortcut.key} desc={shortcut.desc} />
        ))}
      </Box>

      <Separator />

      <Box flexDirection="column" gap={spacing.xs}>
        <Text bold color={roles.accent}>Navigation</Text>
        {viewShortcuts.map(shortcut => (
          <KeyHint key={shortcut.key} keyLabel={shortcut.key} desc={shortcut.desc} />
        ))}
      </Box>

      <Separator />

      <Box flexDirection="column" gap={spacing.xs}>
        <Text bold color={roles.accent}>List Navigation</Text>
        {navigationShortcuts.map(shortcut => (
          <KeyHint key={shortcut.key} keyLabel={shortcut.key} desc={shortcut.desc} />
        ))}
      </Box>
    </Box>
  );

  const renderCommands = () => (
    <Box flexDirection="column" gap={spacing.sm}>
      {commands.map((command, index) => (
        <Box key={index} flexDirection="column">
          <Text bold color={roles.accent}>{command.cmd}</Text>
          <Text color={roles.textMuted}>{command.desc}</Text>
        </Box>
      ))}
    </Box>
  );

  const renderTips = () => (
    <Box flexDirection="column" gap={spacing.sm}>
      {tips.map((tip, index) => (
        <Box key={index}>
          <Text color={roles.textMuted}>• {tip}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      width="100%"
      height="100%"
      borderStyle="double"
      borderColor={roles.accent}
      flexDirection="column"
    >
      <Panel title="Help" padding="sm">
        <Box flexDirection="column" gap={spacing.sm}>
          {/* Tab navigation */}
          <Box flexDirection="row" gap={spacing.lg}>
            <Text 
              color={activeTab === 'shortcuts' ? roles.accent : roles.textMuted}
              underline={activeTab === 'shortcuts'}
            >
              1. Shortcuts
            </Text>
            <Text 
              color={activeTab === 'commands' ? roles.accent : roles.textMuted}
              underline={activeTab === 'commands'}
            >
              2. Commands
            </Text>
            <Text 
              color={activeTab === 'tips' ? roles.accent : roles.textMuted}
              underline={activeTab === 'tips'}
            >
              3. Tips
            </Text>
          </Box>

          <Separator />

          {/* Tab content */}
          {activeTab === 'shortcuts' && renderShortcuts()}
          {activeTab === 'commands' && renderCommands()}
          {activeTab === 'tips' && renderTips()}

          <Separator />

          <Text color={roles.textMuted}>
            Press <Text color={roles.accent}>Escape</Text> to close • Use <Text color={roles.accent}>1/2/3</Text> to switch tabs
          </Text>
        </Box>
      </Panel>
    </Box>
  );
}

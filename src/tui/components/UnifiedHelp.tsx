import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { useTheme } from '../themes/theme-manager.js';
import { KeymapRegistry } from '../keyboard/keymap-registry.js';

interface UnifiedHelpProps {
  visible: boolean;
  onClose: () => void;
  currentView: string;
}

type HelpTab = 'shortcuts' | 'commands' | 'tips';

interface Command {
  id: string;
  label: string;
  description: string;
  category: string;
}

interface Tip {
  id: string;
  title: string;
  message: string;
  viewSpecific?: boolean;
}

const COMMANDS: Command[] = [
  { id: 'help', label: 'Show Help (?)', description: 'Display this help system', category: 'Help' },
  { id: 'palette', label: 'Command Palette (:)', description: 'Open command search', category: 'Navigation' },
  { id: 'quit', label: 'Quit (q)', description: 'Exit the application', category: 'System' },
  { id: 'refresh', label: 'Refresh (Ctrl+r)', description: 'Refresh current view', category: 'Actions' },
  { id: 'search', label: 'Search (s)', description: 'Enter search mode', category: 'Actions' },
  { id: 'select', label: 'Select (Space)', description: 'Toggle item selection', category: 'Selection' },
  { id: 'delete', label: 'Delete (d)', description: 'Delete selected items', category: 'Actions' },
  { id: 'restart', label: 'Restart (r)', description: 'Restart selected services', category: 'Actions' },
];

const TIPS: Tip[] = [
  { id: 'welcome', title: 'Welcome to ACI!', message: 'Use j/k or arrow keys to navigate. Press ? for help anytime.' },
  { id: 'selection', title: 'Selection Mode', message: 'Press Space to select items. Selected items enable bulk actions!' },
  { id: 'search', title: 'Quick Search', message: 'Press s to search, f for filters. Escape to clear.' },
  { id: 'help', title: 'Need Help?', message: 'Press ? to see all available shortcuts and commands.' },
  { id: 'optimistic', title: 'Instant Feedback', message: 'Actions execute immediately with background processing. Look for notifications!' },
];

export function UnifiedHelp({ visible, onClose, currentView }: UnifiedHelpProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<HelpTab>('shortcuts');
  const [searchQuery, setSearchQuery] = useState('');
  const keymapRegistry = KeymapRegistry.getInstance();

  useInput((input, key) => {
    if (!visible) return;

    if (key.escape || input === 'q') {
      onClose();
    } else if (key.tab) {
      const tabs: HelpTab[] = ['shortcuts', 'commands', 'tips'];
      const currentIndex = tabs.indexOf(activeTab);
      setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
    }
  });

  if (!visible) return null;

  const getShortcuts = () => {
    try {
      return keymapRegistry.getAvailableShortcuts(currentView, 'NAVIGATION', {
        selectedItems: [],
        searchActive: false,
        modalOpen: false,
        currentView
      });
    } catch {
      return [
        { key: 'j/↓', label: 'Move down', action: 'navigation' },
        { key: 'k/↑', label: 'Move up', action: 'navigation' },
        { key: 'Space', label: 'Select item', action: 'selection' },
        { key: 'd', label: 'Delete', action: 'action' },
        { key: 's', label: 'Search', action: 'action' }
      ];
    }
  };

  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    
    switch (activeTab) {
      case 'shortcuts':
        return getShortcuts().filter(s => 
          s.key.toLowerCase().includes(query) || 
          s.label.toLowerCase().includes(query)
        );
      case 'commands':
        return COMMANDS.filter(c => 
          c.label.toLowerCase().includes(query) || 
          c.description.toLowerCase().includes(query)
        );
      case 'tips':
        return TIPS.filter(t => 
          t.title.toLowerCase().includes(query) || 
          t.message.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      backgroundColor={colors.backgroundSecondary}
      borderStyle="double"
      borderColor={colors.highlights}
      flexDirection="column"
      padding={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlights}>
          ACI Help System - {currentView} view
        </Text>
        <Box marginLeft={2}>
          <Text color={colors.metadata}>
            Tab to cycle sections • Esc/q to close
          </Text>
        </Box>
      </Box>

      {/* Tabs */}
      <Box marginBottom={1}>
        {(['shortcuts', 'commands', 'tips'] as HelpTab[]).map((tab) => (
          <Box key={tab} marginRight={3}>
            <Text
              color={tab === activeTab ? colors.selections : colors.metadata}
              bold={tab === activeTab}
            >
              {tab === activeTab ? '▶ ' : '  '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Search */}
      <Box marginBottom={1}>
        <Box width={10}>
          <Text color={colors.features}>Search: </Text>
        </Box>
        <TextInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Type to filter..."
        />
      </Box>

      {/* Content */}
      <Box flexDirection="column" flexGrow={1}>
        {filteredData.length === 0 ? (
          <Text color={colors.warnings}>
            No {activeTab} found matching "{searchQuery}"
          </Text>
        ) : (
          filteredData.map((item: any, index) => (
            <Box key={item.id || index} marginBottom={1} flexDirection="column">
              {activeTab === 'shortcuts' && (
                <Box>
                  <Box width={15}>
                    <Text color={colors.features} bold>{item.key}</Text>
                  </Box>
                  <Text color={colors.primaryText}>{item.label}</Text>
                </Box>
              )}
              
              {activeTab === 'commands' && (
                <Box flexDirection="column">
                  <Box>
                    <Text color={colors.features} bold>{item.label}</Text>
                    <Text color={colors.metadata}> ({item.category})</Text>
                  </Box>
                  <Text color={colors.primaryText}>{item.description}</Text>
                </Box>
              )}
              
              {activeTab === 'tips' && (
                <Box flexDirection="column">
                  <Text color={colors.highlights} bold>{item.title}</Text>
                  <Text color={colors.primaryText}>{item.message}</Text>
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop paddingTop={1}>
        <Text color={colors.metadata}>
          {filteredData.length} {activeTab} shown • Tab to switch sections • Esc to close
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Simplified help hook
 */
export function useUnifiedHelp() {
  const [isVisible, setIsVisible] = useState(false);

  return {
    isVisible,
    showHelp: () => setIsVisible(true),
    hideHelp: () => setIsVisible(false),
    toggleHelp: () => setIsVisible(prev => !prev)
  };
}
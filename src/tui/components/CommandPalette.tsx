import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Select } from '@inkjs/ui';
import { useTheme } from '../themes/theme-manager.js';

interface Command {
  id: string;
  label: string;
  description: string;
  action: () => void;
  category: string;
  keywords: string[];
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (view: string, title?: string) => void;
  onAction: (action: string) => void;
}

export function CommandPalette({ visible, onClose, onNavigate, onAction }: CommandPaletteProps) {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'search' | 'select'>('search');

  // Define available commands
  const commands: Command[] = [
    // Navigation commands
    {
      id: 'nav-home',
      label: 'Go to Home',
      description: 'Navigate to the main dashboard',
      action: () => onNavigate('home', 'Home'),
      category: 'Navigation',
      keywords: ['home', 'main', 'dashboard']
    },
    {
      id: 'nav-services',
      label: 'Go to Services',
      description: 'Manage ArcGIS Server services',
      action: () => onNavigate('services', 'Services'),
      category: 'Navigation',
      keywords: ['services', 'server', 'arcgis']
    },
    {
      id: 'nav-users',
      label: 'Go to Users',
      description: 'Manage portal users',
      action: () => onNavigate('users', 'Users'),
      category: 'Navigation',
      keywords: ['users', 'people', 'accounts']
    },
    {
      id: 'nav-groups',
      label: 'Go to Groups',
      description: 'Manage user groups',
      action: () => onNavigate('groups', 'Groups'),
      category: 'Navigation',
      keywords: ['groups', 'teams', 'organizations']
    },
    {
      id: 'nav-items',
      label: 'Go to Items',
      description: 'Manage portal items',
      action: () => onNavigate('items', 'Items'),
      category: 'Navigation',
      keywords: ['items', 'content', 'layers', 'maps']
    },
    {
      id: 'nav-admin',
      label: 'Go to Admin',
      description: 'Server administration',
      action: () => onNavigate('admin', 'Admin'),
      category: 'Navigation',
      keywords: ['admin', 'administration', 'server']
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'Data analysis tools',
      action: () => onNavigate('analytics', 'Analytics'),
      category: 'Navigation',
      keywords: ['analytics', 'analysis', 'data', 'insights']
    },
    {
      id: 'nav-insights',
      label: 'Go to Insights',
      description: 'System insights and metrics',
      action: () => onNavigate('insights', 'Insights'),
      category: 'Navigation',
      keywords: ['insights', 'metrics', 'monitoring']
    },
    {
      id: 'nav-datastores',
      label: 'Go to Datastores',
      description: 'Manage data connections',
      action: () => onNavigate('datastores', 'Datastores'),
      category: 'Navigation',
      keywords: ['datastores', 'data', 'connections', 'databases']
    },
    
    // Action commands
    {
      id: 'action-refresh',
      label: 'Refresh Current View',
      description: 'Reload data in the current view',
      action: () => onAction('refresh'),
      category: 'Actions',
      keywords: ['refresh', 'reload', 'update']
    },
    {
      id: 'action-search',
      label: 'Search',
      description: 'Enter search mode',
      action: () => onAction('search'),
      category: 'Actions',
      keywords: ['search', 'find', 'filter']
    },
    {
      id: 'action-help',
      label: 'Show Help',
      description: 'Display keyboard shortcuts and help',
      action: () => onAction('help'),
      category: 'Help',
      keywords: ['help', 'shortcuts', 'documentation']
    },
    {
      id: 'action-quit',
      label: 'Quit Application',
      description: 'Exit the ACI tool',
      action: () => onAction('quit'),
      category: 'System',
      keywords: ['quit', 'exit', 'close']
    },
    
    // Utility commands
    {
      id: 'util-clear-selection',
      label: 'Clear Selection',
      description: 'Clear all selected items',
      action: () => onAction('clearSelection'),
      category: 'Utilities',
      keywords: ['clear', 'selection', 'deselect']
    },
    {
      id: 'util-select-all',
      label: 'Select All',
      description: 'Select all visible items',
      action: () => onAction('selectAll'),
      category: 'Utilities',
      keywords: ['select', 'all', 'everything']
    },
    {
      id: 'util-theme',
      label: 'Change Theme',
      description: 'Switch color theme',
      action: () => onAction('changeTheme'),
      category: 'Utilities',
      keywords: ['theme', 'colors', 'appearance']
    }
  ];

  // Filter commands based on search term
  const filteredCommands = commands.filter(command => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      command.label.toLowerCase().includes(term) ||
      command.description.toLowerCase().includes(term) ||
      command.keywords.some(keyword => keyword.includes(term)) ||
      command.category.toLowerCase().includes(term)
    );
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (!visible) return;

    if (key.escape) {
      onClose();
    } else if (key.return) {
      if (mode === 'search') {
        if (filteredCommands.length > 0) {
          setMode('select');
        }
      } else if (mode === 'select') {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          selectedCommand.action();
          onClose();
        }
      }
    } else if (key.downArrow || input === 'j') {
      if (mode === 'select') {
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredCommands.length - 1)
        );
      }
    } else if (key.upArrow || input === 'k') {
      if (mode === 'select') {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    } else if (key.tab) {
      setMode(prev => prev === 'search' ? 'select' : 'search');
    }
  });

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      setSearchTerm('');
      setSelectedIndex(0);
      setMode('search');
    }
  }, [visible]);

  // Reset selection when filtered commands change, but preserve user navigation
  useEffect(() => {
    setSelectedIndex(prev => {
      // Only reset if the previous index is now invalid
      if (prev >= filteredCommands.length) {
        return Math.max(0, filteredCommands.length - 1);
      }
      return prev;
    });
  }, [filteredCommands.length]);

  if (!visible) return null;

  // Group commands by category
  const commandsByCategory = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Box
      position="absolute"
      top={3}
      left="50%"
      marginLeft={-40}
      width={80}
      backgroundColor={colors.backgroundSecondary}
      borderStyle="double"
      borderColor={colors.highlights}
      flexDirection="column"
      padding={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlights}>
          Command Palette
        </Text>
        <Box marginLeft={2}>
          <Text color={colors.metadata}>
            Tab to switch modes • Enter to execute • Esc to close
          </Text>
        </Box>
      </Box>

      {/* Search input */}
      <Box marginBottom={1}>
        <Box width={12}>
          <Text color={colors.features} bold>
            Search: 
          </Text>
        </Box>
        <Box flexGrow={1}>
          {mode === 'search' ? (
            <TextInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Type to search commands..."
            />
          ) : (
            <Text color={colors.primaryText}>
              {searchTerm || 'All commands'}
            </Text>
          )}
        </Box>
      </Box>

      {/* Results */}
      <Box flexDirection="column" flexGrow={1} maxHeight={20}>
        {filteredCommands.length === 0 ? (
          <Text color={colors.warnings}>
            No commands found matching "{searchTerm}"
          </Text>
        ) : (
          Object.entries(commandsByCategory).map(([category, categoryCommands]) => (
            <Box key={category} flexDirection="column" marginBottom={1}>
              <Text bold color={colors.features}>
                {category}
              </Text>
              {categoryCommands.map((command, index) => {
                const globalIndex = filteredCommands.indexOf(command);
                const isSelected = mode === 'select' && globalIndex === selectedIndex;
                
                return (
                  <Box key={command.id} paddingLeft={2}>
                    <Text
                      color={isSelected ? colors.selections : colors.primaryText}
                      bold={isSelected}
                    >
                      {isSelected ? '▶ ' : '  '}
                      {command.label}
                    </Text>
                    <Box marginLeft={2}>
                      <Text color={colors.metadata} dimColor>
                        {command.description}
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop paddingTop={1}>
        <Text color={colors.metadata}>
          Mode: {mode === 'search' ? 'Search' : 'Select'} • 
          {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''} available
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Hook for command palette management
 */
export function useCommandPalette() {
  const [isVisible, setIsVisible] = useState(false);

  const showPalette = () => setIsVisible(true);
  const hidePalette = () => setIsVisible(false);
  const togglePalette = () => setIsVisible(prev => !prev);

  return {
    isVisible,
    showPalette,
    hidePalette,
    togglePalette
  };
}
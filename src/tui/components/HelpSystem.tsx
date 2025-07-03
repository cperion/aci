import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../themes/theme-manager.js';
import { KeymapRegistry } from '../keyboard/keymap-registry.js';
import { ModeDetector } from '../keyboard/mode-detector.js';

interface HelpSystemProps {
  visible: boolean;
  onClose: () => void;
  currentView?: string;
  currentMode?: string;
}

interface HelpSection {
  title: string;
  shortcuts: Array<{
    key: string;
    description: string;
    mode?: string[];
  }>;
}

export function HelpSystem({ visible, onClose, currentView = 'home', currentMode = 'NAVIGATION' }: HelpSystemProps) {
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState(0);
  const keymapRegistry = KeymapRegistry.getInstance();

  // Handle escape to close
  useInput((input, key) => {
    if (!visible) return;
    
    if (key.escape || input === 'q') {
      onClose();
    } else if (key.tab) {
      setActiveSection(prev => (prev + 1) % helpSections.length);
    } else if (key.downArrow || input === 'j') {
      setActiveSection(prev => Math.min(prev + 1, helpSections.length - 1));
    } else if (key.upArrow || input === 'k') {
      setActiveSection(prev => Math.max(prev - 1, 0));
    }
  });

  if (!visible) return null;

  // Get current view shortcuts
  const viewShortcuts = keymapRegistry.getAvailableShortcuts(currentView, currentMode as any, {
    selectedItems: [],
    searchActive: false,
    modalOpen: false,
    currentView
  });

  const helpSections: HelpSection[] = [
    {
      title: 'Global Shortcuts',
      shortcuts: [
        { key: '?', description: 'Show/hide this help' },
        { key: 'Esc', description: 'Go back or cancel' },
        { key: ':', description: 'Open command palette' },
        { key: 'q', description: 'Quit application' },
        { key: 'Ctrl+r', description: 'Refresh current view' },
        { key: 'Ctrl+e', description: 'Repeat last action' }
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { key: 'j / ↓', description: 'Move down' },
        { key: 'k / ↑', description: 'Move up' },
        { key: 'h / ←', description: 'Move left' },
        { key: 'l / →', description: 'Move right' },
        { key: 'Space', description: 'Select/toggle item' },
        { key: 'Enter', description: 'Execute default action' },
        { key: 'Tab', description: 'Next pane/section' }
      ]
    },
    {
      title: `Current View (${currentView})`,
      shortcuts: viewShortcuts.map(shortcut => ({
        key: shortcut.key,
        description: shortcut.label,
        mode: undefined // We'll get this from the keymap if needed
      }))
    },
    {
      title: 'Selection & Bulk Actions',
      shortcuts: [
        { key: 'Space', description: 'Toggle item selection', mode: ['NAVIGATION'] },
        { key: 'd', description: 'Delete selected items', mode: ['SELECTION'] },
        { key: 'D', description: 'Bulk delete all selected', mode: ['SELECTION'] },
        { key: 'r', description: 'Restart selected items', mode: ['SELECTION'] },
        { key: 'R', description: 'Bulk restart all selected', mode: ['SELECTION'] },
        { key: 'Esc', description: 'Clear selection', mode: ['SELECTION'] }
      ]
    },
    {
      title: 'Search & Filtering',
      shortcuts: [
        { key: 's', description: 'Enter search mode' },
        { key: 'f', description: 'Toggle filters' },
        { key: '/', description: 'Quick search' },
        { key: 'Esc', description: 'Exit search mode', mode: ['SEARCH'] },
        { key: 'Enter', description: 'Apply search', mode: ['SEARCH'] }
      ]
    },
    {
      title: 'View-Specific Shortcuts',
      shortcuts: [
        { key: 'l', description: 'Go to Login (from Home)' },
        { key: 's', description: 'Go to Services (from Home)' },
        { key: 'u', description: 'Go to Users (from Home)' },
        { key: 'g', description: 'Go to Groups (from Home)' },
        { key: 'i', description: 'Go to Items (from Home)' },
        { key: 'a', description: 'Go to Admin (from Home)' },
        { key: 'n', description: 'Go to Insights (from Home)' },
        { key: 't', description: 'Go to Analytics (from Home)' },
        { key: 'd', description: 'Go to Datastores (from Home)' }
      ]
    }
  ];

  const currentSection = helpSections[activeSection];

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
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={colors.highlights}>
          ACI Keyboard Shortcuts Help
        </Text>
        <Text color={colors.metadata}>
          Current: {currentView} view, {currentMode} mode
        </Text>
        <Text color={colors.metadata}>
          Use ↑↓ or j/k to navigate sections, Tab to cycle, Esc/q to close
        </Text>
      </Box>

      {/* Navigation tabs */}
      <Box marginBottom={1}>
        {helpSections.map((section, index) => (
          <Box key={section.title} marginRight={2}>
            <Text
              color={index === activeSection ? colors.selections : colors.metadata}
              bold={index === activeSection}
            >
              {index === activeSection ? '▶ ' : '  '}
              {section.title}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Content area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Text bold color={colors.highlights} marginBottom={1}>
          {currentSection.title}
        </Text>
        
        {currentSection.shortcuts.length === 0 ? (
          <Text color={colors.metadata}>No shortcuts available for this section</Text>
        ) : (
          <Box flexDirection="column">
            {currentSection.shortcuts.map((shortcut, index) => (
              <Box key={`${shortcut.key}-${index}`} marginBottom={0}>
                <Box width={20}>
                  <Text color={colors.features} bold>
                    {shortcut.key}
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <Text color={colors.primaryText}>
                    {shortcut.description}
                  </Text>
                  {shortcut.mode && (
                    <Text color={colors.metadata}>
                      {' '}({shortcut.mode.join(', ')} mode)
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderColor={colors.metadata} paddingX={1}>
        <Text color={colors.metadata}>
          Press ? to toggle help • Esc or q to close • Tab to switch sections
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Hook for managing help system state
 */
export function useHelpSystem() {
  const [isVisible, setIsVisible] = useState(false);

  const showHelp = () => setIsVisible(true);
  const hideHelp = () => setIsVisible(false);
  const toggleHelp = () => setIsVisible(prev => !prev);

  return {
    isVisible,
    showHelp,
    hideHelp,
    toggleHelp
  };
}
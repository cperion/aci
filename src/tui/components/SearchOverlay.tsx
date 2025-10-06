import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../primitives/Panel';
import { useTheme } from '../design/theme';
import { useEntitiesStore } from '../../state/entities';
import { useNavigationStore } from '../../state/navigation';
import { FilterInput } from './FilterInput';

interface SearchOverlayProps {
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose }) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const getNode = useEntitiesStore((state) => state.getNode);
  const { setScope, path } = useNavigationStore();

  // Get all searchable nodes
  const allNodes = useMemo(() => {
    const nodes = Object.values(useEntitiesStore.getState().byId);
    return nodes.filter(node => node.name || node.url);
  }, []);

  // Filter nodes based on query
  const filteredNodes = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return allNodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery) ||
      node.kind.toLowerCase().includes(lowerQuery) ||
      node.url.toLowerCase().includes(lowerQuery)
    );
  }, [allNodes, query]);

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      if (filteredNodes[selectedIndex]) {
        const selectedNode = filteredNodes[selectedIndex];
        // Navigate to the selected node
        // This would need more sophisticated path reconstruction
        console.log('Navigate to:', selectedNode.name);
      }
      onClose();
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => Math.min(filteredNodes.length - 1, prev + 1));
      return;
    }

    if (key.ctrl && input === 'c') {
      onClose();
      return;
    }
  });

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getKindGlyph = (kind: string): string => {
    switch (kind) {
      case 'serverRoot': return '🌐';
      case 'serverFolder': return '📁';
      case 'serverService': return '🗺️';
      case 'serverLayer': return '📍';
      case 'serverTable': return '📊';
      case 'serverOperation': return '⚡';
      case 'portalRoot': return '🏛️';
      case 'portalUsers': return '👥';
      case 'portalUser': return '👤';
      case 'portalGroups': return '👨‍👩‍👧‍👦';
      case 'portalGroup': return '👥';
      case 'portalItems': return '📦';
      case 'portalItem': return '📄';
      case 'portalOperation': return '⚡';
      default: return '📎';
    }
  };

  return (
    <Panel title="Global Search" width="80%">
      <Box flexDirection="column" gap={1}>
        {/* Search input */}
        <Box flexDirection="row">
          <FilterInput
            value={query}
            onChange={setQuery}
            onSubmit={() => {
              if (filteredNodes[selectedIndex]) {
                console.log('Navigate to:', filteredNodes[selectedIndex].name);
              }
              onClose();
            }}
            onCancel={onClose}
            placeholder="Search nodes..."
          />
        </Box>

        {/* Results */}
        {query && (
          <Box flexDirection="column" height={15}>
            {filteredNodes.length === 0 ? (
              <Box justifyContent="center" alignItems="center" height={10}>
                <Text color={theme.textMuted}>No results found</Text>
              </Box>
            ) : (
              filteredNodes.slice(0, 10).map((node, index) => (
                <Box key={node.id} paddingLeft={1}>
                  <Text
                    backgroundColor={index === selectedIndex ? theme.selectionBg : undefined}
                    color={index === selectedIndex ? theme.selectionFg : theme.text}
                  >
                    {index === selectedIndex ? '▶' : ' '} {getKindGlyph(node.kind)} {node.name}
                  </Text>
                  <Text color={theme.textMuted}>
                    {' '}· {node.kind}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        )}

        {/* Help text */}
        <Box flexDirection="column">
          <Text color={theme.textMuted}>
            Type to search • ↑↓ or j/k to navigate • Enter to select • Esc to close
          </Text>
        </Box>
      </Box>
    </Panel>
  );
};
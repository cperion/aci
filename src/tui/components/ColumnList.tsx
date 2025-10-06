import React, { useMemo, useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ColumnState, Node } from '../data/types';
import { useEntitiesStore } from '../state/entities';
import { useNavigationStore } from '../state/navigation';
import { useTheme } from '../design/theme';
import { FilterInput } from './FilterInput';

interface ColumnListProps {
  column: ColumnState;
  isActive: boolean;
  onSelect: (index: number) => void;
  height: number;
}

export const ColumnList: React.FC<ColumnListProps> = ({ 
  column, 
  isActive, 
  onSelect, 
  height 
}) => {
  const theme = useTheme();
  const getNode = useEntitiesStore((state) => state.getNode);
  const [filterMode, setFilterMode] = useState(false);
  const [filterValue, setFilterValue] = useState(column.filter);
  const [tempSelectedIndex, setTempSelectedIndex] = useState(column.selectedIndex);
  const [scrollOffset, setScrollOffset] = useState(0);

  const visibleNodes = useMemo(() => {
    const isNode = (v: Node | undefined): v is Node => !!v;
    let nodes: Node[] = column.nodes.map(id => getNode(id)).filter(isNode);
    
    // Apply filter if present
    if (filterValue) {
      const filter = filterValue.toLowerCase();
      nodes = nodes.filter(node => 
        node.name.toLowerCase().includes(filter) ||
        node.kind.toLowerCase().includes(filter)
      );
    }

    return nodes;
  }, [column.nodes, filterValue, getNode]);

  // Sync temp selection with store when not in filter mode
  useEffect(() => {
    if (!filterMode) {
      setTempSelectedIndex(column.selectedIndex);
    }
  }, [column.selectedIndex, filterMode]);

  // Clamp temp selection within filtered results
  useEffect(() => {
    if (visibleNodes.length > 0) {
      setTempSelectedIndex(prev => Math.min(prev, visibleNodes.length - 1));
    } else {
      setTempSelectedIndex(0);
    }
  }, [visibleNodes.length]);

  // Handle keyboard input for filter mode
  useInput((input, key) => {
    if (!isActive) return;

    if (filterMode) {
      if (key.escape) {
        setFilterMode(false);
        setFilterValue('');
        useNavigationStore.getState().clearFilter();
        return;
      }

      if (key.return) {
        setFilterMode(false);
        useNavigationStore.getState().setFilter(filterValue);
        // Move store selection to temp selected index
        onSelect(tempSelectedIndex);
        return;
      }

      // Handle j/k navigation during filter mode
      if (input === 'j' || key.downArrow) {
        setTempSelectedIndex(prev => 
          Math.min(prev + 1, visibleNodes.length - 1)
        );
        return;
      }

      if (input === 'k' || key.upArrow) {
        setTempSelectedIndex(prev => 
          Math.max(prev - 1, 0)
        );
        return;
      }
    } else {
      // Handle entering filter mode
      if (input === '/') {
        setFilterMode(true);
        setFilterValue(column.filter);
        return;
      }
    }
  }, { isActive: true });

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

  const renderContent = () => {
    const contentHeight = filterMode ? height - 1 : height;

    if (column.loading) {
      return (
        <Box flexDirection="column" height={contentHeight}>
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.textMuted}>Loading...</Text>
          </Box>
        </Box>
      );
    }

    if (column.error) {
      return (
        <Box flexDirection="column" height={contentHeight}>
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Box flexDirection="column" alignItems="center">
              <Text color={theme.danger}>Error: {column.error}</Text>
              <Text color={theme.textMuted}>Press 'r' to retry</Text>
            </Box>
          </Box>
        </Box>
      );
    }

    if (visibleNodes.length === 0) {
      return (
        <Box flexDirection="column" height={contentHeight}>
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.textMuted}>
              {filterValue ? 'No matches found' : 'No items'}
            </Text>
          </Box>
        </Box>
      );
    }

    // Use temp selection during filter mode, store selection otherwise
    const currentSelectedIndex = filterMode ? tempSelectedIndex : column.selectedIndex;
    
    // Calculate visible range for virtualization with scroll offset
    const centerIndex = currentSelectedIndex + scrollOffset;
    const startIndex = Math.max(0, centerIndex - Math.floor(contentHeight / 2));
    const endIndex = Math.min(visibleNodes.length, startIndex + contentHeight);
    const visibleRange = visibleNodes.slice(startIndex, endIndex);

    return (
      <Box flexDirection="column" height={contentHeight}>
        {visibleRange.map((node, index) => {
          const actualIndex = startIndex + index;
          const isSelected = actualIndex === currentSelectedIndex;
          const glyph = getKindGlyph(node.kind);

          return (
            <Box key={node.id}>
              <Text
                backgroundColor={isSelected ? theme.selectionBg : undefined}
                color={isSelected ? theme.selectionFg : theme.text}
              >
                {isSelected ? '▶' : ' '} {glyph} {node.name}
              </Text>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box
      flexDirection="column"
      borderStyle={isActive ? 'single' : undefined}
      borderColor={isActive ? theme.focus : theme.border}
      paddingX={1}
    >
      {/* Filter input */}
      {filterMode && (
        <Box marginBottom={1}>
          <FilterInput
            value={filterValue}
            onChange={setFilterValue}
            onSubmit={() => {
              setFilterMode(false);
              useNavigationStore.getState().setFilter(filterValue);
            }}
            onCancel={() => {
              setFilterMode(false);
              setFilterValue('');
              useNavigationStore.getState().clearFilter();
            }}
            placeholder="Filter this column..."
          />
        </Box>
      )}

      {/* Content */}
      {renderContent()}

      {/* Filter indicator */}
      {filterValue && !filterMode && (
        <Box marginTop={1}>
          <Text color={theme.textMuted}>
            Filter: {filterValue} (Press '/' to edit, Esc to clear)
          </Text>
        </Box>
      )}
      
      {/* Filter mode indicator */}
      {filterMode && (
        <Box marginTop={1}>
          <Text color={theme.info}>
            Filter mode: j/k to navigate, Enter to apply, Esc to cancel
          </Text>
        </Box>
      )}
    </Box>
  );
};
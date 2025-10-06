import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ColumnState } from '../../data/types';
import { useEntitiesStore } from '../../state';
import { useTheme } from '../../design/roles';
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

  const visibleNodes = useMemo(() => {
    let nodes = column.nodes.map(id => getNode(id)).filter(Boolean);
    
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

  // Handle keyboard input for filter mode
  useInput((input, key) => {
    if (!isActive || !filterMode) return;

    if (key.escape) {
      setFilterMode(false);
      setFilterValue('');
      return;
    }

    if (key.return) {
      setFilterMode(false);
      return;
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

    // Calculate visible range for virtualization
    const startIndex = Math.max(0, column.selectedIndex - Math.floor(contentHeight / 2));
    const endIndex = Math.min(visibleNodes.length, startIndex + contentHeight);
    const visibleRange = visibleNodes.slice(startIndex, endIndex);

    return (
      <Box flexDirection="column" height={contentHeight}>
        {visibleRange.map((node, index) => {
          const actualIndex = startIndex + index;
          const isSelected = actualIndex === column.selectedIndex;
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
              // Apply filter to column state
              // This would need to be handled by the parent component
            }}
            onCancel={() => {
              setFilterMode(false);
              setFilterValue('');
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
    </Box>
  );
};
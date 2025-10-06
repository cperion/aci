import React, { useEffect } from 'react';
import { Box } from 'ink';
import { useNavigationStore } from '../../state/navigation';
import { useEntitiesStore } from '../../state/entities';
import { useUiStore } from '../../state/ui';
import { useKeyboardManager } from '../../keyboard';
import { ColumnList } from './ColumnList';
import { Inspector } from '../layout/Inspector';

interface MillerColumnsProps {
  height: number;
  width: number;
}

export const MillerColumns: React.FC<MillerColumnsProps> = ({ height, width }) => {
  const {
    columns,
    activeColumn,
    loadRoot,
  } = useNavigationStore();

  const getNode = useEntitiesStore((state) => state.getNode);
  const { overlays } = useUiStore();

  // Set up keyboard manager
  const { updateContext } = useKeyboardManager({
    currentScope: 'miller',
    overlayVisible: false,
    millerActive: true,
  });

  // Update keyboard context when overlays change
  useEffect(() => {
    const activeOverlay = Object.entries(overlays).find(([, active]) => active)?.[0];
    updateContext({
      overlayVisible: !!activeOverlay,
      activeOverlay,
    });
  }, [overlays, updateContext]);

  // Load root data on mount
  useEffect(() => {
    void loadRoot();
  }, [loadRoot]);

  // Calculate column widths
  const columnWidth = Math.floor(width / columns.length);
  const inspectorWidth = Math.floor(width * 0.25);
  const columnsWidth = width - inspectorWidth;

  const selectedNode = columns[activeColumn]?.nodes[columns[activeColumn].selectedIndex];
  const node = selectedNode ? getNode(selectedNode) : null;

  return (
    <Box flexDirection="row" height={height} width={width}>
      {/* Columns */}
      <Box flexDirection="row" width={columnsWidth}>
        {columns.map((column, index) => (
          <Box key={index} width={columnWidth}>
            <ColumnList
              column={column}
              isActive={index === activeColumn}
              onSelect={(selectedIndex) => {
                // This would need to update the column's selected index
                // For now, we'll use the store's moveSelection
                const { moveSelection } = useNavigationStore.getState();
                const delta = selectedIndex - column.selectedIndex;
                moveSelection(delta);
              }}
              height={height}
            />
          </Box>
        ))}
      </Box>

      {/* Inspector */}
      {node && (
        <Box width={inspectorWidth}>
          <Inspector node={node} height={height} />
        </Box>
      )}
    </Box>
  );
};
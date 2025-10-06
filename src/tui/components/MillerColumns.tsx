import React, { useEffect } from 'react';
import { Box } from 'ink';
import { useNavigationStore } from '../state/navigation';
import { useEntitiesStore } from '../state/entities';
// no overlay handling here; keyboard manager is at app level

import { ColumnList } from './ColumnList';
import { Inspector } from '../layout/Inspector';

// Constants for inspector gating
const MIN_WIDTH_FOR_INSPECTOR = 120;

interface MillerColumnsProps {
  height: number | string;
  width: number | string;
}

export const MillerColumns: React.FC<MillerColumnsProps> = ({ height, width }) => {
  const {
    columns,
    activeColumn,
    loadRoot,
  } = useNavigationStore();

  const getNode = useEntitiesStore((state) => state.getNode);

  // Load root data on mount
  useEffect(() => {
    void loadRoot();
  }, [loadRoot]);

  // Calculate column widths
  const w = typeof width === 'string' ? 100 : width;
  const h = typeof height === 'string' ? 100 : height;
  const totalWidth = Number(w) || 100;
  const totalHeight = Number(h) || 100;
  const columnWidth = Math.floor(totalWidth / Math.max(1, columns.length));

  const inspectorVisible = useNavigationStore((s) => s.inspectorVisible);
  const showInspector = Boolean(inspectorVisible) && (columns.length < 3 || totalWidth >= MIN_WIDTH_FOR_INSPECTOR);
  const inspectorWidth = showInspector ? Math.floor(totalWidth * 0.25) : 0;
  const columnsWidth = totalWidth - inspectorWidth;

  const selectedNode = columns[activeColumn]?.nodes[columns[activeColumn].selectedIndex];
  const node = selectedNode ? getNode(selectedNode) : null;

  return (
    <Box flexDirection="row" height={totalHeight} width={totalWidth}>
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
              height={totalHeight}
            />
          </Box>
        ))}
      </Box>

      {/* Inspector */}
      {showInspector && node && (
        <Box width={inspectorWidth}>
          <Inspector node={node} height={totalHeight} />
        </Box>
      )}
    </Box>
  );
};

import { create } from 'zustand';
import type { MillerState, ColumnState, Node } from '../data/types';
import { listServerRoot, listServerFolder, listServiceChildren, listLayerOperations } from '../data/arcgis/server';
import { listPortalRoot, listPortalUsers, listPortalGroups, listPortalItems, listPortalUserItems, listPortalItemOperations } from '../data/arcgis/portal';
import { useEntitiesStore } from './entities';
import { useUiStore } from './ui';

interface NavigationState extends MillerState {}

interface NavigationActions {
  setScope: (scope: 'server' | 'portal') => void;
  focusColumn: (index: number) => void;
  moveSelection: (delta: number) => void;
  enter: () => Promise<void>;
  up: () => void;
  setFilter: (value: string) => void;
  clearFilter: () => void;
  refresh: () => Promise<void>;
  toggleInspector: () => void;
}

export type NavigationSlice = NavigationState & NavigationActions & {
  loadRoot: () => void;
  loadChildrenForSelection: () => void;
};

function createInitialColumn(): ColumnState {
  return {
    parentId: null,
    nodes: [],
    selectedIndex: 0,
    filter: '',
    loading: false,
  };
}

export const useNavigationStore = create<NavigationSlice>((set, get) => ({
  // Initial state
  scope: 'server',
  activeColumn: 0,
  columns: [createInitialColumn(), createInitialColumn()],
  path: [],
  inspectorVisible: false,

  setScope: (scope: 'server' | 'portal') => {
    set({ 
      scope,
      columns: [createInitialColumn(), createInitialColumn()],
      path: [],
      activeColumn: 0,
    });
    // Load root for the new scope
    void get().loadRoot();
  },

  focusColumn: (index: number) => {
    const { columns } = get();
    if (index >= 0 && index < columns.length) {
      set({ activeColumn: index });
    }
  },

  moveSelection: (delta: number) => {
    const { activeColumn, columns } = get();
    const column = columns[activeColumn];
    if (!column) return;

    const filteredNodes = getFilteredNodes(column);
    if (filteredNodes.length === 0) return;

    const newIndex = Math.max(0, Math.min(filteredNodes.length - 1, column.selectedIndex + delta));
    
    set((state) => {
      const newColumns = [...state.columns];
      newColumns[activeColumn] = { ...column, selectedIndex: newIndex };
      return { columns: newColumns };
    });

    // Load children for the new selection
    void get().loadChildrenForSelection();
  },

  enter: async () => {
    const { activeColumn, columns } = get();
    const column = columns[activeColumn];
    if (!column) return;

    const filteredNodes = getFilteredNodes(column);
    const selectedNode = filteredNodes[column.selectedIndex];
    if (!selectedNode) return;

    // Move to next column or create one if needed
    if (activeColumn < columns.length - 1) {
      set({ activeColumn: activeColumn + 1 });
    } else {
      // Add a new column
      set((state) => ({
        columns: [...state.columns, createInitialColumn()],
        activeColumn: activeColumn + 1,
      }));
    }

    // Update path
    set((state) => ({
      path: [...state.path.slice(0, activeColumn + 1), selectedNode.id],
    }));

    // Load children in the new column
    void get().loadChildrenForSelection();
  },

  up: () => {
    const { activeColumn, path } = get();
    if (activeColumn === 0) return;

    set({ 
      activeColumn: activeColumn - 1,
      path: path.slice(0, -1),
    });

    // Remove the last column if we have more than 2
    set((state) => {
      if (state.columns.length > 2) {
        return { columns: state.columns.slice(0, -1) };
      }
      return state;
    });
  },

  setFilter: (value: string) => {
    const { activeColumn, columns } = get();
    const column = columns[activeColumn];
    if (!column) return;

    set((state) => {
      const newColumns = [...state.columns];
      newColumns[activeColumn] = { ...column, filter: value, selectedIndex: 0 };
      return { columns: newColumns };
    });
  },

  clearFilter: () => {
    get().setFilter('');
  },

  refresh: async () => {
    const { activeColumn, columns } = get();
    const column = columns[activeColumn];
    if (!column) return;

    const filteredNodes = getFilteredNodes(column);
    const selectedNode = filteredNodes[column.selectedIndex];
    if (!selectedNode) return;

    // Invalidate the node and reload children
    useEntitiesStore.getState().invalidate(selectedNode.id);
    void get().loadChildrenForSelection();
  },

  toggleInspector: () => {
    set((state) => ({ inspectorVisible: !state.inspectorVisible }));
  },

  // Helper methods
  loadRoot: async () => {
    const { scope } = get();
    const { upsertNodes } = useEntitiesStore.getState();
    
    set((state) => {
      const newColumns = [...state.columns];
      newColumns[0] = { ...newColumns[0], loading: true, error: undefined };
      return { columns: newColumns };
    });

    try {
      let nodes;
      if (scope === 'server') {
        // For now, use a default server URL - this should come from config
        nodes = await listServerRoot('https://sampleserver6.arcgisonline.com/arcgis/rest/services');
      } else {
        // For now, use a default portal URL - this should come from config
        nodes = await listPortalRoot('https://www.arcgis.com/sharing/rest');
      }

      upsertNodes(nodes);
      
      set((state) => {
        const newColumns = [...state.columns];
        newColumns[0] = {
          ...newColumns[0],
          nodes: nodes.map(n => n.id),
          loading: false,
        };
        return { columns: newColumns };
      });
    } catch (error) {
      useUiStore.getState().pushNotice({
        level: 'error',
        text: `Failed to load root: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      set((state) => {
        const newColumns = [...state.columns];
        newColumns[0] = {
          ...newColumns[0],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load',
        };
        return { columns: newColumns };
      });
    }
  },

  loadChildrenForSelection: async () => {
    const { activeColumn, columns } = get();
    const column = columns[activeColumn];
    if (!column) return;

    const filteredNodes = getFilteredNodes(column);
    const selectedNode = filteredNodes[column.selectedIndex];
    if (!selectedNode) return;

    // Check if children are already loaded
    if (selectedNode.childrenLoaded) return;

    // Set loading state on the next column
    const nextColumnIndex = activeColumn + 1;
    set((state) => {
      const newColumns = [...state.columns];
      if (nextColumnIndex < newColumns.length) {
        newColumns[nextColumnIndex] = { ...newColumns[nextColumnIndex], loading: true, error: undefined };
      }
      return { columns: newColumns };
    });

    try {
      let children;
      const { upsertNodes } = useEntitiesStore.getState();

      // Load children based on node kind
      switch (selectedNode.kind) {
        case 'serverFolder':
          children = await listServerFolder(selectedNode.url);
          break;
        case 'serverService':
          children = await listServiceChildren(selectedNode.url);
          break;
        case 'serverLayer':
        case 'serverTable':
          children = await listLayerOperations(selectedNode.url);
          break;
        case 'portalUsers':
          children = await listPortalUsers(selectedNode.url.replace('/users', ''));
          break;
        case 'portalUser':
          children = await listPortalUserItems(selectedNode.url);
          break;
        case 'portalGroups':
          children = await listPortalGroups(selectedNode.url.replace('/groups', ''));
          break;
        case 'portalItems':
          children = await listPortalItems(selectedNode.url.replace('/content/items', ''));
          break;
        case 'portalItem':
          children = await listPortalItemOperations(selectedNode.url);
          break;
        default:
          children = [];
      }

      upsertNodes(children);
      
      // Update the parent node
      upsertNodes([{
        ...selectedNode,
        children: children.map(c => c.id),
        childrenLoaded: true,
        childrenCount: children.length,
      }]);

      set((state) => {
        const newColumns = [...state.columns];
        if (nextColumnIndex < newColumns.length) {
          newColumns[nextColumnIndex] = {
            ...newColumns[nextColumnIndex],
            parentId: selectedNode.id,
            nodes: children.map(c => c.id),
            loading: false,
          };
        }
        return { columns: newColumns };
      });
    } catch (error) {
      useUiStore.getState().pushNotice({
        level: 'error',
        text: `Failed to load children: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      set((state) => {
        const newColumns = [...state.columns];
        if (nextColumnIndex < newColumns.length) {
          newColumns[nextColumnIndex] = {
            ...newColumns[nextColumnIndex],
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load',
          };
        }
        return { columns: newColumns };
      });
    }
  },
}));

// Helper function to get filtered nodes
function getFilteredNodes(column: ColumnState): Node[] {
  const { getNode } = useEntitiesStore.getState();
  
  if (!column.filter) {
    return column.nodes.map(id => getNode(id)).filter(Boolean) as Node[];
  }

  const filter = column.filter.toLowerCase();
  return column.nodes
    .map(id => getNode(id))
    .filter(Boolean)
    .filter((node: Node) => 
      node.name.toLowerCase().includes(filter) ||
      node.kind.toLowerCase().includes(filter)
    ) as Node[];
}
import { create } from 'zustand';
import type { MillerState, ColumnState, Node } from '../data/types';
import { 
  listServerRoot, 
  listServiceChildren, 
  listLayerOperations,
  listPortalRoot, 
  listPortalUsers, 
  listPortalGroups, 
  listPortalItems, 
  listPortalItemOperations 
} from '../data/adapters';
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
  navigateToNode: (nodeId: string) => Promise<void>;
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
      const currentColumn = newColumns[0] || createInitialColumn();
      newColumns[0] = { 
        ...currentColumn, 
        loading: true, 
        error: undefined,
      };
      return { columns: newColumns };
    });

    try {
      let nodes;
      if (scope === 'server') {
        nodes = await listServerRoot();
      } else {
        nodes = await listPortalRoot();
      }

      upsertNodes(nodes, null); // Root nodes have no parent
      
      set((state) => {
        const newColumns = [...state.columns];
        const currentColumn = newColumns[0] || createInitialColumn();
        newColumns[0] = {
          ...currentColumn,
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
        const currentColumn = newColumns[0] || createInitialColumn();
        newColumns[0] = {
          ...currentColumn,
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
        const targetColumn = newColumns[nextColumnIndex] || createInitialColumn();
        newColumns[nextColumnIndex] = { 
          ...targetColumn, 
          loading: true, 
          error: undefined,
        };
      }
      return { columns: newColumns };
    });

    try {
      let children: Node[];
      const { upsertNodes } = useEntitiesStore.getState();

      // Load children based on node kind
      switch (selectedNode.kind) {
        case 'serverService':
          children = await listServiceChildren(selectedNode.url);
          break;
        case 'serverLayer':
        case 'serverTable':
          children = await listLayerOperations(selectedNode.url);
          break;
        case 'portalUsers':
          children = await listPortalUsers();
          break;
        case 'portalGroups':
          children = await listPortalGroups();
          break;
        case 'portalItems':
          children = await listPortalItems();
          break;
        case 'portalItem':
          children = await listPortalItemOperations(selectedNode.url);
          break;
        default:
          children = [];
      }

      upsertNodes(children, selectedNode.id); // Set parent relationship
      
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
          const targetColumn = newColumns[nextColumnIndex] || createInitialColumn();
          newColumns[nextColumnIndex] = {
            ...targetColumn,
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
          const targetColumn = newColumns[nextColumnIndex] || createInitialColumn();
          newColumns[nextColumnIndex] = {
            ...targetColumn,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load',
          };
        }
        return { columns: newColumns };
      });
    }
  },

  navigateToNode: async (nodeId: string) => {
    const { getParent } = useEntitiesStore.getState();

    // Build path by walking parents map
    const pathIds: string[] = [];
    let currentId: string | null = nodeId;
    while (currentId !== null) {
      pathIds.push(currentId);
      currentId = getParent(currentId);
    }
    const pathFromRoot = pathIds.reverse();

    // Reset columns and load root
    set({ columns: [createInitialColumn(), createInitialColumn()], path: [], activeColumn: 0 });
    await get().loadRoot();

    // Step through each segment, selecting and entering
    for (let i = 0; i < pathFromRoot.length; i++) {
      const targetId = pathFromRoot[i];
      const { activeColumn, columns } = get();
      const column = columns[activeColumn];
      if (!column) break;

      const filteredNodes = getFilteredNodes(column);
      const idx = filteredNodes.findIndex(n => n.id === targetId);
      if (idx < 0) {
        useUiStore.getState().pushNotice({ level: 'warn', text: 'Target path not fully cached; navigate stepwise.' });
        break;
      }

      // Select target in this column
      set((state) => {
        const newColumns = [...state.columns];
        newColumns[activeColumn] = { ...column, selectedIndex: idx };
        return { columns: newColumns };
      });

      // Enter unless last segment
      if (i < pathFromRoot.length - 1) {
        await get().enter();
      }
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
  const isNode = (v: Node | undefined): v is Node => !!v;
  return column.nodes
    .map(id => getNode(id))
    .filter(isNode)
    .filter((node: Node) => 
      node.name.toLowerCase().includes(filter) ||
      node.kind.toLowerCase().includes(filter)
    );
}

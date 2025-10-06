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

interface NavigationState extends MillerState {
  serverHost?: string;
  portalHost?: string;
}

interface NavigationActions {
  setScope: (scope: 'server' | 'portal') => void;
  setHosts: (serverHost?: string, portalHost?: string) => void;
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
  serverHost: undefined,
  portalHost: undefined,
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

  setHosts: (serverHost?: string, portalHost?: string) => {
    set({ serverHost, portalHost });
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
    const { scope, serverHost, portalHost } = get();
    const { upsertNodes } = useEntitiesStore.getState();
    
    // Check if required host is available
    const host = scope === 'server' ? serverHost : portalHost;
    if (!host) {
      useUiStore.getState().pushNotice({
        level: 'warn',
        text: `Please set ${scope} host using CLI flags`,
      });
      return;
    }
    
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
        nodes = await listServerRoot(serverHost!);
      } else {
        nodes = await listPortalRoot(portalHost!);
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
    const { activeColumn, columns, serverHost, portalHost } = get();
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
          children = await listPortalUsers(portalHost!);
          break;
        case 'portalGroups':
          children = await listPortalGroups(portalHost!);
          break;
        case 'portalItems':
          children = await listPortalItems(portalHost!);
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
    
    // Reverse to get path from root to target
    const pathFromRoot = pathIds.reverse();
    
    // Reset columns and rebuild path
    set((state) => ({
      columns: [createInitialColumn(), createInitialColumn()],
      path: [],
      activeColumn: 0,
    }));

    // Load and navigate step by step
    for (let i = 0; i < pathFromRoot.length; i++) {
      const targetId = pathFromRoot[i];
      
      // For root level, make sure we have the root loaded
      if (i === 0) {
        await get().loadRoot();
      }
      
      // Find the target node in the current column
      const { activeColumn, columns } = get();
      const column = columns[activeColumn];
      if (!column) continue;
      
      const filteredNodes = getFilteredNodes(column);
      const targetIndex = filteredNodes.findIndex(node => node.id === targetId);
      
      if (targetIndex >= 0) {
        // Select the target node
        set((state) => {
          const newColumns = [...state.columns];
          newColumns[activeColumn] = { ...column, selectedIndex: targetIndex };
          return { columns: newColumns };
        });
        
        // If not the last node, enter it to load children
        if (i < pathFromRoot.length - 1) {
          await get().enter();
        }
      } else {
        // Node not found, try to load parent's children first
        if (i > 0) {
          const parentId = pathFromRoot[i - 1];
          if (parentId) { // Add type guard
            const parentNode = useEntitiesStore.getState().getNode(parentId);
            if (parentNode && !parentNode.childrenLoaded) {
            // Go back to parent and load children
            set((state) => ({ activeColumn: Math.max(0, activeColumn - 1) }));
            await get().loadChildrenForSelection();
            
            // Try again to find the target
            const { columns: updatedColumns } = get();
            const updatedColumn = updatedColumns[activeColumn];
            if (updatedColumn) {
              const updatedFilteredNodes = getFilteredNodes(updatedColumn);
              const updatedTargetIndex = updatedFilteredNodes.findIndex(node => node.id === targetId);
              
              if (updatedTargetIndex >= 0) {
                set((state) => {
                  const newColumns = [...state.columns];
                  newColumns[activeColumn] = { ...updatedColumn, selectedIndex: updatedTargetIndex };
                  return { columns: newColumns };
                });
                
                if (i < pathFromRoot.length - 1) {
                  await get().enter();
                }
              }
            }
          }
        }
        }
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
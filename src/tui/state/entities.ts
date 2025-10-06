import { create } from 'zustand';
import type { Node } from '../data/types';

interface EntitiesState {
  byId: Record<string, Node>;
  parents: Record<string, string | null>;
}

interface EntitiesActions {
  upsertNodes: (nodes: Node[], parentId?: string | null) => void;
  getNode: (id: string) => Node | undefined;
  getParent: (id: string) => string | null;
  setParent: (childId: string, parentId: string | null) => void;
  invalidate: (id: string) => void;
}

export type EntitiesSlice = EntitiesState & EntitiesActions;

export const useEntitiesStore = create<EntitiesSlice>((set, get) => ({
  byId: {},
  parents: {},

  upsertNodes: (nodes: Node[], parentId?: string | null) => {
    set((state) => {
      const newById = { ...state.byId };
      const newParents = { ...state.parents };
      
      for (const node of nodes) {
        newById[node.id] = node;
        // Set parent if provided
        if (parentId !== undefined) {
          newParents[node.id] = parentId;
        }
      }
      
      return { byId: newById, parents: newParents };
    });
  },

  getNode: (id: string) => {
    return get().byId[id];
  },

  getParent: (id: string) => {
    return get().parents[id] ?? null;
  },

  setParent: (childId: string, parentId: string | null) => {
    set((state) => ({
      parents: {
        ...state.parents,
        [childId]: parentId,
      },
    }));
  },

  invalidate: (id: string) => {
    set((state) => {
      const node = state.byId[id];
      if (!node) return state;
      
      return {
        byId: {
          ...state.byId,
          [id]: {
            ...node,
            childrenLoaded: false,
            children: undefined,
            childrenCount: undefined,
            error: undefined,
          },
        },
      };
    });
  },
}));
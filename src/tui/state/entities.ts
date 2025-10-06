import { create } from 'zustand';
import type { Node } from '../data/types';

interface EntitiesState {
  byId: Record<string, Node>;
}

interface EntitiesActions {
  upsertNodes: (nodes: Node[]) => void;
  getNode: (id: string) => Node | undefined;
  invalidate: (id: string) => void;
}

export type EntitiesSlice = EntitiesState & EntitiesActions;

export const useEntitiesStore = create<EntitiesSlice>((set, get) => ({
  byId: {},

  upsertNodes: (nodes: Node[]) => {
    set((state) => {
      const newById = { ...state.byId };
      for (const node of nodes) {
        newById[node.id] = node;
      }
      return { byId: newById };
    });
  },

  getNode: (id: string) => {
    return get().byId[id];
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
/**
 * Entity store with Zustand
 * Manages state for users, groups, items, services, and admin entities
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debugLog } from '../utils/debug.ts';
import { TuiCommandService } from '../../services/tui-command-service.ts';
import { useAuthStore } from './auth-store.ts';
import type { EntityState, StoreSetOptions } from './types.ts';

// Entity configurations
const entityConfigs = {
  users: {
    extractors: {
      searchableText: (user: any) => [user.username, user.fullName, user.email, user.role].filter(Boolean).join(' '),
      id: (user: any) => user.username,
      displayText: (user: any) => `${user.fullName || user.username} (${user.role})`
    },
    defaultLimit: 200
  },
  groups: {
    extractors: {
      searchableText: (group: any) => [group.title, group.description, group.owner, ...(group.tags || [])].filter(Boolean).join(' '),
      id: (group: any) => group.id,
      displayText: (group: any) => `${group.title} (${group.memberCount || 0} members)`
    },
    defaultLimit: 200
  },
  items: {
    extractors: {
      searchableText: (item: any) => [item.title, item.description, item.type, item.owner, ...(item.tags || [])].filter(Boolean).join(' '),
      id: (item: any) => item.id,
      displayText: (item: any) => `${item.title} (${item.type})`
    },
    defaultLimit: 200
  },
  services: {
    extractors: {
      searchableText: (service: any) => [service.name, service.description, service.type, service.url].filter(Boolean).join(' '),
      id: (service: any) => service.url,
      displayText: (service: any) => `${service.name} (${service.type})`
    },
    defaultLimit: 100
  },
  admin: {
    extractors: {
      searchableText: (admin: any) => [admin.name, admin.email, admin.role, admin.machine].filter(Boolean).join(' '),
      id: (admin: any) => admin.email,
      displayText: (admin: any) => `${admin.name} (${admin.role})`
    },
    defaultLimit: 50
  }
};

interface EntityStoreActions {
  // Search actions
  setSearchTerm: (entityType: string, term: string) => void;
  fetchEntities: (entityType: string, query?: string) => Promise<void>;
  clearSearch: (entityType: string) => void;
  
  // Selection actions
  toggleSelection: (entityType: string, id: string) => void;
  selectAll: (entityType: string) => void;
  clearSelection: (entityType: string) => void;
  isItemSelected: (entityType: string, id: string) => boolean;
  
  // Navigation
  setCurrentIndex: (entityType: string, index: number) => void;
  getCurrentItem: (entityType: string) => any | null;
  
  // Filters
  setFilter: (entityType: string, filterId: string, value: string) => void;
  clearFilters: (entityType: string) => void;
  
  // Internal helpers
  applyFiltersAndSearch: (entityType: string, items: any[]) => any[];
  getFilteredItems: (entityType: string) => any[];
}

interface EntityStoreInternal {
  // Internal state
  _searchTimers: Record<string, NodeJS.Timeout>;
  _commandServices: Record<string, TuiCommandService>;
  _debug: {
    lastUpdate: number;
    source: string;
    operation: string;
  };
}

// Entity state without actions
type EntityStoreState = EntityState & {
  // Internal state
  _searchTimers?: Record<string, NodeJS.Timeout>;
  _commandServices?: Record<string, TuiCommandService>;
  _debug?: {
    lastUpdate: number;
    source: string;
    operation: string;
  };
};

// Full store interface
interface EntityStore extends EntityStoreState, EntityStoreActions {}

export const useEntityStore = create<EntityStore>()(
  subscribeWithSelector((set, get) => {
    // Initialize internal state
    const searchTimers: Record<string, NodeJS.Timeout> = {};
    const commandServices: Record<string, TuiCommandService> = {};
    
    // Initialize entity state
    const initialState: EntityState = {
      users: {
        items: [],
        selected: new Set(),
        selectedIds: [],
        selectedMap: {},
        filters: {},
        search: {
          term: '',
          debouncedTerm: '',
          isLoading: false,
          error: null
        },
        currentIndex: 0
      },
      groups: {
        items: [],
        selected: new Set(),
        selectedIds: [],
        selectedMap: {},
        filters: {},
        search: {
          term: '',
          debouncedTerm: '',
          isLoading: false,
          error: null
        },
        currentIndex: 0
      },
      items: {
        items: [],
        selected: new Set(),
        selectedIds: [],
        selectedMap: {},
        filters: {},
        search: {
          term: '',
          debouncedTerm: '',
          isLoading: false,
          error: null
        },
        currentIndex: 0
      },
      services: {
        items: [],
        selected: new Set(),
        selectedIds: [],
        selectedMap: {},
        filters: {},
        search: {
          term: '',
          debouncedTerm: '',
          isLoading: false,
          error: null
        },
        currentIndex: 0
      },
      admin: {
        items: [],
        selected: new Set(),
        selectedIds: [],
        selectedMap: {},
        filters: {},
        search: {
          term: '',
          debouncedTerm: '',
          isLoading: false,
          error: null
        },
        currentIndex: 0
      }
    };
    
    Object.keys(entityConfigs).forEach(entityType => {
      // Initialize command service with auth context
      const { portalSession } = useAuthStore.getState();
      commandServices[entityType] = new TuiCommandService(portalSession || undefined);
    });
    
    return {
      ...initialState,
      
      // Internal state
      _searchTimers: searchTimers,
      _commandServices: commandServices,
      _debug: {
        lastUpdate: 0,
        source: 'initial',
        operation: 'init'
      },
      
      // Actions
      setSearchTerm: (entityType, term) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('search' in entityState)) return;
        
        // Clear existing timer
        const searchTimers = get()._searchTimers;
        if (searchTimers && searchTimers[entityType]) {
          clearTimeout(searchTimers[entityType]);
        }
        
        // Update search term immediately
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            search: {
              ...entityState.search,
              term
            }
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'setSearchTerm',
            operation: 'update-term'
          };
          return newState;
        });
        
        // Set debounced update
        const timer = setTimeout(() => {
          set((state) => {
            const currentEntityState = state[entityType as keyof EntityState];
            if (!currentEntityState || typeof currentEntityState !== 'object' || !('search' in currentEntityState)) return state;
            
            const newState = { ...state };
            (newState as any)[entityType] = {
              ...currentEntityState,
              search: {
                ...currentEntityState.search,
                debouncedTerm: term
              }
            };
            (newState as any)._debug = {
              lastUpdate: Date.now(),
              source: 'setSearchTerm',
              operation: 'debounced-update'
            };
            return newState;
          });
          
          debugLog('setSearchTerm', { entityType, term }, 'user');
        }, 300);
        
        // Store timer reference
        set((state) => {
          const newState = { ...state };
          newState._searchTimers = {
            ...(state._searchTimers || {}),
            [entityType]: timer
          };
          return newState;
        });
      },
      
      fetchEntities: async (entityType, query) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('search' in entityState)) return;
        
        const config = entityConfigs[entityType as keyof typeof entityConfigs];
        if (!config) return;
        
        // Set loading state
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            search: {
              ...entityState.search,
              isLoading: true,
              error: null
            }
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'fetchEntities',
            operation: 'start-loading'
          };
          return newState;
        });
        
        try {
          const service = get()._commandServices?.[entityType];
          if (!service) return;
          
          let result;
          
          if (query) {
            // Search with query
            switch (entityType) {
              case 'users':
                result = (await service.searchUsers(query, { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'groups':
                result = (await service.searchGroups(query, { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'items':
                result = (await service.searchItems(query, { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'services':
                result = (await service.searchServices(query, { limit: config.defaultLimit })).data || [];
                break;
              default:
                result = [];
            }
          } else {
            // Get all entities - use search with wildcard
            switch (entityType) {
              case 'users':
                result = (await service.searchUsers('*', { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'groups':
                result = (await service.searchGroups('*', { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'items':
                result = (await service.searchItems('*', { limit: config.defaultLimit })).data?.results || [];
                break;
              case 'services':
                result = (await service.searchServices('*', { limit: config.defaultLimit })).data || [];
                break;
              default:
                result = [];
            }
          }
          
          // Update with results
          set((state) => {
            const currentEntityState = state[entityType as keyof EntityState];
            if (!currentEntityState || typeof currentEntityState !== 'object' || !('search' in currentEntityState)) return state;
            
            const newState = { ...state };
            (newState as any)[entityType] = {
              ...currentEntityState,
              items: result,
              search: {
                ...currentEntityState.search,
                isLoading: false,
                error: null
              },
              currentIndex: 0
            };
            (newState as any)._debug = {
              lastUpdate: Date.now(),
              source: 'fetchEntities',
              operation: 'success'
            };
            return newState;
          });
          
          debugLog('fetchEntities', { entityType, count: result.length }, 'user');
        } catch (error) {
          // Handle error
          set((state) => {
            const currentEntityState = state[entityType as keyof EntityState];
            if (!currentEntityState || typeof currentEntityState !== 'object' || !('search' in currentEntityState)) return state;
            
            const newState = { ...state };
            (newState as any)[entityType] = {
              ...currentEntityState,
              search: {
                ...currentEntityState.search,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch entities'
              }
            };
            (newState as any)._debug = {
              lastUpdate: Date.now(),
              source: 'fetchEntities',
              operation: 'error'
            };
            return newState;
          });
          
          debugLog('fetchEntities error', { entityType, error }, 'system');
        }
      },
      
      clearSearch: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('search' in entityState)) return;
        
        // Clear timer
        const searchTimers = get()._searchTimers;
        if (searchTimers && searchTimers[entityType]) {
          clearTimeout(searchTimers[entityType]);
          set((state) => {
            const newState = { ...state };
            newState._searchTimers = {
              ...(state._searchTimers || {})
            };
            delete newState._searchTimers[entityType];
            return newState;
          });
        }
        
        // Reset search state
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            search: {
              term: '',
              debouncedTerm: '',
              isLoading: false,
              error: null
            },
            currentIndex: 0
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'clearSearch',
            operation: 'reset'
          };
          return newState;
        });
        
        debugLog('clearSearch', { entityType }, 'user');
      },
      
      toggleSelection: (entityType, id) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) return;
        
        const newSelected = new Set(entityState.selected);
        const newSelectedIds = entityState.selectedIds.includes(id)
          ? entityState.selectedIds.filter(item => item !== id)
          : [...entityState.selectedIds, id];
        
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            selected: newSelected,
            selectedIds: newSelectedIds,
            selectedMap: Object.fromEntries(newSelectedIds.map(id => [id, true]))
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'toggleSelection',
            operation: 'toggle'
          };
          return newState;
        });
        
        debugLog('toggleSelection', { entityType, id, selected: newSelected.has(id) }, 'user');
      },
      
      selectAll: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) return;
        
        const filteredItems = get().getFilteredItems(entityType);
        const selectedIds = filteredItems.map(item => {
          const config = entityConfigs[entityType as keyof typeof entityConfigs];
          return config ? config.extractors.id(item) : item.id;
        });
        
        debugLog('selectAll', { entityType, count: filteredItems.length }, 'user');
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            selected: new Set(selectedIds),
            selectedIds: selectedIds,
            selectedMap: Object.fromEntries(selectedIds.map(id => [id, true]))
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'selectAll',
            operation: 'select-all'
          };
          return newState;
        });
      },
      
      clearSelection: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) return;
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            selected: new Set(),
            selectedIds: [],
            selectedMap: {}
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'clearSelection',
            operation: 'clear'
          };
          return newState;
        });\n        \n        debugLog('clearSelection', { entityType }, 'user');\n      },\n      \n      // Backwards compatibility adapter - ensures old code still works\n      // while new code can use value-stable properties\n      _adaptSelectionForLegacy: (entityType) => {\n        const entityState = get()[entityType as keyof EntityState];\n        if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) return entityState;\n        \n        // Ensure Set is synchronized with selectedIds for legacy code\n        const currentSet = entityState.selected;\n        const targetSet = new Set(entityState.selectedIds);\n        \n        // Only update if Sets are different to avoid unnecessary re-renders\n        if (currentSet.size !== targetSet.size || ![...currentSet].every(id => targetSet.has(id))) {\n          set((state) => {\n            const newState = { ...state };\n            (newState as any)[entityType] = {\n              ...entityState,\n              selected: targetSet\n            };
            return newState;
          });
n        }\n        \n        return entityState;\n      },
      
      isItemSelected: (entityType, id) => {
        const entityState = get()[entityType as keyof EntityState];
        return entityState && typeof entityState === 'object' && 'selected' in entityState 
          ? entityState.selected.has(id) 
          : false;
      },
      
      setCurrentIndex: (entityType, index) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('currentIndex' in entityState)) return;
        
        const filteredItems = get().getFilteredItems(entityType);
        const validIndex = Math.max(0, Math.min(index, filteredItems.length - 1));
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            currentIndex: validIndex
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'setCurrentIndex',
            operation: 'set-index'
          };
          return newState;
        });
      },
      
      getCurrentItem: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('currentIndex' in entityState)) return null;
        
        const filteredItems = get().getFilteredItems(entityType);
        return filteredItems[entityState.currentIndex] || null;
      },
      
      setFilter: (entityType, filterId, value) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('filters' in entityState)) return;
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            filters: {
              ...entityState.filters,
              [filterId]: value
            },
            currentIndex: 0
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'setFilter',
            operation: 'set-filter'
          };
          return newState;
        });
        
        debugLog('setFilter', { entityType, filterId, value }, 'user');
      },
      
      clearFilters: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('filters' in entityState)) return;
        
        set((state) => {
          const newState = { ...state };
          (newState as any)[entityType] = {
            ...entityState,
            filters: {},
            currentIndex: 0
          };
          (newState as any)._debug = {
            lastUpdate: Date.now(),
            source: 'clearFilters',
            operation: 'clear-filters'
          };
          return newState;
        });
        
        debugLog('clearFilters', { entityType }, 'user');
      },

      // Internal helpers
      applyFiltersAndSearch: (entityType, items) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('search' in entityState)) return items;
        
        let filtered = [...items];
        
        // Apply search term
        if (entityState.search.debouncedTerm.trim()) {
          const searchLower = entityState.search.debouncedTerm.toLowerCase();
          const config = entityConfigs[entityType as keyof typeof entityConfigs];
          if (!config) return filtered;
          
          const extractor = config.extractors.searchableText;
          
          filtered = filtered.filter(item => {
            const searchableText = extractor(item).toLowerCase();
            return searchableText.includes(searchLower);
          });
        }
        
        // Apply filters
        Object.entries(entityState.filters).forEach(([filterId, filterValue]) => {
          if (filterValue && filterValue !== 'all') {
            filtered = filtered.filter(item => {
              const value = (item as any)[filterId];
              return String(value).toLowerCase() === String(filterValue).toLowerCase();
            });
          }
        });
        
        return filtered;
      },

      getFilteredItems: (entityType) => {
        const entityState = get()[entityType as keyof EntityState];
        if (!entityState || typeof entityState !== 'object' || !('items' in entityState)) return [];
        return get().applyFiltersAndSearch(entityType, entityState.items);
      }
    };
  })
);

// Export selectors for common use cases
export const selectEntityState = (entityType: string) => (state: EntityStore) => {
  const entityState = state[entityType as keyof EntityState];
  if (!entityState || typeof entityState !== 'object' || !('items' in entityState)) {
    return {
      items: [],
      selected: new Set(),
      filters: {},
      search: {
        term: '',
        debouncedTerm: '',
        isLoading: false,
        error: null
      },
      currentIndex: 0,
      filteredItems: [],
      totalCount: 0,
      filteredCount: 0,
      hasSelection: false,
      selectionCount: 0
    };
  }
  
  const filteredItems = state.getFilteredItems(entityType);
  
  return {
    ...entityState,
    filteredItems,
    totalCount: entityState.items.length,
    filteredCount: filteredItems.length,
    hasSelection: entityState.selected.size > 0,
    selectionCount: entityState.selected.size
  };
};

export const selectEntitySearch = (entityType: string) => (state: EntityStore) => {
  const entityState = state[entityType as keyof EntityState];
  if (!entityState || typeof entityState !== 'object' || !('search' in entityState)) {
    return {
      term: '',
      debouncedTerm: '',
      isLoading: false,
      error: null
    };
  }
  return entityState.search;
};

export const selectEntitySelection = (entityType: string) => (state: EntityStore) => {
  const entityState = state[entityType as keyof EntityState];
  if (!entityState || typeof entityState !== 'object' || !('selected' in entityState)) {
    return {
      selected: [],
      count: 0,
      hasSelection: false
    };
  }
  return {
    selected: Array.from(entityState.selected),
    count: entityState.selected.size,
    hasSelection: entityState.selected.size > 0
  };
};

// Hook for entity operations
export const useEntityActions = (entityType: string) => {
  return useEntityStore((state) => ({
    setSearchTerm: (term: string) => state.setSearchTerm(entityType, term),
    fetchEntities: (query?: string) => state.fetchEntities(entityType, query),
    clearSearch: () => state.clearSearch(entityType),
    toggleSelection: (id: string) => state.toggleSelection(entityType, id),
    selectAll: () => state.selectAll(entityType),
    clearSelection: () => state.clearSelection(entityType),
    isItemSelected: (id: string) => state.isItemSelected(entityType, id),
    setCurrentIndex: (index: number) => state.setCurrentIndex(entityType, index),
    getCurrentItem: () => state.getCurrentItem(entityType),
    setFilter: (filterId: string, value: string) => state.setFilter(entityType, filterId, value),
    clearFilters: () => state.clearFilters(entityType)
  }));
};
/**
 * Shared Entity Search Hook - Eliminates search/filter duplication across views
 * Implements the abstraction pattern recommended by DeepSeek analysis
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TuiCommandService } from '../../services/tui-command-service.js';
import type { CommandResult } from '../../types/command-result.js';
import { useAuth } from '../../hooks/use-auth.js';

export type EntityType = 'users' | 'groups' | 'items' | 'services' | 'admin';

export interface FilterDimension {
  id: string;
  type: 'categorical' | 'temporal' | 'numeric';
  options?: string[];
  label: string;
}

export interface SearchState<T> {
  items: T[];
  filteredItems: T[];
  currentIndex: number;
  searchTerm: string;
  isLoading: boolean;
  error: string;
  hasSearched: boolean;
}

export interface SearchActions {
  setSearchTerm: (term: string) => void;
  setCurrentIndex: (index: number) => void;
  applyFilter: (filterId: string, value: string) => void;
  clearFilters: () => void;
  refresh: () => void;
  getCurrentItem: () => any | null;
}

interface UseEntitySearchOptions<T> {
  entityType: EntityType;
  initialQuery?: string;
  extractors: {
    searchableText: (item: T) => string;
    id: (item: T) => string;
    displayText: (item: T) => string;
  };
  filters?: FilterDimension[];
  searchFields?: string[];
  debounceMs?: number;
}

/**
 * Universal entity search hook that eliminates duplication across views
 */
export function useEntitySearch<T>({
  entityType,
  initialQuery = '',
  extractors,
  filters = [],
  debounceMs = 300
}: UseEntitySearchOptions<T>) {
  const { authState } = useAuth();
  const { portalSession } = authState;
  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Core state
  const [state, setState] = useState<SearchState<T>>({
    items: [],
    filteredItems: [],
    currentIndex: 0,
    searchTerm: initialQuery,
    isLoading: true,
    error: '',
    hasSearched: false
  });

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      let result: CommandResult<any>;
      
      switch (entityType) {
        case 'users':
          result = await commandService.searchUsers('*', { limit: 200 });
          break;
        case 'groups':
          result = await commandService.searchGroups('*', { limit: 200 });
          break;
        case 'items':
          result = await commandService.searchItems('*', { limit: 200 });
          break;
        case 'services':
          result = await commandService.searchServices('*', { limit: 200 });
          break;
        case 'admin':
          result = await commandService.listServices();
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      if (result.success && result.data) {
        const items = Array.isArray(result.data) ? result.data : 
                     result.data.results || [result.data];
        
        setState(prev => ({
          ...prev,
          items: items as T[],
          filteredItems: items as T[],
          isLoading: false,
          hasSearched: true
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || `Failed to load ${entityType}`,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : `Network error loading ${entityType}`,
        isLoading: false
      }));
    }
  }, [commandService, entityType]);

  // Apply search and filters
  const applySearchAndFilters = useCallback(() => {
    let filtered = state.items;

    // Apply search term
    if (state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableText = extractors.searchableText(item).toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Apply active filters
    for (const [filterId, filterValue] of Object.entries(activeFilters)) {
      if (filterValue && filterValue !== 'all') {
        const filterDimension = filters.find(f => f.id === filterId);
        if (filterDimension) {
          filtered = filtered.filter(item => {
            const value = (item as any)[filterId];
            if (filterDimension.type === 'categorical') {
              return String(value).toLowerCase() === filterValue.toLowerCase();
            }
            // Add temporal and numeric filtering as needed
            return true;
          });
        }
      }
    }

    setState(prev => ({
      ...prev,
      filteredItems: filtered,
      currentIndex: 0
    }));
  }, [state.items, state.searchTerm, activeFilters, extractors, filters]);

  // Debounced search
  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      applySearchAndFilters();
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, debounceMs, applySearchAndFilters]);

  // Other actions
  const setCurrentIndex = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.filteredItems.length - 1))
    }));
  }, []);

  const applyFilter = useCallback((filterId: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const getCurrentItem = useCallback((): T | null => {
    return state.filteredItems[state.currentIndex] || null;
  }, [state.filteredItems, state.currentIndex]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters when they change
  useEffect(() => {
    applySearchAndFilters();
  }, [activeFilters, applySearchAndFilters]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Navigation helpers
  const moveUp = useCallback(() => {
    setCurrentIndex(state.currentIndex - 1);
  }, [state.currentIndex, setCurrentIndex]);

  const moveDown = useCallback(() => {
    setCurrentIndex(state.currentIndex + 1);
  }, [state.currentIndex, setCurrentIndex]);

  return {
    // State
    ...state,
    activeFilters,
    
    // Actions
    setSearchTerm,
    setCurrentIndex,
    applyFilter,
    clearFilters,
    refresh,
    getCurrentItem,
    moveUp,
    moveDown,
    
    // Computed
    isEmpty: state.hasSearched && state.filteredItems.length === 0,
    hasFilters: Object.keys(activeFilters).length > 0,
    filterCount: Object.values(activeFilters).filter(v => v && v !== 'all').length,
    
    // Statistics
    totalCount: state.items.length,
    filteredCount: state.filteredItems.length,
    searchResultCount: state.searchTerm ? state.filteredItems.length : state.items.length
  };
}

/**
 * Preset configurations for common entity types
 */
export const entityConfigs = {
  users: {
    extractors: {
      searchableText: (user: any) => [user.username, user.fullName, user.email, user.role].filter(Boolean).join(' '),
      id: (user: any) => user.username,
      displayText: (user: any) => `${user.fullName || user.username} (${user.role})`
    },
    filters: [
      { id: 'role', type: 'categorical' as const, label: 'Role' }
    ]
  },
  
  groups: {
    extractors: {
      searchableText: (group: any) => [group.title, group.description, group.owner, ...(group.tags || [])].filter(Boolean).join(' '),
      id: (group: any) => group.id,
      displayText: (group: any) => `${group.title} (${group.memberCount || 0} members)`
    },
    filters: [
      { id: 'access', type: 'categorical' as const, label: 'Access Level', options: ['all', 'private', 'org', 'public'] }
    ]
  },
  
  items: {
    extractors: {
      searchableText: (item: any) => [item.title, item.type, item.owner, item.description, ...(item.tags || [])].filter(Boolean).join(' '),
      id: (item: any) => item.id,
      displayText: (item: any) => `${item.title} (${item.type})`
    },
    filters: [
      { id: 'type', type: 'categorical' as const, label: 'Item Type' },
      { id: 'access', type: 'categorical' as const, label: 'Access Level' }
    ]
  }
};

/**
 * Convenience hooks for specific entity types
 */
export const useUserSearch = (options?: Partial<UseEntitySearchOptions<any>>) =>
  useEntitySearch({ entityType: 'users', ...entityConfigs.users, ...options });

export const useGroupSearch = (options?: Partial<UseEntitySearchOptions<any>>) =>
  useEntitySearch({ entityType: 'groups', ...entityConfigs.groups, ...options });

export const useItemSearch = (options?: Partial<UseEntitySearchOptions<any>>) =>
  useEntitySearch({ entityType: 'items', ...entityConfigs.items, ...options });
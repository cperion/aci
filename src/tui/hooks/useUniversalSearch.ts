/**
 * Universal Search Hook - React integration for the search engine
 * Provides debounced search with prefetching and error handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchEngine } from '../search/SearchEngine.js';
import type { SearchResult, SearchOptions, SearchableType } from '../search/SearchEngine.js';
import { TuiCommandService } from '../../services/tui-command-service.js';
import { useAuthStore } from '../stores/index.js';

interface UseUniversalSearchOptions extends SearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  minQueryLength?: number;
}

interface SearchState {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  query: string;
}

export function useUniversalSearch(options: UseUniversalSearchOptions = {}) {
  const portalSession = useAuthStore(state => state.portalSession);
  const {
    debounceMs = 300,
    autoSearch = true,
    minQueryLength = 2,
    ...searchOptions
  } = options;

  // Initialize search engine
  const searchEngine = useMemo(() => {
    return new SearchEngine(new TuiCommandService(portalSession || undefined));
  }, [portalSession]);

  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
    query: ''
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < minQueryLength) {
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        error: null,
        hasSearched: false,
        query
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query
    }));

    try {
      const results = await searchEngine.search(query, searchOptions);
      
      setState(prev => ({
        ...prev,
        results,
        isLoading: false,
        hasSearched: true
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
        hasSearched: true
      }));
    }
  }, [searchEngine, minQueryLength, searchOptions]);

  // Search function with debouncing
  const search = useCallback((query: string) => {
    // Clear existing timer using functional update
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }
      return null;
    });

    // Set new timer
    const timer = setTimeout(() => {
      if (autoSearch) {
        performSearch(query);
      }
    }, debounceMs);

    setDebounceTimer(timer);
    
    // Update query immediately for UI feedback
    setState(prev => ({
      ...prev,
      query,
      isLoading: query.length >= minQueryLength
    }));
  }, [debounceMs, autoSearch, performSearch, minQueryLength]);

  // Immediate search (no debounce)
  const searchNow = useCallback((query: string) => {
    // Clear existing timer using functional update
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }
      return null;
    });
    performSearch(query);
  }, [performSearch]);

  // Clear search results
  const clear = useCallback(() => {
    // Use functional update to access latest timer state
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }
      return null;
    });
    
    setState({
      results: [],
      isLoading: false,
      error: null,
      hasSearched: false,
      query: ''
    });
  }, []);

  // Filter results by type
  const filterByType = useCallback((type: SearchableType) => {
    return state.results.filter(result => result.type === type);
  }, [state.results]);

  // Get results grouped by type
  const resultsByType = useMemo(() => {
    const grouped: Record<SearchableType, SearchResult[]> = {
      users: [],
      groups: [],
      items: [],
      services: [],
      admin: []
    };

    for (const result of state.results) {
      if (grouped[result.type]) {
        grouped[result.type].push(result);
      }
    }

    return grouped;
  }, [state.results]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return searchEngine.getCacheStats();
  }, [searchEngine]);

  // Clear cache
  const clearCache = useCallback(() => {
    searchEngine.clearCache();
  }, [searchEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setDebounceTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });
    };
  }, []);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    hasSearched: state.hasSearched,
    query: state.query,
    resultsByType,
    
    // Actions
    search,
    searchNow,
    clear,
    filterByType,
    
    // Utilities
    getCacheStats,
    clearCache,
    
    // Statistics
    totalResults: state.results.length,
    isEmpty: state.hasSearched && state.results.length === 0,
    hasQuery: state.query.length >= minQueryLength
  };
}

/**
 * Hook for searching within a specific data type only
 */
export function useTypeSearch(type: SearchableType, options: UseUniversalSearchOptions = {}) {
  return useUniversalSearch({
    ...options,
    types: [type]
  });
}

/**
 * Hook for getting recent searches (could be enhanced with localStorage)
 */
export function useRecentSearches(maxRecent: number = 10) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const addRecentSearch = useCallback((query: string) => {
    if (query.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, maxRecent);
    });
  }, [maxRecent]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
}
/**
 * Universal Search Component - Global search interface with results
 * Implements fzf-like search experience with keyboard navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner } from '@inkjs/ui';
import { useUniversalSearch, useRecentSearches } from '../hooks/useUniversalSearch.js';
import type { SearchResult, SearchableType } from '../search/SearchEngine.js';
import { useTheme } from '../themes/theme-manager.js';
import { useNavigation } from '../../hooks/use-navigation.js';

interface UniversalSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  maxResults?: number;
}

const TYPE_COLORS: Record<SearchableType, string> = {
  users: 'blue',
  groups: 'green', 
  items: 'yellow',
  services: 'cyan',
  admin: 'red'
};

const TYPE_ICONS: Record<SearchableType, string> = {
  users: '👤',
  groups: '👥',
  items: '📄',
  services: '⚙️',
  admin: '🔧'
};

export function UniversalSearch({ 
  visible, 
  onClose, 
  onSelect,
  placeholder = "Search everything...",
  maxResults = 20 
}: UniversalSearchProps) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const [selection, setSelection] = useState<any>({});
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showRecent, setShowRecent] = useState(true);
  
  const {
    results,
    isLoading,
    error,
    hasSearched,
    search,
    clear,
    resultsByType,
    totalResults,
    isEmpty
  } = useUniversalSearch({
    limit: maxResults,
    debounceMs: 150,
    minQueryLength: 1
  });

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  } = useRecentSearches();

  // Update search when query changes
  useEffect(() => {
    if (query.trim()) {
      search(query);
      setShowRecent(false);
    } else {
      clear();
      setShowRecent(true);
      setSelectedIndex(0);
    }
  }, [query, search, clear]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle item selection
  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(query);
    
    if (onSelect) {
      onSelect(result);
    } else {
      // Default navigation behavior
      switch (result.type) {
        case 'users':
          setSelection({ itemId: result.id });
          navigate('user-detail', `User: ${result.title}`);
          break;
        case 'groups':
          setSelection({ itemId: result.id });
          navigate('group-detail', `Group: ${result.title}`);
          break;
        case 'items':
          setSelection({ itemId: result.id });
          navigate('item-detail', `Item: ${result.title}`);
          break;
        case 'services':
          setSelection({ serviceId: result.id });
          navigate('service-detail', `Service: ${result.title}`);
          break;
        case 'admin':
          navigate('admin', 'Server Administration');
          break;
      }
    }
    
    onClose();
  }, [query, onSelect, addRecentSearch, setSelection, navigate, onClose]);

  // Keyboard navigation
  useInput((input, key) => {
    if (!visible) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      if (showRecent && recentSearches.length > 0) {
        const recentQuery = recentSearches[selectedIndex];
        if (recentQuery) {
          setQuery(recentQuery);
          return;
        }
      } else if (results.length > 0) {
        const selectedResult = results[selectedIndex];
        if (selectedResult) {
          handleSelect(selectedResult);
          return;
        }
      }
    }

    if (key.upArrow) {
      const maxIndex = showRecent ? recentSearches.length - 1 : results.length - 1;
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    if (key.downArrow) {
      const maxIndex = showRecent ? recentSearches.length - 1 : results.length - 1;
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    }

    // Clear recent searches
    if (key.ctrl && input === 'r' && showRecent) {
      clearRecentSearches();
    }
  });

  if (!visible) return null;

  const displayResults = results.slice(0, maxResults);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={colors.highlights}
      paddingX={1}
      paddingY={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.highlights}>🔍 Universal Search</Text>
        <Box marginLeft={2}>
          <Text dimColor>Esc to close</Text>
        </Box>
      </Box>

      {/* Search Input */}
      <Box marginBottom={1}>
        <TextInput
          placeholder={placeholder}
          defaultValue={query}
          onChange={(value) => setQuery(value)}
        />
      </Box>

      {/* Loading Indicator */}
      {isLoading && (
        <Box marginBottom={1}>
          <Spinner label="Searching..." />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Box marginBottom={1}>
          <Text color={colors.errors}>Error: {error}</Text>
        </Box>
      )}

      {/* Recent Searches */}
      {showRecent && recentSearches.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color={colors.labels}>Recent Searches:</Text>
          {recentSearches.slice(0, 5).map((recentQuery, index) => (
            <Box key={`recent-${index}`}>
              <Text color={selectedIndex === index ? colors.highlights : colors.metadata}>
                {selectedIndex === index ? '▶ ' : '  '}
                🔍 {recentQuery}
              </Text>
            </Box>
          ))}
          {recentSearches.length > 0 && (
            <Text dimColor>Ctrl+R to clear recent</Text>
          )}
        </Box>
      )}

      {/* Search Results */}
      {hasSearched && !showRecent && (
        <Box flexDirection="column">
          {isEmpty ? (
            <Text color={colors.warnings}>No results found for "{query}"</Text>
          ) : (
            <>
              <Box marginBottom={1}>
                <Text bold color={colors.labels}>
                  Results ({totalResults}):
                </Text>
                {Object.entries(resultsByType).map(([type, typeResults]) => (
                  typeResults.length > 0 && (
                    <Box key={type} marginLeft={2}>
                      <Text color={colors.metadata}>
                        {TYPE_ICONS[type as SearchableType]} {type}: {typeResults.length}
                      </Text>
                    </Box>
                  )
                ))}
              </Box>

              <Box flexDirection="column" height={Math.min(displayResults.length, 12)}>
                {displayResults.map((result, index) => (
                  <SearchResultItem
                    key={`${result.type}-${result.id}`}
                    result={result}
                    isSelected={selectedIndex === index}
                    onClick={() => handleSelect(result)}
                  />
                ))}
              </Box>

              {results.length > maxResults && (
                <Box marginTop={1}>
                  <Text dimColor>
                    ... and {results.length - maxResults} more results
                  </Text>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Help Text */}
      <Box marginTop={1} borderTop borderColor={colors.separators} paddingTop={1}>
        <Text dimColor>
          ↑↓ Navigate • Enter Select • Esc Close
          {query && ' • Ctrl+R Clear recent'}
        </Text>
      </Box>
    </Box>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const { colors } = useTheme();
  const typeColor = TYPE_COLORS[result.type];
  const typeIcon = TYPE_ICONS[result.type];

  return (
    <Box paddingY={0}>
      <Text color={isSelected ? colors.highlights : colors.primaryText}>
        {isSelected ? '▶ ' : '  '}
        <Text color={typeColor}>{typeIcon}</Text>
        {' '}
        <Text bold>{result.title}</Text>
        {result.subtitle && (
          <Text dimColor> • {result.subtitle}</Text>
        )}
        <Text dimColor> ({result.score.toFixed(2)})</Text>
      </Text>
    </Box>
  );
}

/**
 * Hook to manage universal search visibility
 */
export function useUniversalSearchModal() {
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle
  };
}
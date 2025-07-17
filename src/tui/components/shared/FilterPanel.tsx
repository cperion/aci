/**
 * Shared Filter Panel Component - Eliminates filter UI duplication
 * Implements generic filtering interface for all entity types
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { FilterDimension } from '../../hooks/useEntitySearch.js';
import { useTheme } from '../../themes/theme-manager.js';

interface FilterPanelProps {
  dimensions: FilterDimension[];
  activeFilters: Record<string, string>;
  onApplyFilter: (filterId: string, value: string) => void;
  onClearFilters: () => void;
  data?: any[]; // For generating categorical options
  isVisible: boolean;
  onClose: () => void;
}

export function FilterPanel({
  dimensions,
  activeFilters,
  onApplyFilter,
  onClearFilters,
  data = [],
  isVisible,
  onClose
}: FilterPanelProps) {
  const { colors } = useTheme();

  if (!isVisible) return null;

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={colors.highlights}>Filter Options</Text>
      
      {dimensions.map(dimension => (
        <FilterDimension
          key={dimension.id}
          dimension={dimension}
          currentValue={activeFilters[dimension.id] || 'all'}
          onValueChange={(value) => onApplyFilter(dimension.id, value)}
          data={data}
        />
      ))}
      
      <Box marginTop={1} flexDirection="column">
        <Text bold color={colors.labels}>Actions:</Text>
        <Text>
          <Text color="cyan">Enter</Text> - Apply current filters
        </Text>
        <Text>
          <Text color="cyan">c</Text> - Clear all filters
        </Text>
        <Text>
          <Text color="cyan">Esc</Text> - Close filter panel
        </Text>
      </Box>
      
      {Object.keys(activeFilters).length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={colors.labels}>Active Filters:</Text>
          {Object.entries(activeFilters).map(([filterId, value]) => (
            value && value !== 'all' && (
              <Text key={filterId} color={colors.metadata}>
                • {filterId}: {value}
              </Text>
            )
          ))}
        </Box>
      )}
    </Box>
  );
}

interface FilterDimensionProps {
  dimension: FilterDimension;
  currentValue: string;
  onValueChange: (value: string) => void;
  data: any[];
}

function FilterDimension({ dimension, currentValue, onValueChange, data }: FilterDimensionProps) {
  const { colors } = useTheme();
  
  const getOptions = () => {
    if (dimension.options) {
      return dimension.options;
    }
    
    // Generate options from data
    if (dimension.type === 'categorical') {
      const values = data
        .map(item => item[dimension.id])
        .filter(Boolean)
        .map(value => String(value));
      
      const uniqueValues = ['all', ...Array.from(new Set(values))];
      return uniqueValues;
    }
    
    return ['all'];
  };

  const options = getOptions();
  const currentIndex = options.indexOf(currentValue);

  return (
    <Box flexDirection="column">
      <Text bold color={colors.labels}>{dimension.label}:</Text>
      <Box flexDirection="column" marginLeft={2}>
        {options.map((option, index) => {
          const isSelected = option === currentValue;
          const count = option === 'all' ? data.length : 
                       data.filter(item => String(item[dimension.id]) === option).length;
          
          return (
            <Text 
              key={option} 
              color={isSelected ? colors.highlights : colors.metadata}
            >
              {isSelected ? '▶ ' : '  '}
              {option} ({count})
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Compact filter indicator for main views
 */
interface FilterIndicatorProps {
  activeFilters: Record<string, string>;
  totalItems: number;
  filteredItems: number;
  onClick: () => void;
}

export function FilterIndicator({ activeFilters, totalItems, filteredItems, onClick }: FilterIndicatorProps) {
  const { colors } = useTheme();
  const filterCount = Object.values(activeFilters).filter(v => v && v !== 'all').length;
  
  if (filterCount === 0) {
    return (
      <Text color={colors.metadata}>
        All items ({totalItems}) • <Text color="cyan">f</Text> to filter
      </Text>
    );
  }
  
  return (
    <Text color={colors.highlights}>
      {filterCount} filter{filterCount > 1 ? 's' : ''} active • {filteredItems}/{totalItems} items • <Text color="cyan">f</Text> to modify
    </Text>
  );
}

/**
 * Search bar component that integrates with entity search
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Search...", isVisible, onClose }: SearchBarProps) {
  const { colors } = useTheme();
  
  if (!isVisible) return null;
  
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color={colors.highlights}>Search</Text>
      <Box>
        {/* This would be a TextInput in the real implementation */}
        <Text color={colors.metadata}>Search: {value || placeholder}</Text>
      </Box>
      <Text dimColor>
        Type to search • <Text color="cyan">Esc</Text> to close
      </Text>
    </Box>
  );
}
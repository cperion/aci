import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface Item {
  id: string;
  title: string;
  type: string;
  owner: string;
  description?: string;
  tags: string[];
  created: number;
  modified: number;
  access: 'private' | 'shared' | 'org' | 'public';
  size?: number;
  url?: string;
  numViews?: number;
}

export function ItemsView() {
  const { goBack, navigate, setSelection, state } = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'share'>('list');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');

  const commandFacade = CommandFacade.getInstance();

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Filter items when search term or type filter changes
  useEffect(() => {
    let filtered = items;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (itemTypeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.type.toLowerCase().includes(itemTypeFilter.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, items, itemTypeFilter]);

  const loadItems = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if portal is authenticated
      if (!state.authStatus.portal) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandFacade.portalItems('*');
      
      if (result.success && result.data) {
        // Parse items data from CLI output
        const itemsData = Array.isArray(result.data) ? result.data : [];
        setItems(itemsData);
        setFilteredItems(itemsData);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      setError('Network error loading items');
    } finally {
      setIsLoading(false);
    }
  };

  // Global key handlers
  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'search' || mode === 'share') {
        setMode('list');
        setSearchTerm('');
      } else {
        goBack();
      }
    }
    
    if (mode === 'list') {
      switch (input.toLowerCase()) {
        case 's':
          setMode('search');
          break;
        case 'r':
          loadItems();
          break;
        case 'f':
          // Cycle through item type filters
          const filters = ['all', 'web map', 'feature service', 'map service', 'web app', 'dashboard'];
          const currentIndex = filters.indexOf(itemTypeFilter);
          const nextIndex = (currentIndex + 1) % filters.length;
          setItemTypeFilter(filters[nextIndex]!);
          break;
        case 'h':
          if (selectedItem) {
            setMode('share');
          }
          break;
        case 'i':
          if (selectedItem) {
            setSelection({ itemId: selectedItem });
            navigate('item-detail', `Item: ${selectedItem}`);
          }
          break;
      }
    }
  });

  const handleItemSelect = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    setMode('list');
  };

  // Check authentication status
  if (!state.authStatus.portal) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">Authentication Required</Text>
        <Alert variant="warning" title="Portal Access Needed">
          You must be logged into a portal to manage items.
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">Esc</Text> to go back and login first</Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Items...</Text>
        <Spinner label="Fetching portal items" />
        <Text dimColor>Please wait while we retrieve item information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Item Loading Error</Text>
        <Alert variant="error" title="Connection Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text dimColor>Press <Text color="cyan">r</Text> to retry, <Text color="cyan">Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'search') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Search Items</Text>
        <Text dimColor>Enter search term to filter items:</Text>
        <TextInput
          placeholder="Search by title, type, owner, description, or tags..."
          onChange={setSearchTerm}
          onSubmit={handleSearchSubmit}
        />
        <Text dimColor>Press <Text color="cyan">Esc</Text> to cancel search</Text>
      </Box>
    );
  }

  if (mode === 'share') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Share Item</Text>
        <Alert variant="info" title="Feature Coming Soon">
          Item sharing functionality will be available in the next update.
        </Alert>
        <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
      </Box>
    );
  }

  // Get unique item types for display
  const uniqueTypes = [...new Set(items.map(item => item.type))];
  
  // Prepare item options for Select component
  const itemOptions = filteredItems.map(item => ({
    label: `${item.title} (${item.type}) - ${item.owner}`,
    value: item.id
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Portal Item Management</Text>
      <Text dimColor>
        Found {filteredItems.length} items
        {searchTerm && ` matching "${searchTerm}"`}
        {itemTypeFilter !== 'all' && ` filtered by "${itemTypeFilter}"`}
      </Text>

      {/* Show current filter */}
      <Box flexDirection="column">
        <Text><Text bold>Filter:</Text> {itemTypeFilter}</Text>
        <Text dimColor>Press <Text color="cyan">f</Text> to cycle filters</Text>
      </Box>

      {filteredItems.length === 0 ? (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">No items found</Text>
          {searchTerm && (
            <Text dimColor>Try a different search term or change the filter</Text>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text bold>Item List:</Text>
          <Select
            options={itemOptions}
            onChange={handleItemSelect}
          />
          
          {selectedItem && items.find(i => i.id === selectedItem) && (
            <Box marginTop={1} flexDirection="column" gap={1}>
              <Text bold>Selected Item Details:</Text>
              {(() => {
                const item = items.find(i => i.id === selectedItem)!;
                return (
                  <Box flexDirection="column">
                    <Text><Text bold>Title:</Text> {item.title}</Text>
                    <Text><Text bold>Type:</Text> {item.type}</Text>
                    <Text><Text bold>Owner:</Text> {item.owner}</Text>
                    <Text><Text bold>Access:</Text> {item.access}</Text>
                    {item.description && (
                      <Text><Text bold>Description:</Text> {item.description.substring(0, 100)}{item.description.length > 100 ? '...' : ''}</Text>
                    )}
                    {item.tags.length > 0 && (
                      <Text><Text bold>Tags:</Text> {item.tags.slice(0, 3).join(', ')}{item.tags.length > 3 ? '...' : ''}</Text>
                    )}
                    {item.numViews !== undefined && (
                      <Text><Text bold>Views:</Text> {item.numViews}</Text>
                    )}
                    {item.size && (
                      <Text><Text bold>Size:</Text> {(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">s</Text> - Search items</Text>
        <Text>  <Text color="cyan">f</Text> - Filter by type ({itemTypeFilter})</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">h</Text> - Share selected item</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected item</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {selectedItem && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Selected:</Text>
          <Text>{items.find(i => i.id === selectedItem)?.title || selectedItem}</Text>
          <Text dimColor>Press <Text color="cyan">i</Text> to inspect this item</Text>
        </Box>
      )}

      {/* Show statistics */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Statistics:</Text>
        <Text>Total Types: {uniqueTypes.length}</Text>
        <Text>Portal: <Text color="green">✓ Authenticated</Text></Text>
        <Text dimColor>Ready for item management operations</Text>
      </Box>
    </Box>
  );
}
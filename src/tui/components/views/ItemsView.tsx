import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigationActions } from '../../stores/index.js';
import { useAuthStore, selectAuthStatus, selectPortalSession } from '../../stores/index.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult } from '../../../types/command-result.js';

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
  const { goBack, navigate } = useNavigationActions();
  const { portal: portalAuth } = useAuthStore(selectAuthStatus);
  const portalSession = useAuthStore(selectPortalSession);
  const [selection, setSelection] = useState<{ itemId?: string }>({});
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'share' | 'filter' | 'confirm-delete' | 'download' | 'create-item'>('list');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');

  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Set up keyboard handlers
  useViewKeyboard({
    deps: [filteredItems, currentItemIndex, selectedItem, mode],
    handlers: {
      j: () => setCurrentItemIndex(prev => Math.min(prev + 1, filteredItems.length - 1)),
      k: () => setCurrentItemIndex(prev => Math.max(prev - 1, 0)),
      Delete: () => {
        const currentItem = filteredItems[currentItemIndex];
        if (currentItem) {
          setError('');
          setMode('confirm-delete');
          setSelectedItem(currentItem.id);
        }
      },
      i: () => {
        const currentItem = filteredItems[currentItemIndex];
        if (currentItem) {
          setSelection({ itemId: currentItem.id });
          navigate('item-detail', `Item: ${currentItem.title}`);
        }
      },
      h: () => {
        const currentItem = filteredItems[currentItemIndex];
        if (currentItem) {
          console.log('Share item:', currentItem.title);
          setMode('share');
        }
      },
      d: () => {
        const currentItem = filteredItems[currentItemIndex];
        if (currentItem) {
          setMode('download');
          setSelectedItem(currentItem.id);
        }
      },
      s: () => setMode('search'),
      f: () => setMode('filter'),
      c: () => setMode('create-item'),
      r: () => loadItems(),
      escape: () => {
        if (mode !== 'list') {
          setMode('list');
        } else {
          goBack();
        }
      },
      y: () => {
        if (mode === 'confirm-delete') {
          // TODO: Implement actual deletion
          console.log('Delete confirmed');
          setMode('list');
        } else if (mode === 'download') {
          // TODO: Implement actual download
          console.log('Download confirmed');
          setMode('list');
        }
      }
    }
  });

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Reset current index when filtered items change
  useEffect(() => {
    setCurrentItemIndex(0);
  }, [filteredItems]);

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
      if (!portalAuth) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandService.searchItems('*');
      
      if (result.success && result.data) {
        const itemsData = result.data.results || [];
        // Map to Item interface
        const mappedItems: Item[] = itemsData.map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          owner: item.owner,
          description: item.snippet || item.description,
          tags: item.tags || [],
          created: item.created || Date.now(),
          modified: item.modified,
          access: item.access || 'private',
          size: item.size,
          url: item.url,
          numViews: item.numViews
        }));
        setItems(mappedItems);
        setFilteredItems(mappedItems);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      setError('Network error loading items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    setMode('list');
  };

  // Check authentication status
  if (!portalAuth) {
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

  if (mode === 'filter') {
    const uniqueTypes = ['all', ...new Set(items.map(item => item.type))];
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Filter Items by Type</Text>
        <Text dimColor>Current filter: {itemTypeFilter}</Text>
        <Box flexDirection="column" gap={1}>
          {uniqueTypes.slice(0, 8).map(type => (
            <Text key={type} color={type === itemTypeFilter ? 'cyan' : 'white'}>
              {type === itemTypeFilter ? '▶ ' : '  '}{type} ({type === 'all' ? items.length : items.filter(i => i.type === type).length})
            </Text>
          ))}
          {uniqueTypes.length > 8 && (
            <Text dimColor>... and {uniqueTypes.length - 8} more types</Text>
          )}
        </Box>
        <Text dimColor>Press <Text color="cyan">Enter</Text> to apply filter, <Text color="cyan">Esc</Text> to cancel</Text>
      </Box>
    );
  }

  if (mode === 'confirm-delete') {
    const itemToDelete = items.find(i => i.id === selectedItem);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Confirm Item Deletion</Text>
        <Alert variant="warning" title="Destructive Action">
          Are you sure you want to delete item '{itemToDelete?.title}'?
        </Alert>
        <Text dimColor>This action cannot be undone. Type: {itemToDelete?.type}</Text>
        <Box marginTop={1}>
          <Text>Press <Text color="red">y</Text> to confirm, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'download') {
    const itemToDownload = items.find(i => i.id === selectedItem);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">Download Item</Text>
        <Alert variant="info" title="Download Options">
          Download '{itemToDownload?.title}' ({itemToDownload?.type})
        </Alert>
        <Text dimColor>Size: {itemToDownload?.size ? `${(itemToDownload.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</Text>
        <Text dimColor>This will download the item to your local machine.</Text>
        <Box marginTop={1}>
          <Text>Press <Text color="green">y</Text> to download, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'create-item') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Create New Item</Text>
        <Alert variant="info" title="Feature Coming Soon">
          Item creation functionality will be available in the next update.
        </Alert>
        <Text dimColor>Available types: Web Map, Web App, Feature Service, Map Service</Text>
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
        <Text>  <Text color="cyan">c</Text> - Create new item</Text>
        <Text>  <Text color="cyan">h</Text> - Share selected item</Text>
        <Text>  <Text color="cyan">d</Text> - Download selected item</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected item</Text>
        <Text>  <Text color="cyan">Del</Text> - Delete selected item</Text>
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
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface Group {
  id: string;
  title: string;
  description: string;
  owner: string;
  memberCount: number;
  tags: string[];
  created: number;
  modified: number;
  access: 'private' | 'org' | 'public';
}

export function GroupsView() {
  const { goBack, navigate, setSelection, state } = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'create'>('list');

  const commandFacade = CommandFacade.getInstance();

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Filter groups when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  const loadGroups = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if portal is authenticated
      if (!state.authStatus.portal) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandFacade.portalGroups('*');
      
      if (result.success && result.data) {
        // Parse groups data from CLI output
        const groupsData = Array.isArray(result.data) ? result.data : [];
        setGroups(groupsData);
        setFilteredGroups(groupsData);
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (err) {
      setError('Network error loading groups');
    } finally {
      setIsLoading(false);
    }
  };

  // Global key handlers
  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'search' || mode === 'create') {
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
          loadGroups();
          break;
        case 'c':
          setMode('create');
          break;
        case 'i':
          if (selectedGroup) {
            setSelection({ itemId: selectedGroup });
            navigate('group-detail', `Group: ${selectedGroup}`);
          }
          break;
      }
    }
  });

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
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
          You must be logged into a portal to manage groups.
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
        <Text bold color="blue">Loading Groups...</Text>
        <Spinner label="Fetching portal groups" />
        <Text dimColor>Please wait while we retrieve group information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Group Loading Error</Text>
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
        <Text bold color="blue">Search Groups</Text>
        <Text dimColor>Enter search term to filter groups:</Text>
        <TextInput
          placeholder="Search by title, description, owner, or tags..."
          onChange={setSearchTerm}
          onSubmit={handleSearchSubmit}
        />
        <Text dimColor>Press <Text color="cyan">Esc</Text> to cancel search</Text>
      </Box>
    );
  }

  if (mode === 'create') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Create New Group</Text>
        <Alert variant="info" title="Feature Coming Soon">
          Group creation functionality will be available in the next update.
        </Alert>
        <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
      </Box>
    );
  }

  // Prepare group options for Select component
  const groupOptions = filteredGroups.map(group => ({
    label: `${group.title} (${group.memberCount} members) - ${group.access}`,
    value: group.id
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Portal Group Management</Text>
      <Text dimColor>
        Found {filteredGroups.length} groups
        {searchTerm && ` matching "${searchTerm}"`}
      </Text>

      {filteredGroups.length === 0 ? (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">No groups found</Text>
          {searchTerm && (
            <Text dimColor>Try a different search term or clear the filter</Text>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text bold>Group List:</Text>
          <Select
            options={groupOptions}
            onChange={handleGroupSelect}
          />
          
          {selectedGroup && groups.find(g => g.id === selectedGroup) && (
            <Box marginTop={1} flexDirection="column" gap={1}>
              <Text bold>Selected Group Details:</Text>
              {(() => {
                const group = groups.find(g => g.id === selectedGroup)!;
                return (
                  <Box flexDirection="column">
                    <Text><Text bold>Title:</Text> {group.title}</Text>
                    <Text><Text bold>Owner:</Text> {group.owner}</Text>
                    <Text><Text bold>Members:</Text> {group.memberCount}</Text>
                    <Text><Text bold>Access:</Text> {group.access}</Text>
                    {group.description && (
                      <Text><Text bold>Description:</Text> {group.description}</Text>
                    )}
                    {group.tags.length > 0 && (
                      <Text><Text bold>Tags:</Text> {group.tags.join(', ')}</Text>
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
        <Text>  <Text color="cyan">s</Text> - Search groups</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">c</Text> - Create new group</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected group</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {selectedGroup && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Selected:</Text>
          <Text>{groups.find(g => g.id === selectedGroup)?.title || selectedGroup}</Text>
          <Text dimColor>Press <Text color="cyan">i</Text> to inspect this group</Text>
        </Box>
      )}

      {/* Show authentication status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Status:</Text>
        <Text>Portal: <Text color="green">✓ Authenticated</Text></Text>
        <Text dimColor>Ready for group management operations</Text>
      </Box>
    </Box>
  );
}
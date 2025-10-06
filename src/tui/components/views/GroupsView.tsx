import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigationActions } from '../../stores/index.js';
import { useAuthStore, selectAuthStatus, selectPortalSession } from '../../stores/index.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';
import type { CommandResult, GroupSearchResult } from '../../../types/command-result.js';

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
  const { goBack, navigate } = useNavigationActions();
  const { portal: portalAuth } = useAuthStore(selectAuthStatus);
  const portalSession = useAuthStore(selectPortalSession);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'create' | 'filter' | 'confirm-delete' | 'members'>('list');
  const [accessFilter, setAccessFilter] = useState<string>('all');

  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Register keyboard handlers
  useViewKeyboard({
    viewId: 'groups',
    handlers: {
      moveDown: () => {
        setCurrentGroupIndex(prev => Math.min(prev + 1, filteredGroups.length - 1));
      },
      moveUp: () => {
        setCurrentGroupIndex(prev => Math.max(prev - 1, 0));
      },
      delete: () => {
        const currentGroup = filteredGroups[currentGroupIndex];
        if (currentGroup) {
          setError('');
          setMode('confirm-delete');
          setSelectedGroup(currentGroup.id);
        }
      },
      enter: () => {
        const currentGroup = filteredGroups[currentGroupIndex];
        if (currentGroup) {
          navigate('group-detail', `Group: ${currentGroup.title}`, { groupId: currentGroup.id });
        }
      },
      s: () => setMode('search'),
      f: () => setMode('filter'),
      c: () => setMode('create'),
      m: () => {
        const currentGroup = filteredGroups[currentGroupIndex];
        if (currentGroup) {
          setMode('members');
          setSelectedGroup(currentGroup.id);
        }
      },
      r: () => loadGroups(),
      escape: () => {
        if (mode !== 'list') {
          setMode('list');
        } else {
          goBack();
        }
      },
      space: () => {
        const currentGroup = filteredGroups[currentGroupIndex];
        if (currentGroup) {
          setSelectedGroups(prev => {
            const isSelected = prev.includes(currentGroup.id);
            return isSelected 
              ? prev.filter(g => g !== currentGroup.id)
              : [...prev, currentGroup.id];
          });
        }
      }
    }
  }, [filteredGroups, currentGroupIndex, mode]);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Reset current index when filtered groups change
  useEffect(() => {
    setCurrentGroupIndex(0);
  }, [filteredGroups]);

  // Filter groups when search term or access filter changes
  useEffect(() => {
    let filtered = groups;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(group =>
        group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (accessFilter !== 'all') {
      filtered = filtered.filter(group => group.access === accessFilter);
    }
    
    setFilteredGroups(filtered);
  }, [searchTerm, groups, accessFilter]);

  const loadGroups = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if portal is authenticated
      if (!portalAuth || !portalSession) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandService.searchGroups('*', { limit: 100 });
      
      if (result.success && result.data) {
        // Use the structured result data and map to Group interface
        const portalGroups = result.data.results || [];
        const groupsData: Group[] = portalGroups.map(pg => ({
          id: pg.id,
          title: pg.title,
          description: pg.description || '',
          owner: pg.owner,
          memberCount: 0, // Not provided by PortalGroup
          tags: [], // Not provided by PortalGroup
          created: pg.created,
          modified: pg.modified,
          access: pg.access
        }));
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


  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    setMode('list');
  };

  // Check authentication status
  if (!portalAuth || !portalSession) {
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

  if (mode === 'filter') {
    const accessLevels = ['all', 'private', 'org', 'public'];
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Filter Groups by Access</Text>
        <Text dimColor>Current filter: {accessFilter}</Text>
        <Box flexDirection="column" gap={1}>
          {accessLevels.map(access => (
            <Text key={access} color={access === accessFilter ? 'cyan' : 'white'}>
              {access === accessFilter ? '▶ ' : '  '}{access} ({access === 'all' ? groups.length : groups.filter(g => g.access === access).length})
            </Text>
          ))}
        </Box>
        <Text dimColor>Press <Text color="cyan">Enter</Text> to apply filter, <Text color="cyan">Esc</Text> to cancel</Text>
      </Box>
    );
  }

  if (mode === 'confirm-delete') {
    const groupToDelete = groups.find(g => g.id === selectedGroup);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Confirm Group Deletion</Text>
        <Alert variant="warning" title="Destructive Action">
          Are you sure you want to delete group '{groupToDelete?.title}'?
        </Alert>
        <Text dimColor>This will remove {groupToDelete?.memberCount || 0} members from the group.</Text>
        <Box marginTop={1}>
          <Text>Press <Text color="red">y</Text> to confirm, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'members') {
    const selectedGroupData = groups.find(g => g.id === selectedGroup);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Group Members: {selectedGroupData?.title}</Text>
        <Text dimColor>Total members: {selectedGroupData?.memberCount || 0}</Text>
        <Alert variant="info" title="Feature Coming Soon">
          Member management functionality will be available in the next update.
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
        {accessFilter !== 'all' && ` filtered by access "${accessFilter}"`}
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
        <Text>  <Text color="cyan">f</Text> - Filter by access ({accessFilter})</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">c</Text> - Create new group</Text>
        <Text>  <Text color="cyan">m</Text> - View members</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected group</Text>
        <Text>  <Text color="cyan">Del</Text> - Delete selected group</Text>
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
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select, MultiSelect } from '@inkjs/ui';
import { useAuth } from '../../../hooks/use-auth.js';
import { useNavigation } from '../../../hooks/use-navigation.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { TuiCommandService } from '../../../services/tui-command-service.js';

interface User {
  username: string;
  email: string;
  fullName: string;
  role: string;
  groups?: string[];
  created: number;
}

export function UsersView() {
  const { authState } = useAuth();
  const { portal: portalAuth, portalSession } = authState;
  const { goBack, navigate } = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'create' | 'filter' | 'confirm-delete' | 'reset-password'>('list');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const commandService = useMemo(() => new TuiCommandService(portalSession || undefined), [portalSession]);

  // Register keyboard handlers
  useViewKeyboard({
    viewId: 'users',
    handlers: {
      moveDown: () => {
        setCurrentUserIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
      },
      moveUp: () => {
        setCurrentUserIndex(prev => Math.max(prev - 1, 0));
      },
      delete: () => {
        const currentUser = filteredUsers[currentUserIndex];
        if (currentUser) {
          setError('');
          setMode('confirm-delete');
          setSelectedUser(currentUser.username);
        }
      },
      enter: () => {
        const currentUser = filteredUsers[currentUserIndex];
        if (currentUser) {
          navigate('user-detail', `User: ${currentUser.username}`, { username: currentUser.username });
        }
      },
      s: () => setMode('search'),
      f: () => setMode('filter'),
      c: () => setMode('create'),
      r: () => loadUsers(),
      p: () => {
        const currentUser = filteredUsers[currentUserIndex];
        if (currentUser) {
          setError('');
          setMode('reset-password');
          setSelectedUser(currentUser.username);
        }
      },
      escape: () => {
        if (mode !== 'list') {
          setMode('list');
        } else {
          goBack();
        }
      },
      space: () => {
        const currentUser = filteredUsers[currentUserIndex];
        if (currentUser) {
          setSelectedUsers(prev => {
            const isSelected = prev.includes(currentUser.username);
            return isSelected 
              ? prev.filter(u => u !== currentUser.username)
              : [...prev, currentUser.username];
          });
        }
      }
    }
  }, [filteredUsers, currentUserIndex, mode]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search term or role filter changes
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, roleFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if portal is authenticated
      if (!portalAuth || !portalSession) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandService.searchUsers('*', { limit: 100 });
      
      if (result.success && result.data) {
        // Use the structured result data
        const usersData = result.data.results || [];
        // Map PortalUser to User, providing default for optional email
        const mappedUsers = usersData.map((u: any) => ({
          username: u.username,
          fullName: u.fullName || '',
          email: u.email || '',
          role: u.role,
          created: u.created
        }));
        setUsers(mappedUsers);
        setFilteredUsers(mappedUsers);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error loading users');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset current index when filtered users change
  useEffect(() => {
    setCurrentUserIndex(0);
  }, [filteredUsers]);

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
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
          You must be logged into a portal to manage users.
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
        <Text bold color="blue">Loading Users...</Text>
        <Spinner label="Fetching portal users" />
        <Text dimColor>Please wait while we retrieve user information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">User Loading Error</Text>
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
        <Text bold color="blue">Search Users</Text>
        <Text dimColor>Enter search term to filter users:</Text>
        <TextInput
          placeholder="Search by username, email, name, or role..."
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
        <Text bold color="blue">Create New User</Text>
        <Alert variant="info" title="Feature Coming Soon">
          User creation functionality will be available in the next update.
        </Alert>
        <Text dimColor>Press <Text color="cyan">Esc</Text> to go back</Text>
      </Box>
    );
  }

  if (mode === 'filter') {
    const uniqueRoles = ['all', ...new Set(users.map(user => user.role))];
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Filter Users by Role</Text>
        <Text dimColor>Current filter: {roleFilter}</Text>
        <Box flexDirection="column" gap={1}>
          {uniqueRoles.map(role => (
            <Text key={role} color={role === roleFilter ? 'cyan' : 'white'}>
              {role === roleFilter ? '▶ ' : '  '}{role} ({role === 'all' ? users.length : users.filter(u => u.role.toLowerCase() === role.toLowerCase()).length})
            </Text>
          ))}
        </Box>
        <Text dimColor>Press <Text color="cyan">Enter</Text> to apply filter, <Text color="cyan">Esc</Text> to cancel</Text>
      </Box>
    );
  }

  if (mode === 'confirm-delete') {
    const userToDelete = users.find(u => u.username === selectedUser);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Confirm User Deletion</Text>
        <Alert variant="warning" title="Destructive Action">
          Are you sure you want to delete user '{userToDelete?.username}'?
        </Alert>
        <Text dimColor>This action cannot be undone.</Text>
        <Box marginTop={1}>
          <Text>Press <Text color="red">y</Text> to confirm, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'reset-password') {
    const userToReset = users.find(u => u.username === selectedUser);
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">Reset User Password</Text>
        <Alert variant="info" title="Password Reset">
          Reset password for user '{userToReset?.username}'?
        </Alert>
        <Text dimColor>A new temporary password will be generated and sent to the user's email.</Text>
        <Box marginTop={1}>
          <Text>Press <Text color="green">y</Text> to confirm, <Text color="cyan">Esc</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  // Prepare user options for Select component
  const userOptions = filteredUsers.map(user => ({
    label: `${user.username} (${user.fullName}) - ${user.role}`,
    value: user.username
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">Portal User Management</Text>
      <Text dimColor>
        Found {filteredUsers.length} users
        {searchTerm && ` matching "${searchTerm}"`}
        {roleFilter !== 'all' && ` filtered by role "${roleFilter}"`}
      </Text>

      {filteredUsers.length === 0 ? (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">No users found</Text>
          {searchTerm && (
            <Text dimColor>Try a different search term or clear the filter</Text>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text bold>User List:</Text>
          <Select
            options={userOptions}
            onChange={handleUserSelect}
          />
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">s</Text> - Search users</Text>
        <Text>  <Text color="cyan">f</Text> - Filter by role ({roleFilter})</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">c</Text> - Create new user</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected user</Text>
        <Text>  <Text color="cyan">Del</Text> - Delete selected user</Text>
        <Text>  <Text color="cyan">p</Text> - Reset password</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {selectedUser && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Selected:</Text>
          <Text>{selectedUser}</Text>
          <Text dimColor>Press <Text color="cyan">i</Text> to inspect this user</Text>
        </Box>
      )}

      {/* Show authentication status */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Status:</Text>
        <Text>Portal: <Text color="green">✓ Authenticated</Text></Text>
        <Text dimColor>Ready for user management operations</Text>
      </Box>
    </Box>
  );
}
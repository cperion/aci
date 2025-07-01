import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert, Select, MultiSelect } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface User {
  username: string;
  email: string;
  fullName: string;
  role: string;
  groups?: string[];
  created: number;
}

export function UsersView() {
  const { goBack, navigate, setSelection, state } = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'create'>('list');

  const commandFacade = CommandFacade.getInstance();

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if portal is authenticated
      if (!state.authStatus.portal) {
        setError('Portal authentication required. Please login first.');
        setIsLoading(false);
        return;
      }

      const result = await commandFacade.portalUsers('*');
      
      if (result.success && result.data) {
        // Parse users data from CLI output
        const usersData = Array.isArray(result.data) ? result.data : [];
        setUsers(usersData);
        setFilteredUsers(usersData);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error loading users');
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
          loadUsers();
          break;
        case 'c':
          setMode('create');
          break;
        case 'i':
          if (selectedUser) {
            setSelection({ itemId: selectedUser });
            navigate('user-detail', `User: ${selectedUser}`);
          }
          break;
      }
    }
  });

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
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
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">c</Text> - Create new user</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected user</Text>
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
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { CommandFacade } from '../../utils/commandFacade.js';

interface Service {
  serviceName: string;
  type: string;
  status: string;
  folder?: string;
  url?: string;
}

export function ServicesView() {
  const { goBack, navigate, setSelection } = useNavigation();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'search' | 'detail'>('list');

  const commandFacade = CommandFacade.getInstance();

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Filter services when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service =>
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.folder && service.folder.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  const loadServices = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await commandFacade.adminServices();
      
      if (result.success && result.data) {
        // Parse services data from CLI output
        const servicesData = Array.isArray(result.data) ? result.data : [];
        setServices(servicesData);
        setFilteredServices(servicesData);
      } else {
        setError(result.error || 'Failed to load services');
      }
    } catch (err) {
      setError('Network error loading services');
    } finally {
      setIsLoading(false);
    }
  };

  // Global key handlers
  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'search') {
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
          loadServices();
          break;
        case 'i':
          if (selectedService) {
            setSelection({ serviceId: selectedService });
            navigate('service-detail', `Service: ${selectedService}`);
          }
          break;
      }
    }
  });

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    setMode('list');
  };

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="blue">Loading Services...</Text>
        <Spinner label="Fetching ArcGIS Server services" />
        <Text dimColor>Please wait while we retrieve service information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">Service Loading Error</Text>
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
        <Text bold color="blue">Search Services</Text>
        <Text dimColor>Enter search term to filter services:</Text>
        <TextInput
          placeholder="Search by name, type, or folder..."
          onChange={setSearchTerm}
          onSubmit={handleSearchSubmit}
        />
        <Text dimColor>Press <Text color="cyan">Esc</Text> to cancel search</Text>
      </Box>
    );
  }

  // Prepare service options for Select component
  const serviceOptions = filteredServices.map(service => ({
    label: `${service.serviceName} (${service.type}) - ${service.status}`,
    value: service.serviceName
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="blue">ArcGIS Server Services</Text>
      <Text dimColor>
        Found {filteredServices.length} services
        {searchTerm && ` matching "${searchTerm}"`}
      </Text>

      {filteredServices.length === 0 ? (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">No services found</Text>
          {searchTerm && (
            <Text dimColor>Try a different search term or clear the filter</Text>
          )}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text bold>Service List:</Text>
          <Select
            options={serviceOptions}
            onChange={handleServiceSelect}
          />
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Actions:</Text>
        <Text>  <Text color="cyan">s</Text> - Search services</Text>
        <Text>  <Text color="cyan">r</Text> - Refresh list</Text>
        <Text>  <Text color="cyan">i</Text> - Inspect selected service</Text>
        <Text>  <Text color="cyan">Esc</Text> - Go back</Text>
      </Box>

      {selectedService && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Selected:</Text>
          <Text>{selectedService}</Text>
          <Text dimColor>Press <Text color="cyan">i</Text> to inspect this service</Text>
        </Box>
      )}
    </Box>
  );
}
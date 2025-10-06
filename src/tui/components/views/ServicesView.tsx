/**
 * Simplified ServicesView
 * Demonstrates the new simplified patterns without complex contexts
 * Uses local state management and direct keyboard handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert } from '@inkjs/ui';
import { useTheme } from '../../themes/theme-manager.js';
import { useNavigationActions } from '../../stores/index.js';
import { useEntityStore } from '../../stores/index.js';
import { useNotification } from '../../../hooks/use-notification.js';
import { useServiceRestart } from '../../../hooks/use-service-restart.js';
import { useViewKeyboard } from '../../../hooks/use-view-keyboard.js';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { DatabaseService } from '../../../services/database-service.js';
import { formatError } from '../../../utils/error-utils.js';

interface Service {
  serviceName: string;
  type: string;
  status: string;
  folder?: string;
  url?: string;
}

export function ServicesView() {
  // Local state management - no complex contexts
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'search'>('list');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Simple hooks instead of complex contexts
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigationActions();
  // Use value-stable selection from entity store instead of local state
  const selectedIds = useEntityStore(state => state.services?.selectedIds || []);
  const toggleSelection = (id: string) => useEntityStore.getState().toggleSelection('services', id);
  const clearSelection = () => useEntityStore.getState().clearSelection('services');
  const hasSelection = selectedIds.length > 0;
  const isSelected = (id: string) => selectedIds.includes(id);
  const getSelectedFrom = (items: Service[], getId = (item: Service) => item.serviceName) => 
    items.filter(item => isSelected(getId(item)));
  const { showSuccess, showError, showWarning, notifications } = useNotification();
  const { restart, isRestarting, getError: getRestartError } = useServiceRestart();

  // Load services function
  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data for demonstration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockServices: Service[] = [
        { serviceName: 'MapService1', type: 'MapServer', status: 'started', folder: 'GIS' },
        { serviceName: 'FeatureService1', type: 'FeatureServer', status: 'started' },
        { serviceName: 'ImageService1', type: 'ImageServer', status: 'stopped', folder: 'Imagery' },
        { serviceName: 'GPService1', type: 'GPServer', status: 'started', folder: 'Tools' },
        { serviceName: 'GeocodeService', type: 'GeocodeServer', status: 'started' }
      ];
      
      setServices(mockServices);
      setFilteredServices(mockServices);
      
      // Log successful operation
      DatabaseService.logOperation('list_services', 'default', `Loaded ${mockServices.length} services`);
      
    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError.userMessage);
      
      // Log error
      DatabaseService.logError('list_services', 'default', err);
      showError(formattedError.userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

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
      setSelectedIndex(0); // Reset selection when filtering
    }
  }, [searchTerm, services]);

  // Reset selected index when filtered services change
  useEffect(() => {
    if (selectedIndex >= filteredServices.length) {
      setSelectedIndex(Math.max(0, filteredServices.length - 1));
    }
  }, [filteredServices, selectedIndex]);

  // Direct operation handlers
  const handleDelete = async () => {
    const currentService = filteredServices[selectedIndex];
    if (!currentService) return;

    try {
      // Show optimistic UI update
      showWarning(`Deleting ${currentService.serviceName}...`);
      
      // Remove from UI immediately
      setServices(prev => prev.filter(s => s.serviceName !== currentService.serviceName));
      setFilteredServices(prev => prev.filter(s => s.serviceName !== currentService.serviceName));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Occasionally fail for testing
      if (Math.random() < 0.1) {
        throw new Error('Service deletion failed');
      }
      
      showSuccess(`Successfully deleted ${currentService.serviceName}`);
      
      // Log operation
      DatabaseService.logOperation('delete_service', 'default', `Deleted service: ${currentService.serviceName}`);
      
    } catch (err) {
      // Restore service on error
      setServices(prev => [...prev, currentService]);
      setFilteredServices(prev => [...prev, currentService]);
      
      const formattedError = formatError(err);
      showError(formattedError.userMessage);
      DatabaseService.logError('delete_service', 'default', err);
    }
  };

  const handleRestart = async () => {
    const currentService = filteredServices[selectedIndex];
    if (!currentService) return;

    try {
      await restart(currentService.serviceName, async (serviceId: string) => {
        // Simulate restart API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update service status optimistically
        setServices(prev => prev.map(s => 
          s.serviceName === serviceId ? { ...s, status: 'started' } : s
        ));
        setFilteredServices(prev => prev.map(s => 
          s.serviceName === serviceId ? { ...s, status: 'started' } : s
        ));
        
        return { success: true };
      });
      
      showSuccess(`Successfully restarted ${currentService.serviceName}`);
      
    } catch (err) {
      const formattedError = formatError(err);
      showError(formattedError.userMessage);
    }
  };

  const handleBulkDelete = async () => {
    const selectedServices = getSelectedFrom(filteredServices, s => s.serviceName);
    if (selectedServices.length === 0) return;

    try {
      showWarning(`Deleting ${selectedServices.length} services...`);
      
      // Remove from UI immediately
      const serviceNames = selectedServices.map((s: any) => s.serviceName);
      setServices(prev => prev.filter(s => !serviceNames.includes(s.serviceName)));
      setFilteredServices(prev => prev.filter(s => !serviceNames.includes(s.serviceName)));
      
      // Clear selection
      clearSelection();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showSuccess(`Successfully deleted ${selectedServices.length} services`);
      
    } catch (err) {
      // Restore services on error
      setServices(prev => [...prev, ...selectedServices]);
      setFilteredServices(prev => [...prev, ...selectedServices]);
      
      const formattedError = formatError(err);
      showError(formattedError.userMessage);
    }
  };

  // Direct keyboard handling
  useViewKeyboard('services', useCallback((input: string, key: any) => {
    // Handle confirmation dialog
    if (showConfirm) {
      if (input === 'y') {
        setShowConfirm(false);
        setConfirmAction(null);
        
        if (confirmAction === 'delete') {
          handleDelete();
        } else if (confirmAction === 'bulkDelete') {
          handleBulkDelete();
        } else if (confirmAction === 'restart') {
          handleRestart();
        }
        return true;
      } else if (input === 'n' || key?.escape) {
        setShowConfirm(false);
        setConfirmAction(null);
        return true;
      }
      return true; // Consume all input during confirmation
    }
    
    // Handle search mode
    if (mode === 'search') {
      if (key?.escape) {
        setMode('list');
        return true;
      }
      return false; // Let TextInput handle other keys
    }
    
    // Main navigation
    if (key?.downArrow || input === 'j') {
      setSelectedIndex(prev => Math.min(prev + 1, filteredServices.length - 1));
      return true;
    }
    
    if (key?.upArrow || input === 'k') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      return true;
    }
    
    // Actions
    switch (input) {
      case ' ':
        // Toggle selection
        const currentService = filteredServices[selectedIndex];
        if (currentService) {
          toggleSelection(currentService.serviceName);
        }
        return true;
        
      case 'd':
        // Delete service(s)
        if (hasSelection()) {
          setConfirmAction('bulkDelete');
          setShowConfirm(true);
        } else {
          setConfirmAction('delete');
          setShowConfirm(true);
        }
        return true;
        
      case 'r':
        // Restart service or refresh list
        if (key?.ctrl) {
          loadServices(); // Ctrl+R = refresh
        } else {
          setConfirmAction('restart');
          setShowConfirm(true);
        }
        return true;
        
      case 'f':
      case '/':
        // Search mode
        setMode('search');
        return true;
        
      case 'c':
        // Clear selection
        clearSelection();
        return true;
        
      case '\r':
      case '\n':
        // View service details
        const service = filteredServices[selectedIndex];
        if (service) {
          navigate('service-detail', `Service: ${service.serviceName}`, {
            entityId: service.serviceName,
            entityType: 'service'
          });
        }
        return true;
        
      default:
        if (key?.escape) {
          goBack();
          return true;
        }
        return false;
    }
  }, [filteredServices, selectedIndex, hasSelection, showConfirm, confirmAction, mode, toggleSelection, clearSelection, navigate, goBack, loadServices]));

  // Load services on mount (one-time setup)
  useEffect(() => {
    loadServices();
  }, []); // loadServices is stable and doesn't need to be in dependencies

  // Loading state
  if (isLoading) {
    return (
      <ErrorBoundary name="ServicesView">
        <Box flexDirection="column" gap={1} padding={1}>
          <Text bold color={colors.highlights}>Loading Services...</Text>
          <Spinner label="Fetching ArcGIS Server services" />
          <Text color={colors.metadata}>Please wait while we retrieve service information</Text>
        </Box>
      </ErrorBoundary>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary name="ServicesView">
        <Box flexDirection="column" gap={1} padding={1}>
          <Text bold color={colors.errors}>Service Loading Error</Text>
          <Alert variant="error" title="Connection Error">
            {error}
          </Alert>
          <Box marginTop={1}>
            <Text color={colors.metadata}>
              Press <Text color={colors.highlights}>r</Text> to retry, 
              <Text color={colors.highlights}> Esc</Text> to go back
            </Text>
          </Box>
        </Box>
      </ErrorBoundary>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <ErrorBoundary name="ServicesView">
        <Box flexDirection="column" gap={1} padding={1}>
          <Text bold color={colors.highlights}>Search Services</Text>
          <Text color={colors.metadata}>Enter search term to filter services:</Text>
          <TextInput
            placeholder="Search by name, type, or folder..."
            onChange={setSearchTerm}
            onSubmit={() => setMode('list')}
          />
          <Text color={colors.metadata}>
            Press <Text color={colors.highlights}>Esc</Text> to cancel, 
            <Text color={colors.highlights}> Enter</Text> to apply filter
          </Text>
        </Box>
      </ErrorBoundary>
    );
  }

  // Confirmation dialog
  if (showConfirm) {
    const currentService = filteredServices[selectedIndex];
    const selectedServices = getSelectedFrom(filteredServices, s => s.serviceName);
    
    let message = '';
    let destructive = false;
    
    if (confirmAction === 'delete') {
      message = `Delete service "${currentService?.serviceName}"?`;
      destructive = true;
    } else if (confirmAction === 'bulkDelete') {
      message = `Delete ${selectedServices.length} selected services?`;
      destructive = true;
    } else if (confirmAction === 'restart') {
      message = `Restart service "${currentService?.serviceName}"?`;
    }
    
    return (
      <ErrorBoundary name="ServicesView">
        <Box flexDirection="column" gap={1} padding={1} 
             borderStyle="double" borderColor={destructive ? "red" : "yellow"}>
          <Text bold color={destructive ? colors.errors : colors.warnings}>
            Confirm Action
          </Text>
          <Text>{message}</Text>
          <Box marginTop={1}>
            <Text>
              <Text color={colors.success}>[y]</Text> Yes  
              <Text color={colors.errors}> [n]</Text> No
            </Text>
          </Box>
        </Box>
      </ErrorBoundary>
    );
  }

  // Main view
  const currentService = filteredServices[selectedIndex];
  const selectedServices = getSelectedFrom(filteredServices, s => s.serviceName);

  return (
    <ErrorBoundary name="ServicesView">
      <Box flexDirection="column" height="100%">
        {/* Header */}
        <Box flexDirection="column" gap={1} paddingX={1} paddingY={1}>
          <Text bold color={colors.highlights}>ArcGIS Server Services</Text>
          <Text color={colors.metadata}>
            Found {filteredServices.length} services
            {searchTerm && ` matching "${searchTerm}"`}
            {hasSelection() && ` (${selectedServices.length} selected)`}
          </Text>
        </Box>

        {/* Service list */}
        <Box flexGrow={1} paddingX={1}>
          {filteredServices.length === 0 ? (
            <Box flexDirection="column" gap={1}>
              <Text color={colors.warnings}>No services found</Text>
              {searchTerm && (
                <Text color={colors.metadata}>Try a different search term or clear the filter</Text>
              )}
            </Box>
          ) : (
            <Box flexDirection="column">
              {filteredServices.map((service, index) => {
                const isServiceSelected = isSelected(service.serviceName);
                const isCurrent = index === selectedIndex;
                const isServiceRestarting = isRestarting(service.serviceName);
                
                return (
                  <Box key={service.serviceName} paddingLeft={1}>
                    <Text
                      color={
                        isCurrent ? colors.selections :
                        isServiceSelected ? colors.features :
                        colors.primaryText
                      }
                      bold={isCurrent}
                    >
                      {isCurrent ? '▶ ' : '  '}
                      {isServiceSelected ? '◉ ' : '○ '}
                      {isServiceRestarting ? '⟳ ' : ''}
                      {service.serviceName} ({service.type}) - {service.status}
                      {service.folder && ` [${service.folder}]`}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Current service details */}
        {currentService && (
          <Box marginTop={1} flexDirection="column" gap={1} paddingX={1} paddingY={1} 
               borderStyle="single" borderColor={colors.metadata}>
            <Text bold color={colors.highlights}>Current Service:</Text>
            <Text color={colors.primaryText}>{currentService.serviceName}</Text>
            <Text color={colors.metadata}>
              Type: {currentService.type} | Status: {currentService.status}
            </Text>
            {currentService.url && (
              <Text color={colors.metadata}>URL: {currentService.url}</Text>
            )}
          </Box>
        )}

        {/* Shortcuts help */}
        <Box paddingX={1} paddingY={1} borderStyle="single" borderTop borderColor={colors.metadata}>
          <Text color={colors.metadata}>
            <Text color={colors.highlights}>↑/↓</Text> Navigate |
            <Text color={colors.highlights}> Space</Text> Select |
            <Text color={colors.highlights}> d</Text> Delete |
            <Text color={colors.highlights}> r</Text> Restart |
            <Text color={colors.highlights}> f</Text> Search |
            <Text color={colors.highlights}> Enter</Text> Details |
            <Text color={colors.highlights}> Esc</Text> Back
          </Text>
        </Box>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Box flexDirection="column" gap={1}>
            {notifications.slice(-3).map((notification: any) => (
              <Box key={notification?.id || Math.random()} 
                   borderStyle="single" 
                   borderColor={
                     notification?.type === 'error' ? 'red' :
                     notification?.type === 'warning' ? 'yellow' :
                     notification?.type === 'success' ? 'green' : 'blue'
                   }
                   paddingX={1}>
                <Text color={
                  notification?.type === 'error' ? colors.errors :
                  notification?.type === 'warning' ? colors.warnings :
                  notification?.type === 'success' ? colors.success :
                  colors.primaryText
                }>
                  {notification?.message || ''}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
}
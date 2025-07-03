import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, Alert, Select } from '@inkjs/ui';
import { useNavigation } from '../../hooks/navigation.js';
import { useKeyboard } from '../../hooks/keyboard.js';
import { useTheme } from '../../themes/theme-manager.js';
import { CommandFacade } from '../../utils/commandFacade.js';
import { ActionFooter } from '../ActionFooter.js';
import { SelectionBar } from '../SelectionBar.js';
import { ModeIndicator } from '../ModeIndicator.js';
import { ConfirmationDialog } from '../ConfirmationDialog.js';
import { ActionProcessor } from '../../keyboard/action-processor.js';

interface Service {
  serviceName: string;
  type: string;
  status: string;
  folder?: string;
  url?: string;
}

export function ServicesView() {
  const { goBack, navigate, setSelection } = useNavigation();
  const { colors } = useTheme();
  const {
    currentMode,
    selectedItems,
    toggleItemSelection,
    clearSelection,
    registerActionHandler,
    getAvailableShortcuts,
    viewState,
    setViewState
  } = useKeyboard();
  
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
    destructive?: boolean;
  } | null>(null);
  const [mode, setMode] = useState<'list' | 'search' | 'detail'>('list');

  const commandFacade = CommandFacade.getInstance();

  // Register action handlers with stable references to avoid memory leaks
  useEffect(() => {
    const cleanupFunctions = [
      registerActionHandler('moveDown', () => {
        setCurrentServiceIndex(prev => {
          const newIndex = Math.min(prev + 1, filteredServices.length - 1);
          return newIndex;
        });
      }),
      registerActionHandler('moveUp', () => {
        setCurrentServiceIndex(prev => Math.max(prev - 1, 0));
      }),
      registerActionHandler('toggleServiceSelection', () => {
        const currentService = filteredServices[currentServiceIndex];
        if (currentService) {
          toggleItemSelection(currentService.serviceName);
        }
      }),
      registerActionHandler('deleteSelectedService', () => {
        const currentService = filteredServices[currentServiceIndex];
        if (currentService) {
          setConfirmAction({
            action: 'delete',
            title: 'Delete Service',
            message: `Are you sure you want to delete ${currentService.serviceName}?`,
            destructive: true
          });
          setShowConfirmDialog(true);
        }
      }),
      registerActionHandler('deleteBulkServices', () => {
        const selectedCount = selectedItems.length;
        if (selectedCount > 0) {
          setConfirmAction({
            action: 'deleteBulk',
            title: 'Delete Multiple Services',
            message: `Delete ${selectedCount} selected services?`,
            destructive: true
          });
          setShowConfirmDialog(true);
        }
      }),
      registerActionHandler('restartSelectedService', () => {
        const currentService = filteredServices[currentServiceIndex];
        if (currentService) {
          setConfirmAction({
            action: 'restart',
            title: 'Restart Service',
            message: `Restart ${currentService.serviceName}?`
          });
          setShowConfirmDialog(true);
        }
      }),
      registerActionHandler('restartBulkServices', () => {
        const selectedCount = selectedItems.length;
        if (selectedCount > 0) {
          setConfirmAction({
            action: 'restartBulk',
            title: 'Restart Multiple Services',
            message: `Restart ${selectedCount} selected services?`
          });
          setShowConfirmDialog(true);
        }
      }),
      registerActionHandler('inspectSelectedService', () => {
        const currentService = filteredServices[currentServiceIndex];
        if (currentService) {
          setSelection({ serviceId: currentService.serviceName });
          navigate('service-detail', `Service: ${currentService.serviceName}`);
        }
      }),
      registerActionHandler('toggleSearchMode', () => {
        const newMode = mode === 'search' ? 'list' : 'search';
        setMode(newMode);
        setViewState({ searchActive: newMode === 'search' });
      }),
      registerActionHandler('refreshServiceList', () => {
        loadServices();
      }),
      registerActionHandler('editSelectedService', () => {
        const currentService = filteredServices[currentServiceIndex];
        if (currentService) {
          // TODO: Implement service editing
          console.log('Edit service:', currentService.serviceName);
        }
      }),
      registerActionHandler('toggleFilterPanel', () => {
        // TODO: Implement filter panel
        console.log('Toggle filter panel');
      })
    ];
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [registerActionHandler]); // Only depend on stable registerActionHandler

  // Create stable references for the action handlers that need current state
  const handleMoveDown = React.useCallback(() => {
    setCurrentServiceIndex(prev => Math.min(prev + 1, filteredServices.length - 1));
  }, [filteredServices.length]);

  const handleMoveUp = React.useCallback(() => {
    setCurrentServiceIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleToggleSelection = React.useCallback(() => {
    const currentService = filteredServices[currentServiceIndex];
    if (currentService) {
      toggleItemSelection(currentService.serviceName);
    }
  }, [filteredServices, currentServiceIndex, toggleItemSelection]);

  // Update handlers when dependencies change
  useEffect(() => {
    // Re-register handlers that depend on current state
    const actionProcessor = ActionProcessor.getInstance();
    actionProcessor.registerActionHandler('moveDown', handleMoveDown);
    actionProcessor.registerActionHandler('moveUp', handleMoveUp);
    actionProcessor.registerActionHandler('toggleServiceSelection', handleToggleSelection);
  }, [handleMoveDown, handleMoveUp, handleToggleSelection]);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Update view state
  useEffect(() => {
    setViewState({
      currentItem: filteredServices[currentServiceIndex] || null,
      searchActive: mode === 'search'
    });
  }, [currentServiceIndex, filteredServices, mode, setViewState]);

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

  // Handle confirmation dialog actions
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    try {
      switch (confirmAction.action) {
        case 'delete':
          // TODO: Implement service deletion
          console.log('Deleting service:', filteredServices[currentServiceIndex]?.serviceName);
          break;
        case 'deleteBulk':
          // TODO: Implement bulk service deletion
          console.log('Deleting services:', selectedItems);
          clearSelection();
          break;
        case 'restart':
          // TODO: Implement service restart
          console.log('Restarting service:', filteredServices[currentServiceIndex]?.serviceName);
          break;
        case 'restartBulk':
          // TODO: Implement bulk service restart
          console.log('Restarting services:', selectedItems);
          clearSelection();
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleServiceSelect = (serviceId: string) => {
    const index = filteredServices.findIndex(s => s.serviceName === serviceId);
    if (index >= 0) {
      setCurrentServiceIndex(index);
    }
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    setMode('list');
  };

  if (isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color={colors.highlights}>Loading Services...</Text>
        <Spinner label="Fetching ArcGIS Server services" />
        <Text color={colors.metadata}>Please wait while we retrieve service information</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color={colors.errors}>Service Loading Error</Text>
        <Alert variant="error" title="Connection Error">
          {error}
        </Alert>
        <Box marginTop={1}>
          <Text color={colors.metadata}>Press <Text color={colors.highlights}>r</Text> to retry, <Text color={colors.highlights}>Esc</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'search') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color={colors.highlights}>Search Services</Text>
        <Text color={colors.metadata}>Enter search term to filter services:</Text>
        <TextInput
          placeholder="Search by name, type, or folder..."
          onChange={setSearchTerm}
          onSubmit={handleSearchSubmit}
        />
        <Text color={colors.metadata}>Press <Text color={colors.highlights}>Esc</Text> to cancel search</Text>
      </Box>
    );
  }

  // Prepare service options for enhanced display
  const currentService = filteredServices[currentServiceIndex];
  const availableShortcuts = getAvailableShortcuts('services');
  
  // Get bulk actions for selection bar
  const bulkActions = [
    { key: 'D', label: 'Delete', action: 'deleteBulkServices' },
    { key: 'R', label: 'Restart', action: 'restartBulkServices' },
    { key: 'Esc', label: 'Clear', action: 'clearSelection' }
  ];

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
        <Text bold color={colors.highlights}>ArcGIS Server Services</Text>
        <Text color={colors.metadata}>
          Found {filteredServices.length} services
          {searchTerm && ` matching "${searchTerm}"`}
        </Text>
        
        {/* Mode indicator */}
        <ModeIndicator 
          mode={currentMode} 
          selectedCount={selectedItems.length}
        />
      </Box>

      {/* Selection bar (shown when items are selected) */}
      {selectedItems.length > 0 && (
        <SelectionBar
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
          bulkActions={bulkActions}
        />
      )}

      {/* Main content */}
      <Box flexGrow={1} paddingX={2}>
        {filteredServices.length === 0 ? (
          <Box flexDirection="column" gap={1}>
            <Text color={colors.warnings}>No services found</Text>
            {searchTerm && (
              <Text color={colors.metadata}>Try a different search term or clear the filter</Text>
            )}
          </Box>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text bold color={colors.highlights}>Service List:</Text>
            
            {/* Service list with highlighting */}
            {filteredServices.map((service, index) => {
              const isSelected = selectedItems.includes(service.serviceName);
              const isCurrent = index === currentServiceIndex;
              
              return (
                <Box key={service.serviceName} paddingX={1}>
                  <Text
                    color={
                      isCurrent ? colors.selections :
                      isSelected ? colors.features :
                      colors.primaryText
                    }
                    bold={isCurrent}
                  >
                    {isCurrent ? '▶ ' : '  '}
                    {isSelected ? '◉ ' : '○ '}
                    {service.serviceName} ({service.type}) - {service.status}
                    {service.folder && ` [${service.folder}]`}
                  </Text>
                </Box>
              );
            })}
            
            {/* Current service details */}
            {currentService && (
              <Box marginTop={1} flexDirection="column" gap={1} paddingX={1}>
                <Text bold color={colors.highlights}>Current Service:</Text>
                <Text color={colors.primaryText}>{currentService.serviceName}</Text>
                <Text color={colors.metadata}>Type: {currentService.type} | Status: {currentService.status}</Text>
                {currentService.url && (
                  <Text color={colors.metadata}>URL: {currentService.url}</Text>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Action footer */}
      <ActionFooter
        shortcuts={availableShortcuts}
        mode={currentMode}
        selectedCount={selectedItems.length}
      />
      
      {/* Confirmation dialog */}
      <ConfirmationDialog
        visible={showConfirmDialog}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        itemCount={confirmAction?.action.includes('Bulk') ? selectedItems.length : 1}
        itemType="services"
        destructive={confirmAction?.destructive}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </Box>
  );
}
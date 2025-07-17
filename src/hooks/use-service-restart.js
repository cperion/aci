/**
 * Service Restart Hook
 * Simple service operation state management
 * Handles restart operations with loading states and error handling
 */

import { useState, useCallback } from 'react';
import { DatabaseService } from '../services/database-service.js';

export function useServiceRestart() {
  const [operations, setOperations] = useState(new Map());
  
  // Start restart operation for a service
  const restart = useCallback(async (serviceId, restartFn) => {
    // Set loading state
    setOperations(prev => new Map(prev).set(serviceId, {
      isRestarting: true,
      error: null,
      startTime: Date.now()
    }));
    
    try {
      // Record start of restart operation
      DatabaseService.recordServiceEvent(serviceId, 'RESTART', 'restarting', {
        timestamp: Date.now()
      });
      
      // Execute restart function
      const result = await restartFn(serviceId);
      
      // Update state - success
      setOperations(prev => new Map(prev).set(serviceId, {
        isRestarting: false,
        error: null,
        lastRestart: Date.now(),
        success: true
      }));
      
      // Record successful restart
      DatabaseService.recordServiceEvent(serviceId, 'RESTART', 'started', {
        timestamp: Date.now(),
        duration: Date.now() - operations.get(serviceId)?.startTime
      });
      
      return result;
      
    } catch (error) {
      // Update state - error
      setOperations(prev => new Map(prev).set(serviceId, {
        isRestarting: false,
        error: error.message || 'Restart failed',
        lastError: Date.now()
      }));
      
      // Record failed restart
      DatabaseService.recordServiceEvent(serviceId, 'FAILURE', 'failed', {
        timestamp: Date.now(),
        error: error.message,
        duration: Date.now() - (operations.get(serviceId)?.startTime || Date.now())
      });
      
      throw error;
    }
  }, [operations]);
  
  // Batch restart multiple services
  const restartMultiple = useCallback(async (serviceIds, restartFn) => {
    // Set loading state for all services
    setOperations(prev => {
      const newMap = new Map(prev);
      serviceIds.forEach(serviceId => {
        newMap.set(serviceId, {
          isRestarting: true,
          error: null,
          startTime: Date.now()
        });
      });
      return newMap;
    });
    
    const results = [];
    const errors = [];
    
    // Execute restarts in parallel
    const promises = serviceIds.map(async (serviceId) => {
      try {
        const result = await restartFn(serviceId);
        results.push({ serviceId, result });
        
        // Update individual success state
        setOperations(prev => new Map(prev).set(serviceId, {
          isRestarting: false,
          error: null,
          lastRestart: Date.now(),
          success: true
        }));
        
        return result;
      } catch (error) {
        errors.push({ serviceId, error });
        
        // Update individual error state
        setOperations(prev => new Map(prev).set(serviceId, {
          isRestarting: false,
          error: error.message || 'Restart failed',
          lastError: Date.now()
        }));
        
        throw error;
      }
    });
    
    // Wait for all to complete (allow partial success)
    const settledResults = await Promise.allSettled(promises);
    
    return {
      successful: results,
      failed: errors,
      total: serviceIds.length
    };
  }, []);
  
  // Get operation state for a service
  const getOperationState = useCallback((serviceId) => {
    return operations.get(serviceId) || {
      isRestarting: false,
      error: null,
      success: false
    };
  }, [operations]);
  
  // Check if any service is restarting
  const isAnyRestarting = useCallback(() => {
    return Array.from(operations.values()).some(op => op.isRestarting);
  }, [operations]);
  
  // Get all restarting services
  const getRestartingServices = useCallback(() => {
    const restarting = [];
    operations.forEach((state, serviceId) => {
      if (state.isRestarting) {
        restarting.push(serviceId);
      }
    });
    return restarting;
  }, [operations]);
  
  // Clear operation state for a service
  const clearOperationState = useCallback((serviceId) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(serviceId);
      return newMap;
    });
  }, []);
  
  // Clear all operation states
  const clearAllStates = useCallback(() => {
    setOperations(new Map());
  }, []);
  
  // Cancel restart operation (if possible)
  const cancelRestart = useCallback((serviceId) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(serviceId);
      if (current?.isRestarting) {
        newMap.set(serviceId, {
          ...current,
          isRestarting: false,
          error: 'Cancelled by user'
        });
      }
      return newMap;
    });
  }, []);
  
  return {
    // Main operations
    restart,
    restartMultiple,
    
    // State queries
    getOperationState,
    isAnyRestarting,
    getRestartingServices,
    
    // State management
    clearOperationState,
    clearAllStates,
    cancelRestart,
    
    // Convenience methods
    isRestarting: (serviceId) => getOperationState(serviceId).isRestarting,
    getError: (serviceId) => getOperationState(serviceId).error,
    wasSuccessful: (serviceId) => getOperationState(serviceId).success
  };
}